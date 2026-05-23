import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '../components/ui'
import { UserInputForm, AiAdDisplay, ProfileCard } from '../components/features/user-input'
import { ProductAdCards } from '../components/features/advertising'
import { useProductsStore, useUserInputStore } from '../store'
import { useAnalytics } from '../hooks/useAnalytics'

export function HomePage() {
  const { categories } = useProductsStore()
  const { track } = useAnalytics()
  const fetchAd = useUserInputStore((s) => s.fetchAd)
  const trackClick = useUserInputStore((s) => s.trackClick)

  useEffect(() => {
    fetchAd()
  }, [])

  return (
    <div>
      <AiAdDisplay />

      <ProductAdCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <ProfileCard />

          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">СДМ Банк</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-500 max-w-2xl mx-auto px-4">
              Полный спектр банковских продуктов для частных лиц и бизнеса. Вклады, кредиты, карты и РКО.
            </p>
            <div className="mt-4 sm:mt-6 flex justify-center gap-2 sm:gap-3 flex-wrap">
              <Link to="/products">
                <Button variant="primary" size="lg" onClick={() => track('button_click', { button: 'all_products' })}>Все продукты</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" onClick={() => track('button_click', { button: 'open_account' })}>Открыть счёт</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-6">
            {categories.map((cat) => (
              <Link key={cat.category}                 to={`/products?category=${cat.category}`}
                onClick={() => {
                  track('navigation', { to: cat.category })
                  trackClick(cat.products[0]?.id ?? cat.category)
                }}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-gray-300 transition-all">
                  <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-2 sm:mt-3">{cat.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{cat.products.length} продуктов</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="order-first lg:order-none">
          <UserInputForm />
        </aside>
      </div>
    </div>
  )
}
