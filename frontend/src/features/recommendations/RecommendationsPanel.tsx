/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductById, type AdProduct } from '../../data/productParser'
import { initModel } from '../../model/loadModel'
import { recommendForProfile, type RankedRecommendation } from '../../model/recommend'
import { colors } from '../../shared/config/theme'
import { CategoryGlyph } from '../../shared/ui/CategoryIcon'
import { useUserInputStore } from '../../store/userInputStore'
import type { ProfileData } from '../profiles/ClientSelector'

interface RecommendationCardData extends RankedRecommendation {
  product: AdProduct
}

function useRecommendations(profile: ProfileData | null): {
  items: RecommendationCardData[]
  loading: boolean
  error: string | null
} {
  const clickHistory = useUserInputStore((state) => state.clickHistory)
  const [items, setItems] = useState<RecommendationCardData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      setItems([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        await initModel()
        const ranked = await recommendForProfile(profile, clickHistory, 5)
        const resolved = ranked
          .map((item) => {
            const product = getProductById(item.productId)
            return product ? { ...item, product } : null
          })
          .filter((item): item is RecommendationCardData => item != null)
        if (!cancelled) setItems(resolved)
      } catch (modelError) {
        if (!cancelled) {
          setError('Модель не загрузилась, показан fallback.')
          setItems([])
          console.error(modelError)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clickHistory, profile])

  return { items, loading, error }
}

export function RecommendationsPanel({ profile }: { profile: ProfileData | null }) {
  const trackClick = useUserInputStore((state) => state.trackClick)
  const { items, loading, error } = useRecommendations(profile)

  return (
    <section className="surface-panel rounded-[1.25rem] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="section-label mb-1">Локальный browser inference</p>
          <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
            Top-5 рекомендаций
          </h3>
        </div>
        {loading ? <span className="text-sm" style={{ color: colors.text.muted }}>Считаем…</span> : null}
      </div>

      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        Рекомендации пересчитываются локально для выбранного профиля клиента.
      </p>

      {error ? (
        <div className="rounded-2xl border px-4 py-3 mb-4 text-sm" style={{ borderColor: colors.borderLight, color: colors.text.secondary }}>
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <Link
            key={item.product.id}
            to={`/product/${item.product.id}`}
            onClick={() => trackClick(item.product.id)}
            className="rounded-[1.25rem] p-4 border card-shadow-hover"
            style={{ borderColor: colors.borderLight, background: colors.surface }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.text.muted }}>
                  #{index + 1} • {item.product.id}
                </div>
                <h4 className="text-[15px] font-bold leading-tight" style={{ color: colors.text.primary }}>
                  {item.product.name}
                </h4>
              </div>
              <CategoryGlyph category={item.product.category} variant="card" />
            </div>

            <p className="text-sm mt-3 leading-relaxed" style={{ color: colors.text.secondary }}>
              {item.product.description}
            </p>
          </Link>
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <p className="text-sm mt-4" style={{ color: colors.text.muted }}>
          Выберите профиль клиента.
        </p>
      ) : null}
    </section>
  )
}
