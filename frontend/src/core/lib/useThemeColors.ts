import { useSyncExternalStore } from 'react'
import { subscribe, useTheme } from './theme'

const FALLBACK: Record<string, string> = {
  '--color-chart-current': '#e6e6ec',
  '--color-chart-previous': '#66666f',
  '--color-chart-third': '#9a9aa6',
  '--color-chart-highlight': '#6e8bff',
  '--color-chart-grid': '#1e1e24',
}

export function readColor(token: string): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
    return value || FALLBACK[token] || 'currentColor'
  } catch {
    return FALLBACK[token] || 'currentColor'
  }
}

export function useThemeColors(tokens: string[]): string[] {
  useTheme()
  return useSyncExternalStore(
    subscribe,
    () => tokens.map(readColor).join('|'),
    () => tokens.map((token) => FALLBACK[token] ?? 'currentColor').join('|'),
  ).split('|')
}
