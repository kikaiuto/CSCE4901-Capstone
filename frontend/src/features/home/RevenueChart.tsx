import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Figure } from '@/components/ui/Figure'
import type { Cadence, RevenueSeries } from '@/mocks/metrics'

const WIDTH = 560
const HEIGHT = 232
const PAD = { top: 14, right: 8, bottom: 26, left: 42 }

const PLOT_W = WIDTH - PAD.left - PAD.right
const PLOT_H = HEIGHT - PAD.top - PAD.bottom

const CADENCES: Cadence[] = ['W', 'M', 'Q']

function axisMax(max: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const step = magnitude / 2
  return Math.ceil(max / step) * step
}

function compact(value: number): string {
  if (value === 0) return '0'
  if (value < 1000) return String(Math.round(value))
  const thousands = value / 1000
  return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}K`
}

function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h)
  return [
    `M${x},${y + h}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + w - r},${y}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `L${x + w},${y + h}`,
    'Z',
  ].join(' ')
}

export interface RevenueChartProps {
  series: RevenueSeries
  cadence: Cadence
  onCadenceChange: (cadence: Cadence) => void
  periodLabel: string
}

export function RevenueChart({
  series,
  cadence,
  onCadenceChange,
  periodLabel,
}: RevenueChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const points = series.points
  const average = Number(series.average)
  const max = axisMax(Math.max(...points.map((p) => Math.max(p.current, p.previous))))

  const slot = PLOT_W / points.length
  const barW = slot * 0.6

  const yOf = (value: number) => PAD.top + PLOT_H - (value / max) * PLOT_H
  const xOf = (index: number) => PAD.left + slot * (index + 0.5)

  const ticks = [0, max / 3, (max * 2) / 3, max]
  const labelEvery = points.length > 6 ? 2 : 1
  const active = hovered === null ? points.length - 1 : hovered
  const activePoint = points[active]

  const previousLine = points.map((p, i) => `${xOf(i)},${yOf(p.previous)}`).join(' ')

  return (
    <div>
      <div className="flex items-start justify-between">
        <p className="section-label">Revenue · {periodLabel}</p>

        <div className="flex gap-0.5">
          {CADENCES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === cadence}
              onClick={() => {
                setHovered(null)
                onCadenceChange(option)
              }}
              className={cn(
                'figure size-5 rounded-[3px] text-micro font-medium transition-colors',
                option === cadence
                  ? 'bg-ink text-ink-inverse'
                  : 'text-ink-faint hover:bg-raised hover:text-ink',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2.5">
        <Figure value={series.total} kind="money" places={0} className="text-xl" />
        <Figure
          value={series.change}
          kind="percent"
          sign="always"
          tone="signed"
          className="text-xs"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-chart-current" />
          This period
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="2" aria-hidden="true">
            <line x1="0" y1="1" x2="16" y2="1" stroke="var(--color-chart-previous)" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          Previous
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="2" aria-hidden="true">
            <line x1="0" y1="1" x2="16" y2="1" stroke="var(--color-chart-highlight)" strokeWidth="2" strokeDasharray="2 3" />
          </svg>
          Avg <Figure value={series.average} kind="money" places={0} tone="muted" />
        </span>
      </div>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Revenue by ${periodLabel}, compared with the previous period`}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={yOf(tick)}
                x2={WIDTH - PAD.right}
                y2={yOf(tick)}
                stroke="var(--color-chart-grid)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={yOf(tick) + 3.5}
                textAnchor="end"
                className="figure"
                fontSize="10"
                fill="var(--color-ink-faint)"
              >
                {compact(tick)}
              </text>
            </g>
          ))}

          {points.map((point, i) => {
            const y = yOf(point.current)
            const isActive = i === active
            return (
              <path
                key={point.label}
                d={barPath(xOf(i) - barW / 2, y, barW, PAD.top + PLOT_H - y)}
                fill={isActive ? 'var(--color-chart-highlight)' : 'var(--color-chart-current)'}
              />
            )
          })}

          <polyline
            points={previousLine}
            fill="none"
            stroke="var(--color-chart-previous)"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />

          <line
            x1={PAD.left}
            y1={yOf(average)}
            x2={WIDTH - PAD.right}
            y2={yOf(average)}
            stroke="var(--color-chart-highlight)"
            strokeWidth="2"
            strokeDasharray="2 3"
            strokeLinecap="round"
          />

          {points.map((point, i) =>
            i % labelEvery === 0 ? (
              <text
                key={`label-${point.label}`}
                x={xOf(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-ink-faint)"
              >
                {point.label}
              </text>
            ) : null,
          )}

          {points.map((point, i) => (
            <rect
              key={`hit-${point.label}`}
              x={xOf(i) - slot / 2}
              y={PAD.top}
              width={slot}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {hovered !== null && (
          <div
            className="pointer-events-none absolute top-4 z-10 -translate-x-1/2 rounded-control bg-ink px-3 py-2 shadow-float"
            style={{ left: `${((xOf(hovered) / WIDTH) * 100).toFixed(2)}%` }}
          >
            <p className="text-xs font-medium whitespace-nowrap text-ink-inverse">
              {cadence === 'W' ? `Week of ${activePoint.label}` : activePoint.label}
            </p>
            <dl className="mt-1.5 flex flex-col gap-0.5 text-xs whitespace-nowrap text-white/70">
              <div className="flex justify-between gap-6">
                <dt>This period</dt>
                <dd className="figure text-ink-inverse">{compact(activePoint.current)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt>Previous</dt>
                <dd className="figure text-ink-inverse">{compact(activePoint.previous)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt>Orders</dt>
                <dd className="figure text-ink-inverse">{activePoint.orders}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
