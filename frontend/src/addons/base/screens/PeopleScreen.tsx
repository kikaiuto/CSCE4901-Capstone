import { Button } from '@/core/components/ui/Button'
import { SelectShell } from '@/core/components/ui/Field'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { countOf } from '@/core/lib/text'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import {
  accessAreas,
  accessMatrix,
  people,
  peopleTotals,
  roleOrder,
  type AccessLevel,
} from '../fixtures/people'

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

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title="People and roles"
        meta={
          <p className="text-base text-ink-muted">
            {countOf(peopleTotals.count, 'person')} · {peopleTotals.invited} invited
          </p>
        }
        actions={
          <Button variant="primary" unwired>
            Invite person
          </Button>
        }
      />

      <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-[1.6fr_1fr]">
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
                  <SelectShell value={person.role} unwired />
                </Td>
                <Td>
                  <StatusPill status={person.status} />
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-3">
                    {person.status === 'invited' && (
                      <button
                        type="button"
                        aria-disabled="true"
                        title="Not wired up yet"
                        className="text-base text-accent"
                      >
                        Resend
                      </button>
                    )}
                    <button
                      type="button"
                      aria-disabled="true"
                      title="Not wired up yet"
                      className="text-base text-negative"
                    >
                      Remove
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>

        <AccessMatrix />
      </div>
    </div>
  )
}
