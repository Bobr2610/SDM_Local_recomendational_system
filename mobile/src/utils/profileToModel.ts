import type { AccountType, Currency } from '../store/userInputStore'
import type { UserFeatures } from '../services/modelInference'

export type Segment = 'INDIVIDUALS' | 'VIP' | 'STUDENTS'

/** Поля профиля, которые ожидает CatBoost (без конвертации валюты). */
export interface ModelProfileFields {
  sex: 0 | 1
  seniorityMonths: number
  isNewCustomer: 0 | 1
  segment: Segment
  regionName: string
}

export interface ProfileForModel extends ModelProfileFields {
  age: number
  balance: number
  monthlyIncome: number
  accountType: AccountType
  currency: Currency
}

const CURRENCY_MAP: Record<Currency, number> = { RUB: 0, USD: 1, EUR: 2, CNY: 3 }
const ACCOUNT_MAP: Record<AccountType, number> = { current: 0, savings: 1, deposit: 2, card: 3 }

export function inferSeniorityMonths(age: number, isNewCustomer: boolean): number {
  if (isNewCustomer) return Math.min(24, Math.max(3, Math.round((age - 18) * 2)))
  return Math.min(360, Math.max(12, Math.round((age - 20) * 6)))
}

export function profileToUserFeatures(
  profile: ProfileForModel,
  clicks: Record<string, number> = {},
): UserFeatures {
  const segment = profile.segment
  return {
    age: profile.age,
    balance: profile.balance,
    monthlyIncome: profile.monthlyIncome,
    accountType: ACCOUNT_MAP[profile.accountType] ?? 0,
    currency: CURRENCY_MAP[profile.currency] ?? 0,
    clicks,
    sex: profile.sex,
    seniorityMonths: profile.seniorityMonths,
    isNewCustomer: profile.isNewCustomer,
    segment,
    segmentVip: segment === 'VIP' ? 1 : 0,
    segmentStudent: segment === 'STUDENTS' ? 1 : 0,
    regionName: profile.regionName,
  }
}
