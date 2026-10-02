import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT = process.argv[3] ?? './shots'

const ROUTES = [
  ['sign-in', '/'],
  ['home', '/home'],
  ['sales-orders', '/sales/orders'],
  ['sales-order', '/sales/orders/SO-1044'],
  ['sales-customers', '/sales/customers'],
  ['sales-customer', '/sales/customers/cus-riverside'],
  ['inventory-products', '/inventory/products'],
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

for (const [name, path] of ROUTES) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${OUT}/${name}.png` })

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
    `${name.padEnd(20)} bg=${shown.bg.padEnd(20)} font=${shown.font.padEnd(18)} "${shown.text.slice(0, 34)}"`,
  )
}

await context.close()
await browser.close()

console.log(`\nwrote ${ROUTES.length} screenshots to ${OUT}`)
console.log('--- problems ---')
console.log(problems.length ? problems.join('\n') : 'none')

if (problems.length) process.exit(1)
