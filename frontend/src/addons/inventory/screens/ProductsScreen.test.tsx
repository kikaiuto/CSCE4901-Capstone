import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { signIn } from '@/core/app/session'
import { jsonResponse, mockFetch } from '@/core/test/fetch'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { demoSession } from '@/addons/base/fixtures/org'
import { demoCategories, demoProducts } from '../fixtures/catalog'
import { ProductsScreen } from './ProductsScreen'

const fetchMock = mockFetch()

function serve(products = demoProducts, categories = demoCategories) {
  fetchMock.mockImplementation(async (input) =>
    String(input).includes('/categories') ? jsonResponse(categories) : jsonResponse(products),
  )
}

function bodyRows() {
  const [, ...rows] = screen.getAllByRole('row')
  return rows
}

beforeEach(() => {
  serve()
})

describe('ProductsScreen', () => {
  it('lists every product the API returns', async () => {
    renderWithRouter(<ProductsScreen />)

    await waitFor(() => expect(bodyRows()).toHaveLength(demoProducts.length))
    expect(screen.getByText('3 products')).toBeInTheDocument()
  })

  it('asks for the products and the categories of the signed-in organization', async () => {
    renderWithRouter(<ProductsScreen />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const urls = fetchMock.mock.calls.map(([input]) => String(input)).sort()
    expect(urls).toEqual(['/api/inventory/categories', '/api/inventory/products?limit=100'])
  })

  it('names the category instead of showing its id', async () => {
    renderWithRouter(<ProductsScreen />)

    await waitFor(() => expect(screen.getAllByText('Accessories')).toHaveLength(2))
    expect(screen.queryByText('cat-accessories')).not.toBeInTheDocument()
  })

  it('links each SKU through to its record', async () => {
    renderWithRouter(<ProductsScreen />)

    expect(await screen.findByRole('link', { name: 'LAP-01' })).toHaveAttribute(
      'href',
      '/inventory/products/LAP-01',
    )
  })

  it('marks stock columns as not tracked rather than inventing numbers', async () => {
    renderWithRouter(<ProductsScreen />)

    await waitFor(() => expect(bodyRows()).toHaveLength(demoProducts.length))
    const [first] = bodyRows()
    expect(within(first).getAllByLabelText('Not tracked yet')).toHaveLength(2)
    expect(within(first).getByText('550.0000')).toBeInTheDocument()
  })

  it('says what went wrong when the list cannot load', async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse({ error: 'forbidden', message: 'Your role cannot see products', details: {} }, 403),
    )
    renderWithRouter(<ProductsScreen />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Your role cannot see products')
  })

  it('offers to add the first product when there are none', async () => {
    serve([], demoCategories)
    renderWithRouter(<ProductsScreen />)

    expect(await screen.findByText('No products yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'New product' })).toHaveLength(2)
  })

  it('opens the new product form', async () => {
    const { router } = renderWithRouter(<ProductsScreen />, {
      path: '/inventory/products',
      extraRoutes: [{ path: '/inventory/products/new', element: <p>Form</p> }],
    })

    await userEvent.click(screen.getByRole('button', { name: 'New product' }))

    expect(router.state.location.pathname).toBe('/inventory/products/new')
  })

  it('hides New product from roles that cannot create products', async () => {
    signIn({ ...demoSession, user: { ...demoSession.user, role: 'Sales' } })
    renderWithRouter(<ProductsScreen />)

    await waitFor(() => expect(bodyRows()).toHaveLength(demoProducts.length))
    expect(screen.queryByRole('button', { name: 'New product' })).not.toBeInTheDocument()
  })

  it('leaves export unwired', () => {
    renderWithRouter(<ProductsScreen />)

    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-disabled', 'true')
  })
})
