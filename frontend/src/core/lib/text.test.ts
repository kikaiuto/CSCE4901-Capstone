import { describe, expect, it } from 'vitest'
import { countOf, initials, pluralize } from './text'

describe('initials', () => {
  it('takes the first letter of two names', () => {
    expect(initials('Dana Owens')).toBe('DO')
  })

  it('stops at two letters for longer names', () => {
    expect(initials('Maria del Carmen Garcia')).toBe('MD')
  })

  it('handles a single name', () => {
    expect(initials('Jamie')).toBe('J')
  })

  it('ignores extra whitespace', () => {
    expect(initials('  Pat   Kim  ')).toBe('PK')
  })

  it('returns an empty string for an empty name', () => {
    expect(initials('')).toBe('')
  })
})

describe('pluralize', () => {
  it('uses the singular for one', () => {
    expect(pluralize(1, 'order')).toBe('order')
  })

  it('uses the plural for zero', () => {
    expect(pluralize(0, 'order')).toBe('orders')
  })

  it('uses the plural for many', () => {
    expect(pluralize(48, 'order')).toBe('orders')
  })

  it('accepts an irregular plural', () => {
    expect(pluralize(2, 'entry', 'entries')).toBe('entries')
  })
})

describe('countOf', () => {
  it('pairs the count with the singular', () => {
    expect(countOf(1, 'thing')).toBe('1 thing')
  })

  it('pairs the count with the plural', () => {
    expect(countOf(6, 'thing')).toBe('6 things')
  })
})
