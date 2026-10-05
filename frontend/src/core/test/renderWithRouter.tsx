import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'

export interface RenderWithRouterOptions {
  path?: string
  routePath?: string
  extraRoutes?: { path: string; element: ReactElement }[]
  outletContext?: unknown
}

function ContextOutlet({ context }: { context: unknown }) {
  return <Outlet context={context} />
}

export function renderWithRouter(element: ReactElement, options: RenderWithRouterOptions = {}) {
  const path = options.path ?? '/'
  const routePath = options.routePath ?? path

  const leaf =
    options.outletContext === undefined
      ? { path: routePath, element }
      : {
          element: <ContextOutlet context={options.outletContext} />,
          children: [{ path: routePath, element }],
        }

  const router = createMemoryRouter([leaf, ...(options.extraRoutes ?? [])], {
    initialEntries: [path],
  })

  const result = render(<RouterProvider router={router} />)
  return { ...result, router }
}
