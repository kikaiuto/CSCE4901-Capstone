import { useEffect, useRef, useState } from 'react'

export type PresenceState = 'open' | 'closed'

export interface Presence {
  mounted: boolean
  state: PresenceState
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function usePresence(open: boolean, exitMs: number): Presence {
  const [lingering, setLingering] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    window.clearTimeout(timer.current)

    if (open) {
      setLingering(true)
      return
    }

    timer.current = window.setTimeout(() => setLingering(false), exitMs)
    return () => window.clearTimeout(timer.current)
  }, [open, exitMs])

  useEffect(() => {
    return () => window.clearTimeout(timer.current)
  }, [])

  return {
    mounted: reduced ? open : open || lingering,
    state: open ? 'open' : 'closed',
  }
}
