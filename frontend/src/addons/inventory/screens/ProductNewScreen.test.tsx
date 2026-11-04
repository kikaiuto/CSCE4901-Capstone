import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch } from '@/core/test/fetch'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { demoCategories, demoProducts } from '../fixtures/catalog'
import { ProductNewScreen } from './ProductNewScreen'

const fetchMock = mockFetch()

const accounts = [
  { account_id: 'acc-1200', account_code: '1200', account_name: 'Inventory', account_type: 'asset' },
  { account_id: 'acc-1000', account_code: '1000', account_name: 'Cash', account_type: 'asset' },
  { account_id: 'acc-4000', account_code: '4000', account_name: 'Sales revenue', account_type: 'revenue' },
  { account_id: 'acc-5000', account_code: '5000', account_name: 'Cost of goods sold', account_type: 'expense' },
]

type Reply = (init?: RequestInit) => Response

function serve(onCreate: Reply = () => jsonResponse(demoProducts[0], 201)) {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.includes('/categories')) return jsonResponse(demoCategories)
    if (url.includes('/accounts')) return jsonResponse(accounts)
    return onCreate(init)
  })
}

function render() {
  return renderWithRouter(<ProductNewScreen />, {
    path: '/inventory/products/new',
    extraRoutes: [{ path: '/inventory/products', element: <p>Products list</p> }],
  })
}

async function fillIn(sku = 'LAP-09') {
  await screen.findByRole('option', { name: 'Laptops' })
  await userEvent.type(screen.getByLabelText('Name'), 'Travel Laptop')
  await userEvent.type(screen.getByLabelText('SKU'), sku)
  await userEvent.selectOptions(screen.getByLabelText('Category'), 'cat-laptops')
  await userEvent.selectOptions(screen.getByLabelText('Inventory asset account'), 'acc-1200')
  await userEvent.selectOptions(screen.getByLabelText('Sales revenue account'), 'acc-4000')
  await userEvent.type(screen.getByLabelText('Unit cost'), '480.5')
  await userEvent.type(screen.getByLabelText('Unit price'), '799')
}

function createCall() {
  return fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
}

beforeEach(() => {
  serve()
})

describe('ProductNewScreen', () => {
  it('offers only asset accounts for the asset side and revenue for the revenue side', async () => {
    render()

    await screen.findByRole('option', { name: '1200 · Inventory' })
    const asset = screen.getByLabelText('Inventory asset account')
    const revenue = screen.getByLabelText('Sales revenue account')

    expect(within(asset).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Select an account',
      '1200 · Inventory',
      '1000 · Cash',
    ])
    expect(within(revenue).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Select an account',
      '4000 · Sales revenue',
    ])
  })

  it('refuses an empty form without calling the server', async () => {
    render()

    await userEvent.click(screen.getByRole('button', { name: /Create product/ }))

    expect(screen.getByText('Enter a product name')).toBeInTheDocument()
    expect(screen.getByText('Choose a category')).toBeInTheDocument()
    expect(screen.getByText('Enter a cost with up to four decimals')).toBeInTheDocument()
    expect(createCall()).toBeUndefined()
  })

  it('sends decimals as strings and the threshold as a number', async () => {
    const { router } = render()

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Create product/ }))

    await waitFor(() => expect(createCall()).toBeDefined())
    const [url, init] = createCall() ?? []
    expect(url).toBe('/api/inventory/products')
    expect(JSON.parse(String(init?.body))).toEqual({
      name: 'Travel Laptop',
      sku: 'LAP-09',
      category_id: 'cat-laptops',
      asset_account_id: 'acc-1200',
      revenue_account_id: 'acc-4000',
      unit_cost: '480.5',
      unit_price: '799',
      safety_stock_threshold: 0,
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/inventory/products'))
  })

  it('puts a duplicate SKU on the SKU field', async () => {
    serve(() =>
      jsonResponse(
        { error: 'conflict', message: 'A product with this SKU already exists', details: {} },
        409,
      ),
    )
    render()

    await fillIn('LAP-01')
    await userEvent.click(screen.getByRole('button', { name: /Create product/ }))

    expect(await screen.findByText('A product with this SKU already exists')).toBeInTheDocument()
    expect(screen.getByLabelText('SKU')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a rejected reference as a form error', async () => {
    serve(() =>
      jsonResponse({ error: 'app_error', message: 'Invalid product category', details: {} }, 400),
    )
    render()

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Create product/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid product category')
  })

  it('maps a validation reply onto its field', async () => {
    serve(() =>
      jsonResponse(
        { detail: [{ loc: ['body', 'unit_price'], msg: 'Input should be greater than or equal to 0' }] },
        422,
      ),
    )
    render()

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Create product/ }))

    expect(
      await screen.findByText('Input should be greater than or equal to 0'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Unit price')).toHaveAttribute('aria-invalid', 'true')
  })

  it('goes back to the list on cancel', async () => {
    const { router } = render()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(router.state.location.pathname).toBe('/inventory/products')
    expect(createCall()).toBeUndefined()
  })
})
