export interface ForecastPoint {
  label: string
  projected: number
  lower: number
  upper: number
}

export type ForecastWindow = '30D' | '60D' | '90D'

export const forecastSeries: Record<ForecastWindow, ForecastPoint[]> = {
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
