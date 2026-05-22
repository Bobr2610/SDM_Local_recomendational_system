import { useState, useEffect, useCallback } from 'react'
import type { Ad, AdPosition } from '../types'
import adsConfig from '../data/ads.json'

export function useAds(position: AdPosition) {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const loadAds = useCallback(() => {
    const config = adsConfig as { ads: Ad[]; maxAdsPerPosition: number; refreshIntervalMs: number }
    const filtered = config.ads
      .filter((ad) => ad.active && ad.position === position)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, config.maxAdsPerPosition)
    setAds(filtered)
  }, [position])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  useEffect(() => {
    if (ads.length <= 1) return
    const config = adsConfig as { refreshIntervalMs: number }
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, config.refreshIntervalMs)
    return () => clearInterval(timer)
  }, [ads.length])

  return { currentAd: ads[currentIndex] ?? null, allAds: ads, currentIndex }
}
