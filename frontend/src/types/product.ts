export interface BankProduct {
  id: string
  name: string
  description: string
  category: ProductCategory
  icon?: string
  profitScore?: number
}

export type ProductCategory =
  | 'deposits_individuals'
  | 'loans_individuals'
  | 'debit_cards'
  | 'rko_business'
  | 'deposits_business'
  | 'business_services'

export interface ProductCategoryGroup {
  category: ProductCategory
  title: string
  icon: string
  products: BankProduct[]
}

export interface Recommendation {
  product: BankProduct
  relevanceScore: number
  reason: string
}
