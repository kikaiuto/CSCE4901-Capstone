import { useList } from '@/core/app/data'
import { ROLES, roleFromApi, type Role } from '@/core/app/roles'
import type { CurrentUserResponse } from '@/core/app/session'

export type PersonStatus = 'active' | 'inactive'

export interface Person {
  id: string
  name: string
  email: string
  role: Role | undefined
  status: PersonStatus
}

export const usePeople = () => useList<CurrentUserResponse>('/api/base/users')

export function toPerson(row: CurrentUserResponse): Person {
  return {
    id: row.user_id,
    name: row.full_name || row.email,
    email: row.email,
    role: roleFromApi(row.role),
    status: row.is_active === false ? 'inactive' : 'active',
  }
}

const rank = (role: Role | undefined) => (role ? ROLES.indexOf(role) : ROLES.length)

export function byRoleThenName(a: Person, b: Person): number {
  return rank(a.role) - rank(b.role) || a.name.localeCompare(b.name)
}
