export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  phone: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: UserSession
}

export interface UserSession {
  id: string
  fullName: string
  phone: string
  email: string
}
