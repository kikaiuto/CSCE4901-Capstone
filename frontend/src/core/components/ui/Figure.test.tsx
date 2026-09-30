import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Figure } from './Figure'

describe('Figure', () => {
  it('formats a decimal by default', () => {
    render(<Figure value="317.5" />)

    expect(screen.getByText('317.50')).toBeInTheDocument()
  })

  it('formats money', () => {
    render(<Figure value="1205" kind="money" />)

    expect(screen.getByText('$1,205.00')).toBeInTheDocument()
  })

  it('formats a quantity without decimals', () => {
    render(<Figure value="50" kind="quantity" />)

    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('formats a percent', () => {
    render(<Figure value="34.2" kind="percent" />)

    expect(screen.getByText('34.2%')).toBeInTheDocument()
  })

  it('passes the places option through', () => {
    render(<Figure value="11.842" places={4} />)

    expect(screen.getByText('11.8420')).toBeInTheDocument()
  })

  it('always uses the monospace figure treatment', () => {
    render(<Figure value="317.50" />)

    expect(screen.getByText('317.50')).toHaveClass('figure')
  })

  it('colours a positive value green in signed tone', () => {
    render(<Figure value="15.2" kind="percent" sign="always" tone="signed" />)

    expect(screen.getByText('+15.2%')).toHaveClass('text-positive')
  })

  it('colours a negative value red in signed tone', () => {
    render(<Figure value="-2.3" kind="percent" sign="always" tone="signed" />)

    expect(screen.getByText('-2.3%')).toHaveClass('text-negative')
  })

  it('leaves a plain tone uncoloured by sign', () => {
    render(<Figure value="-100" kind="money" />)

    expect(screen.getByText('-$100.00')).toHaveClass('text-ink')
  })
})
