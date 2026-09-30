import { cn } from '@/lib/cn'
import { decimal, money, parseDecimal, percent, quantity, type SignMode } from '@/lib/decimal'

export type FigureKind = 'decimal' | 'money' | 'percent' | 'quantity'
export type FigureTone = 'default' | 'muted' | 'faint' | 'positive' | 'negative' | 'signed'

export interface FigureProps {
  value: string
  kind?: FigureKind
  places?: number
  sign?: SignMode
  tone?: FigureTone
  className?: string
}

const FORMATTERS = { decimal, money, percent, quantity }

const TONES: Record<Exclude<FigureTone, 'signed'>, string> = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  faint: 'text-ink-faint',
  positive: 'text-positive',
  negative: 'text-negative',
}

function toneClass(tone: FigureTone, value: string): string {
  if (tone !== 'signed') return TONES[tone]
  return parseDecimal(value).negative ? TONES.negative : TONES.positive
}

export function Figure({
  value,
  kind = 'decimal',
  places,
  sign,
  tone = 'default',
  className,
}: FigureProps) {
  return (
    <span className={cn('figure', toneClass(tone, value), className)}>
      {FORMATTERS[kind](value, { places, sign })}
    </span>
  )
}
