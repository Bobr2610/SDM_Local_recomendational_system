#!/usr/bin/env node
/**
 * Phone-only: model in Expo bundle + offline scoring (same math as mobile app).
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bundlePath = join(root, 'mobile', 'assets', 'model', 'catboost_mobile.json')
const featurePath = join(root, 'mobile', 'assets', 'model', 'feature_order.json')

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

function syntheticFromProfile(age, income, balance, segment) {
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

function segmentFromFeatures(f) {
  if (f.segment) return f.segment
  if (f.segmentStudent) return 'STUDENTS'
  if (f.segmentVip) return 'VIP'
  if (f.accountType === 3) return 'STUDENTS'
  if (f.balance >= 1_000_000 || f.monthlyIncome >= 500_000) return 'VIP'
  return 'INDIVIDUALS'
}

function buildVector(bundle, f, product) {
  const layout = bundle.surrogate.numeric_layout
  const segment = segmentFromFeatures(f)
  const syn = syntheticFromProfile(f.age, f.monthlyIncome, f.balance, segment)
  const vec = [f.age, f.seniorityMonths ?? 24, f.monthlyIncome, f.isNewCustomer ?? 0]
  for (const key of layout.synthetic) vec.push(syn[key] ?? 0)
  for (const pid of layout.own_products) vec.push((f.clicks[pid] ?? 0) > 0 ? 1 : 0)
  vec.push((f.sex ?? 1) === 1 ? 1 : 0)
  vec.push(segment === 'VIP' ? 1 : 0)
  vec.push(segment === 'STUDENTS' ? 1 : 0)
  for (const pid of layout.product_one_hot) vec.push(pid === product ? 1 : 0)
  return vec
}

function scoreProduct(bundle, f, product) {
  const { coef, intercept } = bundle.surrogate
  const vec = buildVector(bundle, f, product)
  let dot = intercept
  for (let i = 0; i < coef.length && i < vec.length; i++) dot += coef[i] * vec[i]
  return sigmoid(dot)
}

function predictTop(bundle, f, k = 3) {
  const products = bundle.surrogate.products
  const scored = products.map((p) => [p, scoreProduct(bundle, f, p)])
  scored.sort((a, b) => b[1] - a[1])
  return scored.slice(0, k)
}

if (!existsSync(bundlePath)) {
  console.error('✖ Missing', bundlePath)
  process.exit(1)
}

const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'))
const features = JSON.parse(readFileSync(featurePath, 'utf8'))
console.log('Phone bundle OK:', bundlePath)
console.log('  products:', bundle.surrogate.products.length)
console.log('  feature_order:', features.product_names?.length ?? 0)

const profile = {
  age: 20,
  balance: 15000,
  monthlyIncome: 15000,
  accountType: 3,
  seniorityMonths: 6,
  isNewCustomer: 1,
  sex: 1,
  segment: 'STUDENTS',
  clicks: {},
}

const top = predictTop(bundle, profile, 5)
console.log('\nOffline recommendations (student profile):')
for (const [id, score] of top) {
  console.log(`  ${id}: ${score.toFixed(4)}`)
}

if (top.length === 0 || top[0][1] <= 0) {
  console.error('✖ Model returned empty/zero scores')
  process.exit(1)
}

console.log('\n✓ Phone model responds offline (no API required)')
