export interface Organization {
  id: string
  name: string
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Admin' | 'Sales' | 'Warehouse'
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
