# Frontend

React + TypeScript + Vite.

## Главное

- Рекомендации считаются локально в браузере.
- Backend inference для web не используется.
- Разрешены только static model asset loads из `public/model`.

## Основные модули

- `src/model/loadModel.ts`
- `src/model/buildPointwiseRows.ts`
- `src/model/catboostJsonPredict.ts`
- `src/model/recommend.ts`
- `src/features/profiles/demoProfiles.generated.ts`
- `src/features/recommendations/RecommendationsPanel.tsx`

## Команды

```bash
npm install
npm run dev -- --host
npm run lint
npm run build
npm run model:parity
```

## Model assets

- `public/model/catboost_model.json`
- `public/model/catboost_model_full.json`
- `public/model/catboost_web_runtime.json`
- `public/model/catboost_cat_features_hashes.json`
- `public/model/catboost_pointwise.cbm`

## Проверка отсутствия backend inference

```bash
grep -R "fetchCatboostRecommendations\\|/products/recommendations\\|/ads/ai-select" src
```
