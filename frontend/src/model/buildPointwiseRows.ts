import { syntheticFromProfile } from './syntheticFromProfile.generated'
import type { UserFeatures } from './profileToModel'

export interface ModelMeta {
  products: string[]
  feature_names: string[]
  numeric_features: string[]
  categorical_features: string[]
}

export interface PointwiseRow {
  numeric: number[]
  categorical: string[]
}

export function buildPointwiseRows(
  profile: UserFeatures,
  meta: ModelMeta,
): PointwiseRow[] {
  const syn = syntheticFromProfile(profile.age, profile.monthlyIncome, profile.balance, profile.segment)
  const sex = profile.sex === 1 ? 'M' : 'F'
  const isNew = String(profile.isNewCustomer)
  const owned = new Set(profile.ownedProducts)

  const baseValues: Record<string, number | string> = {
    age: profile.age,
    seniority_months: profile.seniorityMonths,
    income_at_lag: profile.monthlyIncome,
    sex,
    is_new_customer: isNew,
    region_name: profile.regionName,
    segment: profile.segment,
    ...syn,
  }

  for (const productId of meta.products) {
    baseValues[`own_${productId}`] = owned.has(productId) ? 1 : 0
  }

  return meta.products.map((candidateProduct) => {
    const rowValues: Record<string, number | string> = { ...baseValues, product: candidateProduct }
    return {
      numeric: meta.numeric_features.map((featureName) => Number(rowValues[featureName] ?? 0)),
      categorical: meta.categorical_features.map((featureName) => String(rowValues[featureName] ?? '')),
    }
  })
}
