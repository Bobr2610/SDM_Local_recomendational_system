import { Button } from '../../ui'
import { useProductsStore } from '../../../store'
import type { ProductCategory } from '../../../types'

const categoryLabels: Record<string, string> = {
  deposits_individuals: 'Вклады',
  loans_individuals: 'Кредиты',
  debit_cards: 'Карты',
  rko_business: 'РКО',
  deposits_business: 'Депозиты бизнес',
  business_services: 'Услуги',
}

export function ProductFilter() {
  const { selectedCategory, setCategory } = useProductsStore()

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={!selectedCategory ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setCategory(null)}
      >
        Все
      </Button>
      {Object.entries(categoryLabels).map(([key, label]) => (
        <Button
          key={key}
          variant={selectedCategory === key ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setCategory(key as ProductCategory)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
