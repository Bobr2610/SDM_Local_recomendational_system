import { create } from 'zustand'
import { analyticsApi } from '../api/endpoints'
import {
  getAllProducts,
  getHomeAdProducts,
  getProductById,
  type AdProduct,
} from '../data/productParser'
import {
  extractFeatures,
  initBitNet,
  personalize,
  predict,
  getTopKUniqueProductIds,
} from '../services/modelInference'
import { getItem, setItem } from '../utils/storage'

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
  clickHistory: Record<string, number>
  setField: <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => void
  trackClick: (productId: string) => void
  hydrate: () => Promise<void>
}

const CURRENCY_MAP: Record<string, number> = { RUB: 0, USD: 1, EUR: 2, CNY: 3 }
const ACCOUNT_MAP: Record<string, number> = { current: 0, savings: 1, deposit: 2, card: 3 }
const CLICK_KEY = 'sdm_click_history'

export const useUserInputStore = create<UserInputState>((set, get) => ({
  fullName: 'Иван Петров',
  age: 30,
  currency: 'RUB',
  balance: 250000,
  monthlyIncome: 85000,
  accountType: 'current',
  sessionId: `${Date.now()}`,
  clickHistory: {},

  hydrate: async () => {
    const clicks = (await getItem<Record<string, number>>(CLICK_KEY)) ?? {}
    set({ clickHistory: clicks })
  },

  setField: (field, value) => {
    set({ [field]: value } as Partial<UserInputState>)
  },

  trackClick: (productId: string) => {
    const state = get()
    const newClicks = {
      ...state.clickHistory,
      [productId]: (state.clickHistory[productId] || 0) + 1,
    }
    set({ clickHistory: newClicks })
    void setItem(CLICK_KEY, newClicks)
    void analyticsApi.track({
      id: `${Date.now()}`,
      type: 'button_click',
      payload: { productId },
      timestamp: new Date().toISOString(),
      sessionId: state.sessionId,
    })
  },
}))

export async function fetchRecommendationsForProfile(profile: {
  age: number
  balance: number
  monthlyIncome: number
  accountType: AccountType
  currency: Currency
}): Promise<AdProduct[]> {
  const clickHistory = useUserInputStore.getState().clickHistory
  await initBitNet()

  const features = extractFeatures({
    age: profile.age,
    balance: profile.balance,
    monthlyIncome: profile.monthlyIncome,
    accountType: ACCOUNT_MAP[profile.accountType] ?? 0,
    currency: CURRENCY_MAP[profile.currency] ?? 0,
    clicks: clickHistory,
  })

  const scores = predict(features)
  const personalized = personalize(scores, clickHistory)
  const topIds = getTopKUniqueProductIds(personalized, 5)
  const resolved = topIds
    .map((id) => getProductById(id))
    .filter((p): p is AdProduct => p != null)
  return resolved.length > 0 ? resolved : getAllProducts().slice(0, 5)
}

export function getPopularProducts(): AdProduct[] {
  return getHomeAdProducts().slice(0, 5)
}
