import { useEffect } from 'react'
import { Card, CardBody, CardHeader, Badge } from '../../ui'
import { useProductsStore } from '../../../store'
import type { Recommendation } from '../../../types'

interface RecommendationListProps {
  recommendations: Recommendation[]
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Card hoverable>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">{rec.product.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
          </div>
          <Badge variant="success">{Math.round(rec.relevanceScore * 100)}%</Badge>
        </div>
      </CardBody>
    </Card>
  )
}

export function RecommendationList({ recommendations }: RecommendationListProps) {
  const { fetchRecommendations, isLoading } = useProductsStore()

  useEffect(() => {
    if (recommendations.length === 0) {
      fetchRecommendations()
    }
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-gray-500">Рекомендации для вас</h3>
        </CardHeader>
        <CardBody>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardBody>
      </Card>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-gray-500">Рекомендации для вас</h3>
      </CardHeader>
      <CardBody className="space-y-3">
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.product.id} rec={rec} />
        ))}
      </CardBody>
    </Card>
  )
}
