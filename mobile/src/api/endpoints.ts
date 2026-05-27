import { apiClient } from './client'
import type { AdSelectionRequest, AdSelectionResponse } from '../types/analytics'

export const adsApi = {
  select: (data: AdSelectionRequest) => apiClient.post<AdSelectionResponse>('/ads/ai-select', data),
}

export const analyticsApi = {
  track: (event: unknown) => apiClient.post<void>('/analytics/event', event),
}

export const healthApi = {
  check: () => apiClient.get<{ status: string }>('/health'),
}
