import { describe, expect, it } from 'vitest'
import { indexFromChartState } from './useSyncedHover'

describe('indexFromChartState', () => {
  it('reads the string index Recharts 3 reports', () => {
    expect(indexFromChartState({ activeTooltipIndex: '2' })).toBe(2)
  })

  it('still accepts a numeric index', () => {
    expect(indexFromChartState({ activeTooltipIndex: 0 })).toBe(0)
  })

  it('returns null when nothing is under the pointer', () => {
    expect(indexFromChartState({ activeTooltipIndex: null })).toBeNull()
    expect(indexFromChartState({ activeTooltipIndex: undefined })).toBeNull()
    expect(indexFromChartState({})).toBeNull()
  })

  it('rejects anything that is not a whole, non-negative position', () => {
    expect(indexFromChartState({ activeTooltipIndex: '' })).toBeNull()
    expect(indexFromChartState({ activeTooltipIndex: 'abc' })).toBeNull()
    expect(indexFromChartState({ activeTooltipIndex: '-1' })).toBeNull()
    expect(indexFromChartState({ activeTooltipIndex: 1.5 })).toBeNull()
  })
})
