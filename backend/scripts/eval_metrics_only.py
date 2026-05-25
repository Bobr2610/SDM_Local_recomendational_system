"""Пересчёт metrics.json без полного переобучения (быстрый eval на val)."""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
DATASET_DIR = BACKEND / "datasets" / "raw"
EXPORT_DIR = ROOT / "frontend" / "public" / "model"
WEIGHTS_PATH = EXPORT_DIR / "bitnet_weights.json"

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(BACKEND))
from src.evaluation.metrics import evaluate_all
from src.models.bitnet import SimpleBitNet, load_frontend_weights
from src.training.calibration import fit_temperature


def load_data():
    csv_path = DATASET_DIR / "train_wide.csv"
    df = pd.read_csv(csv_path, low_memory=False).sample(frac=0.1, random_state=42)
    n = len(df)
    X_raw = np.zeros((n, 32), dtype=np.float32)
    X_raw[:, 0] = pd.to_numeric(df["age"], errors="coerce").fillna(35).values
    X_raw[:, 1] = pd.to_numeric(df["income"], errors="coerce").fillna(50000).values
    X_raw[:, 2] = pd.to_numeric(df["income"], errors="coerce").fillna(60000).values
    X_raw[:, 3] = pd.to_numeric(df["is_new_customer"], errors="coerce").fillna(0).values
    X_raw[:, 4] = df["sex"].map({"F": 0.0, "M": 1.0}).fillna(0.0).values
    X_raw[:, 5] = pd.to_numeric(df["seniority_months"], errors="coerce").fillna(0).values / 120.0
    X_raw[:, 6] = (df["segment"] == "VIP").astype(np.float32).values
    X_raw[:, 7] = (df["segment"] == "STUDENTS").astype(np.float32).values
    X = np.zeros((n, 32), dtype=np.float32)
    X[:, 0] = (X_raw[:, 0] - 35) / 15
    X[:, 1] = (X_raw[:, 1] - 50000) / 30000
    X[:, 2] = (X_raw[:, 2] - 60000) / 40000
    X[:, 3] = X_raw[:, 3] / 3
    X[:, 4] = X_raw[:, 4] / 3
    X[:, 5] = X_raw[:, 5]
    X[:, 6] = X_raw[:, 6]
    X[:, 7] = X_raw[:, 7]
    product_cols = [
        c
        for c in df.columns
        if c
        not in [
            "user_id",
            "sex",
            "age",
            "is_new_customer",
            "seniority_months",
            "income",
            "segment",
        ]
    ]
    y_raw = df[product_cols].fillna(0).values.astype(np.float32)
    y = np.zeros((n, 36), dtype=np.float32)
    y[:, : min(y_raw.shape[1], 36)] = y_raw[:, :36]
    return X, y, product_cols


def main():
    if not WEIGHTS_PATH.exists():
        raise FileNotFoundError(f"Missing {WEIGHTS_PATH}, run train_santander.py first")

    X, y, _product_cols = load_data()
    _, X_val, _, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    X_val_t = torch.from_numpy(X_val)
    y_val_t = torch.from_numpy(y_val)

    weights = json.loads(WEIGHTS_PATH.read_text(encoding="utf-8"))
    model = SimpleBitNet()
    load_frontend_weights(model, weights)
    model.eval()

    with torch.no_grad():
        val_logits = model(X_val_t)
        temperature = fit_temperature(val_logits, y_val_t)
        val_loss = F.binary_cross_entropy_with_logits(val_logits / temperature, y_val_t).item()
        y_pred = torch.sigmoid(val_logits / temperature).cpu().numpy()

    rec = evaluate_all(y_val, y_pred, k=5)

    top1 = np.sort(y_pred, axis=1)[:, -1]
    top2 = np.sort(y_pred, axis=1)[:, -2]
    margins = top1 - top2

    out = {
        "model": "BitNet b1.58 (Microsoft FAQ + bitnet.cpp)",
        "dataset": "train_wide.csv",
        "sample_frac": 0.1,
        "epochs": 15,
        "train_samples": int(len(X) * 0.8),
        "val_samples": int(len(X_val)),
        "train_loss": None,
        "val_loss": round(val_loss, 4),
        "loss": "focal + lambda@5",
        "metrics": {k: round(float(v), 4) for k, v in rec.items()},
        "inference": {
            "temperature": round(temperature, 4),
            "min_score": round(float(np.percentile(top1, 25)), 4),
            "min_margin": round(float(max(0.03, np.percentile(margins, 25))), 4),
        },
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    path = EXPORT_DIR / "metrics.json"
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"Saved {path}")
    for k, v in rec.items():
        print(f"  {k}: {v:.4f}")


if __name__ == "__main__":
    main()
