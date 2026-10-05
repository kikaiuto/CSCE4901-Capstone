import { createContext, useContext, useEffect, type ReactNode } from 'react'

export type SetPageActions = (actions: ReactNode) => void

export const PageActionsContext = createContext<SetPageActions | null>(null)

export function usePageActions(actions: ReactNode) {
  const setActions = useContext(PageActionsContext)

  useEffect(() => {
    if (!setActions) return
    setActions(actions)
    return () => setActions(null)
  }, [setActions, actions])
}
