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
