import { useState } from 'react'
import { useParams } from 'react-router'
import { ActionBar } from '@/core/components/ui/ActionBar'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Figure } from '@/core/components/ui/Figure'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { Stepper } from '@/core/components/ui/Stepper'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { purchaseOrders, receipt, receiptLines } from '../fixtures/purchaseOrders'

export function ReceiveScreen() {
  const { id } = useParams()
  const order = purchaseOrders.find((po) => po.number === id)
  const fresh = useFirstVisit(`procurement/receive/${id}`)

  const [received, setReceived] = useState<Record<string, number>>(() =>
    Object.fromEntries(receiptLines.map((line) => [line.id, line.received])),
  )

  if (!order) {
    return <EmptyState title="No such purchase order" detail={`Nothing matches ${id}.`} />
  }

  const total = Object.values(received).reduce((sum, value) => sum + value, 0)

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-5xl')}>
      <PageHeader
        title={order.number}
        meta={
          <>
            <span className="text-base text-ink-muted">{order.supplier}</span>
            <span className="text-base text-ink-faint">{receipt.terms}</span>
            <StatusPill status={order.status} />
          </>
        }
      />

      <section className="mt-7">
        <h2 className="section-label">Receive items</h2>

        <Table className="mt-3">
          <ColumnHeaders>
            <Th className="pl-3">SKU</Th>
            <Th>Name</Th>
            <Th align="right">Ordered</Th>
            <Th align="center" className="w-40">
              Receiving
            </Th>
            <Th align="right">Unit cost</Th>
            <Th align="right" className="pr-3">
              Avg cost after
            </Th>
          </ColumnHeaders>

          <TBody>
            {receiptLines.map((line) => {
              const value = received[line.id] ?? 0
              const remainder = line.ordered - value

              return (
                <Tr key={line.id}>
                  <Td className="pl-3">
                    <span className="figure">{line.sku}</span>
                  </Td>
                  <Td>{line.name}</Td>
                  <Td align="right">
                    <Figure value={String(line.ordered)} kind="quantity" tone="muted" />
                  </Td>
                  <Td align="center">
                    <div className="flex flex-col items-center gap-1">
                      <Stepper
                        value={value}
                        max={line.ordered}
                        onChange={(next) => setReceived((current) => ({ ...current, [line.id]: next }))}
                        label={`Quantity received for ${line.sku}`}
                      />
                      {remainder > 0 && (
                        <span className="text-micro text-ink-faint">of {line.ordered}</span>
                      )}
                    </div>
                  </Td>
                  <Td align="right">
                    <Figure value={line.unitCost} places={4} tone="muted" />
                  </Td>
                  <Td align="right" className="pr-3">
                    <span className="figure text-xs text-ink-muted">
                      {line.newAvgCost}
                    </span>
                  </Td>
                </Tr>
              )
            })}
          </TBody>
        </Table>
      </section>

      <ActionBar
        preview={
          <span>
            Posts: Inventory Dr <Figure value={receipt.postsDebit} kind="money" tone="muted" /> ·
            Accounts Payable Cr <Figure value={receipt.postsCredit} kind="money" tone="muted" />
          </span>
        }
      >
        <Button unwired>Cancel</Button>
        <Button variant="primary" shortcut="⌘↵" unwired>
          Receive {total} items
        </Button>
      </ActionBar>
    </div>
  )
}
