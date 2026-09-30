import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type KbdTone = 'default' | 'inverse' | 'muted'

export interface KbdProps {
  tone?: KbdTone
  className?: string
  children: ReactNode
}

const TONES: Record<KbdTone, string> = {
  default: 'border-line-strong bg-surface text-ink-muted',
  inverse: 'border-white/35 bg-white/15 text-ink-inverse',
  muted: 'border-line-strong bg-transparent text-ink-faint',
}

export function Kbd({ tone = 'default', className, children }: KbdProps) {
  return (
    <kbd
      className={cn(
        'figure inline-flex h-5 min-w-5 items-center justify-center rounded-pill border px-1.5 text-micro font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </kbd>
  )
}
