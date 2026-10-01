import { cn } from '@/core/lib/cn'
import { toggleTheme, useTheme } from '@/core/lib/theme'
import { Icon } from './Icon'

export interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useTheme()
  const light = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
      title={light ? 'Switch to dark theme' : 'Switch to light theme'}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-140 hover:bg-raised hover:text-ink',
        className,
      )}
    >
      <Icon name={light ? 'moon' : 'sun'} />
    </button>
  )
}
