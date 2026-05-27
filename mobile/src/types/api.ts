export interface ApiResponse<T> {
  data: T
  status: number
  error?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiRequestConfig {
  method: HttpMethod
  url: string
  body?: unknown
  headers?: Record<string, string>
}
