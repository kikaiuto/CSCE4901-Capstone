export type CreditStatus = 'active' | 'cancelled'

export interface CustomerDocument {
  id: string
  document: string
  date: string
  amount: string
  status: 'draft' | 'confirmed' | 'fulfilled' | 'cancelled'
  action: string
}

export interface Customer {
  id: string
  name: string
  contact: string
  email: string
  terms: string
  credit: string
  creditStatus: CreditStatus
  openOrders: string
  receivables: string
  lifetime: string
  averageOrder: string
  lastOrder: string
  documents: CustomerDocument[]
  history: { label: string; value: number }[]
}

function months(values: number[]): { label: string; value: number }[] {
  const labels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  return labels.map((label, index) => ({ label, value: values[index] }))
}

export const customers: Customer[] = [
  {
    id: 'cus-riverside',
    name: 'Riverside Hardware',
    contact: 'Dale Whitford',
    email: 'dale@riversidehardware.com',
    terms: 'Net 30',
    credit: 'good standing',
    creditStatus: 'active',
    openOrders: '1',
    receivables: '461.50',
    lifetime: '18420.00',
    averageOrder: '612.00',
    lastOrder: '2026-09-25',
    documents: [
      { id: 'd1', document: 'SO-1044', date: '2026-09-25', amount: '317.50', status: 'draft', action: 'Review' },
      { id: 'd2', document: 'SO-1039', date: '2026-09-22', amount: '144.00', status: 'fulfilled', action: 'Open' },
    ],
    history: months([980, 1240, 1610, 1180, 1420, 1360, 1840, 1520, 1710, 1930, 2140, 1480]),
  },
  {
    id: 'cus-blueoak',
    name: 'Blue Oak Builders',
    contact: 'Priya Raman',
    email: 'priya@blueoakbuilders.com',
    terms: 'Net 30',
    credit: 'good standing',
    creditStatus: 'active',
    openOrders: '1',
    receivables: '2140.00',
    lifetime: '31750.00',
    averageOrder: '1684.00',
    lastOrder: '2026-09-24',
    documents: [
      { id: 'd1', document: 'SO-1043', date: '2026-09-24', amount: '2140.00', status: 'confirmed', action: 'Fulfil' },
      { id: 'd2', document: 'SO-1037', date: '2026-09-20', amount: '1230.00', status: 'fulfilled', action: 'Open' },
    ],
    history: months([2100, 2480, 2950, 2240, 2610, 2380, 3120, 2740, 2890, 3310, 3480, 3370]),
  },
  {
    id: 'cus-harbor',
    name: 'Harbor Home Goods',
    contact: 'Tomas Lind',
    email: 'tomas@harborhome.com',
    terms: 'Net 15',
    credit: 'good standing',
    creditStatus: 'active',
    openOrders: '1',
    receivables: '864.20',
    lifetime: '14260.00',
    averageOrder: '742.00',
    lastOrder: '2026-09-24',
    documents: [
      { id: 'd1', document: 'SO-1042', date: '2026-09-24', amount: '864.20', status: 'confirmed', action: 'Fulfil' },
      { id: 'd2', document: 'SO-1035', date: '2026-09-18', amount: '1048.00', status: 'fulfilled', action: 'Open' },
    ],
    history: months([860, 1140, 1320, 980, 1210, 1080, 1460, 1190, 1340, 1520, 1610, 1912]),
  },
  {
    id: 'cus-metro',
    name: 'Metro Fixtures',
    contact: 'Ayesha Noor',
    email: 'ayesha@metrofixtures.com',
    terms: 'Net 30',
    credit: 'good standing',
    creditStatus: 'active',
    openOrders: '1',
    receivables: '0.00',
    lifetime: '9840.00',
    averageOrder: '548.00',
    lastOrder: '2026-09-19',
    documents: [
      { id: 'd1', document: 'SO-1036', date: '2026-09-19', amount: '676.40', status: 'draft', action: 'Review' },
    ],
    history: months([540, 720, 910, 640, 780, 820, 1040, 760, 880, 1120, 960, 676]),
  },
  {
    id: 'cus-summit',
    name: 'Summit Tools',
    contact: 'Reggie Alvarez',
    email: 'reggie@summittools.com',
    terms: 'Net 15',
    credit: 'good standing',
    creditStatus: 'active',
    openOrders: '0',
    receivables: '0.00',
    lifetime: '7310.00',
    averageOrder: '418.00',
    lastOrder: '2026-09-22',
    documents: [
      { id: 'd1', document: 'SO-1040', date: '2026-09-22', amount: '395.00', status: 'fulfilled', action: 'Open' },
      { id: 'd2', document: 'SO-1034', date: '2026-09-17', amount: '512.00', status: 'fulfilled', action: 'Open' },
    ],
    history: months([420, 560, 680, 490, 610, 530, 740, 580, 640, 820, 710, 907]),
  },
  {
    id: 'cus-pine',
    name: 'Pine & Co.',
    contact: 'Nora Beckett',
    email: 'nora@pineandco.com',
    terms: 'Prepaid',
    credit: 'on hold',
    creditStatus: 'cancelled',
    openOrders: '0',
    receivables: '2902.75',
    lifetime: '21480.00',
    averageOrder: '1194.00',
    lastOrder: '2026-09-21',
    documents: [
      { id: 'd1', document: 'SO-1038', date: '2026-09-21', amount: '2902.75', status: 'cancelled', action: 'Open' },
    ],
    history: months([1840, 2210, 2640, 1920, 2280, 2060, 2740, 2380, 2510, 2180, 1640, 0]),
  },
]

export const customerTotals = {
  count: customers.length,
  receivables: '12940.00',
  openOrders: 4,
}
