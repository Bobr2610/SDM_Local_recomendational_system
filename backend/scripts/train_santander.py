"""
Обучение BitNet на train_wide_with_lags.csv и экспорт в frontend/public/model.

Data prep (ноутбуки на main, если CSV ещё нет):
  backend/datasets/00_clean_dataset.ipynb
  backend/datasets/01_generate_income_from_cleaned.ipynb

Запуск:
  python backend/scripts/train_santander.py
  python backend/scripts/train_santander.py --sample-frac 0.2 --epochs 12
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(BACKEND))

from src.pipeline.loaders.custom_wide import (  # noqa: E402
    export_feature_order,
    load_custom_wide,
    resolve_dataset_path,
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Train BitNet on wide dataset with lags")
    p.add_argument("--data", type=Path, default=None, help="CSV path (default: train_wide_with_lags.csv)")
    p.add_argument("--sample-frac", type=float, default=0.25, help="Row sample for training (1.0 = full)")
    p.add_argument("--epochs", type=int, default=12)
    p.add_argument("--batch-size", type=int, default=256)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--no-future-targets", action="store_true", help="Use current product flags instead of target_*_90")
    return p.parse_args()


class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6) -> None:
        super().__init__()
        self.eps = eps
        self.w = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x / (x.pow(2).mean(-1, keepdim=True) + self.eps).sqrt() * self.w


class BitLinear(nn.Module):
    def __init__(self, d_in: int, d_out: int) -> None:
        super().__init__()
        self.norm = RMSNorm(d_in)
        self.weight = nn.Parameter(torch.zeros(d_out, d_in))
        nn.init.trunc_normal_(self.weight, std=0.02)
        self.bias = nn.Parameter(torch.zeros(d_out))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.norm(x)
        s = x.abs().max(-1, keepdim=True).values.clamp(1e-8) / 127
        xq = torch.clamp(torch.round(x / s), -127, 127) * s
        xq = xq.detach() + x - x.detach()
        g = self.weight.abs().mean()
        w = torch.clamp(torch.round(self.weight / (g + 1e-8)), -1, 1) * g
        w = w.detach() + self.weight - self.weight.detach()
        return F.linear(xq, w, self.bias)


class BitNet(nn.Module):
    def __init__(self, d_in: int = 32, d_out: int = 36, d_h: int = 128, n_layers: int = 3) -> None:
        super().__init__()
        self.embed = nn.Linear(d_in, d_h, bias=False)
        self.blocks = nn.ModuleList([nn.Sequential(BitLinear(d_h, d_h), nn.Dropout(0.1)) for _ in range(n_layers)])
        self.norm = RMSNorm(d_h)
        self.head = nn.Linear(d_h, d_out)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.embed(x)
        for b in self.blocks:
            x = F.silu(b[0](x)) + x
        return self.head(self.norm(x))


def export_weights(model: BitNet, export_dir: Path, meta: dict) -> None:
    export_dir.mkdir(parents=True, exist_ok=True)

    weights: dict = {}
    model.eval()
    for name, param in model.named_parameters():
        if "weight" in name and param.dim() >= 2:
            p = param.detach()
            g = float(p.abs().mean())
            w = torch.clamp(torch.round(p / (g + 1e-8)), -1, 1).cpu().numpy()
            weights[name] = {"data": w.tolist(), "gamma": g, "shape": list(w.shape)}
        else:
            weights[name] = {
                "data": param.detach().cpu().numpy().tolist(),
                "shape": list(param.detach().shape),
            }

    (export_dir / "bitnet_weights.json").write_text(
        json.dumps(weights), encoding="utf-8"
    )

    norm_data = {
        "mean": meta["raw_mean"],
        "std": meta["raw_std"],
        "feature_names": [
            "age", "balance", "monthlyIncome", "accountType", "currency",
            "seniority_months", "segment_vip", "segment_students", "region_code",
        ],
        "dataset": meta.get("path"),
        "rows_trained": meta.get("rows"),
        "target": meta.get("target_horizon"),
    }
    (export_dir / "normalization.json").write_text(
        json.dumps(norm_data, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    export_feature_order(meta["products"], export_dir / "feature_order.json")
    print(f"  Weights -> {export_dir / 'bitnet_weights.json'}")
    print(f"  feature_order.json ({len(meta['products'])} products)")


def main() -> None:
    args = parse_args()
    data_path = args.data or resolve_dataset_path()

    print("=== BitNet training ===")
    print(f"  data: {data_path}")
    print(f"  sample_frac: {args.sample_frac}, epochs: {args.epochs}")

    X, y, _feat_names, product_names, meta = load_custom_wide(
        sample_frac=args.sample_frac,
        random_state=args.seed,
        data_path=data_path,
        use_future_targets=not args.no_future_targets,
    )
    meta["products"] = product_names
    print(f"  rows: {meta['rows']}, X={X.shape}, y={y.shape}")
    print(f"  labels: {meta['target_horizon']}, products: {len(product_names)}")

    X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=args.seed, shuffle=True)
    device = "cpu"
    X_tr_t = torch.from_numpy(X_tr).to(device)
    y_tr_t = torch.from_numpy(y_tr).to(device)
    X_val_t = torch.from_numpy(X_val).to(device)
    y_val_t = torch.from_numpy(y_val).to(device)

    model = BitNet(d_in=32, d_out=36, d_h=128, n_layers=3).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    loss_fn = nn.BCEWithLogitsLoss()

    bs = args.batch_size
    for epoch in range(args.epochs):
        model.train()
        total = 0.0
        n_batches = 0
        for i in range(0, len(X_tr_t), bs):
            xb, yb = X_tr_t[i : i + bs], y_tr_t[i : i + bs]
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            opt.step()
            total += loss.item()
            n_batches += 1

        model.eval()
        with torch.no_grad():
            val_loss = loss_fn(model(X_val_t), y_val_t).item()
        print(f"  Epoch {epoch + 1:2d}/{args.epochs}: train={total / max(n_batches, 1):.4f} val={val_loss:.4f}")

    print("\n=== Export to frontend ===")
    export_dir = ROOT / "frontend" / "public" / "model"
    export_weights(model, export_dir, meta)

    print("\n=== Verification ===")
    with torch.no_grad():
        out = torch.sigmoid(model(torch.from_numpy(X_val[:3]).to(device)))
        top3 = out.topk(3, dim=1)
        for i in range(min(3, len(X_val))):
            print(f"  user {i}: top-3 idx = {top3.indices[i].tolist()}")

    print("\nDONE. Next: python backend/scripts/export_model.py")


if __name__ == "__main__":
    main()
