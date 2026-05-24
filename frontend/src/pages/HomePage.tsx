import { useState } from 'react'
import { Header } from '../components/layout'
import { ClientSelector, PROFILES } from '../components/features/advertising/ClientSelector'
import { ClientProfile } from '../components/features/advertising/ClientProfile'
import { RecommendationsPanel } from '../components/features/advertising/RecommendationsPanel'
import { useUserInputStore } from '../store'

export function HomePage() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const setField = useUserInputStore((s) => s.setField)

  const handleSelect = (idx: number) => {
    const p = PROFILES[idx]
    setField('age', p.age)
    setField('balance', p.balance)
    setField('monthlyIncome', p.monthlyIncome)
    setField('accountType', p.accountType)
    setField('currency', p.currency)
    setField('fullName', p.name)
    setSelectedIdx(idx)
  }

  const profile = PROFILES[selectedIdx]

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <main className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Подберите продукты для клиента</h1>

        <div className="mb-6">
          <ClientSelector selectedIdx={selectedIdx} onSelect={handleSelect} />
        </div>

        <div className="flex gap-6">
          <div className="w-[32%] shrink-0">
            <ClientProfile profile={profile} />
          </div>
          <div className="flex-1 min-w-0">
            <RecommendationsPanel profile={profile} />
          </div>
        </div>
      </main>
    </div>
  )
}
