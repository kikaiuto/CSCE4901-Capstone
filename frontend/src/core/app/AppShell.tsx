import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router'
import { CommandBar } from '@/addons/ai/components/CommandBar'
import { ModuleBar } from './ModuleBar'
import { ModuleRail } from './ModuleRail'
import { PageActionsContext } from './usePageActions'
import { RecordPagerContext, type RecordPage } from './useRecordPager'

export function AppShell() {
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [actions, setActions] = useState<ReactNode>(null)
  const [page, setPage] = useState<RecordPage | null>(null)

  const close = useCallback(() => setCommandBarOpen(false), [])
  const open = useCallback(() => setCommandBarOpen(true), [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setCommandBarOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const context = useMemo(() => ({ openCommandBar: open }), [open])
  const push = useCallback((node: ReactNode) => setActions(node), [])
  const pushPage = useCallback((next: RecordPage | null) => setPage(next), [])

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-base focus:shadow-overlay"
      >
        Skip to content
      </a>

      <ModuleRail />

      <div className="ml-rail flex min-h-screen flex-col">
        <ModuleBar onOpenCommandBar={open} actions={actions} page={page} />

        <main id="content" className="flex-1 px-gutter py-8">
          <PageActionsContext.Provider value={push}>
            <RecordPagerContext.Provider value={pushPage}>
              <Outlet context={context} />
            </RecordPagerContext.Provider>
          </PageActionsContext.Provider>
        </main>
      </div>

      <CommandBar open={commandBarOpen} onClose={close} />
    </div>
  )
}
