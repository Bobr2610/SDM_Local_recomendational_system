import { Card, CardBody, CardHeader, Button } from '../../ui'

const actions = [
  { label: 'Перевод по номеру карты', icon: '💳' },
  { label: 'Оплатить услуги', icon: '📄' },
  { label: 'Пополнить вклад', icon: '💰' },
  { label: 'Заказать справку', icon: '📋' },
  { label: 'Открыть новый продукт', icon: '➕' },
  { label: 'Заблокировать карту', icon: '🔒' },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-gray-500">Быстрые действия</h3>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="justify-start space-x-2 text-xs"
              onClick={() => console.log(`Action: ${action.label}`)}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
