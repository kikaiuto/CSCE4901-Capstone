import { currentUser } from '@/addons/base/fixtures/org'
import { accessMatrix, type AccessArea, type AccessLevel } from '@/addons/base/fixtures/people'

export type { AccessArea, AccessLevel }

export function accessTo(area: AccessArea): AccessLevel {
  return accessMatrix[currentUser.role]?.[area] ?? 'none'
}

export function canSee(area: AccessArea): boolean {
  return accessTo(area) !== 'none'
}

export function canWrite(area: AccessArea): boolean {
  return accessTo(area) === 'full'
}

export function useAccess(area: AccessArea) {
  const level = accessTo(area)

  return {
    level,
    canSee: level !== 'none',
    canWrite: level === 'full',
    readOnly: level === 'view',
  }
}
