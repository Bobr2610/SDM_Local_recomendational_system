"""
Export CatBoost pointwise model for offline phone / web (JS surrogate + metadata).

  python backend/scripts/export_catboost_mobile.py

Outputs:
  frontend/public/model/catboost_mobile.json
  mobile/assets/model/catboost_mobile.json
  frontend/public/model/feature_order.json  (updated)
  frontend/public/model/model_manifest.json
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import (  # noqa: E402
    CatBoostPointwiseRecommender,
    UserContext,
    synthetic_from_row,
    PRODUCTS,
)
from src.pipeline.loaders.custom_wide import export_feature_order  # noqa: E402

FRONTEND_MODEL = ROOT / "frontend" / "public" / "model"
MOBILE_MODEL = ROOT / "mobile" / "assets" / "model"
DATA_CSV = ROOT / "backend" / "datasets" / "raw" / "train_wide_with_lags.csv"
SAMPLE_ROWS = 8000


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def distill_surrogate(rec: CatBoostPointwiseRecommender) -> dict:
    if not DATA_CSV.exists():
        raise FileNotFoundError(f"Dataset missing: {DATA_CSV}")

    df = pd.read_csv(DATA_CSV, low_memory=False)
    if len(df) > SAMPLE_ROWS:
        df = df.sample(n=SAMPLE_ROWS, random_state=42)

    rows_x: list[list[float]] = []
    rows_y: list[int] = []
    products = rec.products

    for _, row in df.iterrows():
        syn = synthetic_from_row(row)
        owned = {p: float(row[p] > 0) if p in row.index else 0.0 for p in products}
        ctx = UserContext(
            age=float(row["age"]),
            sex=str(row["sex"]),
            is_new_customer=int(row["is_new_customer"]),
            seniority_months=float(row["seniority_months"]),
            region_name=str(row["region_name"]),
            segment=str(row["segment"]),
            income_at_lag=float(row.get("income_filled", row.get("income", 50000))),
            owned_products=owned,
            synthetic=syn,
        )
        frame = rec.build_rows(ctx)
        proba = rec.model.predict_proba(frame)[:, 1]
        for i, product in enumerate(products):
            r = frame.iloc[i]
            vec = [
                float(r["age"]),
                float(r["seniority_months"]),
                float(r["income_at_lag"]),
                float(r["is_new_customer"] == "1"),
            ]
            for k in syn:
                vec.append(float(r[k]))
            for p in products:
                vec.append(float(r[f"own_{p}"]))
            vec.append(1.0 if str(r["sex"]) == "M" else 0.0)
            vec.append(1.0 if str(r["segment"]) == "VIP" else 0.0)
            vec.append(1.0 if str(r["segment"]) == "STUDENTS" else 0.0)
            for j, p in enumerate(products):
                vec.append(1.0 if p == product else 0.0)
            rows_x.append(vec)
            rows_y.append(1 if proba[i] >= 0.5 else 0)

    X = np.nan_to_num(np.array(rows_x, dtype=np.float32), nan=0.0, posinf=1e6, neginf=-1e6)
    y = np.array(rows_y, dtype=np.int8)
    clf = LogisticRegression(max_iter=400, C=1.0, solver="lbfgs")
    clf.fit(X, y)

    return {
        "model_type": "logistic_surrogate",
        "n_features": int(X.shape[1]),
        "coef": clf.coef_.reshape(-1).tolist(),
        "intercept": float(clf.intercept_[0]),
        "products": products,
        "numeric_layout": {
            "base": ["age", "seniority_months", "income_at_lag", "is_new_customer"],
            "synthetic": list(syn.keys()),
            "own_products": products,
            "sex_male": True,
            "segment_vip": True,
            "segment_students": True,
            "product_one_hot": products,
        },
    }


def main() -> None:
    FRONTEND_MODEL.mkdir(parents=True, exist_ok=True)
    MOBILE_MODEL.mkdir(parents=True, exist_ok=True)

    rec = CatBoostPointwiseRecommender()
    print("Distilling mobile surrogate (logistic on CatBoost scores)…")
    surrogate = distill_surrogate(rec)

    meta = {
        "version": 2,
        "inference": "catboost_logistic_surrogate",
        "source_model": "backend/models/export/catboost_pointwise_holdout.pkl",
        "products": rec.products,
        "feature_names": rec.feature_names,
        "defaults": {
            "region_name": "Moscow",
            "segment": "INDIVIDUALS",
            "sex": "M",
        },
        "surrogate": surrogate,
    }

    out_name = "catboost_mobile.json"
    payload = json.dumps(meta, ensure_ascii=False, indent=2)
    for dest in (FRONTEND_MODEL, MOBILE_MODEL):
        (dest / out_name).write_text(payload, encoding="utf-8")
        print(f"  wrote {dest / out_name}")

    export_feature_order(rec.products, FRONTEND_MODEL / "feature_order.json")
    shutil_copy = __import__("shutil")
    shutil_copy.copy2(FRONTEND_MODEL / "feature_order.json", MOBILE_MODEL / "feature_order.json")

    manifest = {
        "inference": "catboost_logistic_surrogate",
        "targets": {
            "web": "frontend/public/model",
            "expo_bundle": "mobile/assets/model",
        },
        "files": {
            out_name: {
                "bytes": (FRONTEND_MODEL / out_name).stat().st_size,
                "sha256_16": _sha256(FRONTEND_MODEL / out_name),
                "required": True,
            },
            "feature_order.json": {
                "bytes": (FRONTEND_MODEL / "feature_order.json").stat().st_size,
                "sha256_16": _sha256(FRONTEND_MODEL / "feature_order.json"),
                "required": True,
            },
        },
        "train_hint": "Colab notebook → pkl; then: python backend/scripts/export_catboost_mobile.py",
    }
    (FRONTEND_MODEL / "model_manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    shutil_copy.copy2(FRONTEND_MODEL / "model_manifest.json", MOBILE_MODEL / "model_manifest.json")
    print("Done.")


if __name__ == "__main__":
    main()
