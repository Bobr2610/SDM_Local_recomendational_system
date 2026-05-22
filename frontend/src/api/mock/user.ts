import type { ApiRequestConfig, ApiResponse, UserProfile, Transaction, DashboardData } from '../../types'

const mockProfile: UserProfile = {
  id: 'user-001',
  fullName: 'Иван Петров',
  phone: '+7 (999) 123-45-67',
  email: 'ivan@example.com',
  balance: 2458900.50,
  currency: 'RUB',
  bonusPoints: 1250,
  tariff: 'Пакет «Оптимальный»',
  registrationDate: '2024-01-15',
}

const mockTransactions: Transaction[] = [
  { id: 'tx-1', type: 'deposit', amount: 50000, currency: 'RUB', description: 'Пополнение через банкомат', date: '2026-05-20T10:30:00', status: 'completed' },
  { id: 'tx-2', type: 'withdrawal', amount: 15000, currency: 'RUB', description: 'Снятие наличных', date: '2026-05-19T14:20:00', status: 'completed' },
  { id: 'tx-3', type: 'transfer', amount: 25000, currency: 'RUB', description: 'Перевод на карту', date: '2026-05-18T09:15:00', status: 'completed' },
  { id: 'tx-4', type: 'payment', amount: 8500, currency: 'RUB', description: 'Оплата мобильной связи', date: '2026-05-17T11:45:00', status: 'completed' },
  { id: 'tx-5', type: 'deposit', amount: 120000, currency: 'RUB', description: 'Зарплата', date: '2026-05-15T08:00:00', status: 'completed' },
]

const activeProducts = [
  { id: 'dep-1', name: 'Вклад «Идеальный баланс»', description: 'Краткосрочный вклад', category: 'deposits_individuals' as const },
  { id: 'card-2', name: 'МИР Привилегия (Классическая)', description: 'Дебетовая карта', category: 'debit_cards' as const },
]

export const userMock: Record<string, (config: ApiRequestConfig) => ApiResponse<unknown>> = {
  'GET:/user/profile': () => ({
    data: mockProfile,
    status: 200,
  }),
  'GET:/user/dashboard': () => ({
    data: { profile: mockProfile, recentTransactions: mockTransactions, activeProducts } as DashboardData,
    status: 200,
  }),
  'GET:/user/transactions?page=1': () => ({
    data: mockTransactions,
    status: 200,
  }),
}
