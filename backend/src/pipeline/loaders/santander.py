"""
Загрузчик датасета Santander Product Recommendation.

Датасет: https://www.kaggle.com/competitions/santander-product-recommendation
- train_ver2.csv: ~13M строк, 48 колонок (дата, пользователь, 24 продукта)
- Используем сэмплирование и агрегацию для обучения.

Выходной формат:
- X: фичи пользователя (age, renta, segment, channel, ...)
- y: multi-hot вектор принадлежащих продуктов (24 → 36 после маппинга)
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Tuple, Optional

DATA_DIR = Path(__file__).parent.parent.parent.parent / "datasets" / "raw"


def load_santander(
    sample_frac: float = 0.1,
    random_state: int = 42,
    data_path: Optional[Path] = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """Загрузка и предобработка Santander датасета.

    Returns:
        X: [n_samples, n_features] — нормализованные фичи
        y: [n_samples, 36] — расширенный multi-hot вектор продуктов
    """
    path = data_path or DATA_DIR / "train_ver2.csv"
    if not path.exists():
        return _generate_synthetic_data()

    df = pd.read_csv(path, low_memory=False)
    df = df.sample(frac=sample_frac, random_state=random_state)

    # Отбираем фичи
    feature_cols = [
        "age", "antiguedad", "renta",
        "ind_actividad_cliente", "segmento",
        "canal_entrada",
    ]
    available = [c for c in feature_cols if c in df.columns]

    # One-hot для категориальных
    df_encoded = pd.get_dummies(df[available].fillna(0), columns=["segmento", "canal_entrada"], dummy_na=False)

    X = df_encoded.values.astype(np.float32)
    X = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-8)
    X = np.nan_to_num(X)

    # Ограничим до 32 фичей (добиваем нулями или PCA)
    if X.shape[1] < 32:
        X = np.pad(X, ((0, 0), (0, 32 - X.shape[1])))
    else:
        X = X[:, :32]

    # Таргет: продукты, которыми владеет пользователь
    product_cols = [c for c in df.columns if c.startswith("ind_")]
    y_raw = df[product_cols].fillna(0).values.astype(np.float32)

    # Расширяем до 36 продуктов
    y = np.zeros((y_raw.shape[0], 36), dtype=np.float32)
    n_products = min(y_raw.shape[1], 36)
    y[:, :n_products] = y_raw[:, :n_products]

    return X, y


def _generate_synthetic_data(n_samples: int = 10000, n_features: int = 32) -> Tuple[np.ndarray, np.ndarray]:
    """Генерация синтетических данных при отсутствии датасета."""
    rng = np.random.RandomState(42)

    X = np.column_stack([
        rng.normal(35, 15, n_samples).clip(18, 90),      # age
        rng.normal(50000, 30000, n_samples).clip(0),       # balance
        rng.normal(60000, 40000, n_samples).clip(0),       # monthly_income
        rng.randint(0, 4, n_samples),                      # account_type (0-3)
        rng.randint(0, 4, n_samples),                      # currency (0-3)
        rng.normal(0, 1, (n_samples, n_features - 5)),     # другие фичи
    ]).astype(np.float32)

    X = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-8)
    X = np.nan_to_num(X)

    # Синтетический таргет: коррелируем с возрастом и доходом
    y = np.zeros((n_samples, 36), dtype=np.float32)
    for i in range(36):
        base_prob = 0.15 + 0.05 * np.sin(i * 0.5)
        score = 0.3 * ((X[:, 0] - 18) / 72) + 0.4 * ((X[:, 1]) / X[:, 1].max()) + 0.3 * ((X[:, 2]) / X[:, 2].max())
        prob = np.clip(base_prob + 0.2 * score + rng.normal(0, 0.05, n_samples), 0, 1)
        y[:, i] = (rng.random(n_samples) < prob).astype(np.float32)

    return X, y


class SantanderDataLoader:
    """DataLoader для Santander + пользовательские события."""
    def __init__(self, batch_size: int = 256):
        self.batch_size = batch_size
        self.X, self.y = load_santander()
        self._idx = 0

    def __len__(self):
        return len(self.X) // self.batch_size

    def __iter__(self):
        self._idx = 0
        return self

    def __next__(self):
        if self._idx >= len(self.X):
            raise StopIteration
        start = self._idx
        end = min(start + self.batch_size, len(self.X))
        self._idx = end
        return (
            torch.from_numpy(self.X[start:end]),
            torch.from_numpy(self.y[start:end]),
        )


import torch

if __name__ == "__main__":
    X, y = load_santander(sample_frac=0.01)
    print(f"Santander: X={X.shape}, y={y.shape}")
    print(f"  Features: {X.shape[1]}, Products: {y.shape[1]}")
    print(f"  Mean products/user: {y.sum(axis=1).mean():.1f}")
