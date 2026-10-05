import type { ReactNode } from 'react'
import { cn } from '@/core/lib/cn'

export interface ActionBarProps {
  preview?: ReactNode
  children: ReactNode
  className?: string
}

export function ActionBar({ preview, children, className }: ActionBarProps) {
  return (
    <div
      role="region"
      aria-label="Primary action"
      className={cn(
        'sticky bottom-0 z-20 -mx-gutter mt-10 flex items-center gap-6 border-t border-line bg-canvas/90 px-gutter py-3 backdrop-blur',
        className,
      )}
    >
      {preview && <div className="min-w-0 flex-1 text-xs text-ink-muted">{preview}</div>}
      <div className={cn('flex items-center gap-2.5', !preview && 'ml-auto')}>{children}</div>
    </div>
  )
}
