# This file marks the `backend` directory as a Python package.
# Import the Celery app so that Django automatically discovers it.
from config.celery import app as celery_app  # noqa: F401
