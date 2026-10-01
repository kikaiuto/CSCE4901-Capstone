export interface Organization {
  id: string
  name: string
}

export const ROLES = [
  'Owner',
  'Admin',
  'Sales',
  'Inventory',
  'Purchasing',
  'Accounting',
] as const

export type Role = (typeof ROLES)[number]

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: Role
}

export const organization: Organization = {
  id: 'org_acme',
  name: 'Acme Supply',
}

export const currentUser: CurrentUser = {
  id: 'usr_dana',
  name: 'Dana Owens',
  email: 'dana@acmesupply.com',
  role: 'Owner',
}

export const today = '2026-09-25'
