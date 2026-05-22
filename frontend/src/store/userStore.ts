import { create } from 'zustand'
import type { UserProfile, Transaction } from '../types'
import { userApi } from '../api/endpoints'

interface UserState {
  profile: UserProfile | null
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  fetchProfile: () => Promise<void>
  fetchTransactions: (page?: number) => Promise<void>
  updateBalance: (amount: number) => void
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await userApi.getProfile()
      if (response.error) throw new Error(response.error)
      set({ profile: response.data, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка загрузки профиля', isLoading: false })
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await userApi.getTransactions(page)
      if (response.error) throw new Error(response.error)
      set({ transactions: response.data, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка загрузки транзакций', isLoading: false })
    }
  },

  updateBalance: (amount) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, balance: amount } : null,
    }))
  },
}))
