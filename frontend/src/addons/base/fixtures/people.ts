import { ROLES, type Role } from './org'

export type PersonStatus = 'active' | 'invited'
export type AccessLevel = 'full' | 'view' | 'none'

export interface Person {
  id: string
  name: string
  email: string
  role: Role
  status: PersonStatus
}

export const people: Person[] = [
  { id: 'usr_dana', name: 'Dana Owens', email: 'dana@acmesupply.com', role: 'Owner', status: 'active' },
  { id: 'usr_mo', name: 'Mo Ferrara', email: 'mo@acmesupply.com', role: 'Admin', status: 'active' },
  { id: 'usr_pri', name: 'Priya Raman', email: 'priya@acmesupply.com', role: 'Sales', status: 'active' },
  { id: 'usr_lee', name: 'Lee Carter', email: 'lee@acmesupply.com', role: 'Inventory', status: 'active' },
  { id: 'usr_sam', name: 'Sam Oyelaran', email: 'sam@acmesupply.com', role: 'Purchasing', status: 'invited' },
  { id: 'usr_ted', name: 'Ted Brill', email: 'ted@acmesupply.com', role: 'Accounting', status: 'active' },
]

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

export const peopleTotals = {
  count: people.length,
  active: people.filter((person) => person.status === 'active').length,
  invited: people.filter((person) => person.status === 'invited').length,
}
