import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { CHART_MARGIN, axisTick, gridProps, niceMax } from './chartTheme'

export interface TrendPoint {
  label: string
  value: number
}

export interface TrendLineProps {
  data: TrendPoint[]
  color: string
  format: (value: number) => string
  showCategories?: boolean
  onActiveIndexChange?: (index: number | null) => void
}

export function TrendLine({
  data,
  color,
  format,
  showCategories = true,
  onActiveIndexChange,
}: TrendLineProps) {
  const peak = Math.max(...data.map((point) => point.value))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
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
      </LineChart>
    </ResponsiveContainer>
  )
}
