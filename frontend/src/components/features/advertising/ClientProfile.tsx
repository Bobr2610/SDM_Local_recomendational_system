import type { ProfileData } from './ClientSelector'

const CHAR_ICONS: Record<string, string> = {
  'Низкий доход': '📉',
  'Молодой': '🌱',
  'Активный': '⚡',
  'Цифровой': '📱',
  'Стабильный доход': '📊',
  'Семейный': '👨‍👩‍👧‍👧',
  'Сбалансированный': '⚖️',
  'Кредитная история': '📈',
  'Высокий доход': '💰',
  'Рисковый': '🎯',
  'Развитие': '🚀',
  'Инвестиции': '💹',
  'Консервативный': '🛡️',
  'Нужна ликвидность': '💧',
  'Долгосрочные цели': '🎯',
}

function formatIncome(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M ₽`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K ₽`
  return `${n} ₽`
}

export function ClientProfile({ profile }: { profile: ProfileData }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-5xl mb-4 shadow-sm">
          {profile.emoji}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mt-1">
          <span>{profile.emoji}</span>
          <span>{profile.info}</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">{profile.age} лет</div>
        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-700">
          <span>💼</span>
          <span className="font-medium">{formatIncome(profile.monthlyIncome)}</span>
          <span className="text-gray-400">/ мес.</span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-100 mb-6" />

      <p className="text-sm text-gray-600 leading-relaxed mb-6">
        {profile.description}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {profile.characteristics.map((ch) => (
          <div
            key={ch}
            className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-3"
          >
            <span className="text-base">{CHAR_ICONS[ch] ?? '•'}</span>
            <span className="text-sm text-gray-700">{ch}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
