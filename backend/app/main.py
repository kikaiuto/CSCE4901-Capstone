"""FastAPI application entrypoint.

Builds the addon dependency graph, then mounts each addon's router in dependency
order under the API prefix. Adding an addon means adding a manifest, not editing
this file.
"""

from fastapi import FastAPI
from redis.asyncio import Redis
from sqlalchemy import text

from app.core.config import get_settings
from app.core.db import get_engine
from app.core.errors import register_error_handlers
from app.core.modules.loading import mount_routers


def create_app() -> FastAPI:
    application = FastAPI(title="Sector 7 AI", version="0.1.0")
    register_error_handlers(application)
    mount_routers(application)
    application.add_api_route("/health", health, methods=["GET"])
    return application


async def health() -> dict[str, str]:
    settings = get_settings()
    async with get_engine().connect() as conn:
        await conn.execute(text("SELECT 1"))
    redis = Redis.from_url(settings.redis_url)
    try:
        await redis.ping()
    finally:
        await redis.aclose()
    return {"status": "ok", "environment": settings.environment}


app = create_app()
