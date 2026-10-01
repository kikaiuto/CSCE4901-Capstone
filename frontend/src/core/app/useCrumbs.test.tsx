import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useCrumbs } from './useCrumbs'

function Probe() {
  const { crumbs, module, view } = useCrumbs()

  return (
    <div>
      <span data-testid="trail">{crumbs.map((crumb) => crumb.label).join(' / ')}</span>
      <span data-testid="links">
        {crumbs.map((crumb) => `${crumb.label}:${crumb.to ?? 'none'}`).join(' ')}
      </span>
      <span data-testid="module">{module ?? 'none'}</span>
      <span data-testid="view">{view ?? 'none'}</span>
    </div>
  )
}

function renderAt(path: string, routes: Parameters<typeof createMemoryRouter>[0]) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('useCrumbs', () => {
  it('returns nothing for a route outside every module', () => {
    renderAt('/', [{ path: '/', element: <Probe /> }])

    expect(screen.getByTestId('trail')).toHaveTextContent('')
    expect(screen.getByTestId('module')).toHaveTextContent('none')
  })

  it('leads with the module even when only the module root matches', () => {
    renderAt('/sales/orders', [{ path: '/sales/orders', element: <Probe /> }])

    expect(screen.getByTestId('trail')).toHaveTextContent('Sales')
    expect(screen.getByTestId('module')).toHaveTextContent('sales')
  })

  it('appends a static crumb from the route handle', () => {
    renderAt('/sales/orders', [
      { path: '/sales/orders', element: <Probe />, handle: { crumb: 'Orders', view: 'list' } },
    ])

    expect(screen.getByTestId('trail')).toHaveTextContent('Sales / Orders')
    expect(screen.getByTestId('view')).toHaveTextContent('list')
  })

  it('resolves a function crumb against the route params', () => {
    renderAt('/inventory/products/WA-100', [
      {
        path: '/inventory/products',
        handle: { crumb: 'Products' },
        children: [
          {
            path: ':sku',
            element: <Probe />,
            handle: { crumb: (params: { sku?: string }) => params.sku ?? '', view: 'record' },
          },
        ],
      },
    ])

    expect(screen.getByTestId('trail')).toHaveTextContent('Inventory / Products / WA-100')
    expect(screen.getByTestId('view')).toHaveTextContent('record')
  })

  it('links every crumb but the last', () => {
    renderAt('/sales/orders', [
      { path: '/sales/orders', element: <Probe />, handle: { crumb: 'Orders' } },
    ])

    expect(screen.getByTestId('links')).toHaveTextContent('Sales:/sales Orders:none')
  })

  it('skips matches that declare no crumb', () => {
    renderAt('/accounting/journal', [
      {
        element: <Probe />,
        children: [{ path: '/accounting/journal', handle: { crumb: 'Journal' } }],
      },
    ])

    expect(screen.getByTestId('trail')).toHaveTextContent('Accounting')
  })
})
