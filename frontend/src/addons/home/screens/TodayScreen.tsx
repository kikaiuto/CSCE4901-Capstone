import { useOutletContext } from 'react-router'
import { longDate } from '@/core/lib/date'
import { countOf } from '@/core/lib/text'
import { riseAt } from '@/core/lib/motion'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { canSee } from '@/core/app/useAccess'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { queueFor } from '@/addons/home/fixtures/queue'
import { currentUser, today } from '@/addons/base/fixtures/org'
import { note } from '@/addons/home/fixtures/metrics'
import { AskLine } from '../components/AskLine'
import { MetricStrip } from '../components/MetricStrip'
import { QueueGroup } from '../components/QueueGroup'

export interface ShellContext {
  openCommandBar: () => void
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TodayScreen() {
  const { openCommandBar } = useOutletContext<ShellContext>()
  const firstName = currentUser.name.split(' ')[0]
  const fresh = useFirstVisit('home')

  const visible = queueFor(canSee)
  const count = visible.reduce((total, group) => total + group.items.length, 0)

  return (
    <div className="mx-auto max-w-3xl">
      <header className={cn(fresh && 'rise')}>
        <p className="section-label">Today · {longDate(today)}</p>
        <h1 className="display mt-5 text-display">
          {greeting()}, {firstName}
        </h1>
        <p
          className={cn(fresh && 'rise', 'mt-3 max-w-md text-lg text-ink-muted')}
          style={fresh ? riseAt(1) : undefined}
        >
          {count === 0 ? (
            'Nothing needs you. The business is running.'
          ) : (
            <>
              {countOf(count, 'thing')} {count === 1 ? 'needs' : 'need'} you. Nothing is
              overdue.
            </>
          )}
        </p>
      </header>

      <div className={cn(fresh && 'rise', 'mt-9')} style={fresh ? riseAt(2) : undefined}>
        <AskLine onOpen={openCommandBar} />
      </div>

      <div className="mt-9">
        <MetricStrip fresh={fresh} />
      </div>

      <p
        className={cn(fresh && 'rise', 'mt-7 border-l-2 border-accent pl-4 text-md text-ink-muted')}
        style={fresh ? riseAt(6) : undefined}
      >
        {note}
      </p>

      <div className="mt-12 flex flex-col gap-11">
        {visible.length > 0 ? (
          visible.map((group, index) => (
            <QueueGroup key={group.id} group={group} index={index} fresh={fresh} />
          ))
        ) : (
          <EmptyState
            title="The queue is empty"
            detail="Nothing is waiting on a person right now. New work lands here as it arrives."
          />
        )}
      </div>
    </div>
  )
}
