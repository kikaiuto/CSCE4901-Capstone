export const manifest = {
  id: 'sales',
  label: 'Sales',
  icon: 'sales',
  track: 'SLS',
  screens: ['S-03 Sales orders', 'S-04 Sales order detail'],
  nav: {
    group: 'operations',
    to: '/sales',
  },
  queueGroups: ['confirm', 'fix'],
}
