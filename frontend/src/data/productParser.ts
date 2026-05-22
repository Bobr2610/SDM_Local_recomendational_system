import rawData from './ad-products.json'
import type { BankProduct, ProductCategoryGroup, ProductCategory } from '../types'

export type AdProduct = BankProduct & {
  image: string
  showOnHome: boolean
  color: string
}

interface RawItem {
  id: string
  name: string
  description: string
  image: string
  showOnHome: boolean
  color: string
}

const CATEGORY_META: Record<string, { title: string; icon: string }> = {
  deposits_and_savings_accounts_individuals: { title: 'Вклады и сбережения', icon: '🏦' },
  loans_individuals:                         { title: 'Кредиты',          icon: '💳' },
  debit_cards:                               { title: 'Дебетовые карты',  icon: '💳' },
  rko_business_packages:                     { title: 'РКО для бизнеса',  icon: '🏢' },
  deposits_business:                         { title: 'Депозиты бизнеса', icon: '🏛️' },
  additional_business_services:              { title: 'Доп. услуги',      icon: '📋' },
}

const data = rawData as Record<string, RawItem[]>

// ─── парсер JSON → продукт ───

function parseProduct(raw: RawItem, category: string): AdProduct {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    category: category as ProductCategory,
    image: raw.image,
    showOnHome: raw.showOnHome,
    color: raw.color,
  }
}

// ─── API ───

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

export function getCategories(): ProductCategoryGroup[] {
  const products = getAllProducts()
  return Object.keys(CATEGORY_META).map((key) => ({
    category: key as ProductCategory,
    title: CATEGORY_META[key].title,
    icon: CATEGORY_META[key].icon,
    products: products.filter((p) => p.category === key),
  }))
}

export function getProductsByCategory(category: ProductCategory): AdProduct[] {
  return getAllProducts().filter((p) => p.category === category)
}
