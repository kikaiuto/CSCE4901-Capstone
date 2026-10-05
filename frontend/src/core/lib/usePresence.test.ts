import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePresence } from './usePresence'

function allowMotion() {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

describe('usePresence', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays unmounted when it starts closed', () => {
    const { result } = renderHook(() => usePresence(false, 140))

    expect(result.current.mounted).toBe(false)
    expect(result.current.state).toBe('closed')
  })

  it('mounts immediately when opened', () => {
    const { result, rerender } = renderHook(({ open }) => usePresence(open, 140), {
      initialProps: { open: false },
    })

    rerender({ open: true })

    expect(result.current.mounted).toBe(true)
    expect(result.current.state).toBe('open')
  })

  it('holds the mount for the exit duration when motion is allowed', () => {
    const restore = allowMotion()
    vi.useFakeTimers()

    const { result, rerender } = renderHook(({ open }) => usePresence(open, 140), {
      initialProps: { open: true },
    })

    rerender({ open: false })

    expect(result.current.mounted).toBe(true)
    expect(result.current.state).toBe('closed')

    act(() => {
      vi.advanceTimersByTime(140)
    })

    expect(result.current.mounted).toBe(false)
    restore()
  })

  it('unmounts at once under reduced motion', () => {
    const { result, rerender } = renderHook(({ open }) => usePresence(open, 140), {
      initialProps: { open: true },
    })

    rerender({ open: false })

    expect(result.current.mounted).toBe(false)
  })
})
