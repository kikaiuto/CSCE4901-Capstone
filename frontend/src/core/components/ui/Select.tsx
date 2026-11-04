import type { SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '@/core/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

export type SelectSize = 'sm' | 'md'

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'size'> {
  label: string
  options: SelectOption[]
  error?: string
  size?: SelectSize
  labelHidden?: boolean
}

const SIZES: Record<SelectSize, string> = {
  sm: 'h-9',
  md: 'h-10',
}

export function Select({
  label,
  options,
  error,
  size = 'md',
  labelHidden = false,
  className,
  ...props
}: SelectProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={cn('flex flex-col', !labelHidden && 'gap-1.5')}>
      <label htmlFor={id} className={labelHidden ? 'sr-only' : 'text-sm text-ink-muted'}>
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full appearance-none rounded-control border bg-surface pr-9 pl-3 text-base text-ink',
            'focus:outline-none',
            SIZES[size],
            error ? 'border-negative focus:border-negative' : 'border-line-strong focus:border-accent',
            className,
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 opacity-60"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {error && (
        <p id={errorId} role="alert" className={cn('text-xs text-negative', labelHidden && 'mt-1')}>
          {error}
        </p>
      )}
    </div>
  )
}
