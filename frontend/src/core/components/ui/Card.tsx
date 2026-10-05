import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/core/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn('rounded-card border border-line bg-surface', className)}
    >
      {children}
    </div>
  )
}

export interface SectionLabelProps {
  count?: number
  className?: string
  children: ReactNode
}

export function SectionLabel({ count, className, children }: SectionLabelProps) {
  return (
    <h2 className={cn('section-label flex items-center gap-2', className)}>
      <span>{children}</span>
      {count !== undefined && <span className="figure text-ink-faint">{count}</span>}
    </h2>
  )
}
