export type StockState = 'ok' | 'low' | 'out'

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  onHand: string
  committed: string
  available: string
  incoming: string
  avgCost: string
  unitPrice: string
  safetyStock: string
  state: StockState
}

export const products: Product[] = [
  {
    id: 'p-wa100',
    sku: 'WA-100',
    name: 'Widget A',
    category: 'Widgets',
    onHand: '4',
    committed: '0',
    available: '4',
    incoming: '50',
    avgCost: '11.8420',
    unitPrice: '24.00',
    safetyStock: '20',
    state: 'low',
  },
  {
    id: 'p-wb200',
    sku: 'WB-200',
    name: 'Widget B',
    category: 'Widgets',
    onHand: '168',
    committed: '24',
    available: '144',
    incoming: '0',
    avgCost: '9.2100',
    unitPrice: '19.50',
    safetyStock: '40',
    state: 'ok',
  },
  {
    id: 'p-br050',
    sku: 'BR-050',
    name: 'Bracket, steel',
    category: 'Hardware',
    onHand: '612',
    committed: '90',
    available: '522',
    incoming: '200',
    avgCost: '2.4050',
    unitPrice: '5.75',
    safetyStock: '150',
    state: 'ok',
  },
  {
    id: 'p-cl010',
    sku: 'CL-010',
    name: 'Clamp, 10mm',
    category: 'Hardware',
    onHand: '0',
    committed: '12',
    available: '-12',
    incoming: '120',
    avgCost: '3.1500',
    unitPrice: '7.25',
    safetyStock: '60',
    state: 'out',
  },
  {
    id: 'p-gk300',
    sku: 'GK-300',
    name: 'Gasket kit',
    category: 'Consumables',
    onHand: '38',
    committed: '6',
    available: '32',
    incoming: '0',
    avgCost: '14.6000',
    unitPrice: '31.00',
    safetyStock: '25',
    state: 'ok',
  },
  {
    id: 'p-sv075',
    sku: 'SV-075',
    name: 'Service valve',
    category: 'Valves',
    onHand: '21',
    committed: '18',
    available: '3',
    incoming: '40',
    avgCost: '42.1800',
    unitPrice: '88.00',
    safetyStock: '15',
    state: 'low',
  },
]

export const productTotals = {
  count: products.length,
  stockValue: '18420.60',
  belowSafety: products.filter((product) => product.state !== 'ok').length,
}
