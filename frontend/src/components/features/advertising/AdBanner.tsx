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
      className="block relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 mb-4 sm:mb-6 group"
    >
      <img
        src={currentAd.image || '/ad-images/placeholder.svg'}
        alt={currentAd.title}
        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="px-4 sm:px-8 py-6 sm:py-10 md:py-14">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">{currentAd.title}</h3>
        <p className="text-sm sm:text-lg text-white/80">{currentAd.subtitle}</p>
      </div>
    </a>
  )
}
