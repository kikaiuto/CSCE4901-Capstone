import type { ReactNode } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_MARGIN, axisTick, gridProps, niceMax } from './chartTheme'

export interface StockPoint {
  label: string
  onHand?: number
  [key: string]: string | number | undefined
}

export interface StepAreaChartProps {
  data: StockPoint[]
  color: string
  format: (value: number) => string
  safetyStock?: number
  safetyColor?: string
  todayLabel?: string
  riskFrom?: string
  riskTo?: string
  riskColor?: string
  overlay?: ReactNode
  onActiveIndexChange?: (index: number | null) => void
}

export function StepAreaChart({
  data,
  color,
  format,
  safetyStock,
  safetyColor,
  todayLabel,
  riskFrom,
  riskTo,
  riskColor,
  overlay,
  onActiveIndexChange,
}: StepAreaChartProps) {
  const peak = Math.max(
    ...data.map((point) => Number(point.onHand) || 0),
    safetyStock ?? 0,
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        accessibilityLayer
        data={data}
        margin={CHART_MARGIN}
        onMouseMove={(state) => {
          const next = typeof state.activeTooltipIndex === 'number' ? state.activeTooltipIndex : null
          onActiveIndexChange?.(next)
        }}
        onMouseLeave={() => onActiveIndexChange?.(null)}
      >
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
        <YAxis
          domain={[0, niceMax(peak)]}
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          tickFormatter={format}
          width={40}
        />

        {riskFrom && riskTo && (
          <ReferenceArea x1={riskFrom} x2={riskTo} fill={riskColor} fillOpacity={0.22} />
        )}

        {safetyStock !== undefined && (
          <ReferenceLine
            y={safetyStock}
            stroke={safetyColor}
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />
        )}

        {todayLabel && <ReferenceLine x={todayLabel} stroke="var(--color-line-strong)" strokeDasharray="2 3" />}

        <Line type="stepAfter" dataKey="onHand" stroke={color} strokeWidth={2} dot={false} />

        {overlay}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
