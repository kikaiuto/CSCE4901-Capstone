import { useEffect, type ReactNode } from 'react'
import { cn } from '@/core/lib/cn'
import { usePresence } from '@/core/lib/usePresence'
import { Kbd } from './Kbd'

export interface BulkActionProps {
  unwired?: boolean
  onClick?: () => void
  children: ReactNode
}

export function BulkAction({ unwired = false, onClick, children }: BulkActionProps) {
  return (
    <button
      type="button"
      aria-disabled={unwired || undefined}
      title={unwired ? 'Not wired up yet' : undefined}
      onClick={unwired ? undefined : onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-base font-medium transition-colors',
        unwired
          ? 'border border-dashed border-panel-line text-panel-ink-muted'
          : 'bg-panel-ink text-panel hover:bg-panel-ink/90',
      )}
    >
      {unwired && <span aria-hidden="true">✕</span>}
      {children}
    </button>
  )
}

export interface BulkBarProps {
  count: number
  onDismiss: () => void
  children: ReactNode
}

export function BulkBar({ count, onDismiss, children }: BulkBarProps) {
  const active = count > 0
  const { mounted, state } = usePresence(active, 140)

  useEffect(() => {
    if (!active) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, onDismiss])

  if (!mounted) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex justify-center">
      <div
        role="region"
        aria-label="Selection"
        className={cn(
          'pointer-events-auto flex items-center gap-3 rounded-card bg-panel py-2.5 pr-2.5 pl-4 shadow-float',
          state === 'open' ? 'animate-lift' : 'animate-drop',
        )}
      >
        <span className="text-base text-panel-ink-muted">
          <span className="figure">{count}</span> selected
        </span>
        <span className="h-5 w-px bg-panel-line" />
        {children}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Clear selection"
          className="ml-1 transition-opacity hover:opacity-70"
        >
          <Kbd tone="inverse">esc</Kbd>
        </button>
      </div>
    </div>
  )
}
