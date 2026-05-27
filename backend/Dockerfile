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
from src.models.bitnet import BitNetRecommender; \
from src.pipeline.loaders.santander import load_santander; \
from src.evaluation.metrics import precision_at_k, ndcg_at_k; \
from src.edge.runtime.inference import EdgeRuntime; \
print('All imports OK')"

CMD ["python", "-c", "print('Backend ready'); import time; time.sleep(99999)"]
