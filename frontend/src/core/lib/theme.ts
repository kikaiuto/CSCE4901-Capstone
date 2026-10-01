import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

export const STORAGE_KEY = 's7-theme'

const listeners = new Set<() => void>()

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function resolve(): Theme {
  return readStored() ?? (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
}

let current: Theme = resolve()

function apply(theme: Theme) {
  const root = document.documentElement
  if (theme === 'light') {
    root.dataset.theme = 'light'
  } else {
    delete root.dataset.theme
  }
}

export function getTheme(): Theme {
  return current
}

export function setTheme(theme: Theme) {
  if (theme === current) return
  current = theme
  apply(theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* empty */
  }
  for (const listener of listeners) listener()
}

export function toggleTheme() {
  setTheme(current === 'dark' ? 'light' : 'dark')
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function syncFromDocument() {
  current = resolve()
  apply(current)
  for (const listener of listeners) listener()
}

apply(current)

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => 'dark' as Theme)
}
