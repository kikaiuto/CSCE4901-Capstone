import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'

export interface PlaceholderProps {
  module: string
  screens: string[]
}

export function Placeholder({ module, screens }: PlaceholderProps) {
  const fresh = useFirstVisit(`placeholder:${module}`)

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-xl py-20')}>
      <h1 className="display text-3xl">{module}</h1>
      <p className="mt-4 text-lg text-ink-muted">
        This part isn't built yet. It's drawn in the design doc and comes next.
      </p>

      <ul className="mt-8 flex flex-col gap-2 border-t border-line pt-6">
        {screens.map((screen) => (
          <li key={screen} className="flex items-baseline gap-3 text-base text-ink-muted">
            <span className="figure text-xs text-ink-faint">{screen.slice(0, 4)}</span>
            {screen.slice(5)}
          </li>
        ))}
      </ul>
    </div>
  )
}
