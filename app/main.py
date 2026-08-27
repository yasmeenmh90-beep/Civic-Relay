from dotenv import load_dotenv
load_dotenv()  # loads .env into the environment - MUST run before any of the
                # imports below, since several modules (uploads, whatsapp, iot,
                # storage, strands_client, municipal_api) read env vars at
                # import time via module-level os.getenv() calls, not inside
                # functions - if .env hasn't loaded yet, those reads see nothing.

import os
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text

from app.logging_config import configure_logging
from app.middleware import RequestLoggingMiddleware
from app.routers import issues, tickets, users, uploads, dev, whatsapp, iot, analytics
from app.agents.tracking_scheduler import start_scheduler, stop_scheduler
from app.rate_limit import limiter
from app.db import SessionLocal

configure_logging()

app = FastAPI(title="CivicRelay API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(RequestLoggingMiddleware)

# ALLOWED_ORIGINS: comma-separated list for production (e.g.
# "https://civicrelay.app,https://staging.civicrelay.app"). Defaults to "*"
# for local dev only - set this explicitly before any real deployment.
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allowed_origins == "*" else [o.strip() for o in _allowed_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(issues.router)
app.include_router(tickets.router)
app.include_router(uploads.router)
app.include_router(dev.router)
app.include_router(whatsapp.router)
app.include_router(iot.router)
app.include_router(analytics.router)

# Serves images saved by the local-disk fallback in app/storage.py
# (only used when S3 isn't configured - real S3 URLs bypass this entirely).
# Serves images saved by the local-disk fallback in app/storage.py
# (only used when S3 isn't configured - real S3 URLs bypass this entirely).
# Tolerates a read-only /app (e.g. a misconfigured volume mount) instead of
# crashing the whole app over a feature that may not even be in use.
try:
    Path("uploads").mkdir(exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except PermissionError:
    logging.getLogger("civicrelay.startup").warning(
        "Could not create/mount ./uploads (permission denied) - local image "
        "storage fallback will fail until this is fixed. If S3_BUCKET is "
        "configured, this doesn't matter - uploads go to S3 instead."
    )


@app.get("/health")
def health():
    """Checked by the Docker healthcheck and would back a load balancer's
    liveness/readiness probe in a real deployment - actually verifies DB
    connectivity, not just that the process is alive."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503
    body = {"status": "ok" if db_ok else "degraded", "database": "ok" if db_ok else "unreachable"}
    return JSONResponse(content=body, status_code=status_code)


@app.on_event("startup")
def _on_startup():
    # RUN_BACKGROUND_SCHEDULER gates the Tracking Agent sweep. This matters
    # once you run more than one process (multiple uvicorn workers, or
    # multiple container replicas behind a load balancer): each process
    # would otherwise run its own independent scheduler, all polling and
    # drafting escalations for the same tickets redundantly. Run it in
    # exactly one process/replica - set RUN_BACKGROUND_SCHEDULER=0 on the
    # rest (e.g. web replicas) and =1 on a single dedicated worker.
    if os.getenv("RUN_BACKGROUND_SCHEDULER", "1") == "1":
        start_scheduler(interval_seconds=int(os.getenv("TRACKING_INTERVAL_SECONDS", "30")))


@app.on_event("shutdown")
def _on_shutdown():
    stop_scheduler()
