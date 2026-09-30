import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import { CommandBar } from '@/addons/ai/components/CommandBar'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [commandBarOpen, setCommandBarOpen] = useState(false)

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

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar onOpenCommandBar={open} />
      <main className="ml-rail px-12 py-14">
        <Outlet context={context} />
      </main>
      <CommandBar open={commandBarOpen} onClose={close} />
    </div>
  )
}
