import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_MARGIN, axisTick, gridProps, niceMax } from './chartTheme'
import { indexFromChartState } from './useSyncedHover'

export interface TrendPoint {
  label: string
  value: number
}

export interface TrendLineProps {
  data: TrendPoint[]
  color: string
  format: (value: number) => string
  showCategories?: boolean
  activeIndex?: number | null
  onActiveIndexChange?: (index: number | null) => void
}

export function TrendLine({
  data,
  color,
  format,
  showCategories = true,
  activeIndex,
  onActiveIndexChange,
}: TrendLineProps) {
  const peak = Math.max(...data.map((point) => point.value))
  const active = activeIndex == null ? undefined : data[activeIndex]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        accessibilityLayer
        data={data}
        margin={CHART_MARGIN}
        onMouseMove={(state) => onActiveIndexChange?.(indexFromChartState(state))}
        onMouseLeave={() => onActiveIndexChange?.(null)}
      >
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={showCategories ? axisTick : false}
          height={showCategories ? 24 : 4}
        />
        <YAxis
          domain={[0, niceMax(peak)]}
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          tickFormatter={format}
          width={44}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
        {active && <ReferenceLine x={active.label} stroke="var(--color-line-strong)" />}
        {active && <ReferenceDot x={active.label} y={active.value} r={3} fill={color} stroke="none" />}
      </LineChart>
    </ResponsiveContainer>
  )
}
