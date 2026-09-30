export const manifest = {
  id: 'inventory',
  label: 'Inventory',
  icon: 'inventory',
  track: 'INV',
  screens: ['S-05 Product and stock ledger'],
  nav: {
    group: 'operations',
    to: '/inventory',
  },
  queueGroups: ['reorder'],
}
