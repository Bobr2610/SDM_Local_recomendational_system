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
import { colors } from '../../../config/theme'
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

function RecCard({ product, rank, hero }: { product: AdProduct; rank: number; hero?: boolean }) {
  const s = colors.rank[rank - 1] ?? colors.rank[0]

  return (
    <Link
      to={`/product/${product.id}`}
      className="block rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
      style={{
        minHeight: hero ? '170px' : '180px',
        background: `linear-gradient(135deg, ${s.from} 0%, ${s.to} 100%)`,
        boxShadow: `0 ${hero ? 10 : 6}px ${hero ? 30 : 20}px ${s.shadow}`,
      }}
    >
      <div className="p-5 h-full flex flex-col gap-2 relative z-10">
        <div className="flex items-start justify-between">
          <div
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            {rank}
          </div>
          <div
            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(255,255,255,0.2)', color: colors.text.white }}
          >
            {getCategoryTag(product.category)}
          </div>
        </div>
        <div>
          <div className="text-2xl mb-1.5 leading-none">{getCategoryIcon(product.category)}</div>
          <h3 className="text-base font-bold text-white mb-0.5 leading-tight">{product.name}</h3>
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.75)' }}>{product.description}</p>
        </div>
      </div>
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
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Режим рекомендаций</h3>
      <div
        className="flex rounded-[14px] p-[4px] gap-0"
        style={{ background: colors.segmented.bg }}
      >
        <button
          onClick={() => onChange('profile')}
          className="px-4 py-1.5 text-sm font-medium rounded-xl transition-all cursor-pointer"
          style={
            mode === 'profile'
              ? { background: colors.surface, color: colors.text.primary, boxShadow: `0 2px 8px ${colors.segmented.activeShadow}` }
              : { color: colors.text.secondary }
          }
        >
          По профилю
        </button>
        <button
          onClick={() => onChange('popular')}
          className="px-4 py-1.5 text-sm font-medium rounded-xl transition-all cursor-pointer"
          style={
            mode === 'popular'
              ? { background: colors.surface, color: colors.text.primary, boxShadow: `0 2px 8px ${colors.segmented.activeShadow}` }
              : { color: colors.text.secondary }
          }
        >
          Популярные
        </button>
      </div>
    </div>
  )
}

export function RecommendationsPanel({ profile }: { profile: ProfileData | null }) {
  const [mode, setMode] = useState<'profile' | 'popular'>('profile')
  const products = useRecommendations(profile, mode)

  return (
    <div
      className="bg-white rounded-2xl p-6"
      style={{ border: `1px solid ${colors.border}`, boxShadow: colors.shadow.card }}
    >
      <ModeSwitch mode={mode} onChange={setMode} />

      <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: colors.text.secondary }}>Топ-5 рекомендаций</h4>

      {products.length > 0 && (
        <div className="mb-3.5">
          <RecCard product={products[0]} rank={1} hero />
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
