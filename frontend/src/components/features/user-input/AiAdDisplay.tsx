import { useAdSelection } from '../../../hooks/useAdSelection'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { Badge } from '../../ui'
import { FEATURES } from '../../../config/features'

const DEFAULT_AD = {
  adId: 'default-welcome',
  title: 'Добро пожаловать в СДМ Банк',
  subtitle: 'Настройте профиль справа — и мы подберём лучшие предложения',
  link: '/products',
  reason: 'Начните с настройки',
  confidence: 1,
}

export function AiAdDisplay() {
  const { selectedAd, isLoading } = useAdSelection()
  const { track } = useAnalytics()

  if (!FEATURES.AI_ADS) return null

  if (isLoading) {
    return (
      <div className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 animate-pulse mb-6">
        <div className="px-8 py-10 md:py-14">
          <div className="h-8 bg-white/20 rounded w-2/3 mb-3" />
          <div className="h-5 bg-white/20 rounded w-1/2" />
        </div>
      </div>
    )
  }

  const ad = selectedAd ?? DEFAULT_AD
  const isDefault = !selectedAd

  return (
    <a
      href={ad.link || '#'}
      className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 mb-6 group"
      onClick={() => track('ad_click', { adId: ad.adId })}
    >
      <div className="px-8 py-10 md:py-14 relative">
        <div className="absolute top-4 right-4">
          <Badge variant={isDefault ? 'info' : 'success'}>
            {isDefault ? 'Приветствие' : `AI · ${Math.round(ad.confidence * 100)}%`}
          </Badge>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{ad.title}</h3>
        <p className="text-lg text-white/80 mb-3">{ad.subtitle}</p>
        <p className="text-sm text-white/50 italic">{ad.reason}</p>
      </div>
    </a>
  )
}
