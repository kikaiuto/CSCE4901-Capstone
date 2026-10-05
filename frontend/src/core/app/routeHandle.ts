export type RouteParams = Readonly<Record<string, string | undefined>>

export interface RouteHandle {
  crumb?: string | ((params: RouteParams) => string)
  view?: 'list' | 'record' | 'report'
}

export function isRouteHandle(value: unknown): value is RouteHandle {
  if (typeof value !== 'object' || value === null) return false
  const handle = value as Record<string, unknown>
  const crumb = handle.crumb
  return crumb === undefined || typeof crumb === 'string' || typeof crumb === 'function'
}

export function resolveCrumb(handle: RouteHandle, params: RouteParams): string | undefined {
  if (typeof handle.crumb === 'function') return handle.crumb(params)
  return handle.crumb
}
