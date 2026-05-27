# СДМ Банк — Персональные рекомендации (Edge ML)

Система рекомендаций банковских продуктов. 
**Модель обучается на сервере → сбрасывается на телефон → работает локально.**

## Архитектура потока данных

```
┌─────────────┐     train     ┌──────────────┐
│  Сервер     │──────────────→│ BitNet b1.58 │
│  (Python)   │               │  Recommender │
│             │               └──────┬───────┘
│ Santander   │                      │
│ Bank Churn  │               export │ .gguf / .onnx
│ Credit Card │                      │
│ UCI Market  │                      ▼
└─────────────┘     копия     ┌──────────────┐
                             │  frontend/    │
                             │  public/model │
                             └──────┬───────┘
                                    │
                         загрузка   │
                         по HTTP    │
                                    ▼
                             ┌──────────────┐
                             │  Телефон     │
                             │  (Android)   │
                             │              │
                             │  bitnet.cpp  │
                             │  локальный   │
                             │  инференс    │
                             │              │
                             │  + персона-  │
                             │  лизация по  │
                             │  кликам      │
                             └──────────────┘
```

## Структура проекта

```
SDM/
├── frontend/                      # React + TypeScript + Vite
│   ├── src/
│   │   ├── data/
│   │   │   ├── ad-products.json   # ⭐ Все продукты + реклама (один файл!)
│   │   │   └── productParser.ts   # Парсер JSON → React
│   │   ├── services/              # Клиентский ML-инференс
│   │   │   ├── modelInference.ts  # JS-предиктор (BitNet эвристика)
│   │   │   └── modelLoader.ts     # ONNX-runtime загрузчик
│   │   ├── components/            # UI компоненты
│   │   ├── pages/                 # Страницы
│   │   └── store/                 # Zustand
│   └── public/model/              # Модель для телефона (GGUF/ONNX)
│
├── backend/                       # ML-пайплайн (Python)
│   ├── src/
│   │   ├── models/
│   │   │   ├── bitnet.py          # BitNet b1.58 архитектура
│   │   │   ├── train.py           # Обучение на Santander
│   │   │   └── export/
│   │   │       ├── onnx_export.py # → ONNX
│   │   │       └── gguf_export.py # → GGUF (bitnet.cpp)
│   │   ├── pipeline/              # Данные: загрузка, синтетика, фичи
│   │   ├── evaluation/            # Precision@k, NDCG@k, CTR, Business Value
│   │   └── edge/                  # Edge runtime
│   │       ├── runtime/           # Эмулятор телефона + Kotlin-спецификация
│   │       └── personalization/   # Локальное дообучение на кликах
│   └── scripts/
│       ├── export_to_frontend.py  # Копирует модель в frontend/public/model/
│       └── export_to_android.py   # Копирует модель в backend/edge/android_assets/
│
├── docker-compose.yml             # Docker: frontend + backend + train
└── Readme.md
```

## Быстрый старт

### Фронтенд (без модели)

```bash
cd frontend
npm install
npm run dev -- --host
# → http://localhost:5173
```

Работает с JS-предиктором (клиентский инференс без сервера).

### Полный цикл (обучение + деплой)

**Датасет:** `backend/datasets/raw/train_wide_with_lags.csv`  
**Подготовка данных (ноутбуки на main):** `datasets/00_clean_dataset.ipynb`, `01_generate_income_from_cleaned.ipynb` — если CSV уже готов, пропустите.

```bash
pip install -r backend/requirements.txt
python backend/scripts/run_full_pipeline.py --sample-frac 0.25 --epochs 12
# или по шагам:
python backend/scripts/train_santander.py
python backend/scripts/export_model.py
cd frontend && npm run build && npm run model:verify
```

Телефон (Expo): `phone.bat` — API на ПК + модель в `mobile/assets/model` + установка APK.
Браузер на телефоне: `serve-phone.bat`.

### Проверка модели

```bash
python -c "
from src.models.bitnet import BitNetRecommender
import torch
m = BitNetRecommender()
x = torch.randn(1, 32)
print(f'Output: {m(x).shape}')  # [1, 36]
print(m.export_info())
"
```

## Как управлять сайтом

**Один файл:** `frontend/src/data/ad-products.json`

| Поле | Действие |
|------|----------|
| `name` | Название в каталоге |
| `description` | Текст на странице продукта |
| `showOnHome: true` | Карточка-реклама на главной |
| `color` | Градиент карточки |
| `image` | Путь к картинке |

Поменял JSON → изменился весь сайт.

## BitNet b1.58

Модель использует архитектуру Microsoft BitNet:
- **Веса:** {-1, 0, +1} — 1.58 бита на параметр
- **Активации:** int8
- **Нормализация:** RMSNorm
- **MLP:** SwiGLU
- **Размер:** ~100 KB для рекомендательной модели

## Телефон (Expo + сервер на ПК)

ПК и телефон в **одной Wi‑Fi**. Модель в приложении (локальный инференс), API — с ноутбука.

| Команда | Что делает |
|---------|------------|
| `build-apk.bat` | Собрать APK → `dist/sdm-bank-debug.apk` (~2–5 мин после первой сборки) |
| `phone.bat` | API `:8000` + export модели + `expo run:android` (USB) или Expo Go (QR) |
| `phone.bat --expo-go` | Только Expo Go, без сборки APK |
| `serve-phone.bat` | Браузер на телефоне (`:5173` + API) |

```bat
phone.bat
```

Перед первой сборкой: Android Studio / JDK 17, USB-отладка. Быстрый тест без APK: `phone.bat --expo-go` + приложение **Expo Go** из Play Store.

## Docker

```bash
docker compose up --build     # только фронтенд (по умолчанию)
docker compose --profile dev up --build # фронтенд + бэкенд
```

## Endpoint'ы (бэкенд)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/ads/ai-select` | AI-подбор рекламы |
| POST | `/analytics/event` | События кликов |
| GET | `/products` | Все продукты |
| GET | `/model/health` | Статус модели |
