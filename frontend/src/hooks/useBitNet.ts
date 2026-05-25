import { useEffect, useState } from 'react'
import { initBitNet, isModelReady } from '../services/modelInference'

let preloadStarted = false

export function preloadBitNet(): void {
  if (!preloadStarted) {
    preloadStarted = true
    void initBitNet()
  }
}

/** Ждёт загрузки весов перед инференсом на главной. */
export function useBitNetReady(): boolean {
  const [ready, setReady] = useState(isModelReady())

  useEffect(() => {
    let cancelled = false
    initBitNet().then((ok) => {
      if (!cancelled) setReady(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
