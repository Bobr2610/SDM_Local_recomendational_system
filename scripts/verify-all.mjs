#!/usr/bin/env node
/**
 * Full smoke verification (no device required).
 * Run: node scripts/verify-all.mjs
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const py = join(root, '.venv', 'Scripts', 'python.exe')
const pyUnix = join(root, '.venv', 'bin', 'python')
const python = existsSync(py) ? py : pyUnix

function run(label, cmd, args, opts = {}) {
  console.log(`\n▶ ${label}`)
  const r = spawnSync(cmd, args, { cwd: opts.cwd ?? root, stdio: 'inherit', shell: false })
  if (r.status !== 0) {
    console.error(`✖ ${label} failed (exit ${r.status})`)
    process.exit(r.status ?? 1)
  }
  console.log(`✓ ${label}`)
}

// 1. Model bundle
run('Model bundle', process.execPath, [join(root, 'scripts', 'verify-model.mjs')])

// 2. Python inference
if (!existsSync(python)) {
  console.error('✖ Python venv not found. Run: python -m venv .venv && pip install -r backend/requirements.txt')
  process.exit(1)
}
run('CatBoost pkl + JSON', python, [join(root, 'backend', 'scripts', 'verify_inference.py')])

// 3. Frontend build
{
  console.log('\n▶ Frontend build')
  const r = spawnSync('npm', ['run', 'build'], { cwd: join(root, 'frontend'), stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
  console.log('✓ Frontend build')
}

// 4. Mobile types
{
  console.log('\n▶ Mobile TypeScript')
  const r = spawnSync('npx', ['tsc', '--noEmit'], { cwd: join(root, 'mobile'), stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
  console.log('✓ Mobile TypeScript')
}

// 5. Surrogate sanity (parse JSON, check dimensions)
const mobile = JSON.parse(readFileSync(join(root, 'frontend', 'public', 'model', 'catboost_mobile.json'), 'utf8'))
const { coef, intercept, products } = mobile.surrogate
if (!coef?.length || products.length < 10) {
  console.error('✖ Invalid catboost_mobile.json surrogate')
  process.exit(1)
}
console.log(`\n✓ Surrogate: ${products.length} products, ${coef.length} coef, intercept=${intercept}`)

console.log('\n=== ALL CHECKS PASSED ===\n')
