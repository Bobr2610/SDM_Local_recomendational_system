import { useEffect } from 'react'
import { AccountBalance, RecentTransactions, QuickActions } from '../components/features/dashboard'
import { RecommendationList } from '../components/features/recommendations'
import { AdBanner, AdSidebar } from '../components/features/advertising'
import { ProfileCard } from '../components/features/user-input'
import { PageSpinner } from '../components/ui'
import { useUserStore, useProductsStore } from '../store'

export function DashboardPage() {
  const { profile, transactions, fetchProfile, fetchTransactions, isLoading } = useUserStore()
  const { recommendations } = useProductsStore()

  useEffect(() => {
    fetchProfile()
    fetchTransactions()
  }, [])

  if (isLoading && !profile) return <PageSpinner />
  if (!profile) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Здравствуйте, {profile.fullName}</h1>
        <p className="text-sm text-gray-500">Добро пожаловать в ваш личный кабинет</p>
      </div>

      <AdBanner position="banner_bottom" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AccountBalance profile={profile} />
            <QuickActions />
          </div>
          <ProfileCard />
          <RecentTransactions transactions={transactions} />
        </div>
        <aside className="space-y-6">
          <AdSidebar />
          <RecommendationList recommendations={recommendations} />
        </aside>
      </div>
    </div>
  )
}
