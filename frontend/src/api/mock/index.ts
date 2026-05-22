import { API_CONFIG } from '../../config/api'
import { authMock } from './auth'
import { userMock } from './user'
import { productsMock } from './products'
import { adSelectionMock } from './adSelection'
import { analyticsMock } from './analytics'
import type { ApiRequestConfig, ApiResponse } from '../../types'

type MockHandler = (config: ApiRequestConfig) => ApiResponse<unknown>

const handlers: Record<string, MockHandler> = {
  ...authMock,
  ...userMock,
  ...productsMock,
  ...adSelectionMock,
  ...analyticsMock,
}

export function handleMockRequest(config: ApiRequestConfig): ApiResponse<unknown> | null {
  if (!API_CONFIG.USE_MOCK) return null
  const key = `${config.method}:${config.url}`
  const handler = handlers[key]
  if (!handler) return null

  return handler(config)
}
