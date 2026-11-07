import { RouterProvider } from 'react-router'
import { router } from '@/core/app/router'

export function App() {
  return <RouterProvider router={router} />
}
