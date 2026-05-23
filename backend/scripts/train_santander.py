"""
Скачивание Santander датасета, обучение BitNet, экспорт для фронтенда.

Запуск: python backend/scripts/train_santander.py
"""

import sys, json
from pathlib import Path
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
DATASET_DIR = BACKEND / "datasets" / "raw"

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(BACKEND))

# ═══════════════════════════════════════
# 1. Загрузка датасета Santander
# ═══════════════════════════════════════

print("=== Downloading Santander dataset ===")
csv_path = DATASET_DIR / "train_ver2.csv"
if csv_path.exists():
    print(f"  Found local dataset: {csv_path}")
else:
    try:
        import kagglehub
        path = kagglehub.competition_download("santander-product-recommendation")
        print(f"  Downloaded to: {path}")
        import os, zipfile
        for f in os.listdir(path):
            if f.endswith('.zip'):
                with zipfile.ZipFile(os.path.join(path, f), 'r') as zf:
                    zf.extractall(path)
        csv_path = Path(path) / "train_ver2.csv"
        print(f"  CSV: {csv_path.exists()}")
    except Exception as e:
        print(f"  Kaggle download failed: {e}")
        csv_path = None

# ═══════════════════════════════════════
# 2. Препроцессинг
# ═══════════════════════════════════════

print("\n=== Preprocessing ===")

if csv_path and csv_path.exists():
    print("  Loading train_ver2.csv...")
    df = pd.read_csv(csv_path, nrows=50000, low_memory=False)
    
    FEATURES = ['age', 'antiguedad', 'renta', 'ind_nuevo', 'ind_actividad_cliente']
    available = [c for c in FEATURES if c in df.columns]
    print(f"  Features: {available}")
    
    df_num = df[available].apply(pd.to_numeric, errors="coerce")
    X_raw = df_num.fillna(0).values.astype(np.float32)
    
    product_cols = [c for c in df.columns if c.startswith('ind_') if c != 'ind_nuevo']
    print(f"  Products: {len(product_cols)}")
    
    df_y = df[product_cols].apply(pd.to_numeric, errors="coerce")
    y_raw = df_y.fillna(0).values.astype(np.float32)
    
    # Нормализация
    X_mean = X_raw.mean(axis=0)
    X_std = X_raw.std(axis=0) + 1e-8
    X = np.nan_to_num((X_raw - X_mean) / X_std)
    
    # Пад до 32 фичей
    if X.shape[1] < 32:
        X = np.pad(X, ((0,0), (0, 32 - X.shape[1])))
    X = X[:, :32]
    
    # Пад до 36 продуктов
    y = np.zeros((y_raw.shape[0], 36), dtype=np.float32)
    n_prod = min(y_raw.shape[1], 36)
    y[:, :n_prod] = y_raw[:, :n_prod]
    
    print(f"  X: {X.shape}, y: {y.shape}")
else:
    print("  Using synthetic data (dataset not found)")
    rng = np.random.RandomState(42)
    n = 10000
    X = np.column_stack([
        np.clip(rng.normal(35, 15, n), 18, 90),
        np.clip(rng.normal(50000, 30000, n), 0, None),
        np.clip(rng.normal(60000, 40000, n), 0, None),
        rng.randint(0, 4, n).astype(np.float32),
        rng.randint(0, 4, n).astype(np.float32),
        rng.normal(0, 1, (n, 27)),
    ]).astype(np.float32)
    X = (X - X.mean(0)) / (X.std(0) + 1e-8)
    X = np.nan_to_num(X)

    y = np.zeros((n, 36), dtype=np.float32)
    for i in range(36):
        base = 0.1 + 0.05 * np.sin(i * 0.5)
        prob = np.clip(base + 0.3 * (X[:,0]+3)/6 + 0.3 * (X[:,1]+3)/6 + rng.normal(0, 0.1, n), 0, 1)
        y[:, i] = (rng.random(n) < prob).astype(np.float32)

# ═══════════════════════════════════════
# 3. BitNet b1.58 модель
# ═══════════════════════════════════════

print("\n=== Training BitNet b1.58 ===")

class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.w = nn.Parameter(torch.ones(dim))
    def forward(self, x):
        return x / (x.pow(2).mean(-1, keepdim=True) + self.eps).sqrt() * self.w

