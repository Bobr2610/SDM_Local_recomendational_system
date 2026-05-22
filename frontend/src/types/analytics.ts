export interface AnalyticsEvent {
  id: string
  type: AnalyticsEventType
  payload: Record<string, unknown>
  timestamp: string
  sessionId: string
}

export type AnalyticsEventType =
  | 'page_view'
  | 'button_click'
  | 'ad_view'
  | 'ad_click'
  | 'form_submit'
  | 'input_change'
  | 'product_view'
  | 'navigation'

export interface AdSelectionRequest {
  age: number
  balance: number
  sessionId: string
}

export interface AdSelectionResponse {
  adId: string
  title: string
  subtitle: string
  link: string
  reason: string
  confidence: number
}
