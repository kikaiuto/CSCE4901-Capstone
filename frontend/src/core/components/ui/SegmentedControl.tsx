import { cn } from '@/core/lib/cn'

export interface SegmentedOption<T extends string> {
  id: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('flex gap-0.5', className)}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn(
            'figure h-6 rounded-[3px] px-2 text-micro font-medium transition-colors duration-140',
            option.id === value
              ? 'bg-emphasis text-emphasis-ink'
              : 'text-ink-faint hover:bg-raised hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
