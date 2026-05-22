import { Button } from '../../ui'
import { useProductsStore } from '../../../store'
import type { ProductCategory } from '../../../types'

const CATS: { key: ProductCategory; label: string }[] = [
  { key: 'deposits_and_savings_accounts_individuals', label: 'Вклады' },
  { key: 'loans_individuals', label: 'Кредиты' },
  { key: 'debit_cards', label: 'Карты' },
  { key: 'rko_business_packages', label: 'РКО' },
  { key: 'deposits_business', label: 'Бизнес' },
  { key: 'additional_business_services', label: 'Услуги' },
]

export function ProductFilter() {
  const { selectedCategory, setCategory } = useProductsStore()

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
      <Button variant={!selectedCategory ? 'primary' : 'outline'} size="sm" onClick={() => setCategory(null)}>Все</Button>
      {CATS.map(({ key, label }) => (
        <Button key={key} variant={selectedCategory === key ? 'primary' : 'outline'} size="sm" onClick={() => setCategory(key)}>
          {label}
        </Button>
      ))}
    </div>
  )
}
