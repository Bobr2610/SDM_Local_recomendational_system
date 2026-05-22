import { create } from 'zustand'
import type { UserSession, LoginRequest, RegisterRequest } from '../types'
import { authApi } from '../api/endpoints'

interface AuthState {
  user: UserSession | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('sdm_auth_token'),
  isAuthenticated: !!localStorage.getItem('sdm_auth_token'),
  isLoading: false,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login(data)
      if (response.error) throw new Error(response.error)
      localStorage.setItem('sdm_auth_token', response.data.token)
      set({ user: response.data.user, token: response.data.token, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка входа', isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.register(data)
      if (response.error) throw new Error(response.error)
      localStorage.setItem('sdm_auth_token', response.data.token)
      set({ user: response.data.user, token: response.data.token, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка регистрации', isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('sdm_auth_token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('sdm_auth_token')
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }
    set({ isLoading: true })
    try {
      const response = await authApi.me()
      if (response.error) throw new Error(response.error)
      set({ user: { id: response.data.id, fullName: response.data.fullName, phone: response.data.phone, email: response.data.email }, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('sdm_auth_token')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
