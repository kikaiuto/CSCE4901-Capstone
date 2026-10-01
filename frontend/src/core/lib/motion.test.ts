import { describe, expect, it } from 'vitest'
import { riseAt } from './motion'

describe('riseAt', () => {
  it('carries the index as a custom property', () => {
    expect(riseAt(3)).toEqual({ '--rise-index': 3 })
  })

  it('floors a fractional index', () => {
    expect(riseAt(2.7)).toEqual({ '--rise-index': 2 })
  })

  it('never returns a negative index', () => {
    expect(riseAt(-4)).toEqual({ '--rise-index': 0 })
  })
})
