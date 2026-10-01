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
- Navigation has two axes. A 72px module rail on the left switches modules and is always
  visible; a sticky module bar above the content carries a breadcrumb for drilling into
  records, the screen's own actions, and the search field. It opens with the organization,
  not a product wordmark — you switch organizations, you never switch products.
- The AI has no tab. It lives in the command bar (⌘K), in the search field that opens it,
  and in one quiet ask line on Home.

### On navigation

This has been settled twice. The original design doc argued for top tabs and against a
sidebar, on the grounds that a left sidebar "looked like every other template". That was
reversed on 2026-09-30 in favour of a 224px sidebar. On 2026-10-01 it was reversed again,
to the rail-and-breadcrumb pair described above.

What survives from both rounds is the part about not leading with reporting. Home still
opens on a work queue rather than a dashboard.

The 224px sidebar was justified on two grounds, and both had to be answered rather than
dropped. It opened with the organization name: the rail still leads with the organization,
whose name is now the control's accessible name rather than visible text, and there is
still no wordmark anywhere in the shell. It gave the AI a permanent, discoverable place:
that moved to the module bar, where a full input-shaped field reading "Search or ask" sits
in the top right of every screen, which is where all ten wireframes put it and where
people look. The assistant is more discoverable after the change, not less.

The rail keeps a label under each icon. An icon-only rail would have taken the AI's job
away from the rail and left six unlabelled glyphs behind, spending the sidebar's rationale
without replacing it. Labels are sized and truncated to fit the longest module name, which
is Procurement. `ModuleRail` takes a `labels` prop so icon-only remains a one-line change.

The breadcrumb is derived from route `handle` metadata through `useMatches`, never from
parsing the pathname, so a crumb can be a function of the route params. Module roots
redirect into a list, matching the wireframes: Inventory opens on Products, Procurement on
Purchase orders, Accounting on Journal, Admin on People.

The rationale section of the UI design document still argues the top-tabs position and
needs updating before that document is submitted.

## Color

One accent. Blue is reserved for primary actions, links, and selection. Red and green
only ever carry meaning — shortages, out-of-balance entries, gains and losses. Everything
else is ink on a neutral ground.

**The interface is dark-first.** Dark is `:root` and what gets demoed; light is opt-in via
`:root[data-theme='light']` and is fully supported. `prefers-color-scheme` is deliberately
not consulted — honouring the OS would show a grader on a light laptop the wrong theme on
first load. A stored preference wins; absent one, dark. An inline script in `index.html`
sets the attribute before first paint, and because dark is the default a script failure
renders dark rather than flashing white.

| Token | Dark | Light | Used for |
| --- | --- | --- | --- |
| `--color-canvas` | `#0A0A0C` | `#FBFAF9` | page background |
| `--color-surface` | `#111114` | `#FFFFFF` | cards, tables, inputs |
| `--color-raised` | `#1A1A1F` | `#F4F3F1` | hover fills, inert button fills |
| `--color-line` | `#232329` | `#EBEAE7` | hairline borders, row dividers |
| `--color-line-strong` | `#33333B` | `#D9D7D3` | input and button borders |
| `--color-ink` | `#ECECF1` | `#16150F` | primary text |
| `--color-ink-muted` | `#9C9CA8` | `#5A5750` | secondary text, column headers, axis labels |
| `--color-ink-faint` | `#82828E` | `#747169` | placeholders, section labels |
| `--color-ink-ghost` | `#4A4A55` | `#9E9B93` | decoration only, never text |
| `--color-accent` | `#6E8BFF` | `#2647E0` | primary actions, links, selection |
| `--color-positive` | `#4FC48C` | `#2E7D4F` | gains, fulfilled, active |
| `--color-negative` | `#FF7070` | `#D64545` | shortages, cancelled, out of balance |
| `--color-pending` | `#E2A63C` | `#B8860B` | submitted, invited |
| `--color-emphasis` | `#ECECF1` | `#16150F` | the `ink` button fill |
| `--color-panel` | `#1E1E24` | `#16150F` | floating overlays: bulk bar, tooltips |
| `--color-scrim` | `rgb(0 0 0 / .66)` | `rgb(22 21 15 / .38)` | the backdrop behind a modal |

