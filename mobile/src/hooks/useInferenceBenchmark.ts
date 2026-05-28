import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { PROFILES } from '../config/profiles'
import {
  runAllInferenceBenchmarks,
  type AllBenchmarkResults,
} from '../services/inferenceBenchmark'
import { profileToUserFeatures } from '../utils/profileToModel'

export type BenchmarkStatus = 'idle' | 'running' | 'done' | 'error'

/** Один замер при старте (не блокирует смену клиента и кнопки). */
export function useInferenceBenchmark() {
  const [status, setStatus] = useState<BenchmarkStatus>(Platform.OS === 'android' ? 'idle' : 'idle')
  const [results, setResults] = useState<AllBenchmarkResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (Platform.OS !== 'android' || startedRef.current) return
    startedRef.current = true

    const profile = PROFILES[3] ?? PROFILES[0]
    if (!profile) return

    let cancelled = false
    setStatus('running')

    const features = profileToUserFeatures(profile)

    void runAllInferenceBenchmarks(features, profile, 100)
      .then((r) => {
        if (!cancelled) {
          setResults(r)
          setStatus('done')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { status, results, error }
}
