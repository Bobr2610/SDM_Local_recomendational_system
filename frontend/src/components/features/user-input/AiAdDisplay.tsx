import { Link } from 'react-router-dom'
import { useAdSelection } from '../../../hooks/useAdSelection'
import { FEATURES } from '../../../config/features'

const DEFAULT_AD = {
  adId: 'default-welcome',
  title: 'Добро пожаловать в СДМ Хакатон',
  subtitle: 'Выберите профиль — AI подберёт предложения',
  productId: '',
}

export function AiAdDisplay() {
  const { selectedAd, isLoading } = useAdSelection()

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
  const to = selectedAd ? `/product/${selectedAd.adId}` : '#'

  return (
    <Link
      to={to}
      className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 mb-4 sm:mb-6 group"
    >
      <div className="px-4 sm:px-8 py-6 sm:py-10 md:py-14 relative">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">{ad.title}</h3>
        <p className="text-sm sm:text-lg text-white/80">{ad.subtitle}</p>
      </div>
    </Link>
  )
}
