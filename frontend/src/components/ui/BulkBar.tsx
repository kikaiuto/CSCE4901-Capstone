import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
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
          ? 'border border-dashed border-white/25 text-white/45'
          : 'bg-white text-ink hover:bg-white/90',
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
  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 rounded-card bg-ink py-2.5 pr-2.5 pl-4 shadow-float">
        <span className="text-base text-white/80">
          <span className="figure">{count}</span> selected
        </span>
        <span className="h-5 w-px bg-white/20" />
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
