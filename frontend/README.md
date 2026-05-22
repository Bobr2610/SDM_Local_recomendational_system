# СДМ Банк — Фронтенд

React + TypeScript + Vite. Модульный банковский фронтенд.

## Структура

```
src/
├── api/              # Сетевой слой
│   ├── client.ts     #   HTTP-клиент (fetch + токен + таймаут)
│   ├── endpoints.ts  #   Все API-методы (auth, user, products)
│   └── mock/         #   Мок-обработчики (пока USE_MOCK=true)
├── components/
│   ├── ui/           #   Атомарные: Button, Card, Input, Modal, Spinner, Badge
│   ├── layout/       #   Header, Footer, MainLayout
│   └── features/     #   ads/, auth/, products/, dashboard/, recommendations/
├── config/
│   ├── api.ts        #   BASE_URL, USE_MOCK, таймауты
│   └── features.ts   #   Флаги включения фич
├── data/
│   ├── ads.json      #   Реклама (текст, позиция, приоритет, productId)
│   └── products.json #   Все продукты банка (из Advert.json)
├── hooks/            #   useAuth, useUser, useProducts, useAds
├── pages/            #   Home, Products, Login, Register, Dashboard, 404
├── store/            #   Zustand: authStore, userStore, productsStore
├── types/            #   TypeScript-интерфейсы
└── utils/            #   cn, formatCurrency, formatDate, storage
```

## Как подключить бэкенд

1. В `src/config/api.ts`:
   ```ts
   USE_MOCK: false
   BASE_URL: 'http://localhost:8000/api'
   ```
2. Все endpoint'ы в `src/api/endpoints.ts`

## Как добавить рекламу

В `src/data/ads.json`:
- Добавить объект в массив `ads`
- Указать `position`: banner_top, sidebar, banner_bottom, modal
- Картинки класть в `public/ads/` и прописать путь в `image`

## Команды

```bash
npm run dev      # dev-сервер
npm run build    # сборка
npm run preview  # предпросмотр сборки
```
