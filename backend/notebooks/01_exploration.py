"""
Ноутбук для исследования датасета Santander и BitNet.

Что внутри:
1. Загрузка и анализ Santander Product Recommendation
2. Визуализация распределения продуктов
3. Тестовый прогон BitNet модели
4. Сравнение метрик (Precision@k, NDCG@k)
"""

# %% [markdown]
# # Santander Product Recommendation + BitNet
# Edge-модель для персональных рекомендаций банковских продуктов.

# %% imports
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

sys.path.insert(0, "..")

from src.pipeline.loaders.santander import load_santander
from src.models.bitnet import BitNetRecommender
from src.edge.runtime.inference import EdgeRuntime

# %% [markdown]
# ## 1. Загрузка данных

X, y = load_santander(sample_frac=0.01)
print(f"X: {X.shape}, y: {y.shape}")
print(f"Продуктов на пользователя: {y.sum(axis=1).mean():.1f}")

# %% [markdown]
# ## 2. Распределение продуктов

product_counts = y.sum(axis=0)
plt.figure(figsize=(14, 4))
plt.bar(range(36), product_counts)
plt.title("Популярность продуктов")
plt.xlabel("Product ID")
plt.ylabel("Пользователей")
plt.show()

# %% [markdown]
# ## 3. Тестовый прогон BitNet

import torch

model = BitNetRecommender(input_dim=32, num_products=36)
model.eval()

xb = torch.from_numpy(X[:100])
with torch.no_grad():
    logits = model(xb)
    probs = torch.sigmoid(logits)

print(f"Prediction shape: {probs.shape}")
print(f"Top-3 для первого пользователя: {probs[0].topk(3).indices.tolist()}")

# %% [markdown]
# ## 4. Edge-рантайм

runtime = EdgeRuntime()
feats = runtime.extract_features(age=30, balance=250000, monthly_income=85000, account_type=0, currency=0)
scores = runtime.predict(feats)
top = runtime.get_top_k(scores, k=3)
print(f"Edge Runtime top-3: {top}")

# Имитация клика
runtime.track_click("dep-1")
feats2 = runtime.extract_features(age=30, balance=250000, monthly_income=85000, account_type=0, currency=0)
scores2 = runtime.personalize("user-1", runtime.predict(feats2))
print(f"After click: {runtime.get_top_k(scores2, k=3)}")
