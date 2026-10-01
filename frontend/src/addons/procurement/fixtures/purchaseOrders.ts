export type PurchaseOrderStatus = 'draft' | 'submitted' | 'received' | 'cancelled'

export interface PurchaseOrderLine {
  id: string
  sku: string
  name: string
  ordered: number
  received: number
  unitCost: string
  newAvgCost: string
}

export interface PurchaseOrder {
  id: string
  number: string
  supplier: string
  expected: string
  lines: number
  value: string
  status: PurchaseOrderStatus
}

export const purchaseOrders: PurchaseOrder[] = [
  { id: 'po-214', number: 'PO-0214', supplier: 'Northstar Parts', expected: '2026-09-28', lines: 3, value: '1055.00', status: 'submitted' },
  { id: 'po-213', number: 'PO-0213', supplier: 'Delta Fasteners', expected: '2026-09-30', lines: 2, value: '486.40', status: 'submitted' },
  { id: 'po-212', number: 'PO-0212', supplier: 'Harbor Supply', expected: '2026-09-18', lines: 5, value: '2310.75', status: 'received' },
  { id: 'po-211', number: 'PO-0211', supplier: 'Northstar Parts', expected: '2026-09-12', lines: 1, value: '592.10', status: 'received' },
  { id: 'po-210', number: 'PO-0210', supplier: 'Crane Metals', expected: '2026-10-04', lines: 4, value: '1740.00', status: 'draft' },
  { id: 'po-209', number: 'PO-0209', supplier: 'Delta Fasteners', expected: '2026-09-02', lines: 2, value: '318.20', status: 'cancelled' },
]

export const purchaseOrderTotals = {
  count: purchaseOrders.length,
  value: '6502.45',
  open: purchaseOrders.filter((order) => order.status === 'submitted').length,
}

export const statusCounts = {
  all: purchaseOrders.length,
  draft: purchaseOrders.filter((order) => order.status === 'draft').length,
  submitted: purchaseOrders.filter((order) => order.status === 'submitted').length,
  received: purchaseOrders.filter((order) => order.status === 'received').length,
  cancelled: purchaseOrders.filter((order) => order.status === 'cancelled').length,
}

export const receiptLines: PurchaseOrderLine[] = [
  { id: 'rl-1', sku: 'WA-100', name: 'Widget A', ordered: 50, received: 50, unitCost: '12.4000', newAvgCost: '12.0800' },
  { id: 'rl-2', sku: 'BR-050', name: 'Bracket, steel', ordered: 20, received: 20, unitCost: '2.5500', newAvgCost: '2.4300' },
  { id: 'rl-3', sku: 'GK-300', name: 'Gasket kit', ordered: 20, received: 0, unitCost: '14.9000', newAvgCost: '14.6800' },
]

export const receipt = {
  number: 'PO-0214',
  supplier: 'Northstar Parts',
  terms: 'Net 30 · FOB origin',
  expected: '2026-09-28',
  status: 'submitted' as const,
  postsDebit: '1055.00',
  postsCredit: '1055.00',
}
