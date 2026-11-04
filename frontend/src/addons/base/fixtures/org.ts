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

export const demoWorkspaces: SessionOrganization[] = [
  { id: '6fd03a14-80fd-5476-a84e-ae0c2c0c6e4d', name: 'Northstar Electronics Demo' },
  { id: 'd3d1a2ca-f45e-5da5-8ef8-3486edc3fe4a', name: 'Cedar Retail Demo' },
]

export const demoSession: Session = {
  token: 'demo-fixture-token',
  user: currentUser,
  organization,
}

export const today = '2026-09-25'
