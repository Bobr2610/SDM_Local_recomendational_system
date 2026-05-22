import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, Button, Badge } from '../components/ui'
import { getProductById } from '../data/productParser'

const CATEGORY_LABELS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: 'Вклады',
  loans_individuals: 'Кредиты',
  debit_cards: 'Дебетовые карты',
  rko_business_packages: 'РКО',
  deposits_business: 'Депозиты бизнеса',
  additional_business_services: 'Услуги',
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const product = productId ? getProductById(productId) : undefined

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Продукт не найден</h1>
        <Link to="/products"><Button variant="primary">Ко всем продуктам</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">← На главную</Link>

      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{product.name}</h1>
            <Badge variant="info">{CATEGORY_LABELS[product.category] ?? product.category}</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="relative rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-gray-100 to-gray-200 h-32 sm:h-48">
            <img
              src={product.image}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              onError={(e) => { (e.target as HTMLImageElement).remove() }}
            />
          </div>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{product.description}</p>
        </CardBody>
      </Card>

      <div className="mt-4 sm:mt-6 text-center">
        <Link to="/register">
          <Button variant="primary" size="lg">Оформить</Button>
        </Link>
      </div>
    </div>
  )
}
