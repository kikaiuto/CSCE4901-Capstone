import { Icon } from '@/core/components/ui/Icon'
import { Kbd } from '@/core/components/ui/Kbd'

export interface AskLineProps {
  onOpen: () => void
}

export function AskLine({ onOpen }: AskLineProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 text-left transition-all duration-200 hover:border-line-strong hover:shadow-[0_1px_2px_rgb(22_21_15_/_0.04)]"
    >
      <Icon name="sparkle" className="text-accent transition-transform duration-300 group-hover:rotate-90" />
      <span className="flex-1 text-md text-ink-faint">
        Ask about your stock, orders or books
      </span>
      <Kbd tone="muted">⌘K</Kbd>
    </button>
  )
}
