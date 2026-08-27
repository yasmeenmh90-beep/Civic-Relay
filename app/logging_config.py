"""
Structured logging setup.

LOG_FORMAT=json (recommended for any real deployment - CloudWatch, Datadog,
ELK, etc. all parse JSON log lines natively) or LOG_FORMAT=text (default,
human-readable for local dev). Every log record includes a request_id when
one is available (see app/middleware.py) so a single request's logs can be
traced across every agent it touched during that request.
"""
import logging
import json
import os
import sys
import contextvars

# contextvar rather than request.state, so any logger call anywhere during
# request handling (including inside agent code, several calls deep) can
# pick up the current request's id without threading it through every
# function signature. Set by app/middleware.py at the start of each request.
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")


class _RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging():
    log_format = os.getenv("LOG_FORMAT", "text").lower()
    level = os.getenv("LOG_LEVEL", "INFO").upper()

    root = logging.getLogger()
    root.setLevel(level)
    # Clear any handlers uvicorn/pytest may have already attached, so we
    # don't end up with duplicate log lines in either format.
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(_RequestIdFilter())

    if log_format == "json":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s [req:%(request_id)s] %(message)s"
        ))

    root.addHandler(handler)
