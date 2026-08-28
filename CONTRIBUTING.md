# Branch Workflow

`main` is the **source of truth** — the only branch that deploys to production (Vercel).
`dev` is the **working branch** — all day-to-day work happens here.

## Rules

- **Never commit directly to `main`.** Work on `dev`, then ship `dev` → `main` (fast-forward only).
- `main` is protected: it requires the **"Frontend tests and build"** CI check to pass and
  disallows force-pushes. The only way `main` can move is a green, fast-forward update.
- Don't rewrite pushed history on `dev` unless you've just made the push and no one has fetched.

## The ship loop

```bash
# 1. Work on dev
git checkout dev
git pull origin dev
# ... edit, test, commit ...
git push origin dev

# 2. Ship dev -> main (fast-forward only; CI must be green)
git checkout main
git pull origin main
git merge --ff-only dev
git push origin main

# 3. Back to dev for the next change
git checkout dev
```

`git merge --ff-only` fails loudly if `dev` and `main` ever drift apart, instead of silently
creating a merge commit — if it refuses, stop and investigate (someone pushed to `main`
directly, or `dev` was rewritten).

## About the "dev had recent pushes" banner

GitHub shows **"dev had recent pushes"** with a *Compare & pull request* button whenever `dev`
contains commits that aren't on `main` (the default branch). This is normal and expected in
this workflow — it's GitHub nudging you to merge. It disappears the moment `dev` is shipped
to `main`.

If the banner persists after the branches are already in sync, it's a stale page render from
GitHub's cache — hard-refresh (Cmd+Shift+R on macOS) and it clears.

## CI

- Every push to `dev` and `main` runs the workflow in `.github/workflows/ci.yml`:
  `npm ci` → tests → production build (warnings fail the build under `CI=true`).
- A **red CI run on the tip of `main`** means `main` is broken — fix it before anything else.
- Red runs on older commits are history and can't block anything.

## Emergency bypass

`main` has `enforce_admins: false` — as repository admin you can always bypass the CI gate
(Vercel also has a *Force Promote* button on a deployment). Use it only when production is
down and waiting for CI would make it worse.
