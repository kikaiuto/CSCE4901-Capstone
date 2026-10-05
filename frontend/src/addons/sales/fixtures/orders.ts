export type OrderStatus = 'draft' | 'confirmed' | 'fulfilled' | 'cancelled'

export interface SalesOrder {
  id: string
  number: string
  customer: string
  date: string
  total: string
  status: OrderStatus
  owner: string
}

export const salesOrders: SalesOrder[] = [
  { id: 'so-1044', number: 'SO-1044', customer: 'Riverside Hardware', date: '2026-09-25', total: '317.50', status: 'draft', owner: 'Jamie Lee' },
  { id: 'so-1043', number: 'SO-1043', customer: 'Blue Oak Builders', date: '2026-09-24', total: '2140.00', status: 'confirmed', owner: 'Jamie Lee' },
  { id: 'so-1042', number: 'SO-1042', customer: 'Harbor Home Goods', date: '2026-09-24', total: '864.20', status: 'confirmed', owner: 'Marco Garcia' },
  { id: 'so-1041', number: 'SO-1041', customer: 'Lakeview Supply', date: '2026-09-23', total: '1512.00', status: 'fulfilled', owner: 'Jamie Lee' },
  { id: 'so-1040', number: 'SO-1040', customer: 'Summit Tools', date: '2026-09-22', total: '395.00', status: 'fulfilled', owner: 'Marco Garcia' },
  { id: 'so-1039', number: 'SO-1039', customer: 'Riverside Hardware', date: '2026-09-22', total: '144.00', status: 'fulfilled', owner: 'Jamie Lee' },
  { id: 'so-1038', number: 'SO-1038', customer: 'Pine & Co.', date: '2026-09-21', total: '2902.75', status: 'cancelled', owner: 'Marco Garcia' },
  { id: 'so-1037', number: 'SO-1037', customer: 'Blue Oak Builders', date: '2026-09-20', total: '1230.00', status: 'fulfilled', owner: 'Jamie Lee' },
  { id: 'so-1036', number: 'SO-1036', customer: 'Metro Fixtures', date: '2026-09-19', total: '676.40', status: 'draft', owner: 'Marco Garcia' },
  { id: 'so-1035', number: 'SO-1035', customer: 'Harbor Home Goods', date: '2026-09-18', total: '1048.00', status: 'fulfilled', owner: 'Jamie Lee' },
  { id: 'so-1034', number: 'SO-1034', customer: 'Summit Tools', date: '2026-09-17', total: '512.00', status: 'fulfilled', owner: 'Marco Garcia' },
]

export interface OrderLine {
  id: string
  sku: string
  name: string
  qty: string
  price: string
  amount: string
  shortage?: string
}

export interface SideEffect {
  id: string
  title: string
  detail: string
  done: boolean
}

export interface OrderProblem {
  message: string
  fix: string
}

export interface OrderDetail {
  billTo: string
  credit: string
  lines: OrderLine[]
  subtotal: string
  tax: string
  total: string
  sideEffects: SideEffect[]
  problems: OrderProblem[]
}

export const orderDetails: Record<string, OrderDetail> = {
  'SO-1044': {
    billTo: 'Riverside Hardware',
    credit: 'good standing',
    lines: [
      { id: 'l1', sku: 'WA-100', name: 'Widget A', qty: '10', price: '24.00', amount: '240.00', shortage: 'Only 4 available · short 6' },
      { id: 'l2', sku: 'BX-220', name: 'Box Kit', qty: '5', price: '15.50', amount: '77.50' },
    ],
    subtotal: '317.50',
    tax: '0.00',
    total: '317.50',
    sideEffects: [
      { id: 's1', title: 'Created', detail: 'Jamie Lee · Sep 25, 10:12', done: true },
      { id: 's2', title: 'Credit check passed', detail: 'Riverside Hardware · Good standing', done: true },
      { id: 's3', title: 'Reserve stock', detail: 'WA-100 ×10, BX-220 ×5', done: false },
      { id: 's4', title: 'Post revenue', detail: 'AR Dr 317.50 / Revenue Cr 317.50', done: false },
      { id: 's5', title: 'Post cost of goods', detail: 'COGS Dr 182.60 / Inventory Cr 182.60', done: false },
      { id: 's6', title: 'Fulfill', detail: 'Ship and close', done: false },
    ],
    problems: [{ message: 'Widget A is short 6 units.', fix: 'Split into backorder' }],
  },
  'SO-1036': {
    billTo: 'Metro Fixtures',
    credit: 'good standing',
    lines: [
      { id: 'l1', sku: 'TS-400', name: 'Tool Set', qty: '4', price: '89.00', amount: '356.00' },
      { id: 'l2', sku: 'BX-220', name: 'Box Kit', qty: '12', price: '15.50', amount: '186.00' },
      { id: 'l3', sku: 'CL-050', name: 'Cable Loom', qty: '6', price: '22.40', amount: '134.40' },
    ],
    subtotal: '676.40',
    tax: '0.00',
    total: '676.40',
    sideEffects: [
      { id: 's1', title: 'Created', detail: 'Marco Garcia · Sep 19, 14:38', done: true },
      { id: 's2', title: 'Credit check passed', detail: 'Metro Fixtures · Good standing', done: true },
      { id: 's3', title: 'Reserve stock', detail: 'TS-400 ×4, BX-220 ×12, CL-050 ×6', done: false },
      { id: 's4', title: 'Post revenue', detail: 'AR Dr 676.40 / Revenue Cr 676.40', done: false },
      { id: 's5', title: 'Post cost of goods', detail: 'COGS Dr 402.10 / Inventory Cr 402.10', done: false },
      { id: 's6', title: 'Fulfill', detail: 'Ship and close', done: false },
    ],
    problems: [],
  },
}

export const orderTotals = {
  count: 48,
  value: '28640.25',
}

export const statusCounts: Record<OrderStatus | 'all', number> = {
  all: 48,
  draft: 6,
  confirmed: 11,
  fulfilled: 29,
  cancelled: 2,
}
