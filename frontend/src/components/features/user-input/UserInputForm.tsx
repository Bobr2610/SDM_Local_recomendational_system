import { Card, CardBody } from '../../ui'
import { useAdSelection } from '../../../hooks/useAdSelection'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { FEATURES } from '../../../config/features'
import type { Currency, AccountType } from '../../../store/userInputStore'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'RUB', label: '₽ Рубли' },
  { value: 'USD', label: '$ Доллары' },
  { value: 'EUR', label: '€ Евро' },
  { value: 'CNY', label: '¥ Юани' },
]

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'current', label: 'Текущий счёт' },
  { value: 'savings', label: 'Накопительный' },
  { value: 'deposit', label: 'Депозит' },
  { value: 'card', label: 'Карта' },
]

export function UserInputForm() {
  const { profile, setField } = useAdSelection()
  const { track } = useAnalytics()

  if (!FEATURES.AI_ADS) return null

  return (
    <Card className="mb-6">
      <CardBody>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Настройка профиля</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Валюта</label>
            <select
              value={profile.currency}
              onChange={(e) => {
                setField('currency', e.target.value as Currency)
                track('input_change', { field: 'currency', value: e.target.value })
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {CURRENCIES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Возраст</label>
            <input
              type="number"
              min={14}
              value={profile.age}
              onChange={(e) => {
                setField('age', Number(e.target.value))
                track('input_change', { field: 'age', value: Number(e.target.value) })
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Тип счёта</label>
            <select
              value={profile.accountType}
              onChange={(e) => {
                setField('accountType', e.target.value as AccountType)
                track('input_change', { field: 'accountType', value: e.target.value })
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {ACCOUNT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Текущий баланс</label>
            <input
              type="number"
              min={0}
              value={profile.balance}
              onChange={(e) => {
                setField('balance', Number(e.target.value))
                track('input_change', { field: 'balance', value: Number(e.target.value) })
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ежемесячные поступления</label>
            <input
              type="number"
              min={0}
              value={profile.monthlyIncome}
              onChange={(e) => {
                setField('monthlyIncome', Number(e.target.value))
                track('input_change', { field: 'monthlyIncome', value: Number(e.target.value) })
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
