import type { Currency, AccountType } from '../../../store/userInputStore'

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
    characteristics: ['Низкий доход', 'Молодой', 'Активный', 'Цифровой'],
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
    characteristics: ['Стабильный доход', 'Семейный', 'Сбалансированный', 'Кредитная история'],
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
    characteristics: ['Высокий доход', 'Рисковый', 'Развитие', 'Инвестиции'],
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
    characteristics: ['Высокий доход', 'Консервативный', 'Нужна ликвидность', 'Долгосрочные цели'],
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
      {PROFILES.map((p, idx) => (
        <button
          key={p.name}
          onClick={() => onSelect(idx)}
          className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-2xl shrink-0">
              {p.emoji}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-lg">{p.name}</div>
              <div className="text-sm text-gray-500">{p.info}, {p.age} лет</div>
              <div className="text-sm text-gray-400">Доход {formatIncome(p.monthlyIncome)} ₽ / мес.</div>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            selectedIdx === idx ? 'border-blue-600' : 'border-gray-300'
          }`}>
            {selectedIdx === idx && <div className="w-3 h-3 rounded-full bg-blue-600" />}
          </div>
        </button>
      ))}
    </div>
  )
}
