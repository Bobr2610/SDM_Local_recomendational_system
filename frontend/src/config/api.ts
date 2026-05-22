export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: 10000,
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true' || true,
  RETRY_COUNT: 3,
}

export const AUTH_CONFIG = {
  TOKEN_KEY: 'sdm_auth_token',
  REFRESH_TOKEN_KEY: 'sdm_refresh_token',
}
