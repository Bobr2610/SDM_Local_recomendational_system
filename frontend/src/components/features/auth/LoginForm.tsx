import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../ui'
import { useAuthStore } from '../../../store'

export function LoginForm() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ phone: '+7 (999) 123-45-67', password: 'demo123' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await login(form)
    if (localStorage.getItem('sdm_auth_token')) {
      navigate('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Номер телефона"
        type="tel"
        placeholder="+7 (999) 123-45-67"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        required
      />
      <Input
        label="Пароль"
        type="password"
        placeholder="demo123"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">Демо: +7 (999) 123-45-67 / demo123</p>
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Войти
      </Button>
    </form>
  )
}
