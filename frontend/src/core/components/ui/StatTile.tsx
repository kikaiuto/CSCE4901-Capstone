import type { ReactNode } from 'react'
import { cn } from '@/core/lib/cn'
import { Figure, type FigureKind, type FigureTone } from './Figure'

export interface StatTileProps {
  label: string
  value: string
  kind?: FigureKind
  places?: number
  tone?: FigureTone
  detail?: ReactNode
  className?: string
}

export function StatTile({
  label,
  value,
  kind = 'decimal',
  places,
  tone = 'default',
  detail,
  className,
}: StatTileProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="section-label">{label}</p>
      <Figure value={value} kind={kind} places={places} tone={tone} className="text-2xl tracking-tight" />
      {detail && <p className="text-xs text-ink-muted">{detail}</p>}
    </div>
  )
}
