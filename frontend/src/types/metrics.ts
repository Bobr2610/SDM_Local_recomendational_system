export interface InferenceCalibration {
  temperature: number
  min_score: number
  min_margin: number
}

export interface ModelMetricsFile {
  model: string
  dataset: string
  sample_frac: number
  epochs: number
  train_samples: number
  val_samples: number
  train_loss: number
  val_loss: number
  loss?: string
  metrics: Record<string, number>
  inference?: InferenceCalibration
  updated_at: string
}

export interface LiveRecommendationMetric {
  productId: string
  productName: string
  score: number
  rank: number
}
