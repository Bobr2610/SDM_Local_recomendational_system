import type { ApiRequestConfig, ApiResponse } from '../../types'

import allProducts from '../../data/products.json'

export const productsMock: Record<string, (config: ApiRequestConfig) => ApiResponse<unknown>> = {
  'GET:/products': () => {
    const all = Object.values(allProducts).flatMap((group) =>
      (group as { products: unknown[] }).products
    )
    return { data: all, status: 200 }
  },
  'GET:/products/recommendations': () => {
    const all = Object.values(allProducts).flatMap((group) =>
      (group as { products: unknown[] }).products
    )
    const random = [...all].sort(() => Math.random() - 0.5).slice(0, 5)
    return { data: random, status: 200 }
  },
  'GET:/health': () => ({
    data: { status: 'ok' },
    status: 200,
  }),
}
