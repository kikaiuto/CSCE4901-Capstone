import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Kbd } from './Kbd'

export type ButtonVariant = 'primary' | 'ink' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant
  size?: ButtonSize
  shortcut?: string
  unwired?: boolean
  children: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-ink-inverse border border-accent hover:bg-accent-hover',
  ink: 'bg-ink text-ink-inverse border border-ink hover:bg-ink/90',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-raised',
  ghost: 'bg-transparent text-ink-muted border border-transparent hover:bg-raised hover:text-ink',
  danger: 'bg-surface text-negative border border-line-strong hover:bg-negative-soft',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3.5 text-base',
}

const UNWIRED = 'bg-raised text-ink-faint border border-dashed border-line-strong'

export function Button({
  variant = 'secondary',
  size = 'md',
  shortcut,
  unwired = false,
  className,
  children,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-disabled={unwired || undefined}
      title={unwired ? 'Not wired up yet' : props.title}
      onClick={unwired ? undefined : onClick}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control font-medium transition-colors',
        SIZES[size],
        unwired ? UNWIRED : VARIANTS[variant],
        className,
      )}
    >
      {unwired && <span aria-hidden="true">✕</span>}
      {children}
      {shortcut && (
        <Kbd tone={unwired ? 'muted' : variant === 'primary' || variant === 'ink' ? 'inverse' : 'default'}>
          {shortcut}
        </Kbd>
      )}
    </button>
  )
}
