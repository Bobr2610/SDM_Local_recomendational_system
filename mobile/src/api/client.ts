import { API_CONFIG } from '../config/api'
import type { ApiRequestConfig, ApiResponse } from '../types/api'

export class ApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  private async request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)
    try {
      const response = await fetch(`${this.baseUrl}${config.url}`, {
        method: config.method,
        headers: { 'Content-Type': 'application/json', ...config.headers },
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

  get<T>(url: string) {
    return this.request<T>({ method: 'GET', url })
  }

  post<T>(url: string, body?: unknown) {
    return this.request<T>({ method: 'POST', url, body })
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
  }
}

export const apiClient = new ApiClient()
