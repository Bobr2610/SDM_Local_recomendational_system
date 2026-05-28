import { PORTRAITS } from './portraits'
import type { AccountType, Currency } from '../store/userInputStore'
import { colors } from './theme'
import type { ModelProfileFields } from '../utils/profileToModel'

export interface ProfileData extends ModelProfileFields {
  name: string
  age: number
  balance: number
  monthlyIncome: number
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
    age: 20,
    balance: 15000,
    monthlyIncome: 15000,
    accountType: 'card',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 6,
    isNewCustomer: 1,
    segment: 'STUDENTS',
    regionName: 'MADRID',
    info: 'Студент',
    avatar: PORTRAITS.matvey,
    avatarBg: ['#e8ecf8', '#d4dcf0'],
    description: 'Молодой студент. Предпочитает современные цифровые решения.',
    characteristics: [
      { label: 'Небольшой доход', icon: 'chart' },
      { label: 'Молодой возраст', icon: 'rocket' },
      { label: 'Активный образ', icon: 'trend' },
      { label: 'Цифровые привычки', icon: 'phone' },
    ],
  },
  {
    name: 'Артем',
    age: 35,
    balance: 350000,
    monthlyIncome: 120000,
    accountType: 'current',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 72,
    isNewCustomer: 0,
    segment: 'INDIVIDUALS',
    regionName: 'MADRID',
    info: 'Менеджер',
    avatar: PORTRAITS.artem,
    avatarBg: ['#f0e8f8', '#e0d4f0'],
    description: 'Уверенный профессионал. Ценит баланс между доходом и надежностью.',
    characteristics: [
      { label: 'Стабильный доход', icon: 'trend' },
      { label: 'Надёжный заёмщик', icon: 'shield' },
      { label: 'Сбалансированный', icon: 'balance' },
      { label: 'Кредитная история', icon: 'chart' },
    ],
  },
  {
    name: 'Даня',
    age: 28,
    balance: 1500000,
    monthlyIncome: 350000,
    accountType: 'savings',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 48,
    isNewCustomer: 0,
    segment: 'VIP',
    regionName: 'BARCELONA',
    info: 'Предприниматель',
    avatar: PORTRAITS.danya,
    avatarBg: ['#fff4e6', '#fce8d4'],
    description: 'Активный предприниматель. Ищет возможности для роста капитала.',
    characteristics: [
      { label: 'Высокий доход', icon: 'trend' },
      { label: 'Готов к риску', icon: 'target' },
      { label: 'Развитие бизнеса', icon: 'rocket' },
      { label: 'Активные инвестиции', icon: 'chart' },
    ],
  },
  {
    name: 'Михаил',
    age: 55,
    balance: 5000000,
    monthlyIncome: 5000000,
    accountType: 'deposit',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 180,
    isNewCustomer: 0,
    segment: 'VIP',
    regionName: 'VALENCIA',
    info: 'Топ-менеджер',
    avatar: PORTRAITS.mikhail,
    avatarBg: ['#e8f8ef', '#d4efe0'],
    description: 'Опытный управленец с высоким доходом. Ценит надежность и сохранность капитала.',
    characteristics: [
      { label: 'Высокий доход', icon: 'trend' },
      { label: 'Консервативный', icon: 'shield' },
      { label: 'Нужна ликвидность', icon: 'droplet' },
      { label: 'Долгосрочные цели', icon: 'target' },
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
