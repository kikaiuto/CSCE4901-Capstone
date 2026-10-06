import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { CHART_MARGIN, axisTick, gridProps, niceMax } from './chartTheme'
import type { SeriesMeta } from './ChartLegend'
import { indexFromChartState } from './useSyncedHover'

export interface ComparisonPoint {
  label: string
  [series: string]: string | number
}

export interface ComparisonBarsProps {
  data: ComparisonPoint[]
  series: SeriesMeta[]
  format: (value: number) => string
  activeIndex?: number | null
  onActiveIndexChange?: (index: number | null) => void
}

export function ComparisonBars({
  data,
  series,
  format,
  activeIndex,
  onActiveIndexChange,
}: ComparisonBarsProps) {
  const peak = Math.max(
    ...data.flatMap((point) => series.map((item) => Number(point[item.key]) || 0)),
  )

  const point = activeIndex == null ? undefined : data[activeIndex]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        accessibilityLayer
        data={data}
        margin={CHART_MARGIN}
        onMouseMove={(state) => onActiveIndexChange?.(indexFromChartState(state))}
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
          width={44}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-raised)' }}
          content={() =>
            point ? (
              <ChartTooltip
                title={String(point.label)}
                rows={series.map((item) => ({
                  key: item.key,
                  label: item.label,
                  value: format(Number(point[item.key]) || 0),
                  swatch: item.color,
                }))}
              />
            ) : null
          }
        />
        {series.map((item) => (
          <Bar key={item.key} dataKey={item.key} fill={item.color} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
