# Frontend release readiness — October 10, 2026

Work branch: `dev`. Main has not been promoted. Backend source was reviewed without editing it. This report supersedes the initial architecture review's frontend gap status; that review remains a historical baseline.

## Implemented

- Removed ignored Freebuff preview metadata, root OS metadata, and two unused duplicate logos. Product feedback, IDE preferences, real environment files, and referenced assets were retained.
- Unified immediate session logout across customer, stylist and admin UI, preserving unrelated preferences and notifying the server best effort. Protected profile fetches and refresh responses cannot repopulate a logged-out or changed session.
- Validated login email/password before network calls; associated field labels/errors and blocked duplicate submission.
- Set JSON, multipart and refresh deadlines to 30, 60 and 15 seconds. Shared refresh rotation across clients, bounded replay to one attempt, and retained sessions on transient refresh failures.
- Sent a booking idempotency key, persisted it and the Stripe payment-method reference for unchanged retries across reload, and blocked concurrent submission. Uncertain results retain the key. Empty replay responses cannot display booking confirmation; the current backend's in-progress duplicate response also retains the key.
- Suppressed stale search responses after filters/navigation change. Superseded transport requests may still run until their deadline, but cannot update the current search.
- Compressed embedded logo/mockup images and added a static hero poster. Decorative video sources are withheld for reduced motion and mobile viewports.
- Upgraded vulnerable dependencies, migrated Tailwind/PostCSS and jest-dom, and added dependency audit and desktop/mobile browser tests to CI. Documented Tailwind 4 browser requirements in README.

## Verification

The table is the latest run. Every older count in this document is prefixed with the date it belongs to, because an undated number in a running report reads as a second, contradictory current figure.

| Check | Result (2026-10-11) |
| --- | --- |
| Full Vitest suite | **120 files, 1009 tests passed**, exit 0 |
| Production build | Passed; browser harness rebuilds before every Playwright run |
| Build manifest and shell integrity | 131 chunks / 154 files verified; shell and manifest agree on the entry chunk |
| Playwright, 5 projects (desktop Chromium, iPhone Chromium, Firefox, WebKit/Safari, iPhone WebKit) | **155 tests passed, 0 failed** — 31 per project across 7 spec files, exit 0 |
| npm audit --audit-level=moderate | **0 reported vulnerabilities**, exit 0 |
| git diff --check | Passed |

Browser tests cover static reduced-motion media, viewport overflow, invalid login without a credential request, signed-out customer/stylist/admin redirects, admin sign-in/logout, preference preservation, booking lost-response/reload/empty-replay/success with the same key and payload, the five-step professional sign-up with photo restore across a reload, and the stylist/admin navigation on every engine. All external traffic is intercepted. These tests prove frontend behavior with fixtures, not live backend or payment correctness. Desktop/mobile screenshots were inspected; lazy content outside the viewport is not fully represented by a full-page capture.

Every engine in that table runs in CI-equivalent local runs; the earlier "Chromium only" position below is history. What Playwright does *not* supply is a real installed Safari, Firefox or device — see release-gates.json for what the browser gate still requires.

Lottie includes an eval-capable expression player and emits a build warning. The enforcing CSP forbids eval and the existing regression proves bundled animations contain no expression strings. This is not an observed exploit. jsdom navigation/scroll and Vite configuration-format warnings also remain. Dependency audit is advisory coverage, not a claim that the application has no vulnerabilities.

## Backend owner fixes and release gates

### P1: Booking idempotency replay is incomplete

In `booking/service/BookingService.java`, a duplicate with a stored response returns `new BaseResponse()` rather than deserializing the stored result. Its comment says the controller will deserialize the JSON, but `booking/controller/BookingController.java` only returns the service response. The resulting null status/message/data defaults to HTTP 200 through `common/web/ApiResponses.java`. The frontend now treats it as unconfirmed.

`booking/service/IdempotencyService.java` retains claims for the caller's 24-hour TTL but stores completed responses for only one hour. After the response expires, the same key returns an in-progress/submitted error rather than the original result. Validation returns and some exception paths can also leave acquired claims behind. The success response is written to Redis inside the transactional method before the database transaction commits.

