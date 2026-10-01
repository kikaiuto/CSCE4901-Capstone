import type { CSSProperties } from 'react'

export function riseAt(index: number): CSSProperties {
  return { '--rise-index': Math.max(0, Math.trunc(index)) } as CSSProperties
}
