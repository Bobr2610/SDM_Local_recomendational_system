export const FEATURES = {
  AUTH: true,
  DASHBOARD: true,
  RECOMMENDATIONS: true,
  PRODUCT_FILTERS: true,
  ADS: true,
  AI_ADS: true,
  ANALYTICS: true,
  NOTIFICATIONS: false,
}

export const ADS = {
  ENABLED: true,
  REFRESH_INTERVAL: 30000,
}

export const ANALYTICS = {
  ENABLED: true,
  BATCH_SIZE: 10,
  FLUSH_INTERVAL_MS: 5000,
  ENDPOINT: '/analytics/event',
}

export const AI_ADS = {
  ENDPOINT: '/ads/ai-select',
  DEBOUNCE_MS: 500,
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
}
