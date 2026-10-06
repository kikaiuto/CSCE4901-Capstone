# Contributing

## Branching

## Commits

## Pull Requests

## Definition of Done

## If `git pull` says "refusing to merge unrelated histories"

On 2026-10-05 `main` was force-pushed while landing PR #1, the restructure onto the
addon layout. The rewritten history starts from a different initial commit than the
repository had before that date. A clone made before then shares no ancestor with the
current `main`, so `git pull` refuses to merge.

Do not pass `--allow-unrelated-histories`. That merges the whole pre-restructure tree
back in beside the new one and has to be untangled by hand.

Instead, keep your local work on a backup branch and replace your `main` with the real
one:

```bash
git fetch origin
git branch backup/pre-restructure main
git checkout main
git reset --hard origin/main
```

Then bring your commits forward on a fresh branch:

```bash
git checkout -b feature/my-work
git cherry-pick <commit>...
```

List the commits to pick with `git log --oneline backup/pre-restructure`. If a pick
conflicts because the restructure moved the file you changed, abort it and redo that
change by hand against the current layout; the addon directories under
`backend/app/addons/` and `frontend/src/addons/` replaced the old flat tree.

Never merge `backup/pre-restructure` into `main`. Delete it once your work is on the
new branch.
