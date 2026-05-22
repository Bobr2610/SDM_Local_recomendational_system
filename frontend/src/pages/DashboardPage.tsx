import { useEffect } from 'react'
import { AccountBalance, RecentTransactions, QuickActions } from '../components/features/dashboard'
import { RecommendationList } from '../components/features/recommendations'
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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Здравствуйте, {profile.fullName}</h1>
        <p className="text-xs sm:text-sm text-gray-500">Добро пожаловать в ваш личный кабинет</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <AccountBalance profile={profile} />
            <QuickActions />
          </div>
          <ProfileCard />
          <RecentTransactions transactions={transactions} />
        </div>
        <aside className="space-y-4 sm:space-y-6">
          <RecommendationList recommendations={recommendations} />
        </aside>
      </div>
    </div>
  )
}
