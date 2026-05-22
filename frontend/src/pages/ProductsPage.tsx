import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ProductList, ProductFilter } from '../components/features/products'
import { AdSidebar } from '../components/features/advertising'
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Продукты банка</h1>
        <p className="text-sm text-gray-500 mb-6">Выберите подходящий продукт</p>
        <ProductFilter />
        <ProductList categories={categories} />
      </div>
      <aside className="lg:col-span-1">
        <AdSidebar />
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Нужна помощь?</h4>
          <p className="text-xs text-gray-500">
            Свяжитесь с нашим консультантом по телефону 8 (800) 123-45-67
          </p>
        </div>
      </aside>
    </div>
  )
}
