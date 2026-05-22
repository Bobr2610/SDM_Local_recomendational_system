import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { UserInputForm, AiAdDisplay, ProfileCard } from '../components/features/user-input'
import { useProductsStore } from '../store'
import { useAnalytics } from '../hooks/useAnalytics'

export function HomePage() {
  const { categories } = useProductsStore()
  const { track } = useAnalytics()

  return (
    <div>
      <AiAdDisplay />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfileCard />

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">СДМ Банк</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Полный спектр банковских продуктов для частных лиц и бизнеса. Вклады, кредиты, карты и РКО.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Link to="/products">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => track('button_click', { button: 'all_products' })}
                >
                  Все продукты
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => track('button_click', { button: 'open_account' })}
                >
                  Открыть счёт
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.category}
                to={`/products?category=${cat.category}`}
                onClick={() => track('navigation', { to: cat.category })}
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all">
                  <span className="text-3xl">{cat.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-3">{cat.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.products.length} продуктов</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside>
          <UserInputForm />
        </aside>
      </div>
    </div>
  )
}
