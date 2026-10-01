import { describe, expect, it } from 'vitest'
import { niceMax, niceTicks } from './chartTheme'

describe('niceMax', () => {
  it('rounds up to a half-magnitude step', () => {
    expect(niceMax(48200)).toBe(50000)
    expect(niceMax(41)).toBe(45)
    expect(niceMax(7)).toBe(7)
    expect(niceMax(6.2)).toBe(6.5)
  })

  it('leaves a value that already sits on a step', () => {
    expect(niceMax(50000)).toBe(50000)
  })

  it('never returns zero, so an axis always has a range', () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(-5)).toBe(1)
    expect(niceMax(Number.NaN)).toBe(1)
  })
})

describe('niceTicks', () => {
  it('spans zero to the rounded maximum', () => {
    const ticks = niceTicks(48200)

    expect(ticks[0]).toBe(0)
    expect(ticks.at(-1)).toBe(50000)
  })

  it('returns the requested number of ticks', () => {
    expect(niceTicks(100, 5)).toHaveLength(5)
  })
})
