import { useEffect } from 'react'
import { useAuthStore } from '../store'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    if (!store.user && store.token) {
      store.checkAuth()
    }
  }, [])

  return store
}
