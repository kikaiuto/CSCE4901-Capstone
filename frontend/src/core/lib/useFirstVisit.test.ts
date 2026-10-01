import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetFirstVisits, useFirstVisit } from './useFirstVisit'

describe('useFirstVisit', () => {
  beforeEach(resetFirstVisits)

  it('is true the first time a key is seen', () => {
    const { result } = renderHook(() => useFirstVisit('home'))

    expect(result.current).toBe(true)
  })

  it('stays true across re-renders of the same mount', () => {
    const { result, rerender } = renderHook(() => useFirstVisit('home'))

    rerender()
    rerender()

    expect(result.current).toBe(true)
  })

  it('is false on a later mount of the same key', () => {
    renderHook(() => useFirstVisit('home')).unmount()

    const { result } = renderHook(() => useFirstVisit('home'))

    expect(result.current).toBe(false)
  })

  it('tracks each key separately', () => {
    renderHook(() => useFirstVisit('home')).unmount()

    expect(renderHook(() => useFirstVisit('sales/orders')).result.current).toBe(true)
    expect(renderHook(() => useFirstVisit('home')).result.current).toBe(false)
  })
})
