import { Link } from 'react-router'
import { cn } from '@/core/lib/cn'
import { Icon } from './Icon'
import type { RecordPage } from '@/core/app/useRecordPager'

const STEP =
  'flex size-7 items-center justify-center rounded-control border border-line-strong text-ink-muted transition-colors'

export function RecordPager({ page }: { page: RecordPage }) {
  return (
    <div className="flex items-center gap-2">
      <span className="figure text-xs text-ink-muted">
        {page.index} of {page.total}
      </span>

      <div className="flex items-center gap-1">
        {page.prev ? (
          <Link to={page.prev} aria-label={`Previous ${page.label}`} className={cn(STEP, 'hover:bg-raised hover:text-ink')}>
            <Icon name="chevron-left" className="size-3.5" />
          </Link>
        ) : (
          <span aria-hidden className={cn(STEP, 'opacity-40')}>
            <Icon name="chevron-left" className="size-3.5" />
          </span>
        )}

        {page.next ? (
          <Link to={page.next} aria-label={`Next ${page.label}`} className={cn(STEP, 'hover:bg-raised hover:text-ink')}>
            <Icon name="chevron-right" className="size-3.5" />
          </Link>
        ) : (
          <span aria-hidden className={cn(STEP, 'opacity-40')}>
            <Icon name="chevron-right" className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}
