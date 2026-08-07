import os
import logging

logger = logging.getLogger("CeleryConfig")

try:
    from celery import Celery
    HAS_CELERY = True
except ImportError:
    HAS_CELERY = False
    logger.warning("Celery package is not installed. Running tasks synchronously.")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

if HAS_CELERY:
    celery_app = Celery(
        "careercopilot_tasks",
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=["app.tasks.webcam_tasks"],
    )
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )
else:
    class MockCelery:
        def task(self, *args, **kwargs):
            def decorator(func):
                func.delay = func  # run synchronously when delay is called
                return func
            return decorator
    celery_app = MockCelery()
