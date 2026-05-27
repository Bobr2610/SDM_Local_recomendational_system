"""
Загрузчик wide-датасета (train_wide.csv / train_wide_with_lags.csv).

Ноутбуки (data prep на main):
  - datasets/00_clean_dataset.ipynb
  - datasets/01_generate_income_from_cleaned.ipynb
→ итоговый CSV с income, lag_* и target_* (как train_wide_with_lags.csv)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[3] / "datasets" / "raw"
DEFAULT_CSV = DATA_DIR / "train_wide_with_lags.csv"
FALLBACK_CSV = DATA_DIR / "train_wide.csv"

META_COLS = {
    "user_id",
    "sex",
    "age",
    "is_new_customer",
    "seniority_months",
    "region_code",
    "region_name",
    "segment",
    "income",
    "income_generated",
    "income_filled",
    "date",
    "lag_30",
    "lag_60",
    "lag_90",
}

# 22 продукта — совпадают с frontend/public/model/feature_order.json
BASE_PRODUCTS = [
    "dep-7", "card-2", "dep-5", "card-1", "card-5", "rko-2", "rko-3", "rko-4",
    "dep-9", "dep-1", "dep-3", "rko-1", "dep-2", "loan-2", "card-4", "loan-1",
    "srv-3", "loan-5", "biz-4", "dep-6", "loan-4", "card-3",
]

CAT_COLS = {"sex": ["F", "M"], "segment": ["INDIVIDUALS", "VIP", "STUDENTS"]}


def resolve_dataset_path(data_path: Optional[Path] = None) -> Path:
    if data_path is not None:
        return data_path
    if DEFAULT_CSV.exists():
        return DEFAULT_CSV
    return FALLBACK_CSV


def load_custom_wide(
    sample_frac: float = 1.0,
    random_state: int = 42,
    data_path: Optional[Path] = None,
    max_features: int = 32,
    max_products: int = 36,
    target_horizon: str = "90",
    use_future_targets: bool = True,
) -> Tuple[np.ndarray, np.ndarray, list[str], list[str], dict]:
    """
    Returns:
        X (n, max_features), y (n, max_products), feature_names, product_names, meta
    """
    path = resolve_dataset_path(data_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    df = pd.read_csv(path, low_memory=False)
    if sample_frac < 1.0:
        df = df.sample(frac=sample_frac, random_state=random_state)
    df = df.reset_index(drop=True)

    income = (
        pd.to_numeric(df["income_filled"], errors="coerce")
        if "income_filled" in df.columns
        else pd.to_numeric(df.get("income"), errors="coerce")
    ).fillna(50000.0)
    income_gen = (
        pd.to_numeric(df["income_generated"], errors="coerce")
        if "income_generated" in df.columns
        else income
    ).fillna(income)

    age = pd.to_numeric(df["age"], errors="coerce").fillna(35.0)
    seniority = pd.to_numeric(df["seniority_months"], errors="coerce").fillna(0.0) / 120.0
    is_new = pd.to_numeric(df["is_new_customer"], errors="coerce").fillna(0.0)
    sex_enc = df["sex"].map({"F": 0.0, "M": 1.0}).fillna(0.0).values.astype(np.float32)
    seg_vip = (df["segment"] == "VIP").astype(np.float32).values
    seg_students = (df["segment"] == "STUDENTS").astype(np.float32).values

    region = (
        pd.to_numeric(df["region_code"], errors="coerce").fillna(0.0) / 50.0
        if "region_code" in df.columns
        else np.zeros(len(df), dtype=np.float32)
    )

    lag_feats = []
    for col in ("lag_30", "lag_60", "lag_90"):
        if col in df.columns:
            lag_feats.append(pd.to_numeric(df[col], errors="coerce").fillna(0.0).values.astype(np.float32))
    lag_stack = np.column_stack(lag_feats) if lag_feats else np.zeros((len(df), 0), dtype=np.float32)

    # Сырые значения для normalization.json (как во фронте)
    X_raw = np.column_stack([
        age.values.astype(np.float32),
        income.values.astype(np.float32),
        income_gen.values.astype(np.float32),
        is_new.values.astype(np.float32),
        sex_enc,
        seniority.values.astype(np.float32) if hasattr(seniority, "values") else seniority,
        seg_vip,
        seg_students,
        region.values.astype(np.float32) if hasattr(region, "values") else region,
    ])

    # Нормализация под формат фронтенда (modelInference.extractFeatures)
    X = np.zeros((len(df), max_features), dtype=np.float32)
    X[:, 0] = (X_raw[:, 0] - 35.0) / 15.0
    X[:, 1] = (X_raw[:, 1] - 50000.0) / 30000.0
    X[:, 2] = (X_raw[:, 2] - 60000.0) / 40000.0
    X[:, 3] = X_raw[:, 3] / 3.0
    X[:, 4] = X_raw[:, 4] / 3.0
    X[:, 5] = X_raw[:, 5]
    X[:, 6] = X_raw[:, 6]
    X[:, 7] = X_raw[:, 7]

    off = 8
    if off < max_features:
        X[:, off] = X_raw[:, 8]
        off += 1
    for j in range(lag_stack.shape[1]):
        if off >= max_features:
            break
        col = lag_stack[:, j]
        denom = float(np.percentile(np.abs(col), 95) + 1e-6)
        X[:, off] = col / denom
        off += 1

    feature_names = [
        "age", "balance", "monthlyIncome", "accountType", "currency",
        "seniority_months", "segment_vip", "segment_students", "region_code",
        "lag_30", "lag_60", "lag_90",
    ][:max_features]

    product_names = [p for p in BASE_PRODUCTS if p in df.columns]
    if not product_names:
        product_names = [
            c for c in df.columns
            if c not in META_COLS and not c.startswith("target_") and "_lag_" not in c
        ]

    if use_future_targets:
        target_cols = [f"target_{p}_{target_horizon}" for p in product_names]
        if all(c in df.columns for c in target_cols):
            y_raw = df[target_cols].fillna(0).values.astype(np.float32)
        else:
            y_raw = df[product_names].fillna(0).values.astype(np.float32)
    else:
        y_raw = df[product_names].fillna(0).values.astype(np.float32)

    y = np.zeros((y_raw.shape[0], max_products), dtype=np.float32)
    n_prod = min(y_raw.shape[1], max_products)
    y[:, :n_prod] = y_raw[:, :n_prod]

    meta = {
        "path": str(path),
        "rows": len(df),
        "products": product_names,
        "target_horizon": target_horizon if use_future_targets else "current",
        "raw_mean": X_raw[:, :9].mean(axis=0).tolist(),
        "raw_std": (X_raw[:, :9].std(axis=0) + 1e-8).tolist(),
    }

    return X, y, feature_names, product_names, meta


def export_feature_order(product_names: list[str], out_path: Path) -> None:
    payload = {
        "input_features": [
            "age", "seniority_months", "income", "is_new_customer",
            "sex_enc", "segment_INDIVIDUALS", "segment_VIP", "segment_STUDENTS",
        ],
        "product_names": product_names,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    X, y, feat_names, prod_names, meta = load_custom_wide(sample_frac=0.01)
    print(f"Dataset: {meta['path']}")
    print(f"  rows={meta['rows']}, X={X.shape}, y={y.shape}")
    print(f"  products ({len(prod_names)}): {prod_names}")
    print(f"  target: {meta['target_horizon']}")
