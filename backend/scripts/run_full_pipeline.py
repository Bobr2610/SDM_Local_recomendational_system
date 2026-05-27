#!/usr/bin/env python3
"""
Полный прогон: обучение BitNet → export_model → проверки.

Датасет уже подготовлен (train_wide_with_lags.csv) — ноутбуки не запускаем.
Если нужна подготовка с нуля — см. datasets/00_*.ipynb и 01_*.ipynb.

  python backend/scripts/run_full_pipeline.py
  python backend/scripts/run_full_pipeline.py --sample-frac 1.0 --epochs 15
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
SCRIPTS = BACKEND / "scripts"


def run(cmd: list[str], label: str, *, cwd: Path | None = None) -> None:
    print(f"\n{'=' * 60}\n{label}\n{'=' * 60}")
    r = subprocess.run(cmd, cwd=cwd or ROOT, shell=sys.platform == "win32")
    if r.returncode != 0:
        sys.exit(r.returncode)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--sample-frac", type=float, default=0.25)
    p.add_argument("--epochs", type=int, default=12)
    p.add_argument("--skip-frontend-build", action="store_true")
    args = p.parse_args()

    train_cmd = [
        sys.executable,
        str(SCRIPTS / "train_santander.py"),
        "--sample-frac", str(args.sample_frac),
        "--epochs", str(args.epochs),
    ]
    run(train_cmd, "1/4 Train BitNet (train_wide_with_lags.csv)")
    run([sys.executable, str(SCRIPTS / "export_model.py")], "2/4 Export model bundle")
    run(["node", str(ROOT / "scripts" / "verify-model.mjs")], "3/4 Verify model files")

    if not args.skip_frontend_build:
        run(["npm", "run", "build"], "4/4 Frontend build", cwd=ROOT / "frontend")

    print("\nAll steps OK.")


if __name__ == "__main__":
    main()
