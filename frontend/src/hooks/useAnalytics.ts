import { useCallback } from 'react'
import { useUserInputStore } from '../store'
import { analyticsApi } from '../api/endpoints'
import { ANALYTICS } from '../config/features'
import type { AnalyticsEventType } from '../types'

export function useAnalytics() {
  const { sessionId, age, balance, monthlyIncome, currency, accountType } = useUserInputStore()

  const track = useCallback((type: AnalyticsEventType, payload: Record<string, unknown> = {}) => {
    if (!ANALYTICS.ENABLED) return
    const event = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      type,
      payload: { age, balance, monthlyIncome, currency, accountType, ...payload },
      timestamp: new Date().toISOString(),
      sessionId,
    }
    analyticsApi.track(event)
  }, [sessionId, age, balance, monthlyIncome, currency, accountType])

  return { track }
}
