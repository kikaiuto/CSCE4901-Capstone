import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT = process.argv[3] ?? './shots'
const WORKSPACE = process.env.DEMO_WORKSPACE ?? 'Northstar Electronics Demo'
const EMAIL = process.env.DEMO_EMAIL ?? 'owner@northstar.demo'
const PASSWORD = process.env.DEMO_PASSWORD ?? 'sector7-demo'

const ROUTES = [
  ['home', '/home'],
  ['sales-orders', '/sales/orders'],
  ['sales-order', '/sales/orders/SO-1044'],
  ['sales-customers', '/sales/customers'],
  ['sales-customer', '/sales/customers/cus-riverside'],
  ['inventory-products', '/inventory/products'],
  ['inventory-product-new', '/inventory/products/new'],
  ['inventory-product', '/inventory/products/WA-100'],
  ['procurement-orders', '/procurement/orders'],
  ['procurement-receive', '/procurement/orders/PO-0214'],
  ['accounting-journal', '/accounting/journal'],
  ['accounting-accounts', '/accounting/accounts'],
  ['accounting-pl', '/accounting/reports/profit-loss'],
  ['admin-people', '/admin/people'],
]

let chromium

try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error(
    'This script needs Playwright, which is not a dependency of this project.\n' +
      'Install it when you want a visual pass, then remove it again:\n\n' +
      '  npm install --no-save playwright && npx playwright install chromium\n' +
      '  npm run dev\n' +
      '  npm run screenshots\n',
  )
  process.exit(1)
}

const reachable = await fetch(BASE).then(
  () => true,
  () => false,
)

if (!reachable) {
  console.error(`Nothing is serving at ${BASE}. Start it with "npm run dev" first.`)
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const problems = []

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
})

const page = await context.newPage()

page.on('console', (message) => {
  if (message.type() === 'error') problems.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))

async function describe(name) {
  const shown = await page.evaluate(() => {
    const body = getComputedStyle(document.body)
    return {
      bg: body.backgroundColor,
      font: body.fontFamily.split(',')[0],
      text: (document.body.innerText || '').slice(0, 60).replace(/\s+/g, ' '),
    }
  })

  if (!shown.text.trim()) problems.push(`${name}: page rendered no text`)

  console.log(
    `${name.padEnd(22)} bg=${shown.bg.padEnd(20)} font=${shown.font.padEnd(18)} "${shown.text.slice(0, 34)}"`,
  )
}

async function capture(name) {
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await describe(name)
}

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await capture('sign-in')

await page.getByRole('button', { name: WORKSPACE }).click()
await capture('sign-in-credentials')

await page.getByLabel('Email', { exact: true }).fill(EMAIL)
await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
await page.getByRole('button', { name: /^Sign in/ }).click()

try {
  await page.waitForURL(`${BASE}/home`, { timeout: 10_000 })
} catch {
  problems.push(`sign-in: did not reach /home as ${EMAIL}; is the demo data seeded?`)
}

for (const [name, path] of ROUTES) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await capture(name)
}

await context.close()
await browser.close()

console.log(`\nwrote ${ROUTES.length + 2} screenshots to ${OUT}`)
console.log('--- problems ---')
console.log(problems.length ? problems.join('\n') : 'none')

if (problems.length) process.exit(1)
