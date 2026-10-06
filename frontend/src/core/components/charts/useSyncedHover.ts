import { useCallback, useState } from 'react'

export interface SyncedHover {
  activeIndex: number | null
  setActiveIndex: (index: number | null) => void
  clear: () => void
}

export interface ChartHoverState {
  activeTooltipIndex?: number | string | null
}

export function indexFromChartState(state: ChartHoverState): number | null {
  const raw = state.activeTooltipIndex
  const index = typeof raw === 'string' ? (raw.trim() === '' ? NaN : Number(raw)) : raw

  return typeof index === 'number' && Number.isInteger(index) && index >= 0 ? index : null
}

export function useSyncedHover(): SyncedHover {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const clear = useCallback(() => setActiveIndex(null), [])

  return { activeIndex, setActiveIndex, clear }
}
