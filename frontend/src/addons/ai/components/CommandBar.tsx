import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '@/core/components/ui/Icon'
import { Kbd } from '@/core/components/ui/Kbd'
import { SectionLabel } from '@/core/components/ui/Card'
import { commandActions, goToResults } from '@/addons/ai/fixtures/ai'
import { AnswerPanel } from './AnswerPanel'
import { useAsk } from '../hooks/useAsk'

export interface CommandBarProps {
  open: boolean
  onClose: () => void
}

export function CommandBar({ open, onClose }: CommandBarProps) {
  const ask = useAsk()
  const inputRef = useRef<HTMLInputElement>(null)
  const reset = ask.reset

  useEffect(() => {
    if (!open) return

    reset()
    inputRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, reset])

  const navigate = useNavigate()

  if (!open) return null

  const asking = ask.question.trim().length > 0

  return (
    <div className="animate-fade fixed inset-0 z-50 flex justify-center bg-ink/20 pt-[12vh] backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close the command bar"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-label="Command bar"
        className="animate-scale-in relative flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-line bg-surface shadow-overlay"
      >
        <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-4">
          {asking ? (
            <span className="figure flex items-center gap-1.5 rounded-pill border border-accent-line bg-accent-soft px-2 py-0.5 text-micro text-accent">
              <Icon name="sparkle" className="size-3" />
              ASK
            </span>
          ) : (
            <Icon name="search" className="text-ink-faint" />
          )}

          <input
            ref={inputRef}
            value={ask.question}
            onChange={(event) => ask.setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') ask.submit()
            }}
            placeholder="Search or type a command…"
            aria-label="Search or ask"
            className="h-12 flex-1 bg-transparent text-base placeholder:text-ink-faint focus:outline-none"
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="flex-1 overflow-y-auto">
          {ask.pending && (
            <p className="px-4 py-5 text-base text-ink-muted" role="status">
              Reading your data…
            </p>
          )}

          {ask.answer && (
            <div className="border-b border-line px-4 py-5">
              <AnswerPanel answer={ask.answer} compact />
            </div>
          )}

          <div className="px-4 py-4">
            <SectionLabel>Actions</SectionLabel>
            <ul className="mt-2 flex flex-col">
              {commandActions.map((action) => (
                <li key={action.label}>
                  <button
                    type="button"
                    aria-disabled="true"
                    title="Not wired up yet"
                    className="flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-base text-ink-faint"
                  >
                    <span aria-hidden="true">✕</span>
                    {action.label}
                    <Kbd tone="muted" className="ml-auto">
                      {action.shortcut}
                    </Kbd>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line px-4 py-4">
            <SectionLabel>Go to</SectionLabel>
            <ul className="mt-2 flex flex-col">
              {goToResults.map((result) => (
                <li key={result.label}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(result.to)
                    }}
                    className="flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-base transition-colors hover:bg-raised"
                  >
                    {result.label}
                    <span className="figure text-xs text-ink-faint">{result.detail}</span>
                    <span className="ml-auto text-xs text-ink-muted">{result.module}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="shrink-0 border-t border-line px-4 py-2.5 text-xs text-ink-faint">
          The assistant reads only. It prepares drafts; you confirm them.
        </p>
      </div>
    </div>
  )
}
