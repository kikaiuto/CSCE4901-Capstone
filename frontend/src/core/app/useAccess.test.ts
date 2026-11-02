import { describe, expect, it } from 'vitest'
import { accessMatrix } from '@/addons/base/fixtures/people'
import { demoSession, ROLES } from '@/addons/base/fixtures/org'
import { accessTo, canSee, canWrite } from './useAccess'
import { navItems, railItems } from './registry'
import { signIn, signOut } from './session'

describe('access', () => {
  it('reads the level the matrix gives the signed-in role', () => {
    expect(accessTo('Sales')).toBe(accessMatrix.Owner.Sales)
    expect(canSee('Accounting')).toBe(true)
    expect(canWrite('Admin')).toBe(true)
  })

  it('covers every area for every role', () => {
    for (const role of ROLES) {
      for (const area of ['Sales', 'Inventory', 'Procurement', 'Accounting', 'Admin'] as const) {
        expect(accessMatrix[role][area], `${role} has no level for ${area}`).toBeDefined()
      }
    }
  })

  it('gives only Owner and Admin the admin area', () => {
    const admins = ROLES.filter((role) => accessMatrix[role].Admin !== 'none')

    expect(admins).toEqual(['Owner', 'Admin'])
  })

  it('shows the Owner every module in the rail', () => {
    expect(railItems().map((item) => item.name)).toEqual([
      'home',
      'sales',
      'inventory',
      'procurement',
      'accounting',
    ])
    expect(navItems('admin')).toHaveLength(1)
  })

  it('follows the session, so a Sales user loses the modules Sales cannot see', () => {
    signIn({ ...demoSession, user: { ...demoSession.user, role: 'Sales' } })

    expect(canSee('Accounting')).toBe(false)
    expect(railItems().map((item) => item.name)).toEqual(['home', 'sales', 'inventory'])
    expect(navItems('admin')).toHaveLength(0)
  })

  it('grants a visitor who is not signed in nothing but the home destination', () => {
    signOut()

    expect(accessTo('Sales')).toBe('none')
    expect(railItems().map((item) => item.name)).toEqual(['home'])
    expect(navItems('admin')).toHaveLength(0)
  })
})
