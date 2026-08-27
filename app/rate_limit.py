"""
Rate limiting via slowapi (a Flask-limiter-style wrapper for FastAPI/Starlette).

Keys by the authenticated user (decoded from the Bearer token) when present,
so one spammy user can't drown out others sharing an IP (common on a
conference/demo wifi) - falls back to client IP for unauthenticated routes
like signup/login where there's no user yet.
"""
import jwt
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.auth import decode_access_token


def _rate_limit_key(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:]
        try:
            user_id = decode_access_token(token)
            return f"user:{user_id}"
        except jwt.InvalidTokenError:
            pass  # falls through to IP-based limiting below
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=_rate_limit_key)
