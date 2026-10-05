import { useCallback, useState } from 'react'

export interface SyncedHover {
  activeIndex: number | null
  setActiveIndex: (index: number | null) => void
  clear: () => void
}

export function useSyncedHover(): SyncedHover {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const clear = useCallback(() => setActiveIndex(null), [])

  return { activeIndex, setActiveIndex, clear }
}
