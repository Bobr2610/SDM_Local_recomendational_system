import { useAdSelection } from '../../../hooks/useAdSelection'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { useUserInputStore } from '../../../store'
import { Badge } from '../../ui'
import { FEATURES } from '../../../config/features'

const DEFAULT_AD = {
  adId: 'default-welcome',
  title: 'Добро пожаловать в СДМ Банк',
  subtitle: 'Настройте профиль — и мы подберём лучшие предложения',
  link: '/products',
  reason: 'Начните с настройки',
  confidence: 1,
}

export function AiAdDisplay() {
  const { selectedAd, isLoading } = useAdSelection()
  const { track } = useAnalytics()
  const trackClick = useUserInputStore((s) => s.trackClick)

  if (!FEATURES.AI_ADS) return null

  if (isLoading) {
    return (
      <div className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 animate-pulse mb-4 sm:mb-6">
        <div className="px-4 sm:px-8 py-6 sm:py-10 md:py-14">
          <div className="h-6 sm:h-8 bg-white/20 rounded w-2/3 mb-2 sm:mb-3" />
          <div className="h-4 sm:h-5 bg-white/20 rounded w-1/2" />
        </div>
      </div>
    )
  }

  const ad = selectedAd ?? DEFAULT_AD
  const isDefault = !selectedAd

  return (
    <a
      href={ad.link || '#'}
      className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 mb-4 sm:mb-6 group"
      onClick={() => { track('ad_click', { adId: ad.adId }); trackClick(ad.adId) }}
    >
      <div className="px-4 sm:px-8 py-6 sm:py-10 md:py-14 relative">
        <div className="sm:absolute top-3 sm:top-4 right-3 sm:right-4 mb-2 sm:mb-0">
          <Badge variant={isDefault ? 'info' : 'success'}>
            {isDefault ? 'Приветствие' : `AI · ${Math.round(ad.confidence * 100)}%`}
          </Badge>
        </div>
        <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">{ad.title}</h3>
        <p className="text-sm sm:text-lg text-white/80 mb-2 sm:mb-3">{ad.subtitle}</p>
        <p className="text-xs sm:text-sm text-white/50 italic">{ad.reason}</p>
      </div>
    </a>
  )
}
