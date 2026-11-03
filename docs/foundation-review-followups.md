# Foundation review follow-ups

The starting point is main at `a272a53`, which includes PR #13 and the team's
November 2 fixes. This branch keeps those changes and addresses two remaining
cases found while comparing the saved local work with main.

## Accounting transaction scope

The router mount already uses a function-scoped tenant session. The three new
accounting routes requested that dependency with its default request scope,
creating a second transaction finalizer on the same session. Capturing actual
ASGI events showed a commit before the response and another after it.

All three route signatures now use `scope="function"`. Transaction tests check
exactly one commit before the response starts, a 500 when commit fails, and
rollback of flushed writes. They cover contract factories, identity, product
reads, and accounting reads and journal posting. The architecture check also
catches new tenant routes with inconsistent dependency scopes.

The FastAPI minimum is now 0.121.2, which supports these dependency scopes and
the fix for top-level dependencies. The locked version stays unchanged.

## Existing email records

The team's User validator normalizes newly assigned emails. Existing database
rows do not pass through that validator. Login now also compares the stored
email without regard to case, within the selected organization.

If two old accounts differ only by case, login returns the usual invalid
credentials response rather than choosing one. Those accounts need deliberate
cleanup. Tests bypass the ORM validator to reproduce old stored values, check
uppercase and padded login input, and verify organization isolation.

The team's email validator, tenant predicates, threaded password verification,
and generic invalid-credentials handling remain in place.

## Saved work and database design

The complete earlier local implementation, including its new files, is saved
in local commit `e050aae` on
`backup/pr13-local-review-fixes-2026-11-03`. The older
`backup/fnd-foundation-2026-10-18` branch remains unchanged.

The saved implementation's broader contract and storage changes are not applied
here. The team's merged contracts, accounting service, and migration chain are
the starting point for future work. This branch adds no database migrations.

## Validation

- Backend: 175 tests passed on SQLite and 175 on isolated PostgreSQL 18.
- Backend Ruff, Python compilation, and offline lock-file verification passed.
- PostgreSQL migrations upgraded, reported no schema drift, downgraded to base,
  and upgraded again successfully using a separate disposable database.
- Frontend: 329 tests passed; lint, type checking, and the production build passed.
- The local Vite server served the HTML and JavaScript entry point successfully.
  This checks startup; it does not replace manual browser testing of workflows.

The follow-up edits are left uncommitted for review. No branch was pushed.
