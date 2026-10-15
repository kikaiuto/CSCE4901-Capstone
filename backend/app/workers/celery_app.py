"""Celery application instance and task discovery configuration.

Backed by Redis. Hosts scheduled forecasting and reporting jobs.
Features: F11, F13.
"""

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "sector7",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[],
)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "UTC"
