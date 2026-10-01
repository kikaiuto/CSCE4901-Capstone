import { cn } from '@/core/lib/cn'
import { initials } from '@/core/lib/text'

export type AvatarShape = 'square' | 'circle'

export interface AvatarProps {
  name: string
  shape?: AvatarShape
  className?: string
}

export function Avatar({ name, shape = 'circle', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'figure flex size-7 shrink-0 items-center justify-center bg-raised text-micro font-medium text-ink-muted',
        shape === 'square' ? 'rounded-control' : 'rounded-full',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
