import { useState } from 'react'
import { Modal } from '../../ui'
import type { BankProduct, ProductCategoryGroup } from '../../../types'
import { ProductCard } from './ProductCard'

interface ProductListProps {
  categories: ProductCategoryGroup[]
}

export function ProductList({ categories }: ProductListProps) {
  const [selectedProduct, setSelectedProduct] = useState<BankProduct | null>(null)

  return (
    <div className="space-y-8">
      {categories.map((group) => (
        <section key={group.category}>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">{group.icon}</span>
            <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </section>
      ))}

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
      >
        <p className="text-sm text-gray-600 leading-relaxed">{selectedProduct?.description}</p>
        <div className="mt-4">
          <span className="text-xs font-medium text-gray-500">Категория:</span>
          <span className="ml-2 text-sm text-gray-900">{selectedProduct?.category}</span>
        </div>
      </Modal>
    </div>
  )
}
