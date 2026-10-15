---
type: "query"
date: "2026-10-06T22:02:30.556453+00:00"
question: "Is the S-10 Profit and Loss trend chart a dual-axis chart that violates the design system?"
contributor: "graphify"
outcome: "corrected"
correction: "S-10 dual axis is already resolved in the design system and in ProfitLossScreen.tsx as two stacked charts with a synced hover; the wireframe PNG and the product design PDF are the stale artifacts."
source_nodes: ["Dual-axis Chart Ban", "Chart Boundary", "ChartCard", "P&L Trend Chart (grouped bars + net margin line)", "frontend-ci check job"]
---

# Q: Is the S-10 Profit and Loss trend chart a dual-axis chart that violates the design system?

## Answer

Expanded from original query via vocab: [dual, axis, chart, boundary, margin, trend, chartcard, eslint]. The S-10 wireframe and the product design PDF (page 15) draw net margin % on a right-hand axis against dollar bars. The graph holds the rule in three connected nodes: Chart Boundary (CLAUDE.md) --rationale_for--> Dual-axis Chart Ban (docs/design/design-system.md) --conceptually_related_to--> ChartCard, and Chart Boundary --implements [INFERRED 0.75]--> frontend-ci check job. The design-system node's rationale already records the resolution: S-10 was rebuilt as two stacked charts in one card sharing an x-axis and hover index, and indexing to 100 was rejected because an accountant wants the literal percentage. Verified in code: ProfitLossScreen.tsx composes ComparisonBars (dollars) above TrendLine (net margin %) inside one ChartCard with useSyncedHover; eslint.config.js blocks recharts imports in addons and the yAxisId and orientation=right attributes in the chart layer; grep finds no yAxisId or orientation= anywhere in frontend/src; ProfitLossScreen.test.tsx has 'resolves the wireframe dual axis into two charts under one card' and 'never draws a second y-axis'. The wireframe-side AMBIGUOUS node 'Dual-axis Chart vs Design-system Ban' is in a disconnected component with no path to the Dual-axis Chart Ban rule node, so the graph could not see the resolution on its own. Conclusion: the wireframe and the PDF are stale; the built screen complies. Corrected: the earlier flag that this needed a UX decision was wrong, it is already resolved.

## Outcome

- Signal: corrected
- Correction: S-10 dual axis is already resolved in the design system and in ProfitLossScreen.tsx as two stacked charts with a synced hover; the wireframe PNG and the product design PDF are the stale artifacts.

## Source Nodes

- Dual-axis Chart Ban
- Chart Boundary
- ChartCard
- P&L Trend Chart (grouped bars + net margin line)
- frontend-ci check job