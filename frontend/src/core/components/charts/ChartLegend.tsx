export type SeriesShape = 'bar' | 'line' | 'dashed'

export interface SeriesMeta {
  key: string
  label: string
  color: string
  shape?: SeriesShape
}

export interface ChartLegendProps {
  series: SeriesMeta[]
}

function Swatch({ color, shape }: { color: string; shape: SeriesShape }) {
  if (shape === 'bar') {
    return (
      <span
        aria-hidden="true"
        className="inline-block size-2.5 rounded-[2px]"
        style={{ backgroundColor: color }}
      />
    )
  }

  return (
    <svg width="16" height="2" aria-hidden="true">
      <line
        x1="0"
        y1="1"
        x2="16"
        y2="1"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={shape === 'dashed' ? '4 3' : undefined}
      />
    </svg>
  )
}

export function ChartLegend({ series }: ChartLegendProps) {
  if (series.length < 2) return null

  return (
    <ul
      aria-label="Chart series"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-ink-muted"
    >
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <Swatch color={item.color} shape={item.shape ?? 'bar'} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
