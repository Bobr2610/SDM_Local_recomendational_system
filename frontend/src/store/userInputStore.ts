import { create } from 'zustand'
import type { AdSelectionResponse } from '../types'
import { adsApi } from '../api/endpoints'
import { ANALYTICS } from '../config/features'
import { generateSessionId } from '../utils/session'

export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY'
export type AccountType = 'savings' | 'current' | 'deposit' | 'card'

export interface UserProfile {
  fullName: string
  age: number
  currency: Currency
  balance: number
  monthlyIncome: number
  accountType: AccountType
}

interface UserInputState extends UserProfile {
  sessionId: string
  selectedAd: AdSelectionResponse | null
  adHistory: AdSelectionResponse[]
  isLoading: boolean
  error: string | null
  setField: <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => void
  fetchAd: () => Promise<void>
  clearError: () => void
}

const DEFAULTS: UserProfile = {
  fullName: 'Иван Петров',
  age: 30,
  currency: 'RUB',
  balance: 250000,
  monthlyIncome: 85000,
  accountType: 'current',
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export const useUserInputStore = create<UserInputState>((set, get) => ({
  ...DEFAULTS,
  sessionId: generateSessionId(),
  selectedAd: null,
  adHistory: [],
  isLoading: false,
  error: null,

  setField: (field, value) => {
    set({ [field]: value } as Partial<UserInputState>)
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      get().fetchAd()
    }, 600)
  },

  fetchAd: async () => {
    const { age, balance, monthlyIncome, currency, accountType, sessionId } = get()
    set({ isLoading: true, error: null })
    try {
      const response = await adsApi.select({ age, balance, sessionId })
      if (response.error) throw new Error(response.error)
      set((state) => ({
        selectedAd: response.data,
        adHistory: [...state.adHistory, response.data],
        isLoading: false,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка подбора', isLoading: false })
    }
    if (ANALYTICS.ENABLED) {
      navigator.sendBeacon?.('/analytics/event', JSON.stringify({
        type: 'form_submit',
        payload: { age, balance, monthlyIncome, currency, accountType, sessionId },
        timestamp: new Date().toISOString(),
        sessionId,
      }))
    }
  },

  clearError: () => set({ error: null }),
}))
