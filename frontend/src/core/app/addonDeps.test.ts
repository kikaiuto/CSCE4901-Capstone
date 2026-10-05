import { describe, expect, it } from 'vitest'
import { addonsByName } from './registry'

const sources = import.meta.glob('/src/addons/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const IMPORT = /['"]@\/addons\/([a-z]+)/g

function ownerOf(path: string): string {
  return path.split('/')[3]
}

const files = Object.entries(sources).filter(([path]) => !path.includes('.test.'))

describe('addon dependencies', () => {
  it('finds the addon sources to check', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('declares a manifest for every addon directory', () => {
    const owners = new Set(files.map(([path]) => ownerOf(path)))

    for (const owner of owners) {
      expect(addonsByName[owner], `${owner} has no manifest`).toBeDefined()
    }
  })

  it('imports only from addons the manifest depends on', () => {
    const violations: string[] = []

    for (const [path, source] of files) {
      const owner = ownerOf(path)
      const depends = addonsByName[owner]?.depends ?? []

      for (const match of source.matchAll(IMPORT)) {
        const imported = match[1]
        if (imported === owner) continue
        if (depends.includes(imported)) continue
        violations.push(`${path}: ${owner} imports ${imported}, which it does not depend on`)
      }
    }

    expect(violations).toEqual([])
  })

  it('keeps the dependency graph free of cycles', () => {
    const seen = new Set<string>()
    const stack = new Set<string>()
    const cycles: string[] = []

    function walk(name: string, trail: string[]) {
      if (stack.has(name)) {
        cycles.push([...trail, name].join(' -> '))
        return
      }
      if (seen.has(name)) return

      seen.add(name)
      stack.add(name)
      for (const dep of addonsByName[name]?.depends ?? []) walk(dep, [...trail, name])
      stack.delete(name)
    }

    for (const name of Object.keys(addonsByName)) walk(name, [])

    expect(cycles).toEqual([])
  })

  it('reaches from core into an addon only at the known assembly points', () => {
    const coreSources = import.meta.glob('/src/core/**/*.{ts,tsx}', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>

    const reaching = Object.entries(coreSources)
      .filter(([path]) => !path.includes('.test.'))
      .filter(([, source]) => /['"]@\/addons\//.test(source))
      .map(([path]) => path.replace('/src/core/', ''))
      .sort()

    expect(reaching).toEqual([
      'app/AppShell.tsx',
      'app/ModuleRail.tsx',
      'app/overlays.ts',
      'app/registry.ts',
      'app/useAccess.ts',
    ])
  })
})
