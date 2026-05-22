import { apiClient } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'
import type { DashboardData, UserProfile, Transaction } from '../types'
import type { BankProduct } from '../types'
import type { AdSelectionRequest, AdSelectionResponse } from '../types'
import type { AnalyticsEvent } from '../types'

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => apiClient.post<AuthResponse>('/auth/register', data),
  logout: () => apiClient.post<void>('/auth/logout'),
  me: () => apiClient.get<UserProfile>('/auth/me'),
}

export const userApi = {
  getProfile: () => apiClient.get<UserProfile>('/user/profile'),
  getDashboard: () => apiClient.get<DashboardData>('/user/dashboard'),
  getTransactions: (page = 1) => apiClient.get<Transaction[]>(`/user/transactions?page=${page}`),
}

export const productsApi = {
  getAll: () => apiClient.get<BankProduct[]>('/products'),
  getByCategory: (category: string) => apiClient.get<BankProduct[]>(`/products?category=${category}`),
  getRecommendations: () => apiClient.get<BankProduct[]>('/products/recommendations'),
}

export const adsApi = {
  select: (data: AdSelectionRequest) => apiClient.post<AdSelectionResponse>('/ads/ai-select', data),
}

export const analyticsApi = {
  track: (event: AnalyticsEvent) => apiClient.post<void>('/analytics/event', event),
}

export const healthApi = {
  check: () => apiClient.get<{ status: string }>('/health'),
}
