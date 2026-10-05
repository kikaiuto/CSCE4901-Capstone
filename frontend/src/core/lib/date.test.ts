import { describe, expect, it } from 'vitest'
import { longDate, monthLabel, parseDate, shortDate } from './date'

describe('parseDate', () => {
  it('splits an ISO date into numbers', () => {
    expect(parseDate('2026-09-25')).toEqual({ year: 2026, month: 9, day: 25 })
  })

  it('drops leading zeros from the month and day', () => {
    expect(parseDate('2026-01-05')).toEqual({ year: 2026, month: 1, day: 5 })
  })
})

describe('shortDate', () => {
  it('formats a date as month and day', () => {
    expect(shortDate('2026-09-28')).toBe('Sep 28')
  })

  it('does not pad a single digit day', () => {
    expect(shortDate('2026-10-02')).toBe('Oct 2')
  })

  it('handles the first month', () => {
    expect(shortDate('2026-01-15')).toBe('Jan 15')
  })

  it('handles the last month', () => {
    expect(shortDate('2026-12-31')).toBe('Dec 31')
  })
})

describe('longDate', () => {
  it('names the weekday for the Today header', () => {
    expect(longDate('2026-09-25')).toBe('Friday, Sep 25')
  })

  it('reads the weekday in UTC rather than local time', () => {
    expect(longDate('2026-01-01')).toBe('Thursday, Jan 1')
  })
})

describe('monthLabel', () => {
  it('returns the abbreviated month', () => {
    expect(monthLabel('2026-04-01')).toBe('Apr')
  })
})
