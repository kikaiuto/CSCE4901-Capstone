import { useRef } from 'react'

const seen = new Set<string>()

export function resetFirstVisits() {
  seen.clear()
}

export function useFirstVisit(key: string): boolean {
  const fresh = useRef<boolean | undefined>(undefined)

  if (fresh.current === undefined) {
    fresh.current = !seen.has(key)
    seen.add(key)
  }

  return fresh.current
}
