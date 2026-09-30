export type SignMode = 'auto' | 'always'

export interface FormatOptions {
  places?: number
  sign?: SignMode
}

interface DecimalParts {
  negative: boolean
  whole: string
  fraction: string
}

export function parseDecimal(value: string): DecimalParts {
  const trimmed = value.trim()
  const negative = trimmed.startsWith('-')
  const unsigned = negative || trimmed.startsWith('+') ? trimmed.slice(1) : trimmed
  const [whole, fraction] = unsigned.split('.')

  return {
    negative,
    whole: whole || '0',
    fraction: fraction || '',
  }
}

function groupThousands(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function prefix(negative: boolean, sign: SignMode): string {
  if (negative) return '-'
  return sign === 'always' ? '+' : ''
}

function render(value: string, places: number, sign: SignMode): string {
  const { negative, whole, fraction } = parseDecimal(value)
  const digits = groupThousands(whole)
  const decimals = places > 0 ? `.${fraction.padEnd(places, '0').slice(0, places)}` : ''

  return `${prefix(negative, sign)}${digits}${decimals}`
}

export function decimal(value: string, options: FormatOptions = {}): string {
  return render(value, options.places ?? 2, options.sign ?? 'auto')
}

export function quantity(value: string, options: FormatOptions = {}): string {
  return render(value, options.places ?? 0, options.sign ?? 'auto')
}

export function percent(value: string, options: FormatOptions = {}): string {
  return `${render(value, options.places ?? 1, options.sign ?? 'auto')}%`
}

export function money(value: string, options: FormatOptions = {}): string {
  const { negative } = parseDecimal(value)
  const magnitude = render(value, options.places ?? 2, 'auto').replace('-', '')

  return `${prefix(negative, options.sign ?? 'auto')}$${magnitude}`
}
