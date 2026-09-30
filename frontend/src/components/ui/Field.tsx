import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: ReactNode
}

export function Field({ label, hint, className, ...props }: FieldProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {label}
      </label>
      <input
        {...props}
        id={id}
        className={cn(
          'h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-base',
          'placeholder:text-ink-faint focus:border-accent focus:outline-none',
          className,
        )}
      />
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
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
