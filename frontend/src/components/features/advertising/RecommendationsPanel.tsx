import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AdProduct } from '../../../data/productParser'
import {
  extractFeatures,
  predictHeuristic,
  personalize,
  getTopK,
} from '../../../services/modelInference'
import { getAllProducts, getHomeAdProducts } from '../../../data/productParser'
import type { ProfileData } from './ClientSelector'

const CATEGORY_ICONS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: '🏦',
  loans_individuals: '💰',
  debit_cards: '💳',
  rko_business_packages: '🏢',
  deposits_business: '🛡️',
  additional_business_services: '📋',
}

const CATEGORY_TAGS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: 'Вклад',
  loans_individuals: 'Кредит',
  debit_cards: 'Карта',
  rko_business_packages: 'РКО',
  deposits_business: 'Депозит',
  additional_business_services: 'Услуга',
}

function getCategoryIcon(cat: string): string {
  return CATEGORY_ICONS[cat] ?? '📦'
}

function getCategoryTag(cat: string): string {
  return CATEGORY_TAGS[cat] ?? cat
}

interface TopRecCardProps {
  product: AdProduct
  rank: number
}

function TopRecCard({ product, rank }: TopRecCardProps) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="block relative rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden group"
      style={{ minHeight: '180px' }}
    >
      <div className="p-7 h-full flex flex-col justify-between relative z-10">
        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            <span>{rank}</span>
            <span>Рекомендуем</span>
          </div>
          <div className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full">
            {getCategoryTag(product.category)}
          </div>
        </div>
        <div className="mt-auto">
          <div className="text-3xl mb-2">{getCategoryIcon(product.category)}</div>
          <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
          <p className="text-sm text-white/80 leading-relaxed line-clamp-2">{product.description}</p>
        </div>
      </div>
    </Link>
  )
}

interface RecCardProps {
  product: AdProduct
  rank: number
}

function RecCard({ product, rank }: RecCardProps) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-1 text-xs font-semibold text-gray-400 mb-2">
        <span>{rank}</span>
      </div>
      <div className="text-2xl mb-2">{getCategoryIcon(product.category)}</div>
      <h4 className="font-semibold text-gray-900 text-base leading-tight mb-1">{product.name}</h4>
      <p className="text-sm text-gray-500 leading-snug line-clamp-2">{product.description}</p>
    </Link>
  )
}

function useRecommendations(profile: ProfileData | null, mode: 'profile' | 'popular'): AdProduct[] {
  return useMemo(() => {
    if (mode === 'popular') {
      return getHomeAdProducts().slice(0, 5)
    }
    if (!profile) return []

    const CURRENCY_MAP: Record<string, number> = { RUB: 0, USD: 1, EUR: 2, CNY: 3 }
    const ACCOUNT_MAP: Record<string, number> = { current: 0, savings: 1, deposit: 2, card: 3 }

    const features = extractFeatures({
      age: profile.age,
      balance: profile.balance,
      monthlyIncome: profile.monthlyIncome,
      accountType: ACCOUNT_MAP[profile.accountType] ?? 0,
      currency: CURRENCY_MAP[profile.currency] ?? 0,
      clicks: {},
    })
    const scores = predictHeuristic(features)
    const personalized = personalize(scores, {})
    const top5 = getTopK(personalized, 5)
    const allProducts = getAllProducts()
    return top5.map((idx) => allProducts[idx] ?? allProducts[0])
  }, [profile, mode])
}

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: 'profile' | 'popular'
  onChange: (m: 'profile' | 'popular') => void
}) {
  const btn = (value: 'profile' | 'popular', label: string) => (
    <button
      onClick={() => onChange(value)}
      className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
        mode === value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Режим рекомендаций</h3>
      <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
        {btn('profile', 'По профилю')}
        {btn('popular', 'Популярные')}
      </div>
    </div>
  )
}

export function RecommendationsPanel({ profile }: { profile: ProfileData | null }) {
  const [mode, setMode] = useState<'profile' | 'popular'>('profile')
  const products = useRecommendations(profile, mode)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <ModeSwitch mode={mode} onChange={setMode} />

      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Топ-5 рекомендаций</h4>

      {products.length > 0 && (
        <div className="mb-4">
          <TopRecCard product={products[0]} rank={1} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {products.slice(1).map((p, i) => (
          <RecCard key={p.id} product={p} rank={i + 2} />
        ))}
      </div>
    </div>
  )
}
