# ADR 0003 — Frontend view layer

- **Status:** proposed
- **Date:** 2026-11-03

## Context

ADR 0001 took Odoo's structural ideas for the backend: an addon per domain, a
manifest that declares dependencies, a loader that assembles them. The frontend
now mirrors four of Odoo's web-client ideas the same way, as design rather than
code:

| Odoo web client | Sector 7 frontend |
| --- | --- |
| Menus and actions declared per module | `routes` and `nav` in each addon's `manifest.ts`, assembled by `core/app/router.tsx` and `registry.ts` |
| The `orm` service every view calls | `useList`, `useRecord`, and `useMutation` in `core/app/data.ts` over the one API client |
| The notification service | `notify` and `Toasts` in `core/app/notify.ts`, mounted once in the shell |
| Access rights per model | `useAccess` reading the session role |

The fifth idea is the one this ADR is about. Odoo renders most of its screens
from two generic views, list and form, parameterised by field declarations. Here
every list screen builds its own `PageHeader`, filter row, `Table`, empty state,
and now its own loading and error branches; every record screen builds its own
header, figure strip, sections, and `ActionBar`. Six list screens repeat that
scaffolding today, and each screen wired to the API this sprint adds the same
loading, error, and empty trio again.

## Decision

Introduce two core components in a later sprint:

- `ListView<T>`: takes `columns` (key, header, alignment, a cell renderer),
  the result of `useList<T>`, an `empty` description, header `actions`, and an
  optional `rowLink`. It owns the header, the loading row, the error alert, the
  empty state, and the table markup.
- `RecordView<T>`: takes the result of `useRecord<T>`, a header renderer, an
  ordered list of sections, and the `ActionBar` contents. It owns not-found and
  loading, and keeps the one-primary-action rule from the design system.

Addons keep their column and field declarations next to their fixtures, so a
screen becomes a declaration plus the handful of cells that need custom
rendering. Screens that are not a list or a record (Journal, Today, Receive)
stay bespoke; forcing them into a generic view would reproduce Odoo's worst
habit of configuring a form into shape.

## Consequences

- Products, People, Chart of accounts, Orders, Customers, and Purchase orders
  shrink to declarations. Wiring a screen to its endpoint becomes a change to the
  hook it passes in, not to its markup.
- The loading, error, and empty states look the same everywhere because one
  component renders them.
- The `unwired` convention and the route-driven unwired test keep working: a
  `ListView` action is still a `Button`, and a live one is still declared in the
  route's `writes`.
- Not this week. Sprint 2 ends on 2026-11-06 and its screens are being wired
  by hand on the data hooks. The third wired list is the point at which the
  shared shape is known well enough to extract, which is after this sprint.
