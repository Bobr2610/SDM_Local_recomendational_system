import { Card, CardBody } from '../../ui'
import { useAdSelection } from '../../../hooks/useAdSelection'
import { formatCurrency } from '../../../utils/format'

const accountLabels: Record<string, string> = {
  current: 'Текущий счёт',
  savings: 'Накопительный',
  deposit: 'Депозит',
  card: 'Карта',
}

export function ProfileCard() {
  const { profile } = useAdSelection()

  return (
    <Card className="mb-6">
      <CardBody>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Мой профиль</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Счёт</span>
            <span className="font-medium text-gray-900">{accountLabels[profile.accountType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Валюта</span>
            <span className="font-medium text-gray-900">{profile.currency}</span>
          </div>
          <hr className="border-gray-100" />
          <div className="flex justify-between">
            <span className="text-gray-500">Баланс</span>
            <span className="font-bold text-blue-600">{formatCurrency(profile.balance, profile.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">В месяц</span>
            <span className="font-medium text-green-600">+{formatCurrency(profile.monthlyIncome, profile.currency)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
