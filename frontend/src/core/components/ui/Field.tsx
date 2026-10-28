import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '@/core/lib/cn'

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: ReactNode
  error?: string
  labelEnd?: ReactNode
  trailing?: ReactNode
}

export function Field({ label, hint, error, labelEnd, trailing, className, ...props }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm text-ink-muted">
          {label}
        </label>
        {labelEnd}
      </div>
      <div className="relative">
        <input
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-10 w-full rounded-control border bg-surface px-3 text-base',
            'placeholder:text-ink-faint focus:outline-none',
            error ? 'border-negative focus:border-negative' : 'border-line-strong focus:border-accent',
            trailing ? 'pr-16' : undefined,
            className,
          )}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-negative">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

export interface SelectShellProps {
  value: string
  unwired?: boolean
  className?: string
}

export function SelectShell({ value, unwired = false, className }: SelectShellProps) {
  return (
    <button
      type="button"
      aria-disabled={unwired || undefined}
      title={unwired ? 'Not wired up yet' : undefined}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-control border px-3 text-base transition-colors',
        unwired
          ? 'border-dashed border-line-strong bg-raised text-ink-faint'
          : 'border-line-strong bg-surface text-ink hover:bg-raised',
        className,
      )}
    >
      {unwired && <span aria-hidden="true">✕</span>}
      {value}
      <svg viewBox="0 0 12 12" className="size-3 opacity-60" fill="none" aria-hidden="true">
        <path
          d="M3 4.5 6 7.5 9 4.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
