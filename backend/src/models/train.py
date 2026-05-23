"""
Скрипт обучения BitNet-модели на сервере.

Запуск:
    python -m src.models.train --epochs 20 --batch-size 256 --lr 1e-3

Результаты сохраняются в models/checkpoints/ и models/export/
"""

import argparse
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.models.bitnet import BitNetRecommender
from src.pipeline.loaders.santander import load_santander


def train(
    epochs: int = 20,
    batch_size: int = 256,
    lr: float = 1e-3,
    hidden_dim: int = 256,
    num_layers: int = 3,
    sample_frac: float = 0.1,
    device: str = "cpu",
) -> BitNetRecommender:
    """Обучение BitNetRecommender."""
    print(f"Device: {device}")
    print(f"Loading data (sample_frac={sample_frac})...")
    X, y = load_santander(sample_frac=sample_frac)
    print(f"  X: {X.shape}, y: {y.shape}")

    # Train/val split
    n = len(X)
    n_train = int(n * 0.8)
    X_train, y_train = torch.from_numpy(X[:n_train]).to(device), torch.from_numpy(y[:n_train]).to(device)
    X_val, y_val = torch.from_numpy(X[n_train:]).to(device), torch.from_numpy(y[n_train:]).to(device)

    model = BitNetRecommender(
        input_dim=X.shape[1],
        num_products=y.shape[1],
        hidden_dim=hidden_dim,
        num_layers=num_layers,
    ).to(device)

    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = nn.BCEWithLogitsLoss()

    best_loss = float("inf")
    history = {"train_loss": [], "val_loss": [], "val_precision": []}

    for epoch in range(epochs):
        # Train
        model.train()
        perm = torch.randperm(n_train, device=device)
        total_loss = 0.0
        steps = 0

        for i in range(0, n_train, batch_size):
            idx = perm[i : i + batch_size]
            xb, yb = X_train[idx], y_train[idx]

            optimizer.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            steps += 1

        train_loss = total_loss / steps
        scheduler.step()

        # Val
        model.eval()
        with torch.no_grad():
            val_logits = model(X_val)
            val_loss = criterion(val_logits, y_val).item()
            val_pred = (torch.sigmoid(val_logits) > 0.5).float()
            val_precision = (val_pred * y_val).sum() / val_pred.sum().clamp(min=1)

        history["train_loss"].append(round(train_loss, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_precision"].append(round(val_precision.item(), 4))

        print(f"Epoch {epoch+1:3d}/{epochs} | train_loss: {train_loss:.4f} | val_loss: {val_loss:.4f} | val_prec: {val_precision:.4f}")

        if val_loss < best_loss:
            best_loss = val_loss
            ckpt_dir = PROJECT_ROOT / "models" / "checkpoints"
            ckpt_dir.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), ckpt_dir / "bitnet_best.pt")

    info = model.export_for_edge()
    info["best_val_loss"] = best_loss
    info["train_config"] = {
        "epochs": epochs, "batch_size": batch_size, "lr": lr,
        "hidden_dim": hidden_dim, "num_layers": num_layers,
    }

    ckpt_dir = PROJECT_ROOT / "models" / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    with open(ckpt_dir / "training_info.json", "w") as f:
        json.dump(info, f, indent=2)

    with open(ckpt_dir / "history.json", "w") as f:
        json.dump(history, f, indent=2)

    print(f"\nTraining complete. Model: {info['model_size_kb']:.1f} KB, {info['total_parameters']:,} params")
    print(f"Checkpoint: {ckpt_dir / 'bitnet_best.pt'}")
    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden-dim", type=int, default=256)
    parser.add_argument("--num-layers", type=int, default=3)
    parser.add_argument("--sample-frac", type=float, default=0.1)
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()

    train(
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        hidden_dim=args.hidden_dim,
        num_layers=args.num_layers,
        sample_frac=args.sample_frac,
        device=args.device,
    )
