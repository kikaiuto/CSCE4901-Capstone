import { NavLink } from 'react-router'
import { cn } from '@/core/lib/cn'
import { Icon, type IconName } from '@/core/components/ui/Icon'
import { Kbd } from '@/core/components/ui/Kbd'
import { initials } from '@/core/lib/text'
import { currentUser, organization } from '@/addons/base/fixtures/org'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const OPERATIONS: NavItem[] = [
  { to: '/sales', label: 'Sales', icon: 'sales' },
  { to: '/inventory', label: 'Inventory', icon: 'inventory' },
  { to: '/procurement', label: 'Procurement', icon: 'procurement' },
  { to: '/accounting', label: 'Accounting', icon: 'accounting' },
]

function Item({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-base transition-colors duration-150',
          isActive
            ? 'bg-raised font-medium text-ink'
            : 'text-ink-muted hover:bg-raised/60 hover:text-ink',
        )
      }
    >
      <Icon name={item.icon} />
      {item.label}
    </NavLink>
  )
}

export interface SidebarProps {
  onOpenCommandBar: () => void
}

export function Sidebar({ onOpenCommandBar }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 flex w-rail flex-col border-r border-line bg-canvas px-3 py-4">
      <button
        type="button"
        aria-disabled="true"
        title="Not wired up yet"
        className="flex items-center gap-2 rounded-control px-2.5 py-1.5 text-left"
      >
        <span className="text-md font-medium tracking-tight">{organization.name}</span>
        <Icon name="chevron" className="size-3.5 text-ink-faint" />
      </button>

      <button
        type="button"
        onClick={onOpenCommandBar}
        className="mt-3 flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-base text-ink-muted transition-colors duration-150 hover:bg-raised/60 hover:text-ink"
      >
        <Icon name="search" />
        Search
        <Kbd tone="muted" className="ml-auto">
          ⌘K
        </Kbd>
      </button>

      <nav aria-label="Main" className="mt-0.5 flex flex-col gap-0.5">
        <Item item={{ to: '/home', label: 'Home', icon: 'home' }} />
      </nav>

      <p id="operations-label" className="section-label mt-7 px-2.5 pb-1.5">
        Operations
      </p>
      <nav aria-labelledby="operations-label" className="flex flex-col gap-0.5">
        {OPERATIONS.map((item) => (
          <Item key={item.to} item={item} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
        <Item item={{ to: '/admin', label: 'Admin', icon: 'admin' }} />

        <button
          type="button"
          aria-disabled="true"
          title="Not wired up yet"
          className="flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-left"
        >
          <span className="figure flex size-6 shrink-0 items-center justify-center rounded-full bg-raised text-micro font-medium text-ink-muted">
            {initials(currentUser.name)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
            {currentUser.name}
          </span>
        </button>
      </div>
    </aside>
  )
}
