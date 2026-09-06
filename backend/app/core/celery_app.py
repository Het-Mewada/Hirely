import os
from celery import Celery
from app.core.config import settings

is_testing = settings.ENVIRONMENT == "testing" or os.environ.get("PYTEST_CURRENT_TEST") is not None
task_always_eager = settings.CELERY_ALWAYS_EAGER or is_testing

celery_app = Celery(
    "hirely_worker",
    broker=settings.CELERY_BROKER_URL if not task_always_eager else "memory://",
    backend=settings.CELERY_RESULT_BACKEND if not task_always_eager else "cache+memory://",
    include=["app.tasks.resume_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_always_eager=task_always_eager,
    task_eager_propagates=True,
)
