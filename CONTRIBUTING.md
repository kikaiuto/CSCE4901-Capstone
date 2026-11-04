# Contributing

## Branching

Branch from `main`, one concern per branch, and name it by kind:

| Prefix | For |
| --- | --- |
| `feat/` | New behaviour, on either side of the stack |
| `fix/` | A bug, with a test that fails before the change |
| `docs/` | Documentation only |
| `chore/` | Housekeeping with no behaviour change |

Delete the branch once its pull request merges. Nobody pushes to `main` directly.

## Commits

Write the subject in the imperative, under 72 characters, saying what the change
does rather than what you did ("Scope list_users by organization", not "fixed
users"). Put the reasoning in the body when the diff does not explain it. Do not
add tool attribution trailers; this is graded coursework and the commit is yours.

Reasoning that outlives the commit goes in `docs/`, not in code comments. The
source tree carries no comments or docblocks.

## Pull Requests

Fill the template: summary, requirement IDs (`R-` and `NF-` from
`docs/requirements/traceability.md`), changes, how you tested, and screenshots
for anything visual. Keep a pull request to one concern so a reviewer can hold
it in their head. Rebase or merge `main` in before asking for review.

CI must be green: the frontend workflow runs lint, typecheck, tests, and build;
the backend workflow runs Ruff, the migration cycle on PostgreSQL 17, and the
tests on PostgreSQL and SQLite. A test run that finds no tests fails.

## Definition of Done

NF22 in the requirements document, applied to every pull request:

- CI is green on the final commit.
- Any migration upgrades and downgrades cleanly against a disposable database.
- A new or changed route has a tenant-isolation test in its addon's `tests/`.
- A new screen or control follows the `unwired` convention until its endpoint exists.
- The change runs under `make up`.

## History

On 2026-10-05 `main` was force-pushed while landing PR #1, the restructure onto the
addon layout. A clone made before then shares no ancestor with the current `main`,
so `git pull` refuses to merge with "refusing to merge unrelated histories".

Do not pass `--allow-unrelated-histories`. Keep your local work on a backup
branch and replace your `main` with the real one:

```bash
git fetch origin
git branch backup/pre-restructure main
git checkout main
git reset --hard origin/main
```

Then bring your commits forward on a fresh branch with `git cherry-pick`. If a
pick conflicts because the restructure moved the file, abort it and redo the
change by hand against the current layout. Never merge the backup branch into
`main`, and delete it once your work is on the new branch.
