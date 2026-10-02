# Requirements Traceability Matrix

Tracks each requirement to the addon that implements it and the semester it is
scheduled for.

Names and priorities are transcribed from `Sector7-AI-Product-Requirements.docx`.
Addon names are the eight defined in ADR 0001; the authoritative mapping is the
`requirements` key of each `backend/app/addons/<name>/__manifest__.py`, and
`backend/tests/architecture/test_manifests.py` asserts the two agree.

Priority: 1 high (MVP must ship it), 2 medium (planned within the nine-month
window), 3 low (nice if time allows).

## Functional Requirements

| ID | Name | Priority | Addon | Features | Semester | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Tenant scoping | 1 | base | F1 | 4901 | Not started |
| R2 | Secure login | 1 | base | F2 | 4901 | Not started |
| R3 | Role-based permissions | 1 | base | F2 | 4901 | Not started |
| R4 | User and role administration | 2 | base | F2 | 4901 | Not started |
| R5 | Customer management | 1 | sales | F3 | 4901 | Not started |
| R6 | Customer purchase ledger | 2 | sales | F3 | 4902 | Not started |
| R7 | Product catalog management | 1 | inventory | F4 | 4901 | Not started |
| R8 | Tiered pricing and categories | 3 | inventory | F4 | 4902 | Not started |
| R9 | Stock visibility | 1 | inventory | F5 | 4901 | Not started |
| R10 | Inventory movement logging | 1 | inventory | F5, F19 | 4901 | Not started |
| R11 | Manual adjustment and cycle count | 2 | inventory | F5 | 4901 | Not started |
| R12 | Reorder threshold alerts | 2 | inventory | F4, F17 | 4901 | Not started |
| R13 | Sales order entry | 1 | sales | F7 | 4901 | Not started |
| R14 | Concurrency-safe order confirmation | 1 | sales | F6, F7 | 4901 | Not started |
| R15 | Order fulfillment and close | 1 | sales | F7 | 4901 | Not started |
| R16 | Purchase order creation | 1 | procurement | F8 | 4901 | Not started |
| R17 | Goods receipt | 1 | procurement | F8, F9 | 4901 | Not started |
| R18 | Chart of accounts | 1 | accounting | F10 | 4901 | Not started |
| R19 | Manual journal entry | 1 | accounting | F11 | 4901 | Not started |
| R20 | Automated revenue recognition | 1 | accounting | F12 | 4901 | Not started |
| R21 | Automated cost of goods sold | 1 | accounting | F12 | 4901 | Not started |
| R22 | Automated procurement liability | 1 | accounting | F12 | 4901 | Not started |
| R23 | Financial statements | 1 | accounting | F13 | 4901 | Not started |
| R24 | Operational dashboard | 2 | home | F14 | 4901 | Not started |
| R25 | Natural-language business queries | 1 | ai | F15 | 4901 | Not started |
| R26 | AI tenant and permission enforcement | 1 | ai | F16 | 4901 | Not started |
| R27 | Human-confirmed AI write intents | 2 | ai | F16 | 4901 | Not started |
| R28 | Demand forecasting | 2 | forecasting | F17 | 4901 | Not started |
| R29 | Forecast cold-start guardrail | 2 | forecasting | F17 | 4901 | Not started |
| R30 | Dashboard insight narratives | 3 | ai | F18 | 4902 | Not started |
| R31 | Audit trail review | 2 | inventory, accounting | F19 | 4902 | Not started |
| R32 | Backup and restore assurance | 2 | infra | F20 | 4901 | Not started |

## Non-Functional Requirements

