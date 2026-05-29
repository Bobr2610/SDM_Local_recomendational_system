import { create } from 'zustand'
import { API_CONFIG } from '../config/api'
import { analyticsApi } from '../api/endpoints'
import { getHomeAdProducts, getProductById, type AdProduct } from '../data/productParser'
import {
  getInferenceBackend,
  getModelInitError,
  getTopKUniqueProductIds,
  initModel,
  isModelLoaded,
  personalize,
  predictAsync,
} from '../services/modelInference'
import { profileToUserFeatures, type ProfileForModel } from '../utils/profileToModel'
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
  sex: 0 | 1
  seniorityMonths: number
  isNewCustomer: 0 | 1
  segment: ProfileForModel['segment']
  regionName: string
}

interface UserInputState extends UserProfile {
  sessionId: string
  clickHistory: Record<string, number>
  setField: <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => void
  trackClick: (productId: string) => void
  hydrate: () => Promise<void>
}

const CLICK_KEY = 'sdm_click_history'

export const useUserInputStore = create<UserInputState>((set, get) => ({
  fullName: 'Иван Петров',
  age: 30,
  currency: 'RUB',
  balance: 250000,
  monthlyIncome: 85000,
  accountType: 'current',
  sex: 1,
  seniorityMonths: 72,
  isNewCustomer: 0,
  segment: 'INDIVIDUALS',
  regionName: 'MADRID',
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

export type ProfileRecommendationsResult =
  | { status: 'ok'; products: AdProduct[]; backend: 'native' | 'js' }
  | { status: 'error'; message: string }

export async function fetchRecommendationsForProfile(
  profile: ProfileForModel,
): Promise<ProfileRecommendationsResult> {
  const clickHistory = useUserInputStore.getState().clickHistory

  if (!API_CONFIG.USE_LOCAL_MODEL) {
    return {
      status: 'error',
      message: 'Локальная модель отключена в этой сборке. Персональные рекомендации недоступны.',
    }
  }

  const ok = await initModel()
  if (!ok || !isModelLoaded()) {
    const detail = getModelInitError()
    console.error('[CatBoost]', detail)
    return {
      status: 'error',
      message: detail ?? 'Модель CatBoost недоступна на устройстве.',
    }
  }

  const backend = getInferenceBackend()
  if (!backend) {
    return { status: 'error', message: 'Модель загружена, но backend inference не инициализирован.' }
  }

  try {
    const userFeatures = profileToUserFeatures(profile, clickHistory)
    const scores = await predictAsync(userFeatures)
    const personalized = personalize(scores, clickHistory)
    const topIds = getTopKUniqueProductIds(personalized, 5)

    if (topIds.length === 0) {
      return { status: 'error', message: 'Модель не вернула ни одной рекомендации.' }
    }

    const products = topIds
      .map((id) => getProductById(id))
      .filter((p): p is AdProduct => p != null)

    if (products.length === 0) {
      return {
        status: 'error',
        message: 'Ответ модели не сопоставился с каталогом продуктов приложения.',
      }
    }

    return { status: 'ok', products, backend }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[Recommendations]', message)
    return { status: 'error', message: `Ошибка inference: ${message}` }
  }
}

export function getPopularProducts(): AdProduct[] {
  return getHomeAdProducts().slice(0, 5)
}
