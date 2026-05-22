import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../ui'
import { useAuthStore } from '../../../store'

export function RegisterForm() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await register(form)
    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="ФИО"
        placeholder="Иванов Иван Иванович"
        value={form.fullName}
        onChange={(e) => { setForm({ ...form, fullName: e.target.value }); clearError() }}
        required
      />
      <Input
        label="Номер телефона"
        type="tel"
        placeholder="+7 (999) 123-45-67"
        value={form.phone}
        onChange={(e) => { setForm({ ...form, phone: e.target.value }); clearError() }}
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="ivan@example.com"
        value={form.email}
        onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError() }}
        required
      />
      <Input
        label="Пароль"
        type="password"
        placeholder="Минимум 8 символов"
        value={form.password}
        onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError() }}
        required
        minLength={8}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Зарегистрироваться
      </Button>
    </form>
  )
}
