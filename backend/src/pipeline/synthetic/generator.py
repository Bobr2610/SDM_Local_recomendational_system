"""
Генератор синтетических фичей для банковских клиентов.

Имитирует:
- Транзакции за 3-6 месяцев
- Аггрегированные признаки (сумма, частота, категории)
- Дополнительные демографические фичи
"""

import numpy as np
from typing import Dict


def generate_synthetic_features(n_users: int, seed: int = 42) -> Dict[str, np.ndarray]:
    """Генерация синтетических фичей для n_users пользователей."""
    rng = np.random.RandomState(seed)

    features = {
        # Демография
        "age": rng.normal(38, 14, n_users).clip(18, 90),
        "tenure_months": rng.randint(1, 120, n_users),

        # Финансы
        "monthly_income": rng.lognormal(10.5, 0.8, n_users),
        "account_balance": rng.lognormal(11.5, 1.2, n_users),
        "credit_score": rng.normal(650, 100, n_users).clip(300, 900),

        # Транзакции (агрегация за 3-6 мес)
        "txn_count_3m": rng.poisson(25, n_users),
        "txn_total_3m": rng.lognormal(11, 1.5, n_users),
        "txn_categories_used": rng.randint(1, 8, n_users),
        "txn_online_ratio": rng.beta(3, 1.5, n_users),
        "txn_weekend_ratio": rng.beta(2, 5, n_users),

        # Кредитная история
        "loans_active": rng.poisson(1.5, n_users),
        "loans_total_amount": rng.lognormal(12, 2, n_users) * (rng.random(n_users) < 0.3),
        "credit_cards_count": rng.poisson(2, n_users),

        # Поведение
        "mobile_logins_30d": rng.poisson(15, n_users),
        "support_calls_30d": rng.poisson(2, n_users),
        "product_views_30d": rng.poisson(5, n_users),
    }

    return features


def combine_with_real(
    real_X: np.ndarray,
    synthetic: Dict[str, np.ndarray],
) -> np.ndarray:
    """Объединение реальных и синтетических фичей."""
    n = real_X.shape[0]
    syn_matrix = np.column_stack([
        synthetic[k][:n] for k in synthetic
    ]).astype(np.float32)

    # Нормализация синтетики
    syn_matrix = (syn_matrix - syn_matrix.mean(axis=0)) / (syn_matrix.std(axis=0) + 1e-8)
    syn_matrix = np.nan_to_num(syn_matrix)

    # Конкатенация + обрезка до input_dim
    combined = np.concatenate([real_X, syn_matrix], axis=1)
    return combined[:, :32]
