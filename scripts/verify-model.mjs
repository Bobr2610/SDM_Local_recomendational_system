#!/usr/bin/env node
/** Verify model files for web (Vite) and Expo (mobile bundle). */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const web = join(root, 'frontend', 'public', 'model')
const mobile = join(root, 'mobile', 'assets', 'model')
const required = ['catboost_mobile.json', 'feature_order.json']

let ok = true

function check(dir, label) {
  console.log(`\n${label}: ${dir}`)
  if (!existsSync(dir)) {
    console.log('  (missing dir)')
    ok = false
    return
  }
  for (const f of required) {
    const p = join(dir, f)
    if (!existsSync(p)) {
      console.log(`  ✖ ${f}`)
      ok = false
    } else {
      console.log(`  ✓ ${f} (${Math.round(statSync(p).size / 1024)} KB)`)
    }
  }
  const manifest = join(dir, 'model_manifest.json')
  if (existsSync(manifest)) {
    const m = JSON.parse(readFileSync(manifest, 'utf8'))
    console.log(`  ✓ model_manifest.json (${Object.keys(m.files || {}).length} files)`)
  }
}

check(web, 'Web (frontend/public/model)')
check(mobile, 'Expo bundle (mobile/assets/model)')

process.exit(ok ? 0 : 1)
