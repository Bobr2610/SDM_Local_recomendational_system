import type { ApiRequestConfig, ApiResponse } from '../../types'
import type { UserProfile } from '../../types'

const mockUser: UserProfile = {
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

export const authMock: Record<string, (config: ApiRequestConfig) => ApiResponse<unknown>> = {
  'POST:/auth/login': () => ({
    data: { token: 'mock-jwt-token-12345', user: { id: 'user-001', fullName: 'Иван Петров', phone: '+7 (999) 123-45-67', email: 'ivan@example.com' } },
    status: 200,
  }),
  'POST:/auth/register': (config) => ({
    data: { token: 'mock-jwt-token-67890', user: { id: 'user-002', ...(config.body as Record<string, unknown>) } },
    status: 201,
  }),
  'POST:/auth/logout': () => ({
    data: null,
    status: 200,
  }),
  'GET:/auth/me': () => ({
    data: mockUser,
    status: 200,
  }),
}
