export const manifest = {
  id: 'procurement',
  label: 'Procurement',
  icon: 'procurement',
  track: 'INV',
  screens: ['S-06 Receive purchase order'],
  nav: {
    group: 'operations',
    to: '/procurement',
  },
  queueGroups: ['receive'],
}
