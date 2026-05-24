import type { ProfileData } from './ClientSelector'
import { colors } from '../../../config/theme'

const CHAR_ICONS: Record<string, string> = {
  'Небольшой доход': '📉',
  'Молодой возраст': '🌱',
  'Активный образ': '⚡',
  'Цифровые привычки': '📱',
  'Стабильный доход': '📊',
  'Надёжный заёмщик': '🤝',
  'Сбалансированный подход': '⚖️',
  'Кредитная история есть': '📈',
  'Высокий доход': '💰',
  'Готов к риску': '🎯',
  'Развитие бизнеса': '🚀',
  'Активные инвестиции': '💹',
  'Консервативный подход': '🛡️',
  'Ликвидность актива': '💧',
  'Долгосрочные цели': '🎯',
}

function formatIncome(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M ₽`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K ₽`
  return `${n} ₽`
}

export function ClientProfile({ profile }: { profile: ProfileData }) {
  return (
    <div
      className="bg-white rounded-2xl p-6 h-full flex flex-col"
      style={{ border: `1px solid ${colors.border}`, boxShadow: colors.shadow.card }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-3 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${colors.primary.bg}, ${colors.primary.bg})` }}
        >
          {profile.emoji}
        </div>
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>{profile.name}</h2>
        <div
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full mt-1"
          style={{ background: colors.primary.bg, color: colors.primary.DEFAULT }}
        >
          <span>{profile.emoji}</span>
          <span>{profile.info}</span>
        </div>
        <div className="text-sm mt-1.5" style={{ color: colors.text.secondary }}>{profile.age} лет</div>
        <div className="flex items-center gap-1.5 mt-2 text-sm" style={{ color: colors.text.primary }}>
          <span>💼</span>
          <span className="font-medium">{formatIncome(profile.monthlyIncome)}</span>
          <span style={{ color: colors.text.muted }}>/ мес.</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full h-px my-5" style={{ background: colors.border }} />

        <p className="text-sm leading-relaxed mb-5" style={{ color: colors.text.secondary }}>
          {profile.description}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {profile.characteristics.map((ch) => (
            <div
              key={ch}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
              style={{ border: `1px solid ${colors.border}` }}
            >
              <span className="text-sm">{CHAR_ICONS[ch] ?? '•'}</span>
              <span className="text-xs font-medium" style={{ color: colors.text.primary }}>{ch}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
