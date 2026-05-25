import { useEffect, useState } from 'react'
import type { ProfileData } from './ClientSelector'
import { colors } from '../../../config/theme'
import { loadModelMetrics } from '../../../services/metricsLoader'
import type { ModelMetricsFile, LiveRecommendationMetric } from '../../../types/metrics'
import { recommendProducts } from '../../../services/modelInference'
import { getProductById } from '../../../data/productParser'
import { useUserInputStore } from '../../../store/userInputStore'
import { useBitNetReady } from '../../../hooks/useBitNet'

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div
      className="rounded-xl p-3 sm:p-4 min-w-0"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: colors.text.muted }}>
        {label}
      </div>
      <div className="text-lg sm:text-xl font-bold tabular-nums" style={{ color: colors.text.primary }}>
        {value}
      </div>
      {hint && (
        <div className="text-xs mt-1 truncate" style={{ color: colors.text.secondary }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function ScoreBar({ label, score, rank }: { label: string; score: number; rank: number }) {
  const pct = Math.round(score * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 text-xs">
        <span className="truncate font-medium" style={{ color: colors.text.primary }}>
          {rank}. {label}
        </span>
        <span className="tabular-nums shrink-0" style={{ color: colors.primary.DEFAULT }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.segmented.bg }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: colors.primary.DEFAULT }}
        />
      </div>
    </div>
  )
}

export function MetricsPanel({ profile }: { profile: ProfileData | null }) {
  const modelReady = useBitNetReady()
  const clickHistory = useUserInputStore((s) => s.clickHistory)
  const [fileMetrics, setFileMetrics] = useState<ModelMetricsFile | null>(null)
  const [live, setLive] = useState<LiveRecommendationMetric[]>([])
  const [inferenceMs, setInferenceMs] = useState<number | null>(null)

  useEffect(() => {
    loadModelMetrics().then(setFileMetrics)
  }, [])

  useEffect(() => {
    if (!profile || !modelReady) {
      setLive([])
      return
    }

    let cancelled = false
    const t0 = performance.now()
    recommendProducts(profile, clickHistory, 5).then((recs) => {
      if (cancelled) return
      setInferenceMs(Math.round(performance.now() - t0))
      setLive(
        recs.map((r, i) => ({
          productId: r.productId,
          productName: getProductById(r.productId)?.name ?? r.productId,
          score: r.score,
          rank: i + 1,
        })),
      )
    })

    return () => {
      cancelled = true
    }
  }, [profile, clickHistory, modelReady])

  const clickCount = Object.values(clickHistory).reduce((a, b) => a + b, 0)
  const clickedProducts = Object.keys(clickHistory).length

  return (
    <section
      className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 card-shadow animate-fade-in-up w-full"
      style={{ border: `1px solid ${colors.border}`, animationDelay: '150ms' }}
    >
      <h3 className="text-base font-semibold mb-4" style={{ color: colors.text.primary }}>
        Метрики модели
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <MetricCard
          label="Val loss"
          value={fileMetrics ? fileMetrics.val_loss.toFixed(4) : '—'}
          hint={fileMetrics ? `${fileMetrics.val_samples} выборка` : 'нет metrics.json'}
        />
        <MetricCard
          label="Precision@5"
          value={
            fileMetrics?.metrics['precision@5'] != null
              ? `${(fileMetrics.metrics['precision@5'] * 100).toFixed(1)}%`
              : '—'
          }
        />
        <MetricCard
          label="NDCG@5"
          value={
            fileMetrics?.metrics['ndcg@5'] != null
              ? fileMetrics.metrics['ndcg@5'].toFixed(3)
              : '—'
          }
        />
        <MetricCard
          label="Инференс"
          value={inferenceMs != null ? `${inferenceMs} ms` : modelReady ? '…' : '—'}
          hint="текущий профиль"
        />
        <MetricCard
          label="Клики"
          value={String(clickCount)}
          hint={`${clickedProducts} продуктов`}
        />
        {fileMetrics?.inference && (
          <MetricCard
            label="Temperature"
            value={fileMetrics.inference.temperature.toFixed(2)}
            hint={`min ${fileMetrics.inference.min_score.toFixed(2)} · Δ ${fileMetrics.inference.min_margin.toFixed(2)}`}
          />
        )}
      </div>

      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.text.muted }}>
        Вероятности топ-5 (текущий клиент)
      </h4>

      {live.length === 0 ? (
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {!modelReady ? 'Загрузка модели…' : 'Выберите профиль клиента'}
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
          {live.map((item) => (
            <ScoreBar key={item.productId} label={item.productName} score={item.score} rank={item.rank} />
          ))}
        </div>
      )}

      {fileMetrics?.updated_at && (
        <p className="text-[11px] mt-4" style={{ color: colors.text.muted }}>
          Обучение: {fileMetrics.model} · {fileMetrics.dataset} · обновлено{' '}
          {new Date(fileMetrics.updated_at).toLocaleString('ru-RU')}
        </p>
      )}
    </section>
  )
}
