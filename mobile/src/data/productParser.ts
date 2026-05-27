import rawData from './ad-products.json'

export type ProductCategory =
  | 'deposits_and_savings_accounts_individuals'
  | 'loans_individuals'
  | 'debit_cards'
  | 'rko_business_packages'
  | 'deposits_business'
  | 'additional_business_services'

export interface BankProduct {
  id: string
  name: string
  description: string
  category: ProductCategory
  image: string
}

export type AdProduct = BankProduct & { showOnHome: boolean }

interface RawItem {
  id: string
  name: string
  description: string
  image: string
  showOnHome: boolean
}

function parseProduct(raw: RawItem, category: string): AdProduct {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    category: category as ProductCategory,
    image: raw.image,
    showOnHome: raw.showOnHome,
  }
}

const data = rawData as Record<string, RawItem[]>

export function getAllProducts(): AdProduct[] {
  const all: AdProduct[] = []
  for (const cat of Object.keys(data)) {
    for (const p of data[cat]) {
      all.push(parseProduct(p, cat))
    }
  }
  return all
}

export function getHomeAdProducts(): AdProduct[] {
  return getAllProducts().filter((p) => p.showOnHome)
}

export function getProductById(id: string): AdProduct | undefined {
  return getAllProducts().find((p) => p.id === id)
}

export const CATEGORY_LABELS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: 'Вклад',
  loans_individuals: 'Кредит',
  debit_cards: 'Карта',
  rko_business_packages: 'РКО',
  deposits_business: 'Депозит',
  additional_business_services: 'Услуга',
}
