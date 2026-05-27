import { API_CONFIG } from '../config/api'
import { handleMockRequest } from './mock'
import type { ApiRequestConfig, ApiResponse } from '../types'

export class ApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  private async request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    if (API_CONFIG.USE_MOCK) {
      const mock = handleMockRequest(config)
      if (mock) return mock as ApiResponse<T>
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const token = localStorage.getItem('sdm_auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${this.baseUrl}${config.url}`, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      })

      const data = await response.json()
      return { data, status: response.status }
    } catch (error) {
      return {
        data: null as T,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  get<T>(url: string, params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<T>({ method: 'GET', url: url + query })
  }

  post<T>(url: string, body?: unknown) {
    return this.request<T>({ method: 'POST', url, body })
  }

  put<T>(url: string, body?: unknown) {
    return this.request<T>({ method: 'PUT', url, body })
  }

  patch<T>(url: string, body?: unknown) {
    return this.request<T>({ method: 'PATCH', url, body })
  }

  delete<T>(url: string) {
    return this.request<T>({ method: 'DELETE', url })
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
  }
}

export const apiClient = new ApiClient()
