/**
 * Загрузчик ONNX-модели для клиентского инференса.
 *
 * Использование:
 *   const session = await loadModel()
 *   if (session) {
 *     const scores = await session.run(features)
 *   } else {
 *     // fallback на predictHeuristic
 *   }
 */

import type { UserFeatures } from './modelInference'
import { extractFeatures, predictHeuristic } from './modelInference'

export type PredictFn = (features: UserFeatures) => Promise<Float32Array>

let predictFn: PredictFn | null = null

export async function getPredictFn(): Promise<PredictFn> {
  if (predictFn) return predictFn

  // Пытаемся загрузить ONNX Runtime
  try {
    const session = await createOnnxSession()
    if (session) {
      predictFn = async (f) => {
        const feats = extractFeatures(f)
        const output = await session.run(feats)
        return output
      }
      return predictFn
    }
  } catch {
    // ONNX не загрузился — используем JS-эвристику
  }

  predictFn = async (f) => {
    return predictHeuristic(extractFeatures(f))
  }
  return predictFn
}

async function createOnnxSession(): Promise<{
  run: (feats: Float32Array) => Promise<Float32Array>
} | null> {
  try {
    const modelPath = '/model/bitnet_recommender.onnx'
    const resp = await fetch(modelPath, { method: 'HEAD' })
    if (!resp.ok) return null

    // Динамический импорт onnxruntime-web (опционально)
    // @ts-ignore - модуль загружается только если доступен
    const ort = await import('onnxruntime-web')
    const session = await ort.InferenceSession.create(modelPath)

    return {
      run: async (feats: Float32Array) => {
        const tensor = new ort.Tensor('float32', feats, [1, feats.length])
        const results = await session.run({ user_features: tensor })
        const scores = results.product_scores.data as Float32Array
        return scores
      },
    }
  } catch {
    return null
  }
}
