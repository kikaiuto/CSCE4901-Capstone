---
type: "query"
date: "2026-10-06T22:00:39.889194+00:00"
question: "How does the AI read-only isolation rule connect to F16 AI Guardrail Framework, the S-08 command bar footer, and test_addon_deps.py enforcement?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["F16 AI Guardrail Framework", "AI Layer Isolation", "test_addon_deps.py", "core/contracts Protocols", "AI Is Read-Only and Advisory: Prepares Drafts, User Confirms", "AI Note (Advisory Insight)"]
---

# Q: How does the AI read-only isolation rule connect to F16 AI Guardrail Framework, the S-08 command bar footer, and test_addon_deps.py enforcement?

## Answer

Expanded from original query via vocab: [isolation, guardrail, advisory, draft, confirm, addon, deps, contracts, assistant]. Traversal: F16 AI Guardrail Framework (docs/features.md) --implements [INFERRED 0.95]--> AI Layer Isolation (docs/architecture.md) --references [EXTRACTED]--> test_addon_deps.py (docs/architecture.md). The architecture.md rule node also references core/contracts Protocols and ForecastingWorker and is semantically similar (0.95) to the CLAUDE.md AI Layer Isolation rule, which in turn is rationale_for the Addon Dependency Rule and ADR 0001 and references core/registry.py and the design-system useAsk concept. The S-08 wireframe rationale node 'AI Is Read-Only and Advisory: Prepares Drafts, User Confirms' and the S-02 'AI Note (Advisory Insight)' node sit in separate connected components with no path to F16: the wireframes state the rule independently and nothing in the corpus ties them to the docs-level rule. The backend code node test_addon_deps.py is also disconnected from the doc concept of the same name. Dead end: shortest_path between F16 and the S-08 footer returns NetworkXNoPath.

## Outcome

- Signal: useful

## Source Nodes

- F16 AI Guardrail Framework
- AI Layer Isolation
- test_addon_deps.py
- core/contracts Protocols
- AI Is Read-Only and Advisory: Prepares Drafts, User Confirms
- AI Note (Advisory Insight)