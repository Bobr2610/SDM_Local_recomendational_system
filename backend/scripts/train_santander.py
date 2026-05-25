"""
Обучение BitNet на кастомном датасете (train_wide.csv) и экспорт для фронтенда.

Запуск: python backend/scripts/train_santander.py
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import torch
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
DATASET_DIR = BACKEND / "datasets" / "raw"

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(BACKEND))

from src.evaluation.metrics import evaluate_all
from src.models.bitnet import SimpleBitNet, export_frontend_weights
from src.training.losses import combined_recommendation_loss
from src.training.calibration import fit_temperature

SAMPLE_FRAC = float(os.environ.get("SAMPLE_FRAC", "0.2"))
EPOCHS = int(os.environ.get("EPOCHS", "15"))
FOCAL_WEIGHT = float(os.environ.get("FOCAL_WEIGHT", "1.0"))
RANK_WEIGHT = float(os.environ.get("RANK_WEIGHT", "0.5"))

# ═══════════════════════════════════════
# 1. Загрузка датасета
# ═══════════════════════════════════════

print("=== Loading custom dataset ===")
csv_path = DATASET_DIR / "train_wide.csv"
product_cols: list[str] = []

if csv_path.exists():
    print(f"  Loading {csv_path}...")
    df = pd.read_csv(csv_path, low_memory=False)
    df = df.sample(frac=SAMPLE_FRAC, random_state=42).reset_index(drop=True)
    print(f"  Sample frac: {SAMPLE_FRAC}")
    n = len(df)
    print(f"  Rows: {n}")

    # Фичи: age, income, is_new_customer → маппим на формат фронтенда
    # Фронтенд: [age_norm, balance_norm, income_norm, accountType, currency, click_hashes...]
    # Наши данные: age, seniority_months, income, is_new_customer, sex, segment

    X_raw = np.zeros((n, 32), dtype=np.float32)

    X_raw[:, 0] = pd.to_numeric(df["age"], errors="coerce").fillna(35).values  # age
    X_raw[:, 1] = pd.to_numeric(df["income"], errors="coerce").fillna(50000).values  # balance proxy
    X_raw[:, 2] = pd.to_numeric(df["income"], errors="coerce").fillna(60000).values  # monthlyIncome
    X_raw[:, 3] = pd.to_numeric(df["is_new_customer"], errors="coerce").fillna(0).values  # accountType proxy
    X_raw[:, 4] = (df["sex"].map({"F": 0.0, "M": 1.0}).fillna(0.0).values)  # currency proxy
    X_raw[:, 5] = pd.to_numeric(df["seniority_months"], errors="coerce").fillna(0).values / 120.0
    X_raw[:, 6] = (df["segment"] == "VIP").astype(np.float32).values
    X_raw[:, 7] = (df["segment"] == "STUDENTS").astype(np.float32).values

    # Нормализация как во фронтенде
    X = np.zeros((n, 32), dtype=np.float32)
    X[:, 0] = (X_raw[:, 0] - 35) / 15
    X[:, 1] = (X_raw[:, 1] - 50000) / 30000
    X[:, 2] = (X_raw[:, 2] - 60000) / 40000
    X[:, 3] = X_raw[:, 3] / 3
    X[:, 4] = X_raw[:, 4] / 3
    X[:, 5] = X_raw[:, 5]
    X[:, 6] = X_raw[:, 6]
    X[:, 7] = X_raw[:, 7]

    save_mean = X_raw[:, :8].mean(axis=0).tolist()
    save_std = X_raw[:, :8].std(axis=0).tolist()

    # Продукты
    product_cols = [c for c in df.columns if c not in ["user_id", "sex", "age", "is_new_customer", "seniority_months", "income", "segment"]]
    y_raw = df[product_cols].fillna(0).values.astype(np.float32)

    y = np.zeros((n, 36), dtype=np.float32)
    n_prod = min(y_raw.shape[1], 36)
    y[:, :n_prod] = y_raw[:, :n_prod]

    print(f"  Features: age, income, is_new_customer, sex, seniority_months, segment")
    print(f"  Products: {len(product_cols)} → padded to 36")
    print(f"  X: {X.shape}, y: {y.shape}")
else:
    print("  Dataset not found, using synthetic data")
    rng = np.random.RandomState(42)
    n = 10000
    X_raw = np.column_stack([
        np.clip(rng.normal(35, 15, n), 18, 90),
        np.clip(rng.normal(50000, 30000, n), 0, None),
        np.clip(rng.normal(60000, 40000, n), 0, None),
        rng.randint(0, 4, n).astype(np.float32),
        rng.randint(0, 4, n).astype(np.float32),
        rng.normal(0, 1, (n, 27)),
    ]).astype(np.float32)
    X = np.zeros((n, 32), dtype=np.float32)
    X[:, 0] = (X_raw[:, 0] - 35) / 15
    X[:, 1] = (X_raw[:, 1] - 50000) / 30000
    X[:, 2] = (X_raw[:, 2] - 60000) / 40000
    X[:, 3] = X_raw[:, 3] / 3
    X[:, 4] = X_raw[:, 4] / 3
    X[:, 5:] = X_raw[:, 5:32]

    save_mean = X_raw[:, :5].mean(axis=0).tolist()
    save_std = X_raw[:, :5].std(axis=0).tolist()

    y = np.zeros((n, 36), dtype=np.float32)
    for i in range(36):
        base = 0.1 + 0.05 * np.sin(i * 0.5)
        prob = np.clip(base + 0.3 * (X[:,0]+3)/6 + 0.3 * (X[:,1]+3)/6 + rng.normal(0, 0.1, n), 0, 1)
        y[:, i] = (rng.random(n) < prob).astype(np.float32)

    product_cols = [f"prod-{i}" for i in range(22)]

# ═══════════════════════════════════════
# 2. BitNet b1.58 (Microsoft FAQ quantizers, src.models.bitnet)
# ═══════════════════════════════════════

print("\n=== Training BitNet b1.58 (SimpleBitNet) ===")

device = "cpu"
X_tr, X_val, y_tr, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)
X_tr = torch.from_numpy(X_tr).to(device)
y_tr = torch.from_numpy(y_tr).to(device)
X_val = torch.from_numpy(X_val).to(device)
y_val = torch.from_numpy(y_val).to(device)

model = SimpleBitNet(d_in=32, d_out=36, d_h=128, n_layers=3, dropout=0.1).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)

final_train_loss = 0.0
final_val_loss = 0.0
print(f"  Loss: Focal (w={FOCAL_WEIGHT}) + Lambda@5 (w={RANK_WEIGHT})")

for epoch in range(EPOCHS):
    model.train()
    total = 0.0
    n_batches = 0
    for i in range(0, len(X_tr), 128):
        xb, yb = X_tr[i:i+128], y_tr[i:i+128]
        opt.zero_grad()
        logits = model(xb)
        l = combined_recommendation_loss(
            logits,
            yb,
            focal_weight=FOCAL_WEIGHT,
            rank_weight=RANK_WEIGHT,
            rank_k=5,
        )
        l.backward()
        opt.step()
        total += l.item()
        n_batches += 1

    model.eval()
    with torch.no_grad():
        val_logits = model(X_val)
        val_focal = combined_recommendation_loss(
            val_logits,
            y_val,
            focal_weight=FOCAL_WEIGHT,
            rank_weight=RANK_WEIGHT,
            rank_k=5,
        )
        final_val_loss = val_focal.item()
    final_train_loss = total / max(n_batches, 1)
    print(f"  Epoch {epoch+1:2d}/{EPOCHS}: loss={final_train_loss:.4f} val={final_val_loss:.4f}")

# ═══════════════════════════════════════
# 3. Экспорт весов для фронтенда
# ═══════════════════════════════════════

print("\n=== Exporting model weights for frontend ===")

export_dir = ROOT / "frontend" / "public" / "model"
export_frontend_weights(
    model,
    export_dir,
    feature_names=[
        "age",
        "seniority_months",
        "income",
        "is_new_customer",
        "sex_enc",
        "segment_INDIVIDUALS",
        "segment_VIP",
        "segment_STUDENTS",
    ],
    product_names=product_cols[:36],
    norm_mean=save_mean,
    norm_std=save_std,
)

norm_data = {
    "mean": save_mean,
    "std": save_std,
    "feature_names": [
        "age",
        "balance",
        "monthlyIncome",
        "accountType",
        "currency",
        "seniority_months",
        "segment_vip",
        "segment_students",
    ],
}
with open(export_dir / "normalization.json", "w", encoding="utf-8") as f:
    json.dump(norm_data, f)
print(f"  Norms saved:   {export_dir / 'normalization.json'}")

# ═══════════════════════════════════════
# 3b. Метрики качества на validation
# ═══════════════════════════════════════

print("\n=== Temperature calibration ===")
model.eval()
with torch.no_grad():
    val_logits = model(X_val)
    temperature = fit_temperature(val_logits, y_val)
    y_pred = torch.sigmoid(val_logits / temperature).cpu().numpy()
    y_true_np = y_val.cpu().numpy()
    rec_metrics = evaluate_all(y_true_np, y_pred, k=5)

print(f"  temperature: {temperature:.3f}")

for name, value in rec_metrics.items():
    print(f"  {name}: {value:.4f}")

# Пороги для фронта: отсекаем слабые рекомендации
probs = y_pred
top1 = np.sort(probs, axis=1)[:, -1]
top2 = np.sort(probs, axis=1)[:, -2]
margins = top1 - top2
min_score = float(np.percentile(top1, 25))
min_margin = float(max(0.03, np.percentile(margins, 25)))

metrics_export = {
    "model": "BitNet b1.58 (Microsoft FAQ + bitnet.cpp)",
    "dataset": str(csv_path.name) if csv_path.exists() else "synthetic",
    "sample_frac": SAMPLE_FRAC if csv_path.exists() else 1.0,
    "epochs": EPOCHS,
    "train_samples": int(len(X_tr)),
    "val_samples": int(len(X_val)),
    "train_loss": round(final_train_loss, 4),
    "val_loss": round(final_val_loss, 4),
    "loss": "focal + lambda@5",
    "metrics": {k: round(float(v), 4) for k, v in rec_metrics.items()},
    "inference": {
        "temperature": round(temperature, 4),
        "min_score": round(min_score, 4),
        "min_margin": round(min_margin, 4),
    },
    "updated_at": datetime.now(timezone.utc).isoformat(),
}
with open(export_dir / "metrics.json", 'w') as f:
    json.dump(metrics_export, f, indent=2)
print(f"  Metrics saved: {export_dir / 'metrics.json'}")

# ═══════════════════════════════════════
# 4. Проверка
# ═══════════════════════════════════════

print("\n=== Verification ===")
model.eval()
test_x = torch.randn(3, 32)
with torch.no_grad():
    out = torch.sigmoid(model(test_x) / temperature)
    top3 = out.topk(3, dim=1)
    print(f"  Sample predictions:")
    for i in range(3):
        print(f"    User {i}: top-3 = {top3.indices[i].tolist()}, scores = {[round(float(s),3) for s in top3.values[i]]}")

params = sum(p.numel() for p in model.parameters())
w_params = sum(p.numel() for n, p in model.named_parameters() if 'weight' in n and p.dim()>=2)
size_kb = (w_params * 1.58 / 8 + (params - w_params) * 2) / 1024
print(f"\n  Model: {params:,} params, ~{size_kb:.0f} KB (1.58-bit)")
print(f"  Weights → frontend/public/model/bitnet_weights.json")
print("\nDONE: модель обучена и экспортирована во фронтенд")
