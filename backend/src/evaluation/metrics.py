"""
Метрики оценки рекомендательной модели.

Использование:
    from src.evaluation.metrics import precision_at_k, ndcg_at_k, business_value

Архитектура:
- Precision@k: доля релевантных среди top-k
- NDCG@k: нормализованный DCG
- Business value: profit_score взвешенная сумма
"""

import numpy as np
from typing import List, Dict


def precision_at_k(y_true: np.ndarray, y_pred: np.ndarray, k: int = 5) -> float:
    """Precision@k: сколько продуктов из top-k действительно релевантны."""
    top_k = np.argsort(-y_pred, axis=1)[:, :k]
    hits = 0
    total = 0
    for i in range(len(y_true)):
        hits += y_true[i, top_k[i]].sum()
        total += k
    return hits / total if total > 0 else 0.0


def ndcg_at_k(y_true: np.ndarray, y_pred: np.ndarray, k: int = 5) -> float:
    """NDCG@k: нормализованный Discounted Cumulative Gain."""
    top_k = np.argsort(-y_pred, axis=1)[:, :k]
    ndcg = 0.0
    for i in range(len(y_true)):
        dcg = 0.0
        idcg = 0.0
        rel = y_true[i]
        for j, idx in enumerate(top_k[i]):
            dcg += rel[idx] / np.log2(j + 2)
        ideal_order = np.argsort(-rel)[:k]
        for j, idx in enumerate(ideal_order):
            idcg += rel[idx] / np.log2(j + 2)
        ndcg += dcg / idcg if idcg > 0 else 0.0
    return ndcg / len(y_true)


def business_value(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    profit_scores: np.ndarray,
    k: int = 5,
) -> float:
    """Business Value: сумма profit_score для релевантных среди top-k."""
    top_k = np.argsort(-y_pred, axis=1)[:, :k]
    total = 0.0
    for i in range(len(y_true)):
        for idx in top_k[i]:
            if y_true[i, idx] > 0:
                total += profit_scores[idx]
    return total / len(y_true)


def evaluate_all(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    profit_scores: np.ndarray | None = None,
    k: int = 5,
) -> Dict[str, float]:
    """Все метрики одним вызовом."""
    if profit_scores is None:
        profit_scores = np.linspace(1, 10, y_true.shape[1])

    return {
        f"precision@{k}": precision_at_k(y_true, y_pred, k),
        f"ndcg@{k}": ndcg_at_k(y_true, y_pred, k),
        f"business_value@{k}": business_value(y_true, y_pred, profit_scores, k),
    }
