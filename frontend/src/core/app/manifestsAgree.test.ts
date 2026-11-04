import { describe, expect, it } from 'vitest'
import { addons } from './registry'

const sources = import.meta.glob('../../../../backend/app/addons/*/__manifest__.py', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

interface BackendManifest {
  name: string
  depends: string[]
  screens: string[]
}

function listIn(source: string, key: string, file: string): string[] {
  const match = new RegExp(`"${key}":\\s*\\[([^\\]]*)\\]`).exec(source)
  if (!match) throw new Error(`${file} has no "${key}" list`)
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1])
}

function readBackendManifests(): BackendManifest[] {
  const files = Object.entries(sources)
  if (files.length === 0) {
    throw new Error('no backend manifests found; run the frontend tests from a full checkout')
  }

  return files.map(([file, source]) => {
    const name = /"name":\s*"([a-z]+)"/.exec(source)?.[1]
    if (!name) throw new Error(`${file} has no "name"`)
    return {
      name,
      depends: listIn(source, 'depends', file),
      screens: listIn(source, 'screens', file),
    }
  })
}

const sorted = (values: string[]) => [...values].sort()

describe('frontend and backend manifests', () => {
  const backend = readBackendManifests()
  const backendByName = Object.fromEntries(backend.map((manifest) => [manifest.name, manifest]))

  it('name the same addons', () => {
    expect(sorted(addons.map((addon) => addon.name))).toEqual(
      sorted(backend.map((manifest) => manifest.name)),
    )
  })

  for (const addon of addons) {
    it(`agree on what ${addon.name} depends on`, () => {
      expect(sorted(addon.depends)).toEqual(sorted(backendByName[addon.name]?.depends ?? []))
    })

    it(`agree on which screens ${addon.name} owns`, () => {
      expect(sorted(addon.screens)).toEqual(sorted(backendByName[addon.name]?.screens ?? []))
    })
  }
})
