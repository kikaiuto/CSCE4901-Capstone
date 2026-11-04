import type { CurrentUserResponse } from '@/core/app/session'
import { ROLES, type Role } from './org'

export type AccessLevel = 'full' | 'view' | 'none'

export const accessAreas = ['Sales', 'Inventory', 'Procurement', 'Accounting', 'Admin'] as const

export type AccessArea = (typeof accessAreas)[number]

export const accessMatrix: Record<Role, Record<AccessArea, AccessLevel>> = {
  Owner: { Sales: 'full', Inventory: 'full', Procurement: 'full', Accounting: 'full', Admin: 'full' },
  Admin: { Sales: 'full', Inventory: 'full', Procurement: 'full', Accounting: 'full', Admin: 'full' },
  Sales: { Sales: 'full', Inventory: 'view', Procurement: 'none', Accounting: 'none', Admin: 'none' },
  Inventory: { Sales: 'view', Inventory: 'full', Procurement: 'view', Accounting: 'none', Admin: 'none' },
  Purchasing: { Sales: 'none', Inventory: 'view', Procurement: 'full', Accounting: 'view', Admin: 'none' },
  Accounting: { Sales: 'view', Inventory: 'view', Procurement: 'view', Accounting: 'full', Admin: 'none' },
}

export const roleOrder = ROLES

const organization = { organization_id: 'org-northstar', organization_name: 'Northstar Electronics Demo' }

export const demoUsers: CurrentUserResponse[] = [
  { ...organization, user_id: 'usr_dana', role: 'owner', email: 'owner@northstar.demo', full_name: 'Dana Owens', is_active: true },
  { ...organization, user_id: 'usr_mo', role: 'admin', email: 'admin@northstar.demo', full_name: 'Mo Ferrara', is_active: true },
  { ...organization, user_id: 'usr_pri', role: 'sales', email: 'sales@northstar.demo', full_name: 'Priya Raman', is_active: true },
  { ...organization, user_id: 'usr_lee', role: 'inventory', email: 'inventory@northstar.demo', full_name: 'Lee Carter', is_active: true },
  { ...organization, user_id: 'usr_sam', role: 'purchasing', email: 'purchasing@northstar.demo', full_name: 'Sam Oyelaran', is_active: false },
  { ...organization, user_id: 'usr_ted', role: 'accounting', email: 'accounting@northstar.demo', full_name: 'Ted Brill', is_active: true },
]
