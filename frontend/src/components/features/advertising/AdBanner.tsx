import { useAds } from '../../../hooks/useAds'
import { FEATURES } from '../../../config/features'

interface AdBannerProps {
  position?: 'banner_top' | 'banner_bottom'
}

export function AdBanner({ position = 'banner_top' }: AdBannerProps) {
  const { currentAd } = useAds(position)

  if (!FEATURES.ADS || !currentAd) return null

  return (
    <a
      href={currentAd.link || '#'}
      className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 mb-6 group"
    >
      <div className="px-8 py-10 md:py-14">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentAd.title}</h3>
        <p className="text-lg text-white/80">{currentAd.subtitle}</p>
      </div>
    </a>
  )
}
