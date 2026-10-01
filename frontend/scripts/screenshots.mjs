import { chromium } from 'playwright'
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
        color: body.color,
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

console.log('\n--- problems ---')
console.log(problems.length ? problems.join('\n') : 'none')
