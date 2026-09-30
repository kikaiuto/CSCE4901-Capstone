# Design system

The rules the Sector 7 frontend is built from. Everything here comes out of the ten
wireframes in `wireframes/` (S-01 to S-10) and the rationale section of the UI design
document. Tokens live in `frontend/src/styles/theme.css`; this file explains them.

## What the design is trying to do

The interface is action-first, not dashboard-first. An earlier round of mockups used the
usual SaaS layout — left sidebar, grid of KPI cards, AI chat drawer — and it was dropped
because it put reporting ahead of the work an ERP user actually has to do.

What replaced it:

- Home is a work queue. It lists only what needs a person right now, grouped by the
  action each row needs: Confirm, Reorder, Receive, Fix. When the queue is empty, the
  business is running.
- Every row carries its own next action as a button, so most work starts and ends there.
- Each record screen has one primary action in a bar pinned to the bottom, and that bar
  previews the side effects before they happen — stock reservations and the exact journal
  entries that will post.
- Navigation is a 224px left sidebar, grouped so Home sits above the four operational
  modules and Admin is pinned apart at the bottom. It opens with the organization name,
  not a product wordmark — you switch organizations, you never switch products.
- The AI has no tab. It lives in the command bar (⌘K) and in one quiet ask line on Home.

### On the sidebar

The original design doc argued for top tabs and against a sidebar, on the grounds that a
left sidebar "looked like every other template". That was reversed on 2026-09-30. The
reasoning that survives is the part about not leading with reporting, and Home still
opens on a work queue rather than a dashboard. What changed is only where navigation
lives.

The sidebar earns its width by giving the AI a permanent, discoverable place. The
rationale section of the UI design document still argues the old position and needs
updating before that document is submitted.

## Color

One accent. Blue is reserved for primary actions, links, and selection. Red and green
only ever carry meaning — shortages, out-of-balance entries, gains and losses. Everything
else is ink on a warm off-white.

| Token | Value | Used for |
| --- | --- | --- |
| `--color-canvas` | `#FBFAF9` | page background |
| `--color-surface` | `#FFFFFF` | cards, tables, inputs |
| `--color-raised` | `#F4F3F1` | hover fills, inert button fills |
| `--color-line` | `#EBEAE7` | hairline borders, row dividers |
| `--color-line-strong` | `#D9D7D3` | input and button borders |
| `--color-ink` | `#16150F` | primary text, ink-filled buttons |
| `--color-ink-muted` | `#6A675F` | secondary text, column headers |
| `--color-ink-faint` | `#9E9B93` | placeholders, axis labels |
| `--color-accent` | `#2647E0` | primary actions, links, selection |
| `--color-positive` | `#2E7D4F` | gains, fulfilled, active |
| `--color-negative` | `#D64545` | shortages, cancelled, out of balance |
| `--color-pending` | `#B8860B` | submitted, invited |

### Chart colors

Charts use three tokens, deliberately separate from the UI palette so a theme change
can't quietly break a chart's readability.

| Token | Value | Used for |
| --- | --- | --- |
| `--color-chart-current` | `#16150F` | current-period bars |
| `--color-chart-previous` | `#8A8A8A` | previous-period comparison line |
| `--color-chart-highlight` | `#2647E0` | the highlighted bar and the average line |

`#8A8A8A` is not an arbitrary gray. It is the lightest value that still clears 3:1
contrast against white while keeping the best colorblind separation from the accent blue
(ΔE 23.3 protanopia, 27.5 normal vision, re-validated against the current ink). Anything lighter fails contrast; anything
darker competes with the ink bars. If you change it, re-run the check rather than
eyeballing it.

Two chart rules that are not negotiable:

- **Never a dual-axis chart.** Two measures on two y-scales is the single most common
  chart mistake. S-10's profit-and-loss wireframe currently draws net margin % on a
  right-hand axis against dollar bars — that needs resolving into two charts or an
  indexed series before S-10 is built.
- **A legend is always present for two or more series,** so identity is never carried by
  color alone.

## Type

Three faces from one family. IBM Plex Serif for display headings and the assistant's
summary line, IBM Plex Sans for interface text, IBM Plex Mono for every figure — amounts,
quantities, IDs, dates, account codes, keyboard chips, status pills.

The scale runs 48px display down to 11px mono labels, roughly 3.5x contrast between the
largest and the body size, with display text tracked at -0.022em. That contrast is the
point: an earlier pass kept everything between 14px and 32px and the result read as flat
and unfinished rather than minimal. Stat figures are set at 32px above an 11px label, so
a number reads as a number rather than a table cell.

