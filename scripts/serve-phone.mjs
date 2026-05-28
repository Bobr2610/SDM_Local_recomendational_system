#!/usr/bin/env node
/**
 * Быстрый запуск на телефоне через браузер (без APK / без Android Studio).
 * Телефон и ПК в одной Wi-Fi → откройте URL на телефоне.
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { networkInterfaces } from 'node:os'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const frontend = join(root, 'frontend')
const isWin = process.platform === 'win32'

function detectLanIp() {
  const candidates = []
  for (const name of Object.keys(networkInterfaces())) {
    if (/vmware|virtual|vethernet|loopback/i.test(name)) continue
    for (const net of networkInterfaces()[name] ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue
      if (!net.address.startsWith('192.168.') && !net.address.startsWith('10.')) continue
      candidates.push({ name, address: net.address })
    }
  }
  if (!candidates.length) throw new Error('Нет Wi-Fi IP. Подключите ПК и телефон к одной сети.')
  return (candidates.find((c) => /wi-?fi|wlan/i.test(c.name)) ?? candidates[0]).address
}

function main() {
  const ip = detectLanIp()
  const apiUrl = `http://${ip}:8000/api`
  const appUrl = `http://${ip}:5173`

  writeFileSync(
    join(frontend, '.env.local'),
    `VITE_API_BASE_URL=${apiUrl}\nVITE_USE_MOCK=false\nVITE_USE_LOCAL_MODEL=true\n`,
    'utf8',
  )

  console.log('\n════════════════════════════════════════')
  console.log('  SDM — откройте на телефоне в браузере:')
  console.log(`\n  ${appUrl}`)
  console.log('\n  API:', apiUrl)
  console.log('  Модель CatBoost: локально в браузере (public/model)')
  console.log('  Остановка: Ctrl+C')
  console.log('════════════════════════════════════════\n')

  const api = spawn(
    'python',
    ['-m', 'pip', 'install', '-q', '-r', 'requirements-api.txt'],
    { cwd: join(root, 'backend'), shell: isWin, stdio: 'inherit' },
  )
  api.on('exit', () => {
    spawn(
      'python',
      ['-m', 'uvicorn', 'src.api.server:app', '--host', '0.0.0.0', '--port', '8000'],
      { cwd: join(root, 'backend'), shell: isWin, stdio: 'inherit' },
    )
  })

  setTimeout(() => {
    spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'], {
      cwd: frontend,
      shell: isWin,
      stdio: 'inherit',
    })
  }, 2000)
}

main()
