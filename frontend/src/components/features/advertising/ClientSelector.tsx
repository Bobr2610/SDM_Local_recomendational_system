import type { Currency, AccountType } from '../../../store/userInputStore'
import { colors } from '../../../config/theme'

export interface ProfileData {
  name: string
  age: number
  balance: number
  monthlyIncome: number
  accountType: AccountType
  currency: Currency
  info: string
  emoji: string
  description: string
  characteristics: string[]
}

export const PROFILES: ProfileData[] = [
  {
    name: 'Матвей',
    age: 20,
    balance: 15000,
    monthlyIncome: 15000,
    accountType: 'card',
    currency: 'RUB',
    info: 'Студент',
    emoji: '🎓',
    description: 'Молодой студент. Предпочитает современные цифровые решения.',
    characteristics: ['Небольшой доход', 'Молодой возраст', 'Активный образ', 'Цифровые привычки'],
  },
  {
    name: 'Артем',
    age: 35,
    balance: 350000,
    monthlyIncome: 120000,
    accountType: 'current',
    currency: 'RUB',
    info: 'Менеджер',
    emoji: '💼',
    description: 'Уверенный профессионал. Ценит баланс между доходом и надежностью.',
    characteristics: ['Стабильный доход', 'Надёжный заёмщик', 'Сбалансированный подход', 'Кредитная история есть'],
  },
  {
    name: 'Даня',
    age: 28,
    balance: 1500000,
    monthlyIncome: 350000,
    accountType: 'savings',
    currency: 'RUB',
    info: 'Предприниматель',
    emoji: '🚀',
    description: 'Активный предприниматель. Ищет возможности для роста капитала.',
    characteristics: ['Высокий доход', 'Готов к риску', 'Развитие бизнеса', 'Активные инвестиции'],
  },
  {
    name: 'Миша',
    age: 55,
    balance: 5000000,
    monthlyIncome: 500000,
    accountType: 'deposit',
    currency: 'RUB',
    info: 'Топ-менеджер',
    emoji: '🏦',
    description: 'Опытный управленец с высоким доходом. Ценит надежность и сохранность капитала.',
    characteristics: ['Высокий доход', 'Консервативный подход', 'Ликвидность актива', 'Долгосрочные цели'],
  },
]

function formatIncome(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return `${n}`
}

export function ClientSelector({
  selectedIdx,
  onSelect,
}: {
  selectedIdx: number
  onSelect: (idx: number) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {PROFILES.map((p, idx) => {
        const active = selectedIdx === idx
        return (
          <button
            key={p.name}
            onClick={() => onSelect(idx)}
            className="rounded-2xl p-5 flex items-center justify-between transition-all cursor-pointer"
            style={{
              background: active ? colors.primary.bgLight : colors.surface,
              border: active ? `2px solid ${colors.primary.DEFAULT}` : `1px solid ${colors.border}`,
              boxShadow: active ? colors.shadow.card : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.borderColor = colors.primary.light
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.borderColor = colors.border
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-13 h-13 rounded-full flex items-center justify-center text-2xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${colors.primary.bg}, ${colors.primary.bg})` }}
              >
                {p.emoji}
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg" style={{ color: colors.text.primary }}>{p.name}</div>
                <div className="text-sm" style={{ color: colors.text.secondary }}>{p.info}, {p.age} лет</div>
                <div className="text-sm" style={{ color: colors.text.muted }}>Доход {formatIncome(p.monthlyIncome)} ₽ / мес.</div>
              </div>
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: active ? colors.primary.DEFAULT : colors.border }}
            >
              {active && <div className="w-3 h-3 rounded-full" style={{ background: colors.primary.DEFAULT }} />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