| ID | Area | Addon or path | Semester | Status |
| --- | --- | --- | --- | --- |
| NF1 | Performance — CRUD p95 under 300 ms at 50 concurrent users | core, all addons | 4902 | Not started |
| NF2 | Performance — aggregations under 2.5 s over 100k journal lines | accounting, home | 4902 | Not started |
| NF3 | Performance — first AI token under 3 s; forecasting off the request path | ai, forecasting, workers | 4901 | Not started |
| NF4 | Security — parameterized statements only; string SQL fails CI | core/db, CI lint | 4901 | Not started |
| NF5 | Security — cross-tenant access returns 403 or 404 on every route | tests/security/cross_tenant, per-addon tests/test_tenant_isolation.py | 4901 | Not started |
| NF6 | Security — Argon2id only (m=65536, t=3, p=4) | core/security, base | 4901 | Not started |
| NF7 | Security — TLS; JWT carries organization and role, verified per request | core/security, core/tenancy | 4901 | Not started |
| NF8 | Security — AI layer has no write capability; 30-scenario adversarial set rejected 100% | ai, tests/security/ai_adversarial, tests/architecture/test_addon_deps.py | 4901 | Not started |
| NF9 | Security — zero-data-retention LLM tier; minimum records leave the platform | ai | 4902 | Not started |
| NF10 | Reliability — daily snapshots, WAL retention, RPO 24 h, RTO 60 min | infra | 4901 | Not started |
| NF11 | Reliability — LLM provider failure degrades only AI features | ai, core/errors | 4902 | Not started |
| NF12 | Reliability — migrations backwards-compatible with a clean rollback in staging | alembic, CI | 4901 | Not started |
| NF13 | Integrity — debits equal credits, enforced by API and CHECK constraint | accounting | 4901 | Not started |
| NF14 | Integrity — fixed-precision NUMERIC (15,2) and (12,4); no float currency | core/money, accounting, inventory | 4901 | Not started |
| NF15 | Integrity — on-hand and reserved never negative; atomic stock mutation | inventory | 4901 | Not started |
| NF16 | Usability — core path completed in 10 minutes by a non-technical user, 5 participants | frontend | 4902 | Not started |
| NF17 | Usability — every rejection names its cause, never a bare code or stack trace | core/errors, all addons | 4901 | Not started |
| NF18 | Compatibility — current and prior Chrome, Edge, Firefox, Safari, verified by Playwright | frontend | 4902 | Not started |
| NF19 | Compatibility — usable down to a 768 px viewport | frontend | 4902 | Not started |
| NF20 | Verifiability — 80% unit coverage on moving average cost, debit/credit validation, Pydantic models | inventory, accounting | 4902 | Not started |
| NF21 | Verifiability — environment reproducible from Terraform and Docker, no manual console steps | infra | 4902 | Not started |
| NF22 | Verifiability — Definition of Done: CI green, migrations roll back, tenant isolation asserted, runs on staging | CI, CONTRIBUTING.md | 4901 | Not started |

## Corrections made during the addon restructure

The previous version of this matrix was generated before the requirements
document was available, so `Name` and `Priority` were blank and the `Module`
column was partly guessed from module names. Ten rows pointed at the wrong
module:

| Row | Previously | Now | Because |
| --- | --- | --- | --- |
| R9 | `catalog` | `inventory` | Stock visibility is ledger work (F5), not catalog |
| R15 | `procurement` | `sales` | Order fulfilment and close is the sales state machine (F7) |
| R16 | `inventory, procurement` | `procurement` | Purchase order creation is procurement alone (F8) |
| R17 | `inventory` | `procurement, inventory` | Goods receipt spans both (F8, F9) |
| R24 | `accounting` | `home` | Operational dashboard, explicitly with no AI in the path (F14) |
| R25 | `reporting` | `ai` | Natural-language business queries (F15) |
| R28 | `ai` | `forecasting` | Holt-Winters demand forecasting (F17) |
| R30 | `forecasting` | `ai` | Dashboard insight narratives (F18) |
| R31 | `ai` | `inventory, accounting` | Audit trail lives in the ledger and the journal (F19) |
| R32 | blank | `infra` | Backup and restore assurance (F20) |

Two further gaps were closed. The matrix previously stopped at NF17; the
requirements document defines NF1 through NF22, so NF18 through NF22 were added.
And the F-IDs referenced throughout the backend were defined in no document —
they are now in `docs/features.md`, and the original F1–F14 tags were re-numbered
against it.

FND-07 on the sprint board asks for owners for NF12, NF14 and NF15. All three now
have one in the table above.

## Screens added after the design document

Three screens were added that the design document names requirements for but never drew.
They are listed in `docs/design/design-system.md` under **Screen status** and need adding
to `Sector7_UI_Design_Sections.docx` before it is submitted.

| Screen | Requirement | Why it was missing |
| --- | --- | --- |
| S-11 Customers | R5 (priority 1) | D-03 calls the module "Sales and CRM"; nothing in S-01…S-10 was a customer |
| S-12 Customer detail | R5, R6 | Follows the S-05 record pattern, with sales orders in place of stock documents |
| S-13 Chart of accounts | R18 (priority 1) | S-07 picks accounts from a list the user could neither see nor edit |

A customer self-service portal is **out of scope** and is not a gap. All six F2 roles are
internal staff, no R-number asks for one, and it would need row scoping below
`organization_id`. Customers are records staff work with, not users who sign in.

## Open questions

Two state machines disagree with the wireframes and need settling before the
`sales` and `procurement` addons are built:

- F7 specifies Draft → Confirmed → Fulfilled → **Closed** / Cancelled. The design
  doc, the S-03/S-04 wireframes, and `frontend/src/addons/sales/fixtures/orders.ts`
  all use four states with no `Closed`. R15 is written against `Closed`.
- F8 specifies Draft → Submitted → Received → **Paid** / Cancelled. `StatusPill`
  has tones for `submitted` and `received` but none for `paid`.
