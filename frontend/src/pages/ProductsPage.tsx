import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ProductList, ProductFilter } from '../components/features/products'
import { useProductsStore } from '../store'
import type { ProductCategory } from '../types'

export function ProductsPage() {
  const [searchParams] = useSearchParams()
  const { categories, setCategory } = useProductsStore()

  useEffect(() => {
    const cat = searchParams.get('category') as ProductCategory | null
    if (cat) setCategory(cat)
  }, [searchParams])

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Продукты банка</h1>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Выберите подходящий продукт</p>
      <ProductFilter />
      <ProductList categories={categories} />
    </div>
  )
}
