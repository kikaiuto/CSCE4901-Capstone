import { Fragment } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <li aria-hidden="true" className="text-ink-faint">
                <Icon name="chevron-right" className="size-3.5" />
              </li>
            )}
            <li className="min-w-0">
              {item.to ? (
                <Link
                  to={item.to}
                  className="truncate rounded-control px-1 py-0.5 text-base text-ink-muted transition-colors duration-140 hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate px-1 text-base font-medium text-ink">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
