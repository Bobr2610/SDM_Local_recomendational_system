"""
Обучение pointwise CatBoost (как в Colab).

Датасет: backend/datasets/raw/train_wide_with_lags.csv
Colab: https://colab.research.google.com/drive/18Egarg7p1_BW2NujhQFGHbwUW6U1XI4y

Запуск из корня репозитория:
  pip install -r backend/requirements.txt
  python backend/scripts/pipeline/train_catboost_pointwise.py --sample-frac 0.2

После обучения:
  python backend/scripts/pipeline/export_catboost_mobile.py
"""

from __future__ import annotations

import argparse
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier, Pool
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from src.models.catboost_pointwise import PRODUCTS, synthetic_from_row  # noqa: E402

DATA_CSV = ROOT / "backend" / "datasets" / "raw" / "train_wide_with_lags.csv"
OUT_PKL = ROOT / "backend" / "models" / "export" / "catboost_pointwise_holdout.pkl"
TARGET_HORIZON = "90"


def build_pointwise_frame(df: pd.DataFrame, products: list[str]) -> tuple[pd.DataFrame, np.ndarray]:
    rows: list[dict] = []
    labels: list[int] = []

    target_cols = {p: f"target_{p}_{TARGET_HORIZON}" for p in products}

    for _, row in df.iterrows():
        syn = synthetic_from_row(row)
        base = {
            "sex": str(row["sex"]),
            "age": float(row["age"]),
            "is_new_customer": str(int(row["is_new_customer"])),
            "seniority_months": float(row["seniority_months"]),
            "region_name": str(row["region_name"]),
            "segment": str(row["segment"]),
            "income_at_lag": float(row.get("income_filled", row.get("income", 50000))),
            **syn,
        }
        for p in products:
            r = dict(base)
            for op in products:
                r[f"own_{op}"] = float(row[op] > 0) if op in row.index else 0.0
            r["product"] = p
            rows.append(r)
            tcol = target_cols[p]
            labels.append(int(row[tcol] > 0) if tcol in row.index else int(row[p] > 0))

    X = pd.DataFrame(rows)
    y = np.array(labels, dtype=np.int8)
    return X, y


def main() -> None:
    p = argparse.ArgumentParser(description="Train pointwise CatBoost recommender")
    p.add_argument("--data", type=Path, default=DATA_CSV)
    p.add_argument("--sample-frac", type=float, default=1.0)
    p.add_argument("--iterations", type=int, default=1200)
    p.add_argument("--depth", type=int, default=8)
    p.add_argument("--lr", type=float, default=0.05)
    p.add_argument("--out", type=Path, default=OUT_PKL)
    args = p.parse_args()

    if not args.data.exists():
        raise SystemExit(f"Dataset not found: {args.data}")

    print(f"Loading {args.data} …")
    df = pd.read_csv(args.data, low_memory=False)
    if args.sample_frac < 1.0:
        df = df.sample(frac=args.sample_frac, random_state=42).reset_index(drop=True)
    print(f"  rows={len(df)}")

    products = [p for p in PRODUCTS if p in df.columns]
    X, y = build_pointwise_frame(df, products)
    print(f"  pointwise rows={len(X)}, positive rate={y.mean():.3f}")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    cat_cols = ["sex", "is_new_customer", "region_name", "segment", "product"]
    train_pool = Pool(X_train, y_train, cat_features=cat_cols)
    val_pool = Pool(X_val, y_val, cat_features=cat_cols)

    model = CatBoostClassifier(
        iterations=args.iterations,
        depth=args.depth,
        learning_rate=args.lr,
        loss_function="Logloss",
        eval_metric="AUC",
        random_seed=42,
        verbose=100,
        early_stopping_rounds=80,
    )
    model.fit(train_pool, eval_set=val_pool, use_best_model=True)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("wb") as f:
        pickle.dump(model, f)
    print(f"Saved: {args.out}")
    print("Next: python backend/scripts/pipeline/export_catboost_mobile.py")


if __name__ == "__main__":
    main()
