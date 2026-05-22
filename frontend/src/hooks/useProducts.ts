import { useProductsStore } from '../store'

export function useProducts() {
  return useProductsStore()
}
