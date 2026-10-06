import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrendLine, type TrendPoint } from './TrendLine'

const DATA: TrendPoint[] = [
  { label: 'Apr', value: 14.2 },
  { label: 'May', value: 15.1 },
  { label: 'Jun', value: 13.8 },
]

function renderLine(activeIndex?: number | null) {
  return render(
    <div style={{ width: 800, height: 400 }}>
      <TrendLine data={DATA} color="#333" format={String} activeIndex={activeIndex} />
    </div>,
  )
}

describe('TrendLine', () => {
  it('draws a single y-axis, never a second one', () => {
    const { container } = renderLine()

    expect(container.querySelectorAll('.recharts-yAxis')).toHaveLength(1)
  })

  it('marks nothing when no index is active', () => {
    const { container } = renderLine(null)

    expect(container.querySelector('.recharts-reference-dot')).not.toBeInTheDocument()
    expect(container.querySelector('.recharts-reference-line')).not.toBeInTheDocument()
  })

  it('marks the active point when another chart drives the index', () => {
    const { container } = renderLine(1)

    expect(container.querySelector('.recharts-reference-dot')).toBeInTheDocument()
    expect(container.querySelector('.recharts-reference-line')).toBeInTheDocument()
  })
})
