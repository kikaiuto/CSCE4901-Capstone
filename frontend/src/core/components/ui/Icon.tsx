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
  | 'sun'
  | 'moon'

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