Four of those names are new, and they exist because inverting a palette breaks anything
that assumed a direction. `--color-emphasis` replaces `bg-ink` as a fill: in dark, `ink`
is near-white, so an ink-filled button would have been near-white text on a near-white
block. `--color-panel` is a dark slab in *both* themes, because a floating overlay reads
as floating by being darker than the page in light and lighter than the page in dark;
nine hardcoded `white` values used to do that job. `--color-scrim` is dark in both themes
for the same reason — a canvas-tinted scrim stops dimming anything in light.

The accent had to move. `#2647E0` is about 2.3:1 on `#0A0A0C` and fails outright, so dark
uses `#6E8BFF` at 6.4:1. `--color-ink-faint` moved in both themes: at `#9E9B93` it was
2.6:1 on white, and it carries the `section-label` text, so it was failing AA for real
content. Pulling it to a passing value collapsed it into `--color-ink-muted`, so the
middle tier moved too. The old value survives as `--color-ink-ghost` for decoration, such
as the sign-in dot grid.

**Tokens are bound with `@theme inline`.** A `var()` inside a custom property resolves
where the property is *declared*, not where it is used, so a plain `@theme` reference
would resolve at `:root` and ignore any subtree theme. `@theme inline` substitutes the
value into the utility instead. Static tokens — type scale, radii, spacing, easings,
keyframes — stay in plain `@theme`.

### Chart colors

Charts use a four-step ramp, deliberately separate from the UI palette so a theme change
can't quietly break a chart's readability.

| Token | Dark | Light | Used for |
| --- | --- | --- | --- |
| `--color-chart-current` | `#E6E6EC` | `#16150F` | the hero series |
| `--color-chart-third` | `#9A9AA6` | `#5E5E5E` | the third series, S-10 operating expenses |
| `--color-chart-previous` | `#66666F` | `#8A8A8A` | the de-emphasised comparison series |
| `--color-chart-highlight` | `#6E8BFF` | `#2647E0` | the highlighted value and the average line |
| `--color-chart-grid` | `#1E1E24` | `#EBEAE7` | grid lines, which are decoration |

**These numbers were re-derived on 2026-10-01, not carried over.** The previous note
recorded `#8A8A8A` as the lightest gray clearing 3:1 against *white* with the best
colorblind separation from `#2647E0`. Dark-first changed every input to that calculation:
the background, the accent, and the hero series, which flips from near-black to
near-white. Re-running it found the third series failing in both themes — 2.26:1 for the
first dark candidate and 1.71:1 for `#C8C6C1`, the value the S-10 wireframe itself uses.

Checked with WCAG relative luminance and CIEDE2000 under Machado 2009 dichromacy
matrices, against both canvas and surface, since charts sit in cards:

| | lowest contrast | worst-case pairwise ΔE |
| --- | --- | --- |
| Dark | 3.32:1 (`previous` on surface) | 19.5 |
| Light | 3.31:1 (`previous` on canvas) | 17.5 |

Every series clears the 3:1 minimum for a graphical object in both themes. Light keeps
`#8A8A8A` exactly, so the original validation still stands for it. If you change any of
these, re-run the check rather than eyeballing it — the script is a contrast and ΔE pass
over the four series against both backgrounds under normal vision and the three
dichromacies.

Grid lines sit at about 1.2:1 by design. They are decoration, not data, and a grid that
competes with the series is worse than no grid.

### How charts are built

Charts are Recharts, and every one of them goes through `src/core/components/charts`. No
addon imports Recharts directly. That boundary is what makes the rules below enforceable
rather than advisory.

Two chart rules that are not negotiable:

- **Never a dual-axis chart.** Two measures on two y-scales is the single most common
  chart mistake.
- **A legend is always present for two or more series,** so identity is never carried by
  color alone.

The dual-axis ban is enforced in three places, because Recharts makes a second axis a
two-line change and a rule that lives only in a document does not survive the first
person who wants one. No wrapper exposes a `yAxisId`; each renders exactly one `YAxis`
internally. ESLint blocks `recharts` imports from `src/addons/**`, and inside the chart
layer it blocks the `yAxisId` and `orientation="right"` attributes outright. If you hit
that lint error, it is a design decision, not a config accident.

