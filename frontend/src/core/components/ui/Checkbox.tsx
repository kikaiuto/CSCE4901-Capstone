import { cn } from '@/core/lib/cn'

export interface CheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
}: CheckboxProps) {
  const active = checked || indeterminate

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
        active
          ? 'border-accent bg-accent text-ink-inverse'
          : 'border-line-strong bg-surface hover:border-ink-faint',
        className,
      )}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2 rounded-full bg-current" />
      ) : (
        checked && (
          <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )
      )}
    </button>
  )
}
