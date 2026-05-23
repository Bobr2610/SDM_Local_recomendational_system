"""
Feature engineering: агрегация транзакционных признаков.
"""

import numpy as np
from typing import Dict


def aggregate_transactions(
    txn_amounts: np.ndarray,
    txn_dates: np.ndarray,
    txn_categories: np.ndarray,
    window_days: int = 90,
) -> Dict[str, np.ndarray]:
    """Агрегация транзакций за окно window_days дней.

    Args:
        txn_amounts: [n_txns] суммы
        txn_dates: [n_txns] даты (дни от сегодня)
        txn_categories: [n_txns] категории (0-7)

    Returns:
        Dictionary с аггрегированными признаками
    """
    mask = txn_dates <= window_days

    return {
        "txn_count": np.sum(mask).astype(np.float32) if mask.any() else 0,
        "txn_total": np.sum(txn_amounts[mask]).astype(np.float32) if mask.any() else 0,
        "txn_mean": np.mean(txn_amounts[mask]).astype(np.float32) if mask.any() else 0,
        "txn_std": np.std(txn_amounts[mask]).astype(np.float32) if mask.any() else 0,
        "txn_max": np.max(txn_amounts[mask]).astype(np.float32) if mask.any() else 0,
        "categories_used": len(np.unique(txn_categories[mask])).astype(np.float32) if mask.any() else 0,
    }
