import { NavLink, useLocation } from 'react-router'
import { cn } from '@/core/lib/cn'
import { Avatar } from '@/core/components/ui/Avatar'
import { Icon } from '@/core/components/ui/Icon'
import { currentUser, organization } from '@/addons/base/fixtures/org'
import { moduleFor, navItems, railItems, type NavItem } from './registry'

const ITEM_HEIGHT = 56

function RailLink({ addon, labels }: { addon: NavItem; labels: boolean }) {
  return (
    <NavLink
      to={addon.to}
      aria-label={addon.label}
      title={labels ? undefined : addon.label}
      className={({ isActive }) =>
        cn(
          'flex h-14 flex-col items-center justify-center gap-1 transition-colors duration-140',
          isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
        )
      }
    >
      <Icon name={addon.icon} className="size-5" />
      {labels && (
        <span className="w-full truncate px-0.5 text-center text-[0.625rem] leading-none font-medium">
          {addon.label}
        </span>
      )}
    </NavLink>
  )
}

export interface ModuleRailProps {
  labels?: boolean
}

export function ModuleRail({ labels = true }: ModuleRailProps) {
  const { pathname } = useLocation()
  const active = moduleFor(pathname)
  const activeIndex = railItems.findIndex((addon) => addon.name === active?.name)
  const [admin] = navItems('admin')

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-rail flex-col border-r border-line bg-surface">
      <div className="flex h-topbar shrink-0 items-center justify-center border-b border-line">
        <button
          type="button"
          aria-disabled="true"
          aria-label={organization.name}
          title="Not wired up yet"
          className="rounded-control p-1"
        >
          <Avatar name={organization.name} shape="square" />
        </button>
      </div>

      <div className="relative mt-2">
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="absolute left-0 h-14 w-0.5 rounded-r-pill bg-accent transition-transform duration-[220ms] ease-out-soft"
            style={{ transform: `translateY(${activeIndex * ITEM_HEIGHT}px)` }}
          />
        )}

        <nav aria-label="Main" className="flex flex-col">
          {navItems('primary').map((addon) => (
            <RailLink key={addon.name} addon={addon} labels={labels} />
          ))}
        </nav>

        <nav aria-label="Operations" className="flex flex-col">
          {navItems('operations').map((addon) => (
            <RailLink key={addon.name} addon={addon} labels={labels} />
          ))}
        </nav>
      </div>

      <div className="mt-auto flex flex-col items-center gap-1 border-t border-line py-2">
        {admin && (
          <nav aria-label="Admin" className="flex w-full flex-col">
            <RailLink addon={admin} labels={labels} />
          </nav>
        )}

        <button
          type="button"
          aria-disabled="true"
          aria-label={currentUser.name}
          title="Not wired up yet"
          className="rounded-full p-1"
        >
          <Avatar name={currentUser.name} />
        </button>
      </div>
    </aside>
  )
}
