import { Card, CardBody, CardHeader, Badge } from '../../ui'
import { formatCurrency } from '../../../utils/format'
import type { Transaction } from '../../../types'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

const statusVariant = {
  completed: 'success' as const,
  pending: 'warning' as const,
  failed: 'danger' as const,
}

const typeLabels: Record<string, string> = {
  deposit: 'Пополнение',
  withdrawal: 'Снятие',
  transfer: 'Перевод',
  payment: 'Оплата',
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-gray-500">Последние операции</h3>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{typeLabels[tx.type] || tx.type}</p>
                <p className="text-xs text-gray-500">{tx.description}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                </p>
                <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
