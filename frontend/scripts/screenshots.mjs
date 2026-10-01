import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT = process.argv[3] ?? './shots'

const ROUTES = [
  ['sign-in', '/'],
  ['home', '/home'],
  ['sales-orders', '/sales/orders'],
  ['inventory-products', '/inventory/products'],
  ['inventory-product', '/inventory/products/WA-100'],
  ['procurement-orders', '/procurement/orders'],
  ['procurement-receive', '/procurement/orders/PO-0214'],
  ['accounting-journal', '/accounting/journal'],
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

for (const theme of ['dark', 'light']) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  })

  await context.addInitScript((value) => {
    try {
      localStorage.setItem('s7-theme', value)
    } catch {}
  }, theme)

  const page = await context.newPage()

  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console ${theme}: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`pageerror ${theme}: ${error.message}`))

  for (const [name, path] of ROUTES) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(450)
    await page.screenshot({ path: `${OUT}/${theme}-${name}.png` })

    const shown = await page.evaluate(() => {
      const body = getComputedStyle(document.body)
      return {
        bg: body.backgroundColor,
        font: body.fontFamily.split(',')[0],
        theme: document.documentElement.dataset.theme ?? 'dark',
        text: (document.body.innerText || '').slice(0, 60).replace(/\s+/g, ' '),
      }
    })

    if (shown.theme !== theme) problems.push(`${theme}/${name}: document says ${shown.theme}`)
    if (!shown.text.trim()) problems.push(`${theme}/${name}: page rendered no text`)

    console.log(
      `${theme.padEnd(5)} ${name.padEnd(20)} bg=${shown.bg.padEnd(20)} font=${shown.font.padEnd(18)} "${shown.text.slice(0, 34)}"`,
    )
  }

  await context.close()
}

await browser.close()

console.log(`\nwrote ${ROUTES.length * 2} screenshots to ${OUT}`)
console.log('--- problems ---')
console.log(problems.length ? problems.join('\n') : 'none')

if (problems.length) process.exit(1)
