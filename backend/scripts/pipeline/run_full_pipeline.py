#!/usr/bin/env python3
"""
Полный прогон: обучение CatBoost → export → проверки.

Датасет уже подготовлен (train_wide_with_lags.csv) — ноутбуки не запускаем.
Если нужна подготовка с нуля — см. datasets/00_*.ipynb и 01_*.ipynb.

  python backend/scripts/pipeline/run_full_pipeline.py
  python backend/scripts/pipeline/run_full_pipeline.py --sample-frac 1.0 --epochs 15
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BACKEND = ROOT / "backend"
PIPELINE = BACKEND / "scripts" / "pipeline"


def run(cmd: list[str], label: str, *, cwd: Path | None = None) -> None:
    print(f"\n{'=' * 60}\n{label}\n{'=' * 60}")
    r = subprocess.run(cmd, cwd=cwd or ROOT, shell=sys.platform == "win32")
    if r.returncode != 0:
        sys.exit(r.returncode)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--sample-frac", type=float, default=0.25)
    p.add_argument("--iterations", type=int, default=1200)
    p.add_argument("--skip-frontend-build", action="store_true")
    args = p.parse_args()

    train_cmd = [
        sys.executable,
        str(PIPELINE / "train_catboost_pointwise.py"),
        "--sample-frac", str(args.sample_frac),
        "--iterations", str(args.iterations),
    ]
    run(train_cmd, "1/4 Train CatBoost pointwise (train_wide_with_lags.csv)")
    run([sys.executable, str(PIPELINE / "export_model.py")], "2/4 Export model bundle")
    run(["node", str(ROOT / "scripts" / "verify-model.mjs")], "3/4 Verify model files")

    if not args.skip_frontend_build:
        run(["npm", "run", "build"], "4/4 Frontend build", cwd=ROOT / "frontend")

    print("\nAll steps OK.")


if __name__ == "__main__":
    main()
