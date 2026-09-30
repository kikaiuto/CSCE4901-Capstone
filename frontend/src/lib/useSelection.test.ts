import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSelection } from './useSelection'

const IDS = ['so-1044', 'so-1043', 'so-1042'] as const

describe('useSelection', () => {
  it('starts with nothing selected', () => {
    const { result } = renderHook(() => useSelection(IDS))

    expect(result.current.count).toBe(0)
    expect(result.current.allSelected).toBe(false)
    expect(result.current.someSelected).toBe(false)
  })

  it('selects a row', () => {
    const { result } = renderHook(() => useSelection(IDS))

    act(() => result.current.toggle('so-1044'))

    expect(result.current.count).toBe(1)
    expect(result.current.isSelected('so-1044')).toBe(true)
    expect(result.current.isSelected('so-1043')).toBe(false)
  })

  it('deselects a row that was selected', () => {
    const { result } = renderHook(() => useSelection(IDS))

    act(() => result.current.toggle('so-1044'))
    act(() => result.current.toggle('so-1044'))

    expect(result.current.count).toBe(0)
  })

  it('reports a partial selection as some but not all', () => {
    const { result } = renderHook(() => useSelection(IDS))

    act(() => result.current.toggle('so-1044'))

    expect(result.current.someSelected).toBe(true)
    expect(result.current.allSelected).toBe(false)
  })

  it('selects every row with toggleAll', () => {
    const { result } = renderHook(() => useSelection(IDS))

    act(() => result.current.toggleAll())

    expect(result.current.count).toBe(3)
    expect(result.current.allSelected).toBe(true)
    expect(result.current.someSelected).toBe(false)
  })

  it('clears every row when toggleAll runs on a full selection', () => {
    const { result } = renderHook(() => useSelection(IDS))

    act(() => result.current.toggleAll())
    act(() => result.current.toggleAll())

    expect(result.current.count).toBe(0)
  })

  it('completes the selection when toggleAll runs on a partial selection', () => {
    const { result } = renderHook(() => useSelection(IDS))

    act(() => result.current.toggle('so-1044'))
    act(() => result.current.toggleAll())

    expect(result.current.allSelected).toBe(true)
  })

  it('clears the selection', () => {
    const { result } = renderHook(() => useSelection(IDS))

    act(() => result.current.toggleAll())
    act(() => result.current.clear())

    expect(result.current.count).toBe(0)
  })

  it('counts only ids that are still visible after the list changes', () => {
    const { result, rerender } = renderHook(({ ids }) => useSelection(ids), {
      initialProps: { ids: IDS as readonly string[] },
    })

    act(() => result.current.toggleAll())
    rerender({ ids: ['so-1044'] })

    expect(result.current.count).toBe(1)
    expect(result.current.allSelected).toBe(true)
  })

  it('treats an empty list as nothing selected', () => {
    const { result } = renderHook(() => useSelection([] as readonly string[]))

    act(() => result.current.toggleAll())

    expect(result.current.count).toBe(0)
    expect(result.current.allSelected).toBe(false)
  })
})
