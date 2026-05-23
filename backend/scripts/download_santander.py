"""
Скачивание датасета Santander Product Recommendation.

Способы:
1. Kaggle API: положи kaggle.json в ~/.kaggle/
2. Hugging Face: автоматически через datasets
3. Прямая ссылка (если доступна)

Запуск: python backend/scripts/download_santander.py
"""

import sys
from pathlib import Path

DATASET_DIR = Path(__file__).parent.parent / "datasets" / "raw"
DATASET_DIR.mkdir(parents=True, exist_ok=True)

TARGET = DATASET_DIR / "train_ver2.csv"

if TARGET.exists():
    print(f"Dataset already exists: {TARGET}")
    print(f"Size: {TARGET.stat().st_size / 1024 / 1024:.0f} MB")
    sys.exit(0)

# ─── Способ 1: Hugging Face ───
print("Trying Hugging Face datasets...")
try:
    from datasets import load_dataset
    ds = load_dataset("santander-product-recommendation", split="train", streaming=True)
    import pandas as pd
    rows = []
    for i, row in enumerate(ds):
        rows.append(row)
        if i > 50000: break
    df = pd.DataFrame(rows)
    df.to_csv(TARGET, index=False)
    print(f"Saved {len(df)} rows via HuggingFace to {TARGET}")
    sys.exit(0)
except Exception as e:
    print(f"  HuggingFace failed: {e}")

# ─── Способ 2: Kaggle API ───
print("\nTrying Kaggle API...")
try:
    import kagglehub
    path = kagglehub.competition_download("santander-product-recommendation")
    print(f"  Downloaded to: {path}")
    import os, zipfile, shutil
    for f in os.listdir(path):
        if f.endswith('.zip'):
            with zipfile.ZipFile(os.path.join(path, f), 'r') as zf:
                zf.extractall(path)
    for f in os.listdir(path):
        if f.endswith('.csv'):
            shutil.copy(os.path.join(path, f), TARGET)
            print(f"  Copied {f} → {TARGET}")
            break
    sys.exit(0)
except Exception as e:
    print(f"  Kaggle failed: {e}")

# ─── Способ 3: Инструкция ───
print(f"""
========================================
Не удалось скачать датасет автоматически.

Скачай вручную:
1. https://www.kaggle.com/competitions/santander-product-recommendation/data
2. Нажми "Download All" (нужен Kaggle аккаунт)
3. Распакуй train_ver2.csv в:
   {TARGET}

Или через Kaggle API:
   pip install kaggle
   # Положи kaggle.json (API key) в C:/Users/<user>/.kaggle/
   kaggle competitions download -c santander-product-recommendation
   unzip santander-product-recommendation.zip -d {DATASET_DIR}

После этого запусти:
    python backend/scripts/train_santander.py
========================================
""")
