/** Демо-профили: реальные мужские клиенты около p01 / p20 / p70 / p99 дохода. */
import { PORTRAITS } from './portraits'
import type { AccountType, Currency } from '../store/userInputStore'
import { colors } from './theme'
import type { ModelProfileFields } from '../utils/profileToModel'

export interface ProfileData extends ModelProfileFields {
  name: string
  age: number
  balance: number
  monthlyIncome: number
  modelIncomeEurYear: number
  accountType: AccountType
  currency: Currency
  info: string
  avatar: number
  avatarBg: [string, string]
  description: string
  characteristics: { label: string; icon: 'trend' | 'shield' | 'droplet' | 'target' | 'rocket' | 'chart' | 'phone' | 'balance' }[]
}

export const PROFILES: ProfileData[] = [
  {
    name: 'Матвей',
    age: 35,
    balance: 10625.84,
    monthlyIncome: 30359.55,
    modelIncomeEurYear: 30359.55,
    accountType: 'card',
    currency: 'EUR',
    sex: 1,
    seniorityMonths: 26,
    isNewCustomer: 0,
    segment: 'INDIVIDUALS',
    regionName: 'VALLADOLID',
    info: 'Частный клиент',
    avatar: PORTRAITS.matvey,
    avatarBg: ['#e8ecf8', '#d4dcf0'],
    description: 'Реальный профиль из нижнего квантиля дохода.',
    characteristics: [
      { label: 'Квантиль 1%', icon: 'chart' },
      { label: 'Стабильный доход', icon: 'trend' },
      { label: 'Реальный клиент', icon: 'shield' },
    ],
  },
  {
    name: 'Артем',
    age: 38,
    balance: 24522.99,
    monthlyIncome: 70065.69,
    modelIncomeEurYear: 70065.69,
    accountType: 'current',
    currency: 'EUR',
    sex: 1,
    seniorityMonths: 26,
    isNewCustomer: 0,
    segment: 'VIP',
    regionName: 'ASTURIAS',
    info: 'Премиум',
    avatar: PORTRAITS.artem,
    avatarBg: ['#f0e8f8', '#e0d4f0'],
    description: 'Реальный профиль около 20-го квантиля дохода.',
    characteristics: [
      { label: 'Квантиль 20%', icon: 'chart' },
      { label: 'Стабильный доход', icon: 'trend' },
      { label: 'Премиум-сегмент', icon: 'rocket' },
    ],
  },
  {
    name: 'Даниил',
    age: 37,
    balance: 46108.71,
    monthlyIncome: 131739.18,
    modelIncomeEurYear: 131739.18,
    accountType: 'savings',
    currency: 'EUR',
    sex: 1,
    seniorityMonths: 61,
    isNewCustomer: 0,
    segment: 'INDIVIDUALS',
    regionName: 'VALLADOLID',
    info: 'Частный клиент',
    avatar: PORTRAITS.danya,
    avatarBg: ['#fff4e6', '#fce8d4'],
    description: 'Реальный профиль около 70-го квантиля дохода.',
    characteristics: [
      { label: 'Квантиль 70%', icon: 'chart' },
      { label: 'Стабильный доход', icon: 'trend' },
      { label: 'Кредитные продукты', icon: 'shield' },
    ],
  },
  {
    name: 'Михаил',
    age: 42,
    balance: 174553.44,
    monthlyIncome: 498724.11,
    modelIncomeEurYear: 498724.11,
    accountType: 'deposit',
    currency: 'EUR',
    sex: 1,
    seniorityMonths: 189,
    isNewCustomer: 0,
    segment: 'VIP',
    regionName: 'MADRID',
    info: 'Премиум',
    avatar: PORTRAITS.mikhail,
    avatarBg: ['#e8f8ef', '#d4efe0'],
    description: 'Реальный профиль около 99-го квантиля дохода.',
    characteristics: [
      { label: 'Квантиль 99%', icon: 'chart' },
      { label: 'Высокий доход', icon: 'trend' },
      { label: 'Премиум-сегмент', icon: 'rocket' },
    ],
  },
]

export const SELECTOR_THEMES = [
  {
    wash: 'rgba(61, 95, 196, 0.08)',
    accent: colors.accent.blue.icon,
    iconBg: colors.accent.blue.bg,
  },
  {
    wash: 'rgba(124, 77, 204, 0.08)',
    accent: colors.accent.purple.icon,
    iconBg: colors.accent.purple.bg,
  },
  {
    wash: 'rgba(217, 122, 26, 0.08)',
    accent: colors.accent.orange.icon,
    iconBg: colors.accent.orange.bg,
  },
  {
    wash: 'rgba(45, 138, 92, 0.08)',
    accent: colors.accent.green.icon,
    iconBg: colors.accent.green.bg,
  },
] as const
