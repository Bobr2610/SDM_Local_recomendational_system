export interface Ad {
  id: string
  title: string
  subtitle: string
  image: string
  link?: string
  position: AdPosition
  priority: number
  active: boolean
  category?: string
}

export type AdPosition = 'banner_top' | 'banner_bottom' | 'sidebar' | 'modal'

export interface AdConfig {
  refreshIntervalMs: number
  maxAdsPerPosition: number
  ads: Ad[]
}
