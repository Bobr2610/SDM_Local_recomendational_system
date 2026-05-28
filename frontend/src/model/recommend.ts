import { buildPointwiseRows } from './buildPointwiseRows'
import { predictRows } from './catboostJsonPredict'
import { initModel } from './loadModel'
import { profileToUserFeatures, type ProfileForModel } from './profileToModel'

export interface RankedRecommendation {
  productId: string
  score: number
  baseScore: number
  boost: number
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value))
}

export function personalize(
  recommendations: RankedRecommendation[],
  clickHistory: Record<string, number>,
): RankedRecommendation[] {
  return recommendations.map((item) => {
    const boost = 0.05 * Math.min(clickHistory[item.productId] ?? 0, 20)
    return {
      ...item,
      boost,
      score: item.baseScore + boost,
    }
  })
}

export async function recommendForProfile(
  profile: ProfileForModel,
  clickHistory: Record<string, number>,
  topK = 5,
): Promise<RankedRecommendation[]> {
  const model = await initModel()
  const rows = buildPointwiseRows(profileToUserFeatures(profile), model.meta)
  const scores = predictRows(model, rows)
  const adjusted = personalize(
    model.meta.products.map((productId, index) => ({
      productId,
      baseScore: sigmoid(scores[index]),
      score: sigmoid(scores[index]),
      boost: 0,
    })),
    clickHistory,
  )

  return adjusted
    .sort((left, right) => right.score - left.score)
    .slice(0, topK)
}
