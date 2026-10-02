# Feature List

The F-IDs referenced throughout the backend docstrings and the traceability
matrix. Transcribed from `Sector7-AI-Product-Requirements.docx`, "List of
Features".

Every addon file's docstring carries the F-IDs it serves. The `features` key in
each `__manifest__.py` is the authoritative list.

| ID | Feature | Addon |
| --- | --- | --- |
| F1 | Tenant isolation and workspaces. Every record scoped to an organization by composite foreign key, tenant context derived from the JWT on every request. | `base` |
| F2 | Authentication and role-based access control. Argon2id hashing, JWT and refresh tokens, six roles enforced at the API controller layer. | `base` |
| F3 | Customer management. Profiles, contact lifecycle, credit status, per-customer purchase ledger. | `sales` |
| F4 | Product catalog. SKU master, category hierarchy, tiered pricing, unit cost and price, linked asset and revenue accounts, safety-stock thresholds. | `inventory` |
| F5 | Inventory ledger. Append-only movement log recording the change and the resulting on-hand quantity, with acting user and source document. | `inventory` |
| F6 | Concurrency-safe stock allocation. Pessimistic row locking during order confirmation so two simultaneous orders cannot oversell. | `inventory`, `sales` |
| F7 | Sales order workflow. Order state machine with server-side line and order totals and inventory allocation. | `sales` |
| F8 | Procurement workflow. Supplier profiles, purchase order state machine, goods receipt that increments stock automatically. | `procurement` |
| F9 | Moving average costing. Unit cost recalculated deterministically on every goods receipt. | `inventory`, `procurement` |
| F10 | Chart of accounts. Per-tenant structure across the five standard types with unique codes. | `accounting` |
| F11 | Double-entry general ledger. Entries and lines with database-level and API-level enforcement that debits equal credits. | `accounting` |
| F12 | Automated sub-ledger posting. Sales fulfilment posts AR/Revenue and COGS/Inventory; goods receipt posts Inventory Asset/Accounts Payable. | `accounting` |
| F13 | Financial statements. Trial Balance, Income Statement, and Balance Sheet aggregated from journal lines over a date range. | `accounting` |
| F14 | Operational dashboard. Gross margin, inventory value, order throughput, and AP/AR position, computed server-side with no AI in the path. | `home` |
| F15 | Natural-language business assistant. Answers questions by dynamic function calling against parameterized internal APIs, never raw SQL. | `ai` |
| F16 | AI guardrail framework. Tenant ID injected server-side, no autonomous writes, write intents returned as pre-filled forms. | `ai` |
| F17 | Statistical demand forecasting. Asynchronous Holt-Winters forecasts per product with a cold-start guardrail and reorder alerts. | `forecasting` |
| F18 | Contextual insight generator. Narrative summaries of aggregated dashboard metrics, grounded in retrieved ERP records. | `ai` |
| F19 | Audit trail. Immutable inventory ledger and journal history attributing every movement and posting to a user, timestamp, and source document. | `inventory`, `accounting` |
| F20 | Cloud platform and operations. Terraform-provisioned infrastructure, containerized deployment, CI/CD, automated daily backups, verified restoration drills. | `infra` |

## Note on earlier F-numbering

The skeleton's original docstrings cited F1 through F14 against a different
numbering: AI was tagged F12/F14 and forecasting F13. Those tags were written
before this document existed and did not match the requirements document. Every
addon docstring and manifest was re-tagged against the table above during the
addon restructure (ADR 0001).

## Roles

F2 specifies six roles, enforced at the controller layer by `RBACGuard`:

`Owner`, `Admin`, `Sales`, `Inventory`, `Purchasing`, `Accounting`

The frontend fixture in `frontend/src/addons/base/fixtures/org.ts` declares the same
six, and `frontend/src/addons/base/fixtures/people.ts` carries the role-by-area matrix
S-09 renders. `frontend/src/core/app/useAccess.ts` reads that matrix to hide rail entries
and Home queue groups a role cannot see. That is presentation only — `RBACGuard` in
`core/rbac.py` is still the thing that enforces, and it is not written yet.

The S-09 wireframe in `Sector7_UI_Design_Sections.docx` shows only four roles
(`Owner`, `Admin`, `Sales`, `Warehouse`). The wireframe is wrong; this list is right.
