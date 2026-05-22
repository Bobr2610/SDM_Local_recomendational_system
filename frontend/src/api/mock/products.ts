import type { ApiRequestConfig, ApiResponse } from '../../types'
import { getAllProducts } from '../../data/productParser'

export const productsMock: Record<string, (config: ApiRequestConfig) => ApiResponse<unknown>> = {
  'GET:/products': () => {
    return { data: getAllProducts(), status: 200 }
  },
  'GET:/products/recommendations': () => {
    const all = getAllProducts()
    const random = [...all].sort(() => Math.random() - 0.5).slice(0, 5)
    return { data: random, status: 200 }
  },
  'GET:/health': () => ({
    data: { status: 'ok' },
    status: 200,
  }),
}