Required backend work: replay the actual committed response, align retention windows, define pending/failed/completed outcomes, release definitive failed claims, and tie successful replay storage to durable commit. Verify concurrent duplicates, lost responses, transaction failure, Redis failure and delayed retries against the real backend. Do not weaken the unique booking-slot protections.

### P1 release gate: Effective production schema configuration

`src/main/resources/application.properties:21` remains `ddl-auto=update`. Its current comment explains that baseline cleanup is pending and `validate` is intended. Confirm migrations on both fresh and existing databases, then set and verify `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` in production. Do not blindly change the default before resolving migration gaps.

### P1 release gate: Non-production integration evidence

A non-production URL, seeded customer/stylist/admin accounts and Stripe test configuration are required. Run successful and declined/authentication-required payments, actual booking replay, authorization/ownership denial, OTP/onboarding, signed uploads, cancellation/refund and webhook reconciliation. Engine-level Safari, Firefox and iPhone coverage now runs green in Playwright (see the table above), but behaviour in real installed browsers against the live API, and production performance measurements, remain unverified. No production financial mutations were attempted.

### Authentication architecture follow-up

Refresh tokens remain readable by JavaScript in sessionStorage. Coordinate an HttpOnly Secure cookie refresh or same-origin backend-for-frontend contract with CSRF/CORS controls. The public browser API key must remain an identification/abuse-control hint, never authorization. These are backend/frontend coordination items; no authorization bypass or XSS exploit was established here.

## Promotion decision

Frontend automated checks pass. Keep the work on `dev` until the booking replay and schema gates are resolved and live non-production business workflows pass. No merge, push or deployment to main was performed.

## Development environment attempt

The user selected the shared development context for live testing. Local configuration identifies `http://localhost:9095/rapid_stylers`, MySQL on localhost:3306 and the running RapidStylers Redis container on localhost:6380. Stripe mode is test. No local API was listening.

Attempted to start the API with test-mode Stripe, demo seeding disabled, and both outbox publication and notification consumption disabled. Startup failed in `EncryptionConfig`: the local backend `.env` has no `ENCRYPT_KEY`, and the application correctly refuses the public fallback outside the test profile. No live frontend/backend test was completed. No existing encryption key was replaced and no production request was made.

Frontend `.env.local` currently points to the production API and overrides the localhost value in `.env`. Future dev tests must explicitly override the URL at process launch. Environment files were preserved; no secret values were copied into this report.

Next prerequisite: restore the existing backend encryption key in local configuration, or authorize a separate disposable local database with its own key and synthetic fixtures. Existing database card references must not be exposed to an arbitrary replacement encryption key.

### Disposable dev environment established

After user authorization, a separate localhost database and encryption key were created. The API booted successfully. One synthetic stylist account was configured in that database, preserving the existing database. Desktop and mobile Playwright checks passed through actual local API sign-in, all nine stylist navigation destinations, logout and subsequent protected-route denial. Third-party traffic was blocked; payments and uploads remain unverified. The missing original dev encryption key is no longer a blocker for these isolated tests.

Stylist mobile navigation was repaired, including a previously invisible white menu icon. Unit verification on 2026-10-10 was **742 tests / 76 files passed** — superseded by the table above. Production build and chunk integrity passed. See stylist-dashboard-review-2026-10-10.md for the remaining page-specific gaps; successful navigation is not completion of those workflows.

## Final page-gap fixes

Admin, customer and stylist page fixes are implemented and verified. The stylist overview now uses real appointments; shared forms and failed-load recovery are accessible; defaults cannot overwrite unavailable preference/availability data. Public profile sharing is real. Inert profile editing was replaced with an explicit support workflow because the backend lacks the save endpoints. See [the page audit](page-by-page-audit-2026-10-10.md#fix-pass-completed-on-dev) for the final status and remaining release gates. These backend and external-provider gates still prevent promotion to main.

Booking discovery was subsequently restructured with clear service/name paths, resilient category images, and no promotional sidebar. The latest page audit section contains verification details. No backend/provider release gate changed.

## Dev checkpoint

The reviewed frontend changes, regression tests, architecture/audit reports and release script are included in a dev checkpoint. Local planning notes remain ignored; real environment files and test artifacts are excluded. Promotion to main remains blocked by release-gates.json. Unit verification on 2026-10-10 at that checkpoint was 823 tests across 86 files with 20 desktop/mobile browser checks — superseded by the table above. Backend source remains unchanged.