**S-10 is resolved.** The wireframe drew net margin % on a right-hand axis against dollar
bars. It is now two charts stacked inside one card: grouped dollar bars above, a slim
net-margin line below, sharing an x-axis and a single hover index so one reading still
covers all four series. That shared reading was the only thing the second axis was
buying. The alternative — rebasing both measures to an index of 100 — was rejected
because an accountant reading a P&L wants the literal 15.1%, and indexing hides it.

Theming needs no JavaScript. Recharts passes `fill` and `stroke` straight to SVG
attributes, so `var(--color-chart-current)` resolves at the element and follows a theme
swap for free. `useThemeColors` exists only for the two cases that cannot take a `var()`,
gradient stops and computed cursor fills.

Every chart sits in a `ChartCard` that renders the same numbers as a visually hidden
table. That is the real answer for screen readers, and it is why chart tests assert on
accessible names, legend text and table cells rather than on SVG nodes — Recharts' DOM is
not a stable contract, and the old hand-rolled chart's test counted `path` elements,
which is exactly the assertion that breaks on a minor version.

Charts are loaded per route. Recharts is about 101 kB gzipped, so the two chart-bearing
routes are lazy and the entry bundle does not carry it.

## Type

Two faces. Inter for interface text and display headings, JetBrains Mono for every
figure — amounts, quantities, IDs, dates, account codes, keyboard chips, status pills.
Both are self-hosted through `@fontsource-variable`, which removes a render-blocking
third-party round trip and the font swap that goes with it; a swap is very visible on a
dark first paint.

This replaced IBM Plex Sans, Serif and Mono on 2026-10-01. The serif display face is
gone, and with it the clearest thing separating this interface from every other technical
SaaS product. That is a real cost and it was accepted knowingly. If the interface starts
reading as generic, bringing a serif back for display headings and the assistant's
summary line — about six usages and one font file — is the cheapest way to fix it.

The scale is unchanged and runs 48px display down to 11px mono labels, roughly 3.5x
contrast between the largest and the body size. That contrast is the point: an earlier
pass kept everything between 14px and 32px and the result read as flat and unfinished
rather than minimal. Stat figures are set at 32px above an 11px label, so a number reads
as a number rather than a table cell.

Inter needs tighter optical tracking than Plex Serif did, so display sits at -0.032em and
the tier below at -0.018em. Inter's optical-size axis is enabled through
`font-optical-sizing: auto`, which is why the `opsz` build is imported rather than the
standard one. The stylistic-set alternates were considered and dropped: the packaged font
ships no feature list, so there was no way to confirm they exist, and shipping an
unverifiable `font-feature-settings` is worse than shipping none.

The mono is load-bearing rather than decorative. S-03's totals column, S-05's stock
ledger, S-07's debit and credit columns and S-10's statement table all depend on digits
lining up vertically. The `figure` utility applies the mono family with tabular numerals
and slashed zero, expressed as `font-variant-numeric` so it degrades cleanly if the face
lacks the feature; use it, don't hand-roll a font stack.

Money is formatted from strings, never floats, matching the `Decimal`-only rule in
`CLAUDE.md`. `frontend/src/core/lib/decimal.ts` does the formatting and never does arithmetic.

## Structure

- Design viewport is 1280×800. This is a desktop application; it is not drawn at phone
  scale. Responsive work below that width is deliberately out of scope — its absence is a
  decision, not an omission.
- Module rail is 72px, module bar is 48px, page gutter 48px, standard gap 24px.
- Home is a single column: date label, greeting, ask line, metric strip, note, then the
  queue. No right rail, and no charts — Home keeps the work queue as its spine. Charts
  live on the module pages. The S-02 wireframe still shows a right rail carrying a
  revenue chart; the wireframe predates that decision and the doc wins.
- Radii: 8px cards, 6px controls, 4px pills.

## Motion

Content rises 10px and fades in on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 45ms per
element, so a page assembles instead of snapping into place. The command bar scales in
from 98.5% behind a blurred backdrop and scales back out when dismissed. The bulk bar
lifts in and drops out. Row actions sit at 70% opacity and come to full on row hover.

