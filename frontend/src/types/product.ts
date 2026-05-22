export interface BankProduct {
  id: string
  name: string
  description: string
  category: ProductCategory
  icon?: string
  profitScore?: number
}

export type ProductCategory =
  | 'deposits_and_savings_accounts_individuals'
  | 'loans_individuals'
  | 'debit_cards'
  | 'rko_business_packages'
  | 'deposits_business'
  | 'additional_business_services'

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
