import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../../store'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}
