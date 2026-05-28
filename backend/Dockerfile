FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt backend/requirements-api.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-api.txt

COPY backend/ backend/
WORKDIR /app/backend

RUN python -c "\
from src.models.catboost_pointwise import get_recommender; \
from src.pipeline.loaders.custom_wide import load_custom_wide; \
print('All imports OK')"

CMD ["python", "-c", "print('Backend ready'); import time; time.sleep(99999)"]
