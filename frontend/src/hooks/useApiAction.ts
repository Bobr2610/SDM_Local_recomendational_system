import { useCallback, useState } from 'react'

export function useApiAction<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fn(...args)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Произошла ошибка'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fn])

  return { execute, isLoading, error, clearError: () => setError(null) }
}
