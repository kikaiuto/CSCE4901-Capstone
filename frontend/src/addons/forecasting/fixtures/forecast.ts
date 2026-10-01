import type { StockWindow } from '@/addons/inventory/fixtures/stock'

export interface ForecastPoint {
  label: string
  projected: number
  lower: number
  upper: number
}

export const forecastSeries: Record<StockWindow, ForecastPoint[]> = {
  '30D': [
    { label: 'Sep 30', projected: 4, lower: 4, upper: 4 },
    { label: 'Oct 4', projected: 48, lower: 44, upper: 52 },
    { label: 'Oct 10', projected: 36, lower: 26, upper: 46 },
  ],
  '60D': [
    { label: 'Sep 30', projected: 4, lower: 4, upper: 4 },
    { label: 'Oct 4', projected: 48, lower: 44, upper: 52 },
    { label: 'Oct 10', projected: 36, lower: 26, upper: 46 },
  ],
  '90D': [
    { label: 'Sep 30', projected: 4, lower: 4, upper: 4 },
    { label: 'Oct 10', projected: 36, lower: 24, upper: 48 },
  ],
}

export const stockoutRisk = { from: 'Sep 24', to: 'Sep 30' }
