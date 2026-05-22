import { create } from 'zustand'
import type { BankProduct, ProductCategoryGroup, ProductCategory, Recommendation } from '../types'
import allProductsData from '../data/products.json'

interface ProductsState {
  categories: ProductCategoryGroup[]
  allProducts: BankProduct[]
  selectedCategory: ProductCategory | null
  recommendations: Recommendation[]
  isLoading: boolean
  error: string | null
  setCategory: (category: ProductCategory | null) => void
  getFilteredProducts: () => BankProduct[]
  setRecommendations: (recs: Recommendation[]) => void
  fetchRecommendations: () => Promise<void>
}

interface RawGroup {
  title: string
  icon: string
  products: Array<{ id: string; name: string; description: string }>
}

function buildCategories(): ProductCategoryGroup[] {
  return Object.entries(allProductsData).map(([key, value]) => {
    const group = value as RawGroup
    return {
      category: key as ProductCategory,
      title: group.title,
      icon: group.icon,
      products: group.products.map((p) => ({
        ...p,
        category: key as ProductCategory,
      })),
    }
  })
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  categories: buildCategories(),
  allProducts: buildCategories().flatMap((c) => c.products),
  selectedCategory: null,
  recommendations: [],
  isLoading: false,
  error: null,

  setCategory: (category) => set({ selectedCategory: category }),

  getFilteredProducts: () => {
    const { categories, selectedCategory } = get()
    if (!selectedCategory) return categories.flatMap((c) => c.products)
    const found = categories.find((c) => c.category === selectedCategory)
    return found?.products ?? []
  },

  setRecommendations: (recs) => set({ recommendations: recs }),

  fetchRecommendations: async () => {
    set({ isLoading: true, error: null })
    try {
      const { allProducts } = get()
      const shuffled = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 5)
      const recs: Recommendation[] = shuffled.map((p, i) => ({
        product: p,
        relevanceScore: Math.round((1 - i * 0.15) * 100) / 100,
        reason: i === 0 ? 'Отлично подходит под ваш профиль' : i === 1 ? 'Популярный продукт' : 'Рекомендовано для вас',
      }))
      set({ recommendations: recs, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка', isLoading: false })
    }
  },
}))
