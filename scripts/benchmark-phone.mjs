#!/usr/bin/env node
/**
 * Build APK, install on USB device, wait for on-screen + logcat benchmark.
 *   node scripts/benchmark-phone.mjs
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const adb = join(
  process.env.LOCALAPPDATA || '',
  'Android',
  'Sdk',
  'platform-tools',
  process.platform === 'win32' ? 'adb.exe' : 'adb',
)
const pkg = 'ru.mai.sdm.bank'

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function sleep(ms) {
  spawnSync('powershell', ['-Command', `Start-Sleep -Milliseconds ${ms}`], { stdio: 'ignore' })
}

console.log('▶ Building APK…')
run(process.execPath, [join(root, 'scripts', 'build-apk.mjs')])

run(adb, ['devices'])
run(adb, ['install', '-r', join(root, 'dist', 'sdm-bank-debug.apk')])
run(adb, ['logcat', '-c'])
run(adb, ['shell', 'am', 'force-stop', pkg])
run(adb, ['shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1'])

console.log('\nWaiting for benchmark (up to 120s)…\n')
const deadline = Date.now() + 120_000
let captured = ''

while (Date.now() < deadline) {
  const r = spawnSync(adb, ['logcat', '-d', '-t', '600'], { encoding: 'utf8' })
  const out = r.stdout || ''
  if (out.includes('END BENCHMARK')) {
    captured = out
    break
  }
  sleep(2000)
}

const lines = captured
  .split(/\r?\n/)
  .filter((l) => l.includes('ReactNativeJS') && l.includes('[Benchmark]'))
  .map((l) => l.replace(/^.*ReactNativeJS:\s*/, ''))

if (lines.length === 0) {
  console.error('No [Benchmark] lines in logcat. Check USB device and open the app.')
  process.exit(1)
}

console.log('=== LOGCAT BENCHMARK ===')
for (const line of lines) console.log(line)
console.log('========================')
console.log('\nResults are also shown in the app banner at the top of Home screen.')
