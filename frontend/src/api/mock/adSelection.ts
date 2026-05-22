import type { ApiRequestConfig, ApiResponse, AdSelectionResponse } from '../../types'

const AD_TEMPLATES: Array<{ title: string; subtitle: string; link: string }> = [
  { title: 'Вклад «Идеальный баланс»', subtitle: 'Ставка до 14,30% — от 50 000 ₽', link: '/products?category=deposits_individuals' },
  { title: 'MIR SUPREME Платиновая', subtitle: 'Премиум-карта с VIP-доступом', link: '/products?category=debit_cards' },
  { title: 'Потребительский кредит', subtitle: 'До 3 млн ₽ от 24% годовых', link: '/products?category=loans_individuals' },
  { title: 'Ипотека', subtitle: 'До 20 млн ₽ на 25 лет от 18,9%', link: '/products?category=loans_individuals' },
  { title: 'Автокредит', subtitle: 'До 6 млн ₽ от 22% годовых', link: '/products?category=loans_individuals' },
  { title: 'МИР Привилегия Классическая', subtitle: 'До 6% на остаток — 0 ₽ обслуживание', link: '/products?category=debit_cards' },
  { title: 'РКО «Стартовый»', subtitle: '0 ₽/мес первые 2 месяца', link: '/products?category=rko_business' },
  { title: '«СДМ-Вклад»', subtitle: 'До 14,15% от 50 000 ₽', link: '/products?category=deposits_individuals' },
  { title: 'Депозит «Оперативный плюс»', subtitle: 'Для бизнеса от 5 млн ₽', link: '/products?category=deposits_business' },
  { title: 'Факторинг для маркетплейсов', subtitle: 'Финансирование до 50 млн ₽', link: '/products?category=business_services' },
]

export const adSelectionMock: Record<string, (config: ApiRequestConfig) => ApiResponse<unknown>> = {
  'POST:/ads/ai-select': (config) => {
    const body = config.body as { age: number; balance: number } | undefined
    const age = body?.age ?? 30
    const balance = body?.balance ?? 100000

    let adIdx: number
    let reason: string

    if (age < 25 && balance < 50000) {
      adIdx = 5
      reason = 'Молодой возраст + скромный бюджет: дебетовая карта с кэшбеком'
    } else if (age < 25 && balance >= 50000) {
      adIdx = 2
      reason = 'Молодой возраст + хороший бюджет: потребительский кредит на развитие'
    } else if (age >= 25 && age < 45 && balance >= 200000) {
      adIdx = 3
      reason = 'Средний возраст + высокий доход: ипотека'
    } else if (age >= 45 && balance >= 500000) {
      adIdx = 0
      reason = 'Зрелый возраст + крупная сумма: выгодный вклад'
    } else if (age >= 45 && balance < 500000) {
      adIdx = 7
      reason = 'Зрелый возраст + сбережения: стабильный вклад'
    } else if (balance >= 1000000) {
      adIdx = 8
      reason = 'Крупный капитал: депозит для бизнеса'
    } else if (age >= 25 && age < 45) {
      adIdx = 4
      reason = 'Средний возраст: автокредит'
    } else {
      adIdx = 0
      reason = 'Универсальное предложение: выгодный вклад'
    }

    const template = AD_TEMPLATES[adIdx]
    const response: AdSelectionResponse = {
      adId: `ai-ad-${adIdx}`,
      title: template.title,
      subtitle: template.subtitle,
      link: template.link,
      reason,
      confidence: 0.75 + Math.random() * 0.2,
    }

    return { data: response, status: 200 }
  },
}
