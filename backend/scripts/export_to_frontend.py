"""
Скрипт: копирование обученной модели из бэкенда в фронтенд.

Запуск:
    python backend/scripts/export_to_frontend.py

Переносит models/export/bitnet_recommender.onnx → frontend/public/model/
Сохраняет метаданные модели в frontend/public/model/model_info.json
"""

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
MODEL_SRC = ROOT / "backend" / "models" / "export" / "bitnet_recommender.onnx"
MODEL_DST = ROOT / "frontend" / "public" / "model" / "bitnet_recommender.onnx"
META_SRC = ROOT / "backend" / "models" / "export" / "model_meta.json"
META_DST = ROOT / "frontend" / "public" / "model" / "model_info.json"


def export_to_frontend():
    if not MODEL_SRC.exists():
        print("Модель не найдена. Сначала запустите обучение и экспорт:")
        print("  python -m src.models.train --epochs 10")
        print("  python -m src.models.export.onnx_export")
        sys.exit(1)

    MODEL_DST.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(MODEL_SRC, MODEL_DST)
    print(f"Модель скопирована: {MODEL_SRC} → {MODEL_DST}")
    print(f"  Размер: {MODEL_DST.stat().st_size / 1024:.1f} KB")

    if META_SRC.exists():
        shutil.copy2(META_SRC, META_DST)
        print(f"Метаданные: {META_DST}")

    print("\nГотово. Модель доступна по URL: /model/bitnet_recommender.onnx")
    print("Телефон загрузит её и будет использовать для локального инференса.")


if __name__ == "__main__":
    export_to_frontend()
