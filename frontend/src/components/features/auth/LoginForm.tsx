import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../ui'
import { useAuthStore } from '../../../store'

export function LoginForm() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ phone: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(form)
    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Номер телефона"
        type="tel"
        placeholder="+7 (999) 123-45-67"
        value={form.phone}
        onChange={(e) => { setForm({ ...form, phone: e.target.value }); clearError() }}
        required
      />
      <Input
        label="Пароль"
        type="password"
        placeholder="Введите пароль"
        value={form.password}
        onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError() }}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Войти
      </Button>
    </form>
  )
}
