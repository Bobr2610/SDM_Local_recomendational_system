"""Export trained model artifacts for Android edge runtime.

Copies ONNX/GGUF and metadata into a local android_assets folder.
"""

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
MODEL_DIR = ROOT / "backend" / "models" / "export"
ANDROID_ASSETS = ROOT / "backend" / "edge" / "android_assets"

FILES = [
    "bitnet_recommender.onnx",
    "bitnet_recommender.gguf",
    "model_meta.json",
    "feature_order.json",
]


def export_to_android() -> None:
    if not MODEL_DIR.exists():
        print("Model export dir not found. Run training and export first.")
        sys.exit(1)

    ANDROID_ASSETS.mkdir(parents=True, exist_ok=True)

    copied = 0
    for name in FILES:
        src = MODEL_DIR / name
        if src.exists():
            dst = ANDROID_ASSETS / name
            shutil.copy2(src, dst)
            print(f"Copied: {src} -> {dst}")
            copied += 1

    if copied == 0:
        print("No model files found. Run:")
        print("  python -m src.models.train --epochs 10")
        print("  python -m src.models.export.onnx_export")
        print("  python -m src.models.export.gguf_export")
        sys.exit(1)

    print("\nAndroid assets ready:")
    print(f"  {ANDROID_ASSETS}")


if __name__ == "__main__":
    export_to_android()
