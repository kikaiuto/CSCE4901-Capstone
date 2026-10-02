import { NavLink } from 'react-router'
import { cn } from '@/core/lib/cn'

export interface SectionNavItem {
  label: string
  to: string
}

export interface SectionNavProps {
  label: string
  items: SectionNavItem[]
  className?: string
}

export function SectionNav({ label, items, className }: SectionNavProps) {
  return (
    <nav aria-label={label} className={cn('flex items-center gap-1', className)}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            cn(
              'rounded-control px-2.5 py-1 text-base transition-colors',
              isActive ? 'bg-raised text-ink' : 'text-ink-muted hover:text-ink',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
