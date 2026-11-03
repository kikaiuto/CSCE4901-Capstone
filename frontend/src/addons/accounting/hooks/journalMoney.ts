// Integer-cent arithmetic so the meter never sees floating-point drift.
// Digits past the second decimal are ignored here; the server rejects them as too_precise.
export function toCents(value: string): number {
  const match = /^(\d*)(?:\.(\d*))?$/.exec(value.trim())
  if (!match) return 0
  return Number(match[1] || '0') * 100 + Number((match[2] ?? '').padEnd(2, '0').slice(0, 2))
}

export function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}
