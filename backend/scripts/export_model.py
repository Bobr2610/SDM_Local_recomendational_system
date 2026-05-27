"""
Единый экспорт модели для телефона (Expo) и edge/android_assets.

Телефон (React Native) использует JS-инференс из bundle:
  mobile/assets/model/bitnet_weights.json
  mobile/assets/model/feature_order.json

Браузер (Vite):
  frontend/public/model/

Опционально (ONNX / bitnet.cpp позже):
  bitnet_recommender.onnx, bitnet_recommender.gguf, model_meta.json

Запуск из корня репозитория:
  python backend/scripts/export_model.py

После обучения:
  python backend/scripts/train_santander.py
  python backend/scripts/export_model.py
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FRONTEND_MODEL = ROOT / "frontend" / "public" / "model"
MOBILE_MODEL = ROOT / "mobile" / "assets" / "model"
ANDROID_ASSETS = ROOT / "backend" / "edge" / "android_assets"
BACKEND_EXPORT = ROOT / "backend" / "models" / "export"

# Обязательно для локального BitNet в WebView (APK)
REQUIRED_FOR_PHONE = [
    "bitnet_weights.json",
    "feature_order.json",
]

# Копируются из backend/models/export, если есть
OPTIONAL_FROM_EXPORT = [
    "bitnet_recommender.onnx",
    "bitnet_recommender.gguf",
    "model_meta.json",
    "normalization.json",
    "feature_order.json",
]


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def _copy_if_exists(src: Path, dst: Path) -> bool:
    if not src.exists():
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    print(f"  copied: {src.name} -> {dst.parent.name}/")
    return True


def export_model(*, strict: bool = True) -> dict:
    FRONTEND_MODEL.mkdir(parents=True, exist_ok=True)
    MOBILE_MODEL.mkdir(parents=True, exist_ok=True)
    ANDROID_ASSETS.mkdir(parents=True, exist_ok=True)

    print("=== SDM model export (phone bundle) ===\n")

    if BACKEND_EXPORT.exists():
        print(f"From {BACKEND_EXPORT.relative_to(ROOT)}:")
        for name in OPTIONAL_FROM_EXPORT:
            _copy_if_exists(BACKEND_EXPORT / name, FRONTEND_MODEL / name)
            _copy_if_exists(BACKEND_EXPORT / name, ANDROID_ASSETS / name)
    else:
        print(f"No {BACKEND_EXPORT.relative_to(ROOT)} (ONNX/GGUF skip — run train + onnx_export if needed)")

    missing = [n for n in REQUIRED_FOR_PHONE if not (FRONTEND_MODEL / n).exists()]
    if missing:
        print("\nMissing required files for phone JS inference:")
        for n in missing:
            print(f"  - {n}")
        print("\nRun training export:")
        print("  python backend/scripts/train_santander.py")
        if strict:
            sys.exit(1)

    manifest: dict = {
        "targets": {
            "web": str(FRONTEND_MODEL.relative_to(ROOT)).replace("\\", "/"),
            "expo_bundle": str(MOBILE_MODEL.relative_to(ROOT)).replace("\\", "/"),
            "android_native_assets": str(ANDROID_ASSETS.relative_to(ROOT)).replace("\\", "/"),
        },
        "inference": "bitnet_js_weights",
        "files": {},
    }

    all_names = sorted({p.name for p in FRONTEND_MODEL.iterdir() if p.is_file()})
    for name in all_names:
        path = FRONTEND_MODEL / name
        manifest["files"][name] = {
            "bytes": path.stat().st_size,
            "sha256_16": _sha256(path),
            "required": name in REQUIRED_FOR_PHONE,
        }

    manifest_path = FRONTEND_MODEL / "model_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    shutil.copy2(manifest_path, ANDROID_ASSETS / "model_manifest.json")

    # Expo app bundle (mobile/assets/model)
    for name in all_names:
        shutil.copy2(FRONTEND_MODEL / name, MOBILE_MODEL / name)

    # Mirror full bundle to android_assets for future JNI / bitnet.cpp
    for name in all_names:
        if name == "model_manifest.json":
            continue
        shutil.copy2(FRONTEND_MODEL / name, ANDROID_ASSETS / name)

    weights_kb = manifest["files"].get("bitnet_weights.json", {}).get("bytes", 0) / 1024
    print(f"\nPhone bundle OK:")
    print(f"  web:    {FRONTEND_MODEL.relative_to(ROOT)}")
    print(f"  mobile: {MOBILE_MODEL.relative_to(ROOT)}")
    print(f"  bitnet_weights.json: {weights_kb:.1f} KB")
    print(f"  manifest: {manifest_path.name}")
    print("  Rebuild app: cd mobile && npx expo run:android")

    return manifest


if __name__ == "__main__":
    export_model(strict="--allow-missing" not in sys.argv)
