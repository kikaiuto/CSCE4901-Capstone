export const manifest = {
  id: 'accounting',
  label: 'Accounting',
  icon: 'accounting',
  track: 'ACC',
  screens: ['S-07 Journal entry', 'S-10 Profit and loss report'],
  nav: {
    group: 'operations',
    to: '/accounting',
  },
  queueGroups: ['fix'],
}