Only `transform` and `opacity` are animated. Exits are always shorter than entrances —
420ms to arrive, 120ms to leave — because leaving should feel decisive.

**This section described something that was not happening.** Until 2026-10-01 the
stagger was written as `` stagger-${index + 3} ``, and Tailwind's scanner only emits
class names it can see literally, so only three hardcoded delays ever compiled. The
documented cascade had never shipped. The index now travels as a registered
`--rise-index` custom property read by a single literal `rise` utility, which nothing can
tree-shake by accident.

Entrance animations run on a screen's first visit in a session and not on return.
Previously they sat on route-level containers and replayed a full-page rise on every
navigation, which is what read as lag when moving between modules.

Reduced motion is handled by wrapping the animation in
`prefers-reduced-motion: no-preference` rather than shortening it, so those users get no
animation declaration at all. The old approach zeroed `animation-duration` but not
`animation-delay`, and with `both` fill that pinned content at `opacity: 0` for the full
delay and then snapped it in — worse than no accommodation.

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

## Icons

Hand-drawn, in one file. `Icon.tsx` holds a 16×16 path registry at `strokeWidth 1.3`,
stroke-only, `currentColor`, no filled variants. An entry is a single path or an array of
them.

There is no icon package, and the reason is the house style rather than the dependency
count. No published set matches a 16px grid at 1.3 with these joins, so adopting one
would change the shape of every existing icon — a visual regression dressed as an
upgrade.

That trade stops holding at scale. **Past about 35 icons, switch to `lucide-react`**,
which is the closest match to this style and ships per-icon ESM. The threshold is written
down so the decision has a trigger instead of being relitigated every time someone needs
a glyph. The set stands at 28.

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

- **Live** — anything that is view state or navigation. Rail links, breadcrumbs, the
  theme toggle, sign-in to Home,
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

`useAsk` currently matches a question against fixtures in `src/addons/ai/fixtures/ai.ts` and returns
after a short delay to stand in for latency. Replacing it with a real call to
`backend/app/addons/ai/` is a change to that one hook — the panel, the citations, and the
draft rendering stay as they are. The `ToolCall` and `AiAnswer` shapes in the fixtures are
deliberately close to what that endpoint should return.

## Screen status

| Screen | State |
| --- | --- |
| S-01 Sign in | built |
| S-02 Home (Today) | built |
| S-03 Sales orders | built |
| S-04 Sales order detail | wireframe only |
| S-05 Product and stock ledger | built, with the forecast overlay |
| S-06 Receive purchase order | built |
| S-07 Journal entry | built |
| S-08 Command bar with AI | built; the `/ask` page is not |
| S-09 People and roles | built |
| S-10 Profit and loss | built, dual axis resolved into two charts |

Two list screens exist that were never wireframed — Products and Purchase orders — both
derived from the S-03 pattern rather than invented, so every module opens on a list.

Anything still only drawn routes to a placeholder inside the shell, so the whole rail is
explorable rather than part of it leading to dead links.

The ten wireframe PNGs in `wireframes/` are light-theme references drawn against the
224px sidebar and the earlier top-tab layout. They remain the authority on what each
screen contains and are no longer the authority on chrome or color.

### Known gaps

- The `/ask` page described under **The AI surface** does not exist. There is no `/ask`
  route and no Ask page component; the assistant is reachable through ⌘K and the Home ask
  line only. Either build it or cut the claim before submission.
- S-04 sales order detail is still a placeholder.

### Checking it visually

All ten screens were captured in both themes at 1280×800 on 2026-10-01, with no console
or page errors. `frontend/scripts/screenshots.mjs` repeats the pass and fails on any
error it finds. Playwright is deliberately not a dependency; the script prints the
install line when it is missing:

```
npm install --no-save playwright && npx playwright install chromium
npm run dev
npm run screenshots
```

That pass is worth running after any change to the shell, the palette or a chart. It
found two things a green test suite was happy to ship: the Admin rail icon was a gear,
which at 20px is the same shape as the sun on the theme toggle directly beneath it, and
the Home metric strip overflowed its column so revenue's delta ran into the next figure.
Tests check structure. They do not look at the page.
