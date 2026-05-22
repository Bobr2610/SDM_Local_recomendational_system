import type { ApiRequestConfig, ApiResponse } from '../../types'

const eventLog: unknown[] = []

export const analyticsMock: Record<string, (config: ApiRequestConfig) => ApiResponse<unknown>> = {
  'POST:/analytics/event': (config) => {
    eventLog.push(config.body)
    return { data: null, status: 200 }
  },
}
