export interface ToolCall {
  name: string
  argument: string
  result: string
}

export interface CitedFact {
  text: string
  source: string
}

export interface DraftLine {
  item: string
  sku: string
  qty: string
  unit: string
  amount: string
}

export interface AiDraft {
  heading: string
  lines: DraftLine[]
  covers: string
  arrives: string
  posts: string
}

export interface AiAnswer {
  id: string
  question: string
  toolCalls: ToolCall[]
  summary: string
  facts: CitedFact[]
  draft?: AiDraft
}

export const suggestions = [
  'What is short on stock right now?',
  'Reorder 50 Widget A from Northstar',
  'Why did margin move this month?',
]

export const answers: AiAnswer[] = [
  {
    id: 'reorder-widget-a',
    question: 'Reorder 50 Widget A from Northstar',
    toolCalls: [
      { name: 'read_product_stock', argument: 'WA-100', result: '4 on hand · 20 min' },
      { name: 'read_demand_history', argument: '90 days', result: '1.6 units/day' },
      { name: 'read_supplier_terms', argument: 'Northstar Parts', result: 'Net 30 · 7 day lead' },
    ],
    summary:
      'Widget A runs out before PO-0214 arrives. A 50 unit order from Northstar covers about a month at the current rate.',
    facts: [
      { text: '4 on hand against a minimum of 20', source: 'WA-100' },
      { text: '1.6 units a day over the last 90 days', source: 'Sales history' },
      { text: '7 day lead time, Net 30', source: 'Northstar Parts' },
    ],
    draft: {
      heading: 'Purchase order · Northstar Parts',
      lines: [
        { item: 'Widget A', sku: 'WA-100', qty: '50', unit: '12.10', amount: '605.00' },
      ],
      covers: '31',
      arrives: '2026-10-02',
      posts: 'Inventory Dr / Accounts Payable Cr',
    },
  },
  {
    id: 'what-is-short',
    question: 'What is short on stock right now?',
    toolCalls: [
      { name: 'read_stock_levels', argument: 'all products', result: '2 below minimum' },
      { name: 'read_open_orders', argument: 'confirmed', result: '1 line short' },
    ],
    summary: 'Two products are below their minimum, and one confirmed order cannot be filled from stock.',
    facts: [
      { text: 'Widget A is 16 under its minimum of 20', source: 'WA-100' },
      { text: 'Tool Set is at zero against a minimum of 10', source: 'TL-018' },
      { text: 'SO-1044 is short 6 units of Widget A', source: 'SO-1044' },
    ],
  },
  {
    id: 'margin-move',
    question: 'Why did margin move this month?',
    toolCalls: [
      { name: 'read_margin_by_period', argument: 'Sep 2026', result: '34.2% · +1.1' },
      { name: 'read_cost_changes', argument: '30 days', result: '1 product changed' },
    ],
    summary:
      'Margin is up 1.1 points. Higher priced lines made up more of the mix, and no cost increase has landed yet.',
    facts: [
      { text: 'Gross margin is 34.2%, up from 33.1%', source: 'Sep 2026' },
      { text: "Widget A's average cost is unchanged at 11.8420", source: 'WA-100' },
      { text: 'The Oct 2 receipt raises it to 12.08', source: 'PO-0214' },
    ],
  },
]

export interface CommandAction {
  label: string
  shortcut: string
}

export const commandActions: CommandAction[] = [
  { label: 'New purchase order', shortcut: 'P' },
  { label: 'New sales order', shortcut: 'N' },
  { label: 'Adjust stock for Widget A', shortcut: 'A' },
]

export interface GoToResult {
  label: string
  detail: string
  module: string
  to: string
}

export const goToResults: GoToResult[] = [
  { label: 'Widget A', detail: 'WA-100 · 4 on hand', module: 'Inventory', to: '/inventory' },
  { label: 'Northstar Parts', detail: 'Net 30 · 7 day lead', module: 'Procurement', to: '/procurement' },
  { label: 'SO-1044', detail: 'Draft · $317.50', module: 'Sales', to: '/sales/orders' },
]
