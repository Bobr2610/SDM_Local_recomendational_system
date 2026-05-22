export interface UserProfile {
  id: string
  fullName: string
  phone: string
  email: string
  balance: number
  currency: Currency
  bonusPoints: number
  tariff: string
  registrationDate: string
}

export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  description: string
  date: string
  status: TransactionStatus
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'payment'
export type TransactionStatus = 'completed' | 'pending' | 'failed'

import type { BankProduct } from './product'

export interface DashboardData {
  profile: UserProfile
  recentTransactions: Transaction[]
  activeProducts: BankProduct[]
}
