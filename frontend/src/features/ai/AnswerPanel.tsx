import { Button } from '@/components/ui/Button'
import { Figure } from '@/components/ui/Figure'
import { Icon } from '@/components/ui/Icon'
import { shortDate } from '@/lib/date'
import type { AiAnswer, AiDraft } from '@/mocks/ai'

function ToolCalls({ answer }: { answer: AiAnswer }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {answer.toolCalls.map((call) => (
        <li key={call.name} className="flex items-center gap-2.5 text-xs">
          <Icon name="check" className="size-3.5 text-positive" />
          <span className="figure text-ink-muted">{call.name}</span>
          <span className="figure text-ink-faint">{call.argument}</span>
          <span className="ml-auto figure text-ink-muted">{call.result}</span>
        </li>
      ))}
    </ol>
  )
}

function Draft({ draft }: { draft: AiDraft }) {
  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
        <p className="section-label">Draft · not saved</p>
        <p className="text-xs text-ink-muted">{draft.heading}</p>
      </div>

      <table className="w-full">
        <tbody>
          {draft.lines.map((line) => (
            <tr key={line.sku} className="border-b border-line">
              <td className="px-4 py-3 text-base">
                {line.item} <span className="figure text-ink-faint">{line.sku}</span>
              </td>
              <td className="px-2 py-3 text-right">
                <Figure value={line.qty} kind="quantity" />
              </td>
              <td className="px-2 py-3 text-right">
                <Figure value={line.unit} />
              </td>
              <td className="px-4 py-3 text-right">
                <Figure value={line.amount} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-3 text-xs text-ink-muted">
        <div className="flex gap-1.5">
          <dt>Covers</dt>
          <dd className="figure text-ink">{draft.covers} days</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Arrives</dt>
          <dd className="figure text-ink">{shortDate(draft.arrives)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Posts on receipt</dt>
          <dd className="text-ink">{draft.posts}</dd>
        </div>
      </dl>

      <div className="flex gap-2 border-t border-line px-4 py-3">
        <Button variant="primary" shortcut="↵" unwired>
          Open as draft
        </Button>
        <Button shortcut="Tab" unwired>
          Change quantity
        </Button>
      </div>
    </div>
  )
}

export interface AnswerPanelProps {
  answer: AiAnswer
  compact?: boolean
}

export function AnswerPanel({ answer, compact = false }: AnswerPanelProps) {
  return (
    <div className="animate-rise flex flex-col gap-5">
      <ToolCalls answer={answer} />

      <p className={compact ? 'text-md' : 'display text-xl'}>{answer.summary}</p>

      <ul className="flex flex-col gap-2">
        {answer.facts.map((fact) => (
          <li key={fact.text} className="flex items-baseline gap-2 text-base text-ink-muted">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint" />
            <span>
              {fact.text}{' '}
              <span className="figure rounded-pill border border-line px-1.5 py-0.5 text-micro text-ink-muted">
                {fact.source}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {answer.draft && <Draft draft={answer.draft} />}
    </div>
  )
}
