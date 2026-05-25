import type { InferenceCalibration, ModelMetricsFile } from '../types/metrics'

let cached: ModelMetricsFile | null = null

const DEFAULT_CALIBRATION: InferenceCalibration = {
  temperature: 0.75,
  min_score: 0.35,
  min_margin: 0.05,
}

export async function loadModelMetrics(): Promise<ModelMetricsFile | null> {
  if (cached) return cached
  try {
    const resp = await fetch('/model/metrics.json')
    if (!resp.ok) return null
    cached = await resp.json()
    return cached
  } catch {
    return null
  }
}

export async function getInferenceCalibration(): Promise<InferenceCalibration> {
  const m = await loadModelMetrics()
  return m?.inference ?? DEFAULT_CALIBRATION
}
