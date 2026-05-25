export interface UserFeatures {
  age: number
  balance: number
  monthlyIncome: number
  accountType: number
  currency: number
  clicks: Record<string, number>
  seniorityMonths?: number
  isNewCustomer?: number
  sex?: number
  segmentVip?: number
  segmentStudent?: number
}

/** Порядок продуктов как при обучении (train_wide.csv). */
const DEFAULT_PRODUCT_NAMES = [
  'dep-7', 'card-2', 'dep-5', 'card-1', 'card-5', 'rko-2', 'rko-3', 'rko-4',
  'dep-9', 'dep-1', 'dep-3', 'rko-1', 'dep-2', 'loan-2', 'card-4', 'loan-1',
  'srv-3', 'loan-5', 'biz-4', 'dep-6', 'loan-4', 'card-3',
]

type WeightEntry = { data: number[][] | number[]; gamma?: number; shape: number[] }

import { getInferenceCalibration } from './metricsLoader'
import type { InferenceCalibration } from '../types/metrics'

let modelWeights: Record<string, WeightEntry> | null = null
let productNames: string[] = [...DEFAULT_PRODUCT_NAMES]
let initPromise: Promise<boolean> | null = null
let modelReady = false
let calibration: InferenceCalibration = {
  temperature: 0.75,
  min_score: 0.35,
  min_margin: 0.05,
}

export function isModelReady(): boolean {
  return modelReady && modelWeights !== null
}

export async function initBitNet(): Promise<boolean> {
  if (modelReady && modelWeights) return true
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const wResp = await fetch('/model/bitnet_weights.json')
      if (!wResp.ok) {
        console.warn('[BitNet] bitnet_weights.json not found')
        return false
      }
      modelWeights = await wResp.json()

      try {
        const fResp = await fetch('/model/feature_order.json')
        if (fResp.ok) {
          const featureOrder = await fResp.json()
          if (Array.isArray(featureOrder.product_names) && featureOrder.product_names.length > 0) {
            productNames = featureOrder.product_names
          }
        }
      } catch {
        // feature_order optional
      }

      calibration = await getInferenceCalibration()
      modelReady = true
      console.info(
        '[BitNet] Model loaded:',
        Object.keys(modelWeights ?? {}).length,
        'tensors; T=',
        calibration.temperature,
      )
      return true
    } catch (e) {
      console.warn('[BitNet] Failed to load weights:', e)
      return false
    }
  })()

  return initPromise
}

export function getProductIndex(productId: string): number {
  return productNames.indexOf(productId)
}

export function getProductId(modelIndex: number): string | null {
  return productNames[modelIndex] ?? null
}

function rmsNorm(x: Float32Array, gamma: Float32Array): Float32Array {
  let sq = 0
  for (let i = 0; i < x.length; i++) sq += x[i] * x[i]
  const rms = Math.sqrt(sq / x.length + 1e-6)
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i++) out[i] = (x[i] / rms) * gamma[i]
  return out
}

/** 8-bit absmax activation quant (Microsoft BitNet b1.58 FAQ). */
function actQuant8(x: Float32Array): Float32Array {
  let maxAbs = 0
  for (let i = 0; i < x.length; i++) maxAbs = Math.max(maxAbs, Math.abs(x[i]))
  const scale = 127 / Math.max(maxAbs, 1e-5)
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i++) {
    const q = Math.round(x[i] * scale)
    const clamped = Math.max(-128, Math.min(127, q))
    out[i] = (clamped / scale)
  }
  return out
}

function silu(x: Float32Array): Float32Array {
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i++) out[i] = x[i] * (1 / (1 + Math.exp(-x[i])))
  return out
}

function linear(
  x: Float32Array,
  w: number[][],
  gamma: number,
  bias: number[],
): Float32Array {
  const out = new Float32Array(w.length)
  for (let i = 0; i < w.length; i++) {
    let s = bias[i] ?? 0
    const row = w[i]
    for (let j = 0; j < x.length; j++) s += row[j] * gamma * x[j]
    out[i] = s
  }
  return out
}

function getLayer(name: string): { w: number[][]; g: number; b: number[] } | null {
  if (!modelWeights) return null
  const entry = modelWeights[name]
  if (!entry || !Array.isArray(entry.data)) return null
  const w = entry.data as number[][]
  const g = entry.gamma ?? 1
  const biasKey = name.replace(/\.weight$/, '.bias')
  const biasEntry = modelWeights[biasKey]
  const b = biasEntry
    ? (biasEntry.data as unknown as number[])
    : new Array(w.length).fill(0)
  return { w, g, b }
}

/** Признаки в том же порядке, что в train_santander.py. */
export function extractFeatures(f: UserFeatures): Float32Array {
  const feats = new Float32Array(32)
  feats[0] = (f.age - 35) / 15
  feats[1] = (f.balance - 50000) / 30000
  feats[2] = (f.monthlyIncome - 60000) / 40000
  feats[3] = (f.isNewCustomer ?? 0) / 3
  feats[4] = (f.sex ?? 0) / 3
  feats[5] = (f.seniorityMonths ?? 0) / 120
  feats[6] = f.segmentVip ?? 0
  feats[7] = f.segmentStudent ?? 0

  for (const [id, count] of Object.entries(f.clicks)) {
    const idx = productNames.indexOf(id)
    if (idx >= 0) feats[9 + (idx % 23)] = Math.min(count / 100, 1)
  }
  return feats
}