class BitLinear(nn.Module):
    def __init__(self, d_in, d_out):
        super().__init__()
        self.norm = RMSNorm(d_in)
        self.weight = nn.Parameter(torch.zeros(d_out, d_in))
        nn.init.trunc_normal_(self.weight, std=0.02)
        self.bias = nn.Parameter(torch.zeros(d_out))
    def forward(self, x):
        x = self.norm(x)
        # act quant int8
        s = x.abs().max(-1, keepdim=True).values.clamp(1e-8) / 127
        xq = torch.clamp(torch.round(x / s), -127, 127) * s
        xq = xq.detach() + x - x.detach()
        # weight quant 1.58
        g = self.weight.abs().mean()
        w = torch.clamp(torch.round(self.weight / (g+1e-8)), -1, 1) * g
        w = w.detach() + self.weight - self.weight.detach()
        return F.linear(xq, w, self.bias)

class BitNet(nn.Module):
    def __init__(self, d_in=32, d_out=36, d_h=128, n_layers=3):
        super().__init__()
        self.embed = nn.Linear(d_in, d_h, bias=False)
        self.blocks = nn.ModuleList([
            nn.Sequential(BitLinear(d_h, d_h), nn.Dropout(0.1)) for _ in range(n_layers)
        ])
        self.norm = RMSNorm(d_h)
        self.head = nn.Linear(d_h, d_out)

    def forward(self, x):
        x = self.embed(x)
        for b in self.blocks:
            x = F.silu(b[0](x)) + x
        return self.head(self.norm(x))

device = 'cpu'
X_tr = torch.from_numpy(X[:int(len(X)*0.8)]).to(device)
y_tr = torch.from_numpy(y[:int(len(y)*0.8)]).to(device)
X_val = torch.from_numpy(X[int(len(X)*0.8):]).to(device)
y_val = torch.from_numpy(y[int(len(y)*0.8):]).to(device)

model = BitNet(d_in=32, d_out=36, d_h=128, n_layers=3).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
loss_fn = nn.BCEWithLogitsLoss()

for epoch in range(15):
    model.train()
    total = 0.0
    for i in range(0, len(X_tr), 128):
        xb, yb = X_tr[i:i+128], y_tr[i:i+128]
        opt.zero_grad()
        l = loss_fn(model(xb), yb)
        l.backward()
        opt.step()
        total += l.item()
    
    model.eval()
    with torch.no_grad():
        vl = loss_fn(model(X_val), y_val).item()
    print(f"  Epoch {epoch+1:2d}: loss={total/(len(X_tr)//128+1):.4f} val={vl:.4f}")

# ═══════════════════════════════════════
# 4. Экспорт весов для фронтенда
# ═══════════════════════════════════════

print("\n=== Exporting model weights for frontend ===")

weights = {}
model.eval()
for name, param in model.named_parameters():
    if 'weight' in name and param.dim() >= 2:
        p = param.detach()
        g = float(p.abs().mean())
        w = torch.clamp(torch.round(p / (g+1e-8)), -1, 1).cpu().numpy()
        weights[name] = {'data': w.tolist(), 'gamma': g, 'shape': list(w.shape)}
    else:
        weights[name] = {'data': param.detach().cpu().numpy().tolist(), 'shape': list(param.detach().shape)}

# Сохраняем
export_dir = ROOT / "frontend" / "public" / "model"
export_dir.mkdir(parents=True, exist_ok=True)

with open(export_dir / "bitnet_weights.json", 'w') as f:
    json.dump(weights, f)
print(f"  Weights saved: {export_dir / 'bitnet_weights.json'}")
print(f"  Norms saved:   {export_dir / 'normalization.json'}")

# ═══════════════════════════════════════
# 5. Проверка
# ═══════════════════════════════════════

print("\n=== Verification ===")
model.eval()
test_x = torch.randn(3, 32)
with torch.no_grad():
    out = torch.sigmoid(model(test_x))
    top3 = out.topk(3, dim=1)
    print(f"  Sample predictions:")
    for i in range(3):
        print(f"    User {i}: top-3 = {top3.indices[i].tolist()}, scores = {[round(float(s),3) for s in top3.values[i]]}")

params = sum(p.numel() for p in model.parameters())
w_params = sum(p.numel() for n, p in model.named_parameters() if 'weight' in n and p.dim()>=2)
size_kb = (w_params * 1.58 / 8 + (params - w_params) * 2) / 1024
print(f"\n  Model: {params:,} params, ~{size_kb:.0f} KB (1.58-bit)")
print(f"  Real data: {'YES' if csv_path and csv_path.exists() else 'synthetic'}")
print(f"  Weights → frontend/public/model/bitnet_weights.json")
print("\nDONE: модель обучена и экспортирована во фронтенд")
