import { useOutletContext } from 'react-router'
import { longDate } from '@/core/lib/date'
import { countOf } from '@/core/lib/text'
import { queue, queueCount } from '@/addons/home/fixtures/queue'
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

  return (
    <div className="mx-auto max-w-3xl">
      <header className="animate-rise">
        <p className="section-label">Today · {longDate(today)}</p>
        <h1 className="display mt-5 text-display">
          {greeting()}, {firstName}
        </h1>
        <p className="animate-rise stagger-1 mt-3 max-w-md text-lg text-ink-muted">
          {countOf(queueCount, 'thing')} {queueCount === 1 ? 'needs' : 'need'} you. Nothing
          is overdue.
        </p>
      </header>

      <div className="animate-rise stagger-2 mt-9">
        <AskLine onOpen={openCommandBar} />
      </div>

      <div className="mt-9">
        <MetricStrip />
      </div>

      <p className="animate-rise stagger-6 mt-7 border-l-2 border-accent pl-4 text-md text-ink-muted">
        {note}
      </p>

      <div className="mt-12 flex flex-col gap-11">
        {queue.map((group, index) => (
          <QueueGroup key={group.id} group={group} index={index} />
        ))}
      </div>
    </div>
  )
}
