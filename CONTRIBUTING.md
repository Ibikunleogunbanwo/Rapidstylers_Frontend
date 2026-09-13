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

## Forms and validation

The app has two validation libraries in the tree: **Zod** (newer flows) and **Yup**
(older pages). The standard going forward is **Zod**:

- **New forms use Zod** with Formik as the form-state layer (see the stylist signup steps
  under `src/pages/styler/stylerSignUp/` for the pattern — `zod` schema + `Formik` +
  `validate` adapter).
- **Existing Yup forms are migrated opportunistically** — when you are already editing a
  page that uses Yup, port its schema to Zod as part of that change. Do not bulk-rewrite
  untouched pages.
- Remove the `yup` dependency only once `grep -rl "from 'yup'" src` returns nothing.

This is deliberately incremental: the target is *one* validation library, reached by
attrition, not a rewrite PR that touches every form at once. Background and rationale:
`Rapidstylers_Backend/docs/simplification-plan.md` (Step 4).

## API responses and error handling

The backend can answer **HTTP 200 with a body `statusCode` of `"400"`** for business
failures. Always `await` the response and check the body's `statusCode` before treating a
call as successful — the Axios instance in `src/hooks/remote/apiClient.js` already handles
this for you: it normalizes an application-level failure into a rejected promise (the
classification itself lives in `src/hooks/remote/appFailure.js`), so treat the call as
throwing: `try { await api.foo() } catch (err) { toast(err.message) }`.
Legacy pages may still hand-roll `data.statusCode === "400"` checks; those are being
retired as pages are touched.

## Frontend toolchain (Vite)

The app builds with **Vite 8** (rolldown/oxc). Two things are deliberate and easy to
"clean up" by accident:

- **JSX inside plain `.js` files is supported on purpose.** Vite 8 only parses JSX for
  `.jsx`/`.tsx`, so `vite.config.js` registers a small pre-transform
  (`rapidstylers:jsx-in-js`) that compiles `.js` with the oxc `jsx` loader. This is why the
  CRA-era files did not need renaming. New files may be `.js` **or** `.jsx` — both work.
- **The build output keeps CRA's layout.** Assets land in `build/static/js`, `build/static/css`,
  and `build/static/media`, and the entry chunk keeps the name
  `static/js/main.<hash>.js`. Three things depend on that: `vercel.json`'s immutable cache
  rule for `/static/*`, the boot-time stale-shell guard in `src/index.js`, and
  `scripts/verify-build-chunks.js` (also run by the *Chunk integrity check* workflow).

`npm run build` also emits `build/.vite/manifest.json`; the integrity check reads it.

## Writing tests (Vitest)

Tests run on **Vitest** with jsdom and globals, so Jest-style specs work, but three Jest
behaviours are stricter here:

- **A `vi.mock` factory must return an object.** Jest let a factory return a component
  function directly; here write `vi.mock("./thing", () => ({ default: () => <div /> }))`.
- **A missing named export on a mock throws.** If a module imports `FOO` from a module you
  mock, the mock must define `FOO` (or spread `await importOriginal()`).
- **Import modules the way they export them.** `import userReducer from "./userReducer"`
  silently yielded `undefined` under Jest's CJS interop; here it throws — use the named
  import the module actually has.

jsdom also does not implement `AnimationEvent`, and react-dom only registers its animation
listeners when that interface exists — `src/setupTests.js` installs a minimal shim so
`onAnimationEnd` fires in tests.
