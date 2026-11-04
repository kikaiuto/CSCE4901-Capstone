import { act, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notify, TOAST_TTL_MS, useToasts } from './notify'
import { Toasts } from './Toasts'

describe('notify', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    notify.clear()
    vi.useRealTimers()
  })

  it('publishes a toast to subscribers', () => {
    const { result } = renderHook(() => useToasts())

    act(() => {
      notify.success('Product created')
    })

    expect(result.current).toEqual([{ id: expect.any(Number), tone: 'success', message: 'Product created' }])
  })

  it('dismisses a toast by id', () => {
    const { result } = renderHook(() => useToasts())
    let id = 0

    act(() => {
      id = notify.info('Saved')
    })
    act(() => {
      notify.dismiss(id)
    })

    expect(result.current).toEqual([])
  })

  it('dismisses a toast on its own after its time to live', () => {
    const { result } = renderHook(() => useToasts())

    act(() => {
      notify.error('Could not post the entry')
    })
    act(() => {
      vi.advanceTimersByTime(TOAST_TTL_MS.error - 1)
    })
    expect(result.current).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toEqual([])
  })

  it('gives errors longer than notices', () => {
    expect(TOAST_TTL_MS.error).toBeGreaterThan(TOAST_TTL_MS.success)
  })
})

describe('Toasts', () => {
  afterEach(() => {
    notify.clear()
  })

  it('announces a notice politely and an error assertively', () => {
    render(<Toasts />)

    act(() => {
      notify.success('Entry posted')
      notify.error('Could not reach the server')
    })

    expect(within(screen.getByRole('status')).getByText('Entry posted')).toBeInTheDocument()
    expect(
      within(screen.getByRole('alert')).getByText('Could not reach the server'),
    ).toBeInTheDocument()
  })

  it('removes a toast when its dismiss button is pressed', async () => {
    render(<Toasts />)

    act(() => {
      notify.info('Reloaded')
    })
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByText('Reloaded')).not.toBeInTheDocument()
  })
})
