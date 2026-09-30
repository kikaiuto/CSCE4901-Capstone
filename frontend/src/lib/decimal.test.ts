import { describe, expect, it } from 'vitest'
import { decimal, money, parseDecimal, percent, quantity } from './decimal'

describe('parseDecimal', () => {
  it('splits an unsigned value', () => {
    expect(parseDecimal('317.50')).toEqual({ negative: false, whole: '317', fraction: '50' })
  })

  it('records a negative sign without keeping it in the digits', () => {
    expect(parseDecimal('-100.00')).toEqual({ negative: true, whole: '100', fraction: '00' })
  })

  it('strips an explicit plus sign', () => {
    expect(parseDecimal('+15.2')).toEqual({ negative: false, whole: '15', fraction: '2' })
  })

  it('defaults a bare fraction to a zero whole part', () => {
    expect(parseDecimal('.5')).toEqual({ negative: false, whole: '0', fraction: '5' })
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseDecimal('  42  ')).toEqual({ negative: false, whole: '42', fraction: '' })
  })
})

describe('decimal', () => {
  it('pads to two places by default', () => {
    expect(decimal('317.5')).toBe('317.50')
  })

  it('groups thousands', () => {
    expect(decimal('28640.25')).toBe('28,640.25')
  })

  it('groups millions', () => {
    expect(decimal('1234567.89')).toBe('1,234,567.89')
  })

  it('does not group a three digit value', () => {
    expect(decimal('395')).toBe('395.00')
  })

  it('truncates rather than rounding beyond the requested places', () => {
    expect(decimal('11.8420', { places: 2 })).toBe('11.84')
  })

  it('keeps four places for unit costs', () => {
    expect(decimal('11.842', { places: 4 })).toBe('11.8420')
  })

  it('omits the decimal point when places is zero', () => {
    expect(decimal('12940', { places: 0 })).toBe('12,940')
  })

  it('keeps the minus sign in front of the digits', () => {
    expect(decimal('-100')).toBe('-100.00')
  })

  it('adds a plus sign when asked', () => {
    expect(decimal('1.1', { places: 1, sign: 'always' })).toBe('+1.1')
  })

  it('never doubles a sign on a negative value', () => {
    expect(decimal('-2.3', { places: 1, sign: 'always' })).toBe('-2.3')
  })
})

describe('money', () => {
  it('puts the currency symbol inside the sign', () => {
    expect(money('-100.00')).toBe('-$100.00')
  })

  it('formats a positive amount', () => {
    expect(money('1205')).toBe('$1,205.00')
  })

  it('drops the decimals when places is zero', () => {
    expect(money('127800', { places: 0 })).toBe('$127,800')
  })

  it('adds a plus sign outside the symbol', () => {
    expect(money('500', { sign: 'always' })).toBe('+$500.00')
  })
})

describe('quantity', () => {
  it('shows no decimals by default', () => {
    expect(quantity('50')).toBe('50')
  })

  it('groups large counts', () => {
    expect(quantity('12940')).toBe('12,940')
  })

  it('signs a stock movement when asked', () => {
    expect(quantity('50', { sign: 'always' })).toBe('+50')
  })

  it('keeps a negative movement negative', () => {
    expect(quantity('-46', { sign: 'always' })).toBe('-46')
  })
})

describe('percent', () => {
  it('uses one place by default', () => {
    expect(percent('34.2')).toBe('34.2%')
  })

  it('pads a whole number to one place', () => {
    expect(percent('15')).toBe('15.0%')
  })

  it('signs a positive change', () => {
    expect(percent('15.2', { sign: 'always' })).toBe('+15.2%')
  })

  it('signs a negative change once', () => {
    expect(percent('-2.3', { sign: 'always' })).toBe('-2.3%')
  })
})
