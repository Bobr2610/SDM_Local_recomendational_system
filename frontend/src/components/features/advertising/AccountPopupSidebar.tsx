import { useState } from 'react'
import { useUserInputStore } from '../../../store'
import { PROFILES, type ProfileData } from './ClientSelector'

const PROFILE_EMOJI: Record<string, string> = {
  Матвей: '🎓',
  Артем: '💼',
  Даня: '🚀',
  Михаил: '🏦',
}

function formatBalance(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M ₽`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K ₽`
  return `${n} ₽`
}

export function AccountPopupSidebar() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const setField = useUserInputStore((s) => s.setField)

  const handleSelect = (profile: ProfileData, idx: number) => {
    setField('age', profile.age)
    setField('balance', profile.balance)
    setField('monthlyIncome', profile.monthlyIncome)
    setField('accountType', profile.accountType)
    setField('currency', profile.currency)
    setField('fullName', profile.name)
    setField('sex', profile.sex)
    setField('seniorityMonths', profile.seniorityMonths)
    setField('isNewCustomer', profile.isNewCustomer)
    setField('segment', profile.segment)
    setField('regionName', profile.regionName)
    setSelectedIdx(idx)
  }

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">Выберите профиль</h3>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {PROFILES.map((profile, idx) => (
          <button
            key={profile.name}
            onClick={() => handleSelect(profile, idx)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
              selectedIdx === idx
                ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-xl sm:text-2xl">{PROFILE_EMOJI[profile.name] ?? '👤'}</span>
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-xs sm:text-sm">{profile.name}</div>
              <div className="text-xs text-gray-500">
                {profile.info} · {formatBalance(profile.balance)} · {profile.age} лет
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
