import type { ReactNode } from 'react'
import { cn } from '@/core/lib/cn'

export interface PageHeaderProps {
  title: string
  eyebrow?: string
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, eyebrow, meta, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-6', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="section-label">{eyebrow}</p>}
        <h1 className={cn('display text-3xl', eyebrow && 'mt-2')}>{title}</h1>
        {meta && <div className="mt-2 flex flex-wrap items-center gap-3">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  )
}
