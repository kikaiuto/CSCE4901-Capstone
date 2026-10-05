import { render, screen } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RecordPager } from '@/core/components/ui/RecordPager'
import { RecordPagerContext, useRecordPager, type RecordPage } from './useRecordPager'

const ROWS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

function Record({ id }: { id: string }) {
  useRecordPager(
    ROWS,
    (row) => row.id === id,
    (row) => `/records/${row.id}`,
    'record',
  )
  return <p>record {id}</p>
}

function Harness({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<RecordPage | null>(null)

  return (
    <MemoryRouter>
      <RecordPagerContext.Provider value={setPage}>
        {page && <RecordPager page={page} />}
        {children}
      </RecordPagerContext.Provider>
    </MemoryRouter>
  )
}

describe('the record pager', () => {
  it('counts the current record against its siblings', () => {
    render(
      <Harness>
        <Record id="b" />
      </Harness>,
    )

    expect(screen.getByText('2 of 3')).toBeInTheDocument()
  })

  it('links to the record on either side', () => {
    render(
      <Harness>
        <Record id="b" />
      </Harness>,
    )

    expect(screen.getByRole('link', { name: 'Previous record' })).toHaveAttribute(
      'href',
      '/records/a',
    )
    expect(screen.getByRole('link', { name: 'Next record' })).toHaveAttribute('href', '/records/c')
  })

  it('offers no previous link on the first record', () => {
    render(
      <Harness>
        <Record id="a" />
      </Harness>,
    )

    expect(screen.queryByRole('link', { name: 'Previous record' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Next record' })).toBeInTheDocument()
  })

  it('offers no next link on the last record', () => {
    render(
      <Harness>
        <Record id="c" />
      </Harness>,
    )

    expect(screen.getByRole('link', { name: 'Previous record' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Next record' })).not.toBeInTheDocument()
  })

  it('shows nothing when the record is not in the list', () => {
    render(
      <Harness>
        <Record id="zz" />
      </Harness>,
    )

    expect(screen.queryByText(/of 3/)).not.toBeInTheDocument()
  })
})
