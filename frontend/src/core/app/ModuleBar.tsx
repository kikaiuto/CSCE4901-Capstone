import type { ReactNode } from 'react'
import { Breadcrumb } from '@/core/components/ui/Breadcrumb'
import { Icon } from '@/core/components/ui/Icon'
import { Kbd } from '@/core/components/ui/Kbd'
import { useCrumbs } from './useCrumbs'

export interface ModuleBarProps {
  onOpenCommandBar: () => void
  actions?: ReactNode
}

export function ModuleBar({ onOpenCommandBar, actions }: ModuleBarProps) {
  const { crumbs } = useCrumbs()

  return (
    <header className="sticky top-0 z-30 flex h-topbar shrink-0 items-center gap-4 border-b border-line bg-canvas/85 px-gutter backdrop-blur">
      <Breadcrumb items={crumbs} />

      <div className="ml-auto flex items-center gap-2.5">
        {actions}

        <button
          type="button"
          onClick={onOpenCommandBar}
          aria-label="Search or ask"
          className="flex h-8 w-64 items-center gap-2.5 rounded-control border border-line-strong bg-surface px-2.5 text-left text-base text-ink-faint transition-colors duration-140 hover:border-accent-line hover:text-ink-muted"
        >
          <Icon name="search" className="size-3.5" />
          <span className="flex-1 truncate">Search or ask</span>
          <Kbd tone="muted">⌘K</Kbd>
        </button>
      </div>
    </header>
  )
}
