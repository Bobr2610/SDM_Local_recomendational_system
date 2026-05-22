import { useAds } from '../../../hooks/useAds'
import { Card, CardBody } from '../../ui'
import { FEATURES } from '../../../config/features'

export function AdSidebar() {
  const { currentAd } = useAds('sidebar')

  if (!FEATURES.ADS || !currentAd) return null

  return (
    <Card className="mb-6">
      <CardBody>
        <a href={currentAd.link || '#'} className="block group">
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 mb-3" />
          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {currentAd.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{currentAd.subtitle}</p>
        </a>
      </CardBody>
    </Card>
  )
}
