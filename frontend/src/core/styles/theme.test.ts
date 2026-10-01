import { describe, expect, it } from 'vitest'
import palette from './palette.css?raw'
import theme from './theme.css?raw'

const INVERTED = [
  '--t-canvas',
  '--t-surface',
  '--t-raised',
  '--t-line',
  '--t-ink',
  '--t-ink-muted',
  '--t-ink-inverse',
]

function blockFor(selector: RegExp): string {
  const match = selector.exec(palette)
  if (!match) return ''
  const open = palette.indexOf('{', match.index)
  const close = palette.indexOf('}', open)
  return palette.slice(open, close)
}

function tokensIn(block: string): string[] {
  return [...block.matchAll(/(--t-[a-z0-9-]+)\s*:/g)].map((match) => match[1]).sort()
}

function valueOf(block: string, token: string): string | undefined {
  return new RegExp(`${token}\\s*:\\s*([^;]+);`).exec(block)?.[1].trim()
}

const dark = blockFor(/:root\s*\{/)
const light = blockFor(/:root\[data-theme=['"]light['"]\]\s*\{/)

describe('palette', () => {
  it('defines both theme blocks', () => {
    expect(dark).not.toBe('')
    expect(light).not.toBe('')
  })

  it('defines the same tokens in both themes', () => {
    expect(tokensIn(light)).toEqual(tokensIn(dark))
  })

  it('defines every token the theme binds', () => {
    const bound = [...theme.matchAll(/var\((--t-[a-z0-9-]+)\)/g)].map((match) => match[1])
    const known = tokensIn(dark)
    expect(bound.filter((token) => !known.includes(token))).toEqual([])
  })

  it('inverts the surface and ink ramp between themes', () => {
    const shared = INVERTED.filter((token) => valueOf(dark, token) === valueOf(light, token))
    expect(shared).toEqual([])
  })

  it('leaves no IBM Plex or serif references behind', () => {
    expect(theme).not.toMatch(/IBM Plex/)
    expect(theme).not.toMatch(/--font-serif/)
  })
})
