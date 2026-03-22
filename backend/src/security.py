import os
import hmac

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

PUBLIC_ROUTES = {"/", "/health", "/docs", "/openapi.json", "/redoc"}


class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.secret_key = os.getenv("API_SECRET_KEY", "")

    async def dispatch(self, request: Request, call_next):
        if request.url.path.rstrip("/") in PUBLIC_ROUTES:
            return await call_next(request)

        if not self.secret_key:
            return JSONResponse(
                status_code=503,
                content={"detail": "Service misconfigured: API_SECRET_KEY is not set."},
            )

        provided_key = request.headers.get("X-API-Key", "")

        if not provided_key:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing API key. Pass it as the 'X-API-Key' header."},
            )

        if not hmac.compare_digest(provided_key.encode(), self.secret_key.encode()):
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid API key."},
            )

        return await call_next(request)