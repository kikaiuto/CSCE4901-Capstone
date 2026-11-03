import { ROLES, type Role } from '@/core/app/roles'
import type { Session, SessionOrganization, SessionUser } from '@/core/app/session'

export { ROLES, type Role }

export const organization: SessionOrganization = {
  id: 'org_acme',
  name: 'Acme Supply',
}

export const currentUser: SessionUser = {
  id: 'usr_dana',
  name: 'Dana Owens',
  email: 'dana@acmesupply.com',
  role: 'Owner',
}

export const demoSession: Session = {
  token: 'demo-fixture-token',
  user: currentUser,
  organization,
}

export const today = '2026-09-25'
