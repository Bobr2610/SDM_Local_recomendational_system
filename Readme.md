# SDM Bank Demo

В проекте теперь реализован второй этап: web-рекомендации считаются локально в браузере, без backend inference и без HTTP-запросов за рекомендациями.

## Что работает

- `frontend/` считает рекомендации в браузере из статических артефактов в `frontend/public/model`.
- Web path больше не использует `/products/recommendations` и `/ads/ai-select`.
- `mobile/` сохраняет native Android CatBoost path через `.cbm`.
- `backend/` нужен для train/export/data prep/parity scripts, а не для web inference.

## Web inference

Выбранный web artifact:

- `frontend/public/model/catboost_model_full.json` — полный CatBoost JSON export.
- `frontend/public/model/catboost_web_runtime.json` — browser runtime artifact, сериализованный из official CatBoost python applier.
- `frontend/public/model/catboost_cat_features_hashes.json` — полная hash map для категориальных значений из реального датасета.

Как это устроено:

- `frontend/src/model/loadModel.ts` загружает metadata/runtime/hash map как static assets.
- `frontend/src/model/buildPointwiseRows.ts` строит только mini-batch long-строк `user × candidate_product` для выбранного профиля.
- Схема строк совпадает с `backend/scripts/data_prep/build_train_long.py`, но мы не генерим весь long-датасет.
- `frontend/src/model/catboostJsonPredict.ts` повторяет official CatBoost applier: binarization, one-hot, CTR, tree traversal.
- `frontend/src/model/recommend.ts` считает score для всех 22 candidate products и добавляет controlled click boost.

## Реальные demo-профили

Профили генерируются из реального датасета скриптом:

```bash
source .venv/bin/activate
python backend/scripts/generate_demo_profiles.py
```

Вход:

- `train_wide_filled_lags.csv` в корне, если есть
- иначе fallback к `backend/datasets/raw/*`

Выход:

- `frontend/src/features/profiles/demoProfiles.generated.ts`
- `backend/datasets/processed/demo_profiles.json`
- `frontend/src/model/__fixtures__/profiles.json`

Текущие 4 профиля:

- `~15 000 ₽/мес`: `user_id=1289958`, факт `15 002.76 ₽`
- `~100 000 ₽/мес`: `user_id=649589`, факт `100 000.08 ₽`
- `~500 000 ₽/мес`: `user_id=1125781`, факт `499 978.68 ₽`
- `~5 000 000 ₽/мес`: `user_id=167364`, факт `5 046 790.47 ₽`

Примечание по балансу:

- В `train_wide_filled_lags.csv` нет явной колонки `balance`.
- Поэтому в audit artifact и UI хранится честный `balanceSource`; сейчас используется `income_lag_90_proxy`.

## Экспорт модели

Если у вас есть обученный `pkl`, положите его в:

- `backend/models/export/catboost_pointwise_holdout.pkl`, или
- корень проекта как `catboost_pointwise_holdout.pkl` / `catboost_pointwise_holdout_old_good.pkl`

Экспорт:

```bash
source .venv/bin/activate
python backend/scripts/pipeline/export_catboost_mobile.py
```

Скрипт обновляет:

- `frontend/public/model/catboost_pointwise.cbm`
- `frontend/public/model/catboost_model.json`
- `frontend/public/model/catboost_model_full.json`
- `frontend/public/model/catboost_web_runtime.json`
- `frontend/public/model/catboost_cat_features_hashes.json`
- `frontend/public/model/model_manifest.json`
- `mobile/assets/model/*`

## Parity

Fixtures:

- `frontend/src/model/__fixtures__/profiles.json`
- `frontend/src/model/__fixtures__/expected_scores.json`

Генерация reference scores:

```bash
source .venv/bin/activate
python backend/scripts/pipeline/generate_model_parity_fixtures.py
```

Проверка:

```bash
cd frontend
npm run model:parity
```

Текущий результат:

- overlap top-5 = `5/5` для всех 4 профилей
- `maxDelta = 0.000000` для всех 4 профилей

## Запуск

Web:

```bash
cd frontend
npm install
npm run dev -- --host
```

Backend для web recommendations больше не нужен.

## Обязательные проверки

```bash
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm run model:parity
node scripts/verify-model.mjs
grep -R "fetchCatboostRecommendations\\|/products/recommendations\\|/ads/ai-select" frontend/src
grep -R "Math.random\\|random_score\\|popularity" frontend/src/model frontend/src/features/recommendations
```

## Важные файлы

- `frontend/src/model/loadModel.ts`
- `frontend/src/model/catboostJsonPredict.ts`
- `frontend/src/model/buildPointwiseRows.ts`
- `frontend/src/model/recommend.ts`
- `frontend/src/features/recommendations/RecommendationsPanel.tsx`
- `backend/scripts/generate_demo_profiles.py`
- `backend/scripts/pipeline/export_catboost_mobile.py`
- `backend/scripts/pipeline/generate_model_parity_fixtures.py`
