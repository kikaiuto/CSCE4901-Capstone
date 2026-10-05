import { describe, expect, it } from 'vitest'
import palette from './palette.css?raw'
import theme from './theme.css?raw'

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

const root = blockFor(/:root\s*\{/)

describe('palette', () => {
  it('defines the root block', () => {
    expect(root).not.toBe('')
  })

  it('defines every token the theme binds', () => {
    const bound = [...theme.matchAll(/var\((--t-[a-z0-9-]+)\)/g)].map((match) => match[1])
    const known = tokensIn(root)
    expect(bound.filter((token) => !known.includes(token))).toEqual([])
  })

  it('declares a single theme', () => {
    expect(palette).not.toMatch(/data-theme/)
    expect(root).toMatch(/color-scheme:\s*light/)
  })

  it('leaves no IBM Plex or serif references behind', () => {
    expect(theme).not.toMatch(/IBM Plex/)
    expect(theme).not.toMatch(/--font-serif/)
  })
})
