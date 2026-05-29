import type { ProfileData } from '../config/profiles'
import { getProductById } from '../data/productParser'
import { profileToUserFeatures } from '../utils/profileToModel'
import {
  getInferenceBackend,
  getTopKUniqueProductIds,
  initModel,
  personalize,
  predictAsync,
} from './modelInference'
import type { UserFeatures } from './pointwiseFeatures'

export interface TimedStats {
  iterations: number
  averageMs: number
  minMs: number
  maxMs: number
  p50Ms: number
  p95Ms: number
}

export interface AllBenchmarkResults {
  profileName: string
  profileSummary: string
  backend: string
  initMs: number
  predict: TimedStats
  recommendations: TimedStats
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

function summarize(times: number[]): TimedStats {
  const sorted = [...times].sort((a, b) => a - b)
  return {
    iterations: times.length,
    averageMs: times.reduce((a, b) => a + b, 0) / times.length,
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
  }
}

async function measureLoop(iterations: number, fn: () => Promise<void>): Promise<TimedStats> {
  await fn()
  const times: number[] = []
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now()
    await fn()
    times.push(performance.now() - start)
    if (i % 4 === 3) await yieldToUi()
  }
  return summarize(times)
}

function buildProfileSummary(profile: ProfileData): string {
  return `${profile.name}, ${profile.age} лет, ${profile.segment}, доход ${Math.round(profile.modelIncomeEurYear).toLocaleString('ru-RU')} €/год`
}

function logStats(label: string, stats: TimedStats) {
  console.log(`[Benchmark] ${label}: avg=${stats.averageMs.toFixed(2)} ms, min=${stats.minMs.toFixed(2)}, max=${stats.maxMs.toFixed(2)}, p50=${stats.p50Ms.toFixed(2)}, p95=${stats.p95Ms.toFixed(2)}`)
}

/** Init + predict + full recommendations pipeline (warm-up + 100 iterations each). */
export async function runAllInferenceBenchmarks(
  features: UserFeatures,
  profile: ProfileData,
  iterations = 100,
): Promise<AllBenchmarkResults> {
  const initStart = performance.now()
  const ok = await initModel()
  const initMs = performance.now() - initStart
  if (!ok) throw new Error('Model init failed — cannot benchmark')

  const backend = getInferenceBackend() ?? 'unknown'
  console.log(`=== INFERENCE BENCHMARK (backend=${backend}, ${iterations} iter) ===`)
  console.log(`[Benchmark] init: ${initMs.toFixed(2)} ms`)

  const predict = await measureLoop(iterations, () => predictAsync(features).then(() => undefined))
  logStats('predict', predict)

  const recommendations = await measureLoop(iterations, async () => {
    const userFeatures = profileToUserFeatures(profile, {})
    const scores = await predictAsync(userFeatures)
    const personalized = personalize(scores, {})
    const topIds = getTopKUniqueProductIds(personalized, 5)
    for (const id of topIds) getProductById(id)
  })
  logStats('recommendations', recommendations)

  const result: AllBenchmarkResults = {
    profileName: profile.name,
    profileSummary: buildProfileSummary(profile),
    backend,
    initMs,
    predict,
    recommendations,
  }
  console.log('=== END BENCHMARK ===')
  return result
}

