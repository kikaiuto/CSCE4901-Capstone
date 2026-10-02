const FALLBACK: Record<string, string> = {
  '--color-chart-current': '#16150f',
  '--color-chart-previous': '#8a8a8a',
  '--color-chart-third': '#5e5e5e',
  '--color-chart-highlight': '#2647e0',
  '--color-chart-grid': '#ebeae7',
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
  return tokens.map(readColor)
}
