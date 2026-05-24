import { useEffect } from 'react'
import { Header } from '../components/layout'
import { AiAdDisplay } from '../components/features/user-input'
import { ProductAdCards } from '../components/features/advertising'
import { AccountPopupSidebar } from '../components/features/advertising/AccountPopupSidebar'
import { useUserInputStore } from '../store'

export function HomePage() {
  const fetchAd = useUserInputStore((s) => s.fetchAd)

  useEffect(() => {
    fetchAd()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AccountPopupSidebar />

          <AiAdDisplay />

          <ProductAdCards />
        </div>
      </main>
    </div>
  )
}
