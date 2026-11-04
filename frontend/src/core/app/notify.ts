import { useSyncExternalStore } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

export const TOAST_TTL_MS: Record<ToastTone, number> = {
  success: 4000,
  info: 4000,
  error: 8000,
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit() {
  for (const listener of listeners) listener()
}

function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer !== undefined) clearTimeout(timer)
  timers.delete(id)
  if (!toasts.some((toast) => toast.id === id)) return
  toasts = toasts.filter((toast) => toast.id !== id)
  emit()
}

function push(tone: ToastTone, message: string): number {
  const id = nextId++
  toasts = [...toasts, { id, tone, message }]
  timers.set(
    id,
    setTimeout(() => dismiss(id), TOAST_TTL_MS[tone]),
  )
  emit()
  return id
}

function clear() {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
  if (toasts.length === 0) return
  toasts = []
  emit()
}

export const notify = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
  dismiss,
  clear,
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = () => toasts

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
