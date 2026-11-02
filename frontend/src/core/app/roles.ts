export const ROLES = ['Owner', 'Admin', 'Sales', 'Inventory', 'Purchasing', 'Accounting'] as const

export type Role = (typeof ROLES)[number]

const byApiName: Record<string, Role> = Object.fromEntries(
  ROLES.map((role) => [role.toLowerCase(), role]),
)

export function roleFromApi(value: string): Role | undefined {
  return byApiName[value.trim().toLowerCase()]
}