The mono is load-bearing rather than decorative. S-03's totals column, S-05's stock
ledger, S-07's debit and credit columns and S-10's statement table all depend on digits
lining up vertically. The `figure` utility applies the mono family with tabular numerals
and slashed zero; use it, don't hand-roll a font stack.

Money is formatted from strings, never floats, matching the `Decimal`-only rule in
`CLAUDE.md`. `frontend/src/lib/decimal.ts` does the formatting and never does arithmetic.

## Structure

- Design viewport is 1280×800. This is a desktop application; it is not drawn at phone
  scale.
- Sidebar is 224px, page gutter 48px, standard gap 24px.
- Home is a single 48rem column: date label, greeting, ask line, metric strip, note,
  then the queue. No right rail.
- Radii: 8px cards, 6px controls, 4px pills.

## Motion

Content rises 10px and fades in on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 60ms per
element with the `stagger-*` utility, so a page assembles instead of snapping into place.
The command bar scales in from 98.5% behind a blurred backdrop. Row actions sit at 70%
opacity and come to full on row hover. Everything collapses to 0.01ms under
`prefers-reduced-motion: reduce`.

Motion is for orientation, never decoration. Nothing loops, nothing bounces, and no
animation delays a person from acting.

## Status pills

Uppercase mono, bordered, no fill. The border and text carry the color; nothing is a
solid block.

| Status | Tone |
| --- | --- |
| Draft, Manual | gray |
| Confirmed, Auto | blue |
| Fulfilled, Received, Active | green |
| Cancelled | red |
| Submitted, Invited | amber |

## Buttons

| Variant | When |
| --- | --- |
| `primary` | the one screen-level primary action — blue |
| `ink` | an emphasized row-level action, such as Confirm in the Home queue |
| `secondary` | everything else — white with a border |
| `ghost` | low-emphasis actions inside dense areas |
| `danger` | destructive actions |

Blue is reserved. A screen has at most one blue button.

## The unwired convention

There is no backend yet. Rather than shipping buttons that look live and silently do
nothing, any action that would write data renders visibly inert: muted fill, dashed
border, a leading ✕, `aria-disabled="true"`, and a "Not wired up yet" tooltip. It stays
focusable, so keyboard users can still find it and understand why it is off.

The split:

- **Live** — anything that is view state or navigation. Sidebar links, sign-in to Home,
  status-tab filtering, row selection, the command bar and everything the assistant does.
- **Unwired** — anything that writes, or opens a screen that isn't built. Confirm,
  Draft PO, Receive, Open, New order, Export, the filter dropdowns, the org switcher.

Remove `unwired` when the endpoint behind a control actually exists. The tests in
`Button.test.tsx` and each screen's test file assert this behavior, so a control that
gets wired up without removing the prop will fail rather than pass quietly.

## The AI surface

The assistant is read-only. It answers from the organization's own data through
parameterized tool calls, and anything that would change a record comes back as a draft a
person opens and confirms. The interface has to make that visible rather than ask for
trust, so every answer shows three things in order:

1. **The tool calls it made**, each with its argument and what came back —
   `read_product_stock · WA-100 · 4 on hand · 20 min`. The user can see exactly which
   reads happened against their data, and that none of them wrote.
2. **A short summary, then each figure with the record it came from.** Every number
   carries a source chip naming the document behind it. No figure appears without one.
3. **A draft, clearly marked "Draft · not saved"**, showing the lines, what it covers, and
   the journal entry that would post on receipt. Its actions open the normal purchase
   order screen, so the same role checks and validation apply as to manual work.

Two entry points share one `AnswerPanel`, so the two can never drift:

- **Ask** (`/ask`) — a full page for real questions, with starter prompts before anything
  is asked.
- **⌘K** — the command bar over any screen. Typing switches it into Ask mode; it also
  holds commands and jump-to-record results.

`useAsk` currently matches a question against fixtures in `src/mocks/ai.ts` and returns
after a short delay to stand in for latency. Replacing it with a real call to
`backend/app/modules/ai/` is a change to that one hook — the panel, the citations, and the
draft rendering stay as they are. The `ToolCall` and `AiAnswer` shapes in the fixtures are
deliberately close to what that endpoint should return.

## Screen status

| Screen | State |
| --- | --- |
| S-01 Sign in | built |
| S-02 Home (Today) | built |
| S-03 Sales orders | built |
| S-04 Sales order detail | wireframe only |
| S-05 Product and stock ledger | wireframe only |
| S-06 Receive purchase order | wireframe only |
| S-07 Journal entry | wireframe only |
| S-08 Command bar with AI | built, plus a full Ask page |
| S-09 People and roles | wireframe only |
| S-10 Profit and loss | wireframe only, dual-axis needs resolving |

Modules without screens route to a placeholder inside the shell, so the top bar is fully
explorable rather than half of it leading to dead links.
