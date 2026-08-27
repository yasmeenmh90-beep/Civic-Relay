import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.logging_config import request_id_ctx

logger = logging.getLogger("civicrelay.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        token = request_id_ctx.set(request_id)
        start = time.monotonic()
        try:
            response = await call_next(request)
            duration_ms = round((time.monotonic() - start) * 1000, 1)
            logger.info(
                "%s %s -> %s (%sms)",
                request.method, request.url.path, response.status_code, duration_ms,
            )
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception:
            duration_ms = round((time.monotonic() - start) * 1000, 1)
            logger.exception(
                "%s %s failed after %sms", request.method, request.url.path, duration_ms
            )
            raise
        finally:
            # Reset only after all logging for this request has happened above -
            # resetting first would make those log lines lose their request_id.
            request_id_ctx.reset(token)
