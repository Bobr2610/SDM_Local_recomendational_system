import { useState, useEffect, useCallback } from 'react'
import type { AdPosition } from '../types'
import { getHomeAdProducts } from '../data/productParser'
import type { AdProduct } from '../data/productParser'

function toAd(p: AdProduct, position: AdPosition) {
  return {
    id: p.id,
    title: p.name,
    subtitle: p.description.slice(0, 80) + '...',
    image: p.image,
    link: `/product/${p.id}`,
    position,
    priority: 0,
    active: true,
    color: p.color,
  }
}

const REFRESH_MS = 30000
const MAX_PER_POSITION = 3

export function useAds(position: AdPosition) {
  const [ads, setAds] = useState<ReturnType<typeof toAd>[]>([])

  const loadAds = useCallback(() => {
    const products = getHomeAdProducts()
    const mapped = products
      .map((p) => toAd(p, position))
      .slice(0, MAX_PER_POSITION)
    setAds(mapped)
  }, [position])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (ads.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [ads.length])

  return { currentAd: ads[currentIndex] ?? null, allAds: ads, currentIndex }
}
