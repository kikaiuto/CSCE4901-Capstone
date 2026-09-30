import { useCallback, useMemo, useState } from 'react'

export interface Selection<T extends string> {
  selected: ReadonlySet<T>
  count: number
  allSelected: boolean
  someSelected: boolean
  isSelected: (id: T) => boolean
  toggle: (id: T) => void
  toggleAll: () => void
  clear: () => void
}

export function useSelection<T extends string>(ids: readonly T[]): Selection<T> {
  const [selected, setSelected] = useState<ReadonlySet<T>>(() => new Set())

  const visible = useMemo(() => ids.filter((id) => selected.has(id)), [ids, selected])

  const toggle = useCallback((id: T) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])

  const allSelected = ids.length > 0 && visible.length === ids.length

  const toggleAll = useCallback(() => {
    setSelected((current) => {
      const everySelected = ids.length > 0 && ids.every((id) => current.has(id))
      return everySelected ? new Set() : new Set(ids)
    })
  }, [ids])

  return {
    selected,
    count: visible.length,
    allSelected,
    someSelected: visible.length > 0 && !allSelected,
    isSelected: useCallback((id: T) => selected.has(id), [selected]),
    toggle,
    toggleAll,
    clear,
  }
}
