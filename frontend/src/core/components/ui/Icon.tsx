import { cn } from '@/core/lib/cn'

export type IconName =
  | 'home'
  | 'sparkle'
  | 'sales'
  | 'inventory'
  | 'procurement'
  | 'accounting'
  | 'admin'
  | 'search'
  | 'check'
  | 'arrow-right'
  | 'chevron'
  | 'chevron-right'
  | 'chevron-left'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'minus'
  | 'filter'
  | 'download'
  | 'columns'
  | 'list'
  | 'grid'
  | 'close'
  | 'alert'
  | 'lock'
  | 'people'
  | 'arrow-up-right'
  | 'dot'

const PATHS: Record<IconName, string | readonly string[]> = {
  home: 'M2.5 6.5 8 2.5l5.5 4v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z',
  sparkle: 'M8 2.2 9.4 6.6 13.8 8 9.4 9.4 8 13.8 6.6 9.4 2.2 8 6.6 6.6z',
  sales: 'M3.5 2.5h9v11l-1.8-1.2-1.8 1.2-1.9-1.2-1.8 1.2-1.7-1.2zM5.8 6h4.4M5.8 8.6h4.4',
  inventory: 'M2.5 5.4 8 2.6l5.5 2.8v5.2L8 13.4l-5.5-2.8zM2.5 5.4 8 8.2l5.5-2.8M8 8.2v5.2',
  procurement: 'M2 3h2l1.6 7.2h6.6L14 5.2H5.1M6.4 13a.7.7 0 1 0 0-1.4.7.7 0 0 0 0 1.4M11.4 13a.7.7 0 1 0 0-1.4.7.7 0 0 0 0 1.4',
  accounting: 'M3.5 2.8h9v10.4h-9zM6 5.6h4M6 8h4M6 10.4h2.4',
  admin: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4M8 1.8v1.6M8 12.6v1.6M2.6 8h1.6M11.8 8h1.6M4.2 4.2l1.1 1.1M10.7 10.7l1.1 1.1M11.8 4.2l-1.1 1.1M5.3 10.7l-1.1 1.1',
  search: 'M7.2 12a4.8 4.8 0 1 0 0-9.6 4.8 4.8 0 0 0 0 9.6M13.6 13.6l-2.8-2.8',
  check: 'M3 8.4 6.2 11.6 13 4.8',
  'arrow-right': 'M3 8h10M9.2 4.2 13 8l-3.8 3.8',
  chevron: 'M4.5 6.5 8 10l3.5-3.5',
  sun: [
    'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    'M8 1.4v1.4M8 13.2v1.4M1.4 8h1.4M13.2 8h1.4M3.3 3.3l1 1M11.7 11.7l1 1M12.7 3.3l-1 1M4.3 11.7l-1 1',
  ],
  moon: 'M13.4 9.7A5.9 5.9 0 0 1 6.3 2.6a5.9 5.9 0 1 0 7.1 7.1',
  'chevron-right': 'M6.5 4.5 10 8l-3.5 3.5',
  'chevron-left': 'M9.5 4.5 6 8l3.5 3.5',
  plus: 'M8 3.5v9M3.5 8h9',
  minus: 'M3.5 8h9',
  filter: 'M2.6 4h10.8M4.6 8h6.8M6.6 12h2.8',
  download: 'M8 2.6v7.8M4.9 7.3 8 10.4l3.1-3.1M3 13.4h10',
  columns: ['M2.6 3h10.8v10H2.6z', 'M6.2 3v10M9.8 3v10'],
  list: 'M3 4.6h10M3 8h10M3 11.4h10',
  grid: ['M2.6 2.6h4.6v4.6H2.6z', 'M8.8 2.6h4.6v4.6H8.8z', 'M2.6 8.8h4.6v4.6H2.6z', 'M8.8 8.8h4.6v4.6H8.8z'],
  close: 'M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6',
  alert: ['M8 2.9 14.1 13.3H1.9z', 'M8 6.6v3.1M8 11.5h.01'],
  lock: ['M3.9 7.3h8.2v5.9H3.9z', 'M5.9 7.3V5.4a2.1 2.1 0 0 1 4.2 0v1.9'],
  people: [
    'M6.2 7.4a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4',
    'M1.9 13.2c0-2.4 1.9-3.9 4.3-3.9s4.3 1.5 4.3 3.9',
    'M10.9 3.3a2.2 2.2 0 0 1 0 4.2',
    'M11.7 9.5c1.5.4 2.4 1.7 2.4 3.3',
  ],
  'arrow-up-right': 'M4.8 11.2 11.2 4.8M6.2 4.8h5v5',
  dot: 'M8 9.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4',
}

export interface IconProps {
  name: IconName
  className?: string
}

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-4 shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(typeof PATHS[name] === 'string' ? [PATHS[name]] : PATHS[name]).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
