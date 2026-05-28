import catboostMobile from '../../assets/model/catboost_mobile.json'
import featureOrder from '../../assets/model/feature_order.json'

export type Segment = 'INDIVIDUALS' | 'VIP' | 'STUDENTS'

export interface UserFeatures {
  age: number
  balance: number
  monthlyIncome: number
  accountType: number
  currency: number
  clicks: Record<string, number>
  seniorityMonths?: number
  isNewCustomer?: number
  sex?: number
  segment?: Segment
  segmentVip?: number
  segmentStudent?: number
  regionName?: string
}

interface SurrogateMeta {
  coef: number[]
  intercept: number
  products: string[]
  numeric_layout: {
    synthetic: string[]
    own_products: string[]
    product_one_hot: string[]
  }
}

interface MobileBundle {
  products: string[]
  surrogate: SurrogateMeta
}

const bundle = catboostMobile as unknown as MobileBundle
const productNames: string[] =
  bundle.products ?? (featureOrder as { product_names?: string[] }).product_names ?? []
let initialized = false

export function isModelLoaded(): boolean {
  return initialized && Boolean(bundle?.surrogate?.coef?.length)
}

export const isBitNetLoaded = isModelLoaded

export async function initModel(): Promise<boolean> {
  if (initialized) return isModelLoaded()
  initialized = true
  console.info('[CatBoost] Loaded mobile surrogate', productNames.length, 'products')
  return isModelLoaded()
}

export const initBitNet = initModel

function syntheticFromProfile(age: number, income: number, balance: number, segment: string): Record<string, number> {
  const segMul = segment === 'VIP' ? 1.4 : segment === 'STUDENTS' ? 0.65 : 1
  const ageMul = age < 25 ? 0.85 : age > 50 ? 1.1 : 1
  const turnover = Math.max(income, 1) * 1.15 * ageMul + balance * 0.02
  const ops = Math.min(80, Math.max(2, (turnover / 8000) * segMul))
  const activeDays = Math.min(28, Math.max(2, ops * 0.55))
  const expenses = turnover * 0.62
  return {
    synthetic_activity_score: Math.min(2.5, Math.max(0.05, (Math.log1p(turnover) / 12) * segMul)),
    synthetic_operations_cnt_30d: ops,
    synthetic_active_days_30d: activeDays,
    synthetic_expenses_30d: expenses,
    synthetic_income_30d: Math.max(income, 1),
    synthetic_turnover_30d: turnover,
    synthetic_avg_operation_size_30d: turnover / Math.max(ops, 1),
    synthetic_financial_intensity: Math.min(3, turnover / (balance + income + 1)),
    synthetic_inflow_outflow_ratio: Math.min(2.5, Math.max(0.3, income / (expenses + 1))),
    synthetic_credit_pressure: Math.min(1.5, expenses / (balance + income + 1)),
    synthetic_savings_capacity: Math.min(2, (balance + income - expenses) / (income + 1)),
    synthetic_credit_capacity: Math.min(2, Math.max(0, (income * 3 - expenses) / (income * 3 + 1))),
    synthetic_business_intensity: segment === 'VIP' && balance > 500_000 ? 0.35 : 0.08,
  }
}

function segmentFromFeatures(f: UserFeatures): string {
  if (f.segment) return f.segment
  if (f.segmentStudent) return 'STUDENTS'
  if (f.segmentVip) return 'VIP'
  if (f.accountType === 3) return 'STUDENTS'
  if (f.balance >= 1_000_000 || f.monthlyIncome >= 500_000) return 'VIP'
  return 'INDIVIDUALS'
}

function buildVector(f: UserFeatures, product: string): number[] {
  const layout = bundle.surrogate.numeric_layout
  const segment = segmentFromFeatures(f)
  const syn = syntheticFromProfile(f.age, f.monthlyIncome, f.balance, segment)
  const vec: number[] = [
    f.age,
    f.seniorityMonths ?? 24,
    f.monthlyIncome,
    f.isNewCustomer ?? 0,
  ]
  for (const key of layout.synthetic) vec.push(syn[key] ?? 0)
  for (const pid of layout.own_products) vec.push((f.clicks[pid] ?? 0) > 0 ? 1 : 0)
  vec.push((f.sex ?? 1) === 1 ? 1 : 0)
  vec.push(segment === 'VIP' ? 1 : 0)
  vec.push(segment === 'STUDENTS' ? 1 : 0)
  for (const pid of layout.product_one_hot) vec.push(pid === product ? 1 : 0)
  return vec
}

function scoreProduct(f: UserFeatures, product: string): number {
  const { coef, intercept } = bundle.surrogate
  const vec = buildVector(f, product)
  let dot = intercept
  for (let i = 0; i < coef.length && i < vec.length; i++) dot += coef[i] * vec[i]
  return 1 / (1 + Math.exp(-dot))
}

export function getProductIndex(productId: string): number {
  return productNames.indexOf(productId)
}

export function getProductId(modelIndex: number): string | null {
  return productNames[modelIndex] ?? null
}

export function predict(f: UserFeatures): Float32Array {
  const products = productNames
  const scores = new Float32Array(products.length)
  for (let i = 0; i < products.length; i++) scores[i] = scoreProduct(f, products[i])
  return scores
}

export function personalize(scores: Float32Array, clicks: Record<string, number>): Float32Array {
  const adj = new Float32Array(scores)
  for (const [id, count] of Object.entries(clicks)) {
    const idx = getProductIndex(id)
    if (idx >= 0 && idx < adj.length) adj[idx] += 0.05 * Math.min(count, 20)
  }
  return adj
}

export function getTopKUniqueProductIds(scores: Float32Array, k = 5): string[] {
  const sorted = Array.from(scores)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
  const seen = new Set<string>()
  const ids: string[] = []
  for (const { i } of sorted) {
    const id = getProductId(i)
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length >= k) break
  }
  return ids
}
