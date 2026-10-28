import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/core/components/ui/Avatar'
import { Button } from '@/core/components/ui/Button'
import { signOut, useSignedIn } from './session'

export function UserMenu() {
  const { user } = useSignedIn()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function onPointerDown(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={user.name}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="rounded-full p-1 transition-colors hover:bg-raised"
      >
        <Avatar name={user.name} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute bottom-0 left-full z-50 ml-3 w-64 rounded-card border border-line bg-surface p-4 shadow-overlay"
        >
          <p className="truncate text-base font-medium text-ink">{user.name}</p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
          <p className="mt-1 text-xs text-ink-faint">{user.role}</p>
          <Button
            autoFocus
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
          >
            Sign out
          </Button>
        </div>
      )}
    </div>
  )
}
