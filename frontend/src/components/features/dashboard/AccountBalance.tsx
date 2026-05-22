import { Card, CardBody, CardHeader } from '../../ui'
import { formatCurrency } from '../../../utils/format'
import type { UserProfile } from '../../../types'

interface AccountBalanceProps {
  profile: UserProfile
}

export function AccountBalance({ profile }: AccountBalanceProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-gray-500">Ваш баланс</h3>
      </CardHeader>
      <CardBody>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(profile.balance, profile.currency)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Бонусные баллы</p>
            <p className="text-sm font-semibold text-gray-900">{profile.bonusPoints}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Тариф</p>
            <p className="text-sm font-semibold text-gray-900">{profile.tariff}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
