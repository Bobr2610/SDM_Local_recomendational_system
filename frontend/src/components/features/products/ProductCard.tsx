import { Card, CardBody, Badge } from '../../ui'
import { truncate } from '../../../utils/format'
import type { BankProduct } from '../../../types'

interface ProductCardProps {
  product: BankProduct
  onClick?: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card hoverable onClick={onClick}>
      <CardBody>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {truncate(product.description, 120)}
        </p>
        <div className="mt-3">
          <Badge variant="info">{product.category}</Badge>
        </div>
      </CardBody>
    </Card>
  )
}
