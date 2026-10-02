export type QueueGroupId = 'confirm' | 'reorder' | 'receive' | 'fix'

export interface QueueItem {
  id: string
  title: string
  detail: string
  amount?: string
  amountTone?: 'default' | 'negative'
  ratio?: { have: string; need: string }
  action: string
  primary?: boolean
}

export interface QueueGroup {
  id: QueueGroupId
  label: string
  area: 'Sales' | 'Inventory' | 'Procurement' | 'Accounting'
  items: QueueItem[]
}

export const queue: QueueGroup[] = [
  {
    id: 'confirm',
    label: 'Confirm',
    area: 'Sales',
    items: [
      {
        id: 'so-1044',
        title: 'SO-1044 · Riverside Hardware',
        detail: '1 line short on stock',
        amount: '317.50',
        action: 'Review',
      },
      {
        id: 'so-1036',
        title: 'SO-1036 · Metro Fixtures',
        detail: 'Draft since Sep 19',
        amount: '676.40',
        action: 'Confirm',
        primary: true,
      },
    ],
  },
  {
    id: 'reorder',
    label: 'Reorder',
    area: 'Inventory',
    items: [
      {
        id: 'wa-100',
        title: 'Widget A',
        detail: '4 on hand · min 20 · Northstar, 7 day lead',
        ratio: { have: '4', need: '20' },
        action: 'Draft PO',
      },
      {
        id: 'tl-018',
        title: 'Tool Set',
        detail: '0 on hand · min 10 · Northstar',
        ratio: { have: '0', need: '10' },
        action: 'Draft PO',
      },
    ],
  },
  {
    id: 'receive',
    label: 'Receive',
    area: 'Procurement',
    items: [
      {
        id: 'po-0214',
        title: 'PO-0214 · Northstar Parts',
        detail: 'Expected Sep 28 · 2 lines',
        amount: '1205.00',
        action: 'Receive',
      },
    ],
  },
  {
    id: 'fix',
    label: 'Fix',
    area: 'Accounting',
    items: [
      {
        id: 'je-draft',
        title: 'Journal draft · September rent',
        detail: 'Out of balance by $100.00',
        amount: '-100.00',
        amountTone: 'negative',
        action: 'Open',
      },
    ],
  },
]

export const queueCount = queue.reduce((total, group) => total + group.items.length, 0)

export function queueFor(canSee: (area: QueueGroup['area']) => boolean): QueueGroup[] {
  return queue.filter((group) => canSee(group.area))
}
