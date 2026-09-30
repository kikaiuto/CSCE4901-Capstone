import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/core/lib/cn'

export type Align = 'left' | 'right' | 'center'

const ALIGN: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table {...props} className={cn('w-full border-collapse', className)}>
      {children}
    </table>
  )
}

export function THead({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead {...props} className={cn('border-b border-line', className)}>
      {children}
    </thead>
  )
}

export function TBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...props} className={className}>
      {children}
    </tbody>
  )
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
}

export function Tr({ selected, className, children, ...props }: TrProps) {
  return (
    <tr
      {...props}
      className={cn(
        'border-b border-line last:border-0',
        selected ? 'bg-accent-soft' : 'hover:bg-raised',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: Align
}

export function Th({ align = 'left', className, children, ...props }: ThProps) {
  return (
    <th
      {...props}
      scope="col"
      className={cn('px-3 py-2 text-xs font-normal text-ink-muted', ALIGN[align], className)}
    >
      {children}
    </th>
  )
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: Align
}

export function Td({ align = 'left', className, children, ...props }: TdProps) {
  return (
    <td {...props} className={cn('px-3 py-3', ALIGN[align], className)}>
      {children}
    </td>
  )
}

export interface ColumnHeadersProps {
  children: ReactNode
}

export function ColumnHeaders({ children }: ColumnHeadersProps) {
  return (
    <THead>
      <Tr className="hover:bg-transparent">{children}</Tr>
    </THead>
  )
}
