import { accessMatrix, type AccessArea, type AccessLevel } from '@/addons/base/fixtures/people'
import type { Role } from './roles'
import { getSession, useSession } from './session'

export type { AccessArea, AccessLevel }

export function accessTo(area: AccessArea, role: Role | undefined = getSession()?.user.role): AccessLevel {
  if (!role) return 'none'
  return accessMatrix[role]?.[area] ?? 'none'
}

export function canSee(area: AccessArea): boolean {
  return accessTo(area) !== 'none'
}

export function canWrite(area: AccessArea): boolean {
  return accessTo(area) === 'full'
}

export function useAccess(area: AccessArea) {
  const session = useSession()
  const level = accessTo(area, session?.user.role)

  return {
    level,
    canSee: level !== 'none',
    canWrite: level === 'full',
    readOnly: level === 'view',
  }
}
