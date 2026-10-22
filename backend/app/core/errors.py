"""Application exception types and their HTTP error handlers.

Services raise these instead of FastAPI's HTTPException, so business code never
imports the web framework. register_error_handlers maps each to its status code.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("app.errors")


class AppError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str = "") -> None:
        super().__init__(message or self.code)
        self.message = message or self.code

    def details(self) -> dict[str, Any]:
        """Structured data the screen needs to show the problem, such as every
        short line on S-04. JSON-safe values only: str for Decimal and UUID."""
        return {}


class Unauthorized(AppError):
    status_code = 401
    code = "unauthorized"


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"


class NotFound(AppError):
    status_code = 404
    code = "not_found"


class Conflict(AppError):
    status_code = 409
    code = "conflict"


class CrossTenantWrite(AppError):
    """A write tried to touch a row outside the caller's organization.

    Always a bug in the calling code, never a user error, so it maps to 500 and
    is never caught to recover.
    """

    status_code = 500
    code = "cross_tenant_write"


async def _handle_app_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)
    headers = {"WWW-Authenticate": "Bearer"} if isinstance(exc, Unauthorized) else None
    if exc.status_code >= 500:
        # A server-side bug such as CrossTenantWrite: log it, never echo it.
        logger.error("%s: %s", exc.code, exc.message)
        content = {"error": "internal_error", "message": "Something went wrong", "details": {}}
    else:
        content = {"error": exc.code, "message": exc.message, "details": exc.details()}
    return JSONResponse(status_code=exc.status_code, content=content, headers=headers)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _handle_app_error)
