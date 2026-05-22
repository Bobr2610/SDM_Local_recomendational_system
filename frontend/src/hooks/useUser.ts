import { useEffect } from 'react'
import { useUserStore } from '../store'

export function useUser() {
  const store = useUserStore()

  useEffect(() => {
    if (!store.profile) {
      store.fetchProfile()
    }
  }, [])

  return store
}
