import { createContext, useContext, useEffect } from 'react'

export interface RecordPage {
  index: number
  total: number
  prev?: string
  next?: string
  label: string
}

export type SetRecordPage = (page: RecordPage | null) => void

export const RecordPagerContext = createContext<SetRecordPage | null>(null)

export function useRecordPager<T>(
  items: T[],
  isCurrent: (item: T) => boolean,
  toPath: (item: T) => string,
  label: string,
) {
  const setPage = useContext(RecordPagerContext)

  const position = items.findIndex(isCurrent)
  const total = items.length
  const prev = position > 0 ? toPath(items[position - 1]) : undefined
  const next = position >= 0 && position < total - 1 ? toPath(items[position + 1]) : undefined

  useEffect(() => {
    if (!setPage) return

    if (position < 0) {
      setPage(null)
      return
    }

    setPage({ index: position + 1, total, prev, next, label })
    return () => setPage(null)
  }, [setPage, position, total, prev, next, label])
}
