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
