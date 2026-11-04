import { cn } from '@/core/lib/cn'
import { notify, useToasts, type Toast, type ToastTone } from './notify'

const TONES: Record<ToastTone, string> = {
  success: 'border-positive/55',
  error: 'border-negative/55',
  info: 'border-accent-line',
}

function ToastCard({ toast }: { toast: Toast }) {
  return (
    <div
      className={cn(
        'rise pointer-events-auto flex items-start gap-3 rounded-card border-l-2 border border-line bg-surface px-4 py-3 shadow-overlay',
        TONES[toast.tone],
      )}
    >
      <p className="flex-1 text-base text-ink">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => notify.dismiss(toast.id)}
        className="rounded-control px-1 text-sm text-ink-muted hover:text-ink"
      >
        ✕
      </button>
    </div>
  )
}

export function Toasts() {
  const toasts = useToasts()
  const notices = toasts.filter((toast) => toast.tone !== 'error')
  const alerts = toasts.filter((toast) => toast.tone === 'error')

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex w-80 flex-col gap-2">
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {notices.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </div>
      <div role="alert" className="flex flex-col gap-2">
        {alerts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  )
}