function sigmoidScaled(logits: Float32Array, temperature: number): Float32Array {
  const T = Math.max(temperature, 1e-4)
  const out = new Float32Array(logits.length)
  for (let i = 0; i < logits.length; i++) {
    out[i] = 1 / (1 + Math.exp(-logits[i] / T))
  }
  return out
}

export function predict(feats: Float32Array): Float32Array {
  if (!modelWeights) return predictHeuristic(feats)

  try {
    const emb = getLayer('embed.weight')
    if (!emb) return predictHeuristic(feats)

    let x = linear(feats, emb.w, emb.g, [])

    const blockIndices = [0, 1, 2]
    for (const idx of blockIndices) {
      const prefix = `blocks.${idx}.0`
      const bl = getLayer(`${prefix}.weight`)
      const normEntry = modelWeights[`${prefix}.norm.w`]
      if (!bl || !normEntry) continue

      const normGamma = new Float32Array(normEntry.data as unknown as number[])
      let h = rmsNorm(x, normGamma)
      h = actQuant8(h)
      h = linear(h, bl.w, bl.g, bl.b)
      h = silu(h)

      const residual = new Float32Array(x)
      for (let i = 0; i < Math.min(h.length, residual.length); i++) {
        x[i] = h[i] + residual[i]
      }
    }

    const fn = modelWeights['norm.w']
    if (fn) {
      x = rmsNorm(x, new Float32Array(fn.data as unknown as number[]))
    }

    const head = getLayer('head.weight')
    if (!head) return predictHeuristic(feats)

    const logits = linear(x, head.w, head.g, head.b)
    return sigmoidScaled(logits, calibration.temperature)
  } catch (e) {
    console.warn('[BitNet] Inference error, using heuristic:', e)
    return predictHeuristic(feats)
  }
}

export function predictHeuristic(feats: Float32Array): Float32Array {
  const scores = new Float32Array(36)
  const seed = feats.reduce((a, b) => a * 31 + Math.round(b * 1000), 0)
  const rng = ((s: number) => () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  })(Math.abs(seed))
  const ageFactor = (feats[0] + 1) / 2
  const incomeFactor = (feats[1] + 3) / 6
  for (let i = 0; i < 36; i++) {
    scores[i] =
      0.12 +
      0.04 * Math.sin(i * 0.5) +
      0.25 * ageFactor +
      0.25 * incomeFactor +
      (rng() - 0.5) * 0.15
  }
  return scores
}

export function personalize(scores: Float32Array, clicks: Record<string, number>): Float32Array {
  const adj = new Float32Array(scores)
  for (const [id, count] of Object.entries(clicks)) {
    const idx = getProductIndex(id)
    if (idx >= 0 && idx < adj.length) adj[idx] += 0.05 * Math.min(count, 20)
  }
  return adj
}

export function getTopK(scores: Float32Array, k = 3): number[] {
  const ranked = Array.from(scores)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)

  const filtered = ranked.filter((x) => x.s >= calibration.min_score)
  const pool = filtered.length > 0 ? filtered : ranked

  if (pool.length >= 2 && pool[0].s - pool[1].s < calibration.min_margin) {
    return pool.slice(0, Math.max(1, k)).map((x) => x.i)
  }

  return pool.slice(0, k).map((x) => x.i)
}

export function getCalibration(): InferenceCalibration {
  return { ...calibration }
}

export function profileToFeatures(
  profile: {
    age: number
    balance: number
    monthlyIncome: number
    accountType: string
    currency: string
    seniorityMonths?: number
    isNewCustomer?: number
    sex?: number
    segmentVip?: number
    segmentStudent?: number
  },
  clicks: Record<string, number>,
): Float32Array {
  const CURRENCY_MAP: Record<string, number> = { RUB: 0, USD: 1, EUR: 2, CNY: 3 }
  const ACCOUNT_MAP: Record<string, number> = { current: 0, savings: 1, deposit: 2, card: 3 }

  return extractFeatures({
    age: profile.age,
    balance: profile.balance,
    monthlyIncome: profile.monthlyIncome,
    accountType: ACCOUNT_MAP[profile.accountType] ?? 0,
    currency: CURRENCY_MAP[profile.currency] ?? 0,
    clicks,
    seniorityMonths: profile.seniorityMonths,
    isNewCustomer: profile.isNewCustomer,
    sex: profile.sex,
    segmentVip: profile.segmentVip,
    segmentStudent: profile.segmentStudent,
  })
}

export async function recommendProducts(
  profile: Parameters<typeof profileToFeatures>[0],
  clicks: Record<string, number>,
  k = 5,
): Promise<{ productId: string; score: number }[]> {
  await initBitNet()
  const feats = profileToFeatures(profile, clicks)
  const scores = personalize(predict(feats), clicks)
  const top = getTopK(scores, k)
  return top.map((idx) => ({
    productId: getProductId(idx) ?? DEFAULT_PRODUCT_NAMES[0],
    score: scores[idx],
  }))
}
