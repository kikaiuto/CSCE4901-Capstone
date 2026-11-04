import { useMemo } from 'react'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { SelectShell } from '@/core/components/ui/Field'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { countOf } from '@/core/lib/text'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { accessAreas, accessMatrix, roleOrder, type AccessLevel } from '../fixtures/people'
import { byRoleThenName, toPerson, usePeople } from '../hooks/usePeople'

const MARK: Record<AccessLevel, string> = { full: '●', view: '◐', none: '○' }
const MARK_LABEL: Record<AccessLevel, string> = {
  full: 'Full access',
  view: 'View only',
  none: 'No access',
}

function AccessMatrix() {
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="section-label">Access by role</h2>

      <Table className="mt-4">
        <ColumnHeaders>
          <Th className="pl-0">Role</Th>
          {accessAreas.map((area) => (
            <Th key={area} align="center">
              {area}
            </Th>
          ))}
        </ColumnHeaders>
        <TBody>
          {roleOrder.map((role) => (
            <Tr key={role} className="hover:bg-transparent">
              <Td className="pl-0 text-ink-muted">{role}</Td>
              {accessAreas.map((area) => {
                const level = accessMatrix[role][area]
                return (
                  <Td key={area} align="center">
                    <span
                      aria-label={`${role}, ${area}: ${MARK_LABEL[level]}`}
                      className={level === 'none' ? 'text-ink-faint' : 'text-ink'}
                    >
                      {MARK[level]}
                    </span>
                  </Td>
                )
              })}
            </Tr>
          ))}
        </TBody>
      </Table>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-micro text-ink-muted">
        {(['full', 'view', 'none'] as AccessLevel[]).map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span aria-hidden="true">{MARK[level]}</span>
            {MARK_LABEL[level]}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PeopleScreen() {
  const fresh = useFirstVisit('admin/people')
  const users = usePeople()
  const people = useMemo(() => users.items.map(toPerson).sort(byRoleThenName), [users.items])
  const inactive = people.filter((person) => person.status === 'inactive').length

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title="People and roles"
        meta={
          !users.loading && (
            <p className="text-base text-ink-muted">
              {countOf(people.length, 'person', 'people')}
              {inactive > 0 && ` · ${inactive} inactive`}
            </p>
          )
        }
        actions={
          <Button variant="primary" unwired>
            Invite person
          </Button>
        }
      />

      {users.error && (
        <p role="alert" className="mt-4 text-base text-negative">
          {users.error}
        </p>
      )}

      <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {users.loading && (
            <p role="status" className="py-4 text-base text-ink-muted">
              Loading people…
            </p>
          )}

          {!users.loading && !users.error && people.length === 0 && (
            <EmptyState title="Nobody here yet" detail="Invite the first person to this workspace." />
          )}

          {!users.loading && people.length > 0 && (
            <Table>
              <ColumnHeaders>
                <Th className="pl-3">Name</Th>
                <Th>Email</Th>
                <Th className="w-40">Role</Th>
                <Th className="w-28">Status</Th>
                <Th className="w-36" align="right">
                  Actions
                </Th>
              </ColumnHeaders>

              <TBody>
                {people.map((person) => (
                  <Tr key={person.id}>
                    <Td className="pl-3">{person.name}</Td>
                    <Td className="text-ink-muted">{person.email}</Td>
                    <Td>
                      <SelectShell value={person.role ?? 'Unknown'} unwired />
                    </Td>
                    <Td>
                      <StatusPill status={person.status} />
                    </Td>
                    <Td align="right">
                      <button
                        type="button"
                        aria-disabled="true"
                        title="Not wired up yet"
                        className="text-base text-negative"
                      >
                        Remove
                      </button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </div>

        <AccessMatrix />
      </div>
    </div>
  )
}
