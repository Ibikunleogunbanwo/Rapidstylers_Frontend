# RapidStylers — Step 1 launch-readiness QA plan

Prepared: October 11, 2026. Audience: QA, frontend/backend engineers and the release owner.

This is a standalone test plan for Step 1 of [the go-to-market strategy](go-to-market-strategy.md). Execute it against a named release candidate, attach evidence and use the sign-off section to decide whether the invitation-only pilot can begin. This document defines tests; it does not certify that they have passed.

## 1. Scope and release baseline

In scope: customer and stylist registration, sessions, discovery, profile editing, booking, payment lifecycle, notifications, support, disputes, refunds, payout handling, admin navigation, browser compatibility and deployment checks.

Out of scope: unfinished reference-admin capabilities such as full customer/booking directories, revenue charts, promotions and CMS editing. See [the reference-admin backend handoff](admin-reference-review-2026-10-11.md). Do not fail the current candidate for a feature explicitly excluded from this launch scope; report any exclusion that prevents an essential launch journey.

Current recorded gates in `release-gates.json`:

| Gate | Recorded status | QA responsibility |
|---|---|---|
| bookingReplay | Passed on local contract/concurrency evidence | Run the deployed integration replay and duplicate-action cases below |
| schemaValidation | Passed on fresh/upgrade tests and VPS evidence | Confirm the deployed candidate still starts with validation and is healthy |
| stylistProfileUpdates | Passed on frontend/backend contract tests | Verify real saves, refresh persistence and ownership denial |
| providerWorkflows | Pending | Complete actual test-provider integration and CI/secret-scan evidence |
| browserCompatibility | Pending | Complete real-browser coverage; mocked Chromium checks alone cannot close it |

The gate file records an earlier Stripe reconciliation lookback defect and a local fix. Engineering must establish whether that fix is present in the deployed backend before payment sign-off. The previous claim that an authenticated reconciliation call returning zero proves correct reconciliation is insufficient: QA must use known intents inside the lookback window.

## 2. Execution record — fill before testing

| Field | Record |
|---|---|
| Test run ID and date/time, including timezone | |
| QA tester and release owner | |
| Frontend URL, commit SHA and deployment ID | |
| Backend URL, commit SHA/image digest and environment | |
| Database migration version and API health | |
| Stripe mode and test-account identifier; webhook endpoint | |
| Cloudinary test environment and enabled incoming transformation | |
| Browser/device/OS versions | |
| Configured payment authorization lead time | |
| Configured dispute/payout hold and cancellation windows | |
| Approved coverage, pricing, travel fee and cancellation rules | |
| Notification-delivery target and support contact | |
| Evidence folder or issue-tracker link | |

Use a dedicated non-production backend/database and Stripe test mode for mutations. Prefer a dedicated test Cloudinary environment. If engineering proposes testing a shared deployed environment, obtain approval for the named synthetic accounts and records first. Never assume that a test publishable key proves the backend is in test mode.

Production checks in this plan are read-only unless the release owner explicitly approves a named test transaction. Never drop/reset the production database or run Flyway `clean` there. Fault injection and clock manipulation belong only in an isolated environment.

## 3. Prerequisites and test data

Engineering supplies credentials through the approved local environment/password manager, not this document or screenshots.

| Fixture | Required setup |
|---|---|
| Customer A and Customer B | Separate verified synthetic accounts; A owns the primary bookings |
| Stylist A and Stylist B | Separate synthetic accounts; A approved with bookable slots and completed test payout onboarding |
| Pending stylist | Unapproved account for eligibility and admin-approval tests |
| Admin A | Authorized administrator; valid step-up password available privately |
| Signed-out browser | Clean session/profile with no auth tokens |
| Service and location | Approved test service, supported Canadian address and known timezone |
| Appointment slots | Distinct future slots; one shared slot for concurrency; blocked/closed-day slot |
| Payment methods | Engineering-approved Stripe success, decline and authentication-required test fixtures; never real cards |
| Images | Synthetic valid image, invalid format, image over the browser's 5 MB limit, and large-dimension image |
| Ownership fixtures | Uploaded image owned by A and uploaded image owned by B; no real identification documents |
| Booking states | Requested/authorized, accepted/captured, failed/action-required payment, cancelled, completed, disputed, and payout-eligible |
| Provider recovery | Controlled provider failure/lost-response capability, webhook redelivery and reconciliation access |

Use unique run identifiers in synthetic email addresses, business names and booking notes. Record appointment, PaymentIntent, refund and transfer identifiers privately for reconciliation. Do not expose tokens, OTP codes, passwords, card details, government ID images or raw authorization headers in shared evidence.

## 4. Test execution order

1. Validate environment and candidate identity: QA-01–QA-03.
2. Run registration, sessions and profile checks: QA-04–QA-09.
3. Run discovery, booking and payment checks: QA-10–QA-18.
4. Run disputes, refunds, payouts and support: QA-19–QA-24.
5. Repeat critical journeys across the browser/device matrix: QA-25–QA-28.
6. Triage defects, retest fixes and complete release sign-off.

A blocked prerequisite makes dependent tests **Blocked**, not Passed or Not applicable. Independent read-only checks may continue.

## 5. Test cases and acceptance criteria

### Environment and deployment

| ID / priority | Steps | Acceptance criteria | Evidence |
|---|---|---|---|
| QA-01 / P0 — Candidate and CI | Record frontend/backend revisions; inspect GitHub checks, deployment status and live asset loading. | Frontend checks, build/chunk verification, dependency audit and required secret scan succeed for the candidate. Deployment is successful; the live page loads the intended assets without chunk errors. A Git push alone is not deployment evidence. | Commit/deployment IDs, CI links, redacted console/network capture |
| QA-02 / P0 — Database and API | Inspect Flyway history, migration validation, effective Hibernate setting, startup log and container health. | V1–V23 are successful for this baseline, or any newer candidate migrations are fully recorded. Flyway validates; Hibernate uses `validate`; application starts and health is healthy. Existing fresh/upgrade evidence is linked to its tested backend revision. | Read-only command output and startup timestamp |
| QA-03 / P0 — Provider configuration | Engineering verifies effective Stripe mode, current credentials, webhook setup and deployed reconciliation implementation; create a known test intent in the lookback window and reconcile. | Stripe is explicitly test mode. The known intent is examined by reconciliation; discrepancies surface correctly. Valid signed webhooks are processed; invalid signatures are rejected. No expired-key failures. No real charge, refund or transfer occurs. | Mode verification without secrets, known intent ID, redacted reconciliation/webhook logs |

### Registration, authentication and profile

| ID / priority | Steps | Acceptance criteria | Evidence |
|---|---|---|---|
| QA-04 / P0 — Customer registration and OTP | Register a unique customer; receive/verify OTP. Separately try wrong, expired and reused codes; resend using the configured cooldown. | Valid flow creates exactly one usable account. Wrong/expired/reused codes do not authenticate or create an account. Resend and abuse limits are enforced server-side; feedback explains how to recover without disclosing sensitive internals. | Synthetic account ID, delivery timing, redacted response/status evidence |
| QA-05 / P0 — Stylist registration | Complete personal details → email verification → business details → photos → password. Test invalid fields, password mismatch, visibility control, Back and refresh. Submit once. | Each step validates required fields; errors appear beside relevant fields. Password visibility works. Own-tab draft/photos survive supported navigation. Valid submission creates one stylist account and clears signup drafts/secrets. Pending approval state is accurate. No unsupported success after a failed request. | Step screenshots, account ID, sanitized final request/result |
| QA-06 / P0 — Real upload and ownership | Upload valid synthetic profile/ID photos through the actual provider. Try invalid format and oversized browser upload. In isolated integration testing, try missing/expired signup upload pass and another stylist's uploaded image. | Valid signed upload succeeds; account references the returned image. Invalid client files produce readable errors before upload. Unauthorized signature requests and cross-account image assignment/deletion are rejected server-side. Signed incoming transformation limits stored image width/height to at most 2000 pixels each when configured. Accepted policy is dimension cap plus configured provider plan limit; strict 5 MB server enforcement is not required. | Provider result/metadata, redacted authorization-denial responses, image dimensions and configuration evidence |
| QA-07 / P0 — Login and logout | Sign in as each role; verify correct dashboard. Log out, press Back, refresh and try protected URLs. Test session expiry and configured refresh/reuse behaviour with engineering. | Signed-out/expired/revoked sessions cannot access protected data or mutate records. Wrong-role access is rejected by the server. Logout immediately clears application credentials and protected UI; unrelated preferences remain. Expiry gives a usable sign-in path without redirect loops. | Browser recording, denied API responses, redacted session lifecycle evidence |
| QA-08 / P0 — Profile saves and timezone | As Stylist A, edit name/phone, business/address/timezone and profile/cover photo. Refresh, sign out/in and open the public profile. Try invalid timezone, duplicate phone and a failed save. | Valid changes persist and appear in the appropriate views. Invalid values are rejected. Failed saves retain edits and clearly report failure; they never display a false success. Email is read-only in this profile flow. Address/timezone changes affect booking display correctly. Ownership denial from QA-06 remains enforced. | Before/after persisted values, sanitized payloads, public-profile screenshots |
| QA-09 / P0 — Approval eligibility | Confirm pending stylist cannot receive bookable exposure; admin approves the synthetic account and verifies eligible discovery. Test rejection/suspension on a separate fixture. | Eligibility agrees across discovery, booking and backend authorization. Restricted accounts cannot bypass restrictions through direct API calls. Mutations are attributed in audit records. Define reapproval requirements for later profile changes before sign-off. | Eligibility responses and audit records |

### Discovery, booking and payments

| ID / priority | Steps | Acceptance criteria | Evidence |
|---|---|---|---|
| QA-10 / P0 — Address and discovery | Type the supported test address, select a suggestion, inspect resolved location, search/filter services and open a profile. Simulate Places failure separately. | Actual provider suggestions and geocoding work. Selected address resolves correctly. Service/category filters lead to appropriate profiles. A provider outage is distinguishable from zero matches; manual address entry remains usable. Missing category images have accessible fallbacks. | Address result, search screenshots, redacted provider error/recovery result |
| QA-11 / P0 — Quote, availability and booking | Select service/time, inspect estimate and travel fee, submit a booking. Attempt a blocked/closed-day time. | Customer sees the payable total and applicable rules before confirmation. Backend recalculates authoritative price and availability. Valid booking returns an appointment ID and consistent status; unavailable slots cannot be booked. Dates/timezones agree for customer and stylist. | Quote and booking IDs, totals, slot and timezone evidence |
| QA-12 / P0 — Duplicate/concurrent booking | Double-submit once; reload/retry after a controlled lost response using the same idempotency key. Run two customers against the same slot in an isolated environment. | Replay names the same booking; there is no duplicate appointment or financial action. Conflicting slot requests do not create overlapping appointments. Cross-account or changed-payload reuse of a key is refused; failed/pending attempts recover according to the contract. | Request keys stored privately, appointment counts, test intent IDs and concurrency results |
| QA-13 / P0 — Payment success | Use the success test fixture for a near-term booking; observe authorization, stylist acceptance and capture. Complete the appointment. | Required authorization succeeds. For authorized bookings, acceptance captures once and backend/Stripe states agree. Completion does not charge again. Receipt identifies the correct booking and amount. | Booking/intent IDs, state sequence, receipt and amount |
| QA-14 / P0 — Deferred authorization | Book outside the configured authorization lead window; progress the isolated fixture into the authorization window and run the scheduler. | Deferred payment is accurately labelled, not presented as already captured. Scheduled authorization and acceptance/capture follow the candidate's configured contract exactly once. Failures require recovery and are visible. | Effective lead-window configuration, scheduler and Stripe/booking states |
| QA-15 / P0 — Decline and authentication | Use decline and authentication-required fixtures through the application. Complete, abandon and fail the supported authentication flow; retry a recoverable payment. | Decline never produces a false paid state. Authentication is completed through the supported provider flow before success. Retry does not duplicate a charge. Interrupted/failed payment can recover, or has an explicitly approved support fallback. Sensitive payment details remain with the provider. | Test fixture label, intent status, UI result and recovery evidence |
| QA-16 / P0 — Decline/cancel before capture | Stylist declines a requested authorized booking; customer cancels a separate requested authorized booking. Repeat each action once. | Authorization is released rather than refunded as a captured payment. Booking status updates correctly, held slots are released and repeat actions are safe. Customer and stylist receive the correct notification. | Cancelled intent state, slot reuse and appointment status |
| QA-17 / P0 — Cancel after capture | Cancel an accepted captured fixture as an allowed actor; test stylist cancellation after completion within and outside the configured window. Repeat supported cancellation. | Authorized actor/rule checks are enforced server-side. Eligible captured cancellation refunds once; slot and booking state agree. Outside-window requests are refused and give the approved support path. No transfer/refund is duplicated. | Configured window, refund IDs/amounts and state evidence |
| QA-18 / P0 — Webhook delivery/reconciliation | Redeliver an actual signed success/cancellation event for an app-linked test booking; exercise out-of-order/invalid events in isolation. Run reconciliation against known intents and a seeded mismatch. | Valid booking-linked events update the correct record without duplicating side effects. Invalid signatures fail; stale events do not regress final state. Reconciliation examines known records and reports the seeded mismatch. A valid event with no local booking only proves transport/signature handling, not booking integration. | Event IDs, booking IDs, webhook logs and reconciliation report |

### Disputes, refunds, payouts and support

| ID / priority | Steps | Acceptance criteria | Evidence |
|---|---|---|---|
| QA-19 / P0 — Customer outcome/dispute | Complete a booking; verify outcome controls while `disputeWindowEndsAt` is set. Confirm service on one fixture; report a problem on another. Retry and test expired window/other customer. | Confirmation/report sends once. Report is associated with the right customer/appointment, shows under review and holds payout. Expired or unauthorized reports are rejected server-side. Customer outcome controls/status match the backend decision. | Appointment state, window timestamps, dispute entry and payout hold |
| QA-20 / P0 — Admin refund review | Open refund context, validate remaining refundable amount, issue partial refund with `recoverStylistShare` off. On a separate eligible fixture test the option on, then refund the remaining amount. Attempt excessive amount and wrong step-up password. | Review identifies the correct appointment, captured amount, prior refunds and remainder. Partial/full totals never exceed captured value. Step-up is enforced by the server. Recovery selection produces the intended accounting result; partial refund leaves correct remaining state. A completed refund appears once. | Context, selected recovery option, refund IDs and reconciled ledger totals |
| QA-21 / P0 — Uncertain refund recovery | Engineering simulates provider acceptance followed by lost response in an isolated test; retry the same unresolved refund intent. Test concurrent retries. | Recovery reuses/reconciles the original provider intent/key. Customer is refunded once; no fresh refund is created while the old outcome is uncertain. The UI reports uncertainty without inviting blind duplicate action. | Stable key/intent reference, provider refund count, before/after totals |
| QA-22 / P0 — Admin dispute resolution | Load the dispute queue; refund first if the approved decision owes money, then resolve with a note. Reopen customer booking. | Correct booking is reviewed. Required refund completes before resolution. Resolution clears the appropriate hold once; reason, decision note and resolution time persist and are visible to the authorized customer. Repeat resolution is safe; unrelated customers cannot read the result. The UI acknowledgement is not proof of a provider refund: QA verifies financial records. | Refund-before-resolution timeline, note/date, audit and customer screenshots |
| QA-23 / P0 — Payout hold and release | Test a completed confirmed booking, a disputed booking, an eligible undisputed expired-window booking and a payout-account-incomplete fixture. Try manual payout from admin. | Holds follow the configured policy. Disputed/ineligible records cannot be paid through direct requests. Eligible payout goes once to the correct test connected account for the correct net amount. Retry/concurrent payout does not transfer twice. Account problems/failed transfers are visible and recoverable. | Appointment/transfer IDs, hold reasons, net calculation and provider results |
| QA-24 / P1 — Notifications and support | Check booking/acceptance/cancellation/receipt messages; open/read/delete notification; submit a support ticket; admin responds. Send a small announcement only to approved test recipients. | Required messages reach the intended recipients within the agreed target. No cross-account messages. Read/delete preferences persist. Support draft survives a failed update; saved response/status persists. Support/refund/dispute escalation contacts are available to QA and launch users. | Delivery timestamps, notification/ticket IDs and response screenshots |

### Browser, mobile and resilience

| ID / priority | Steps | Acceptance criteria | Evidence |
|---|---|---|---|
| QA-25 / P0 — Browser journey | Repeat registration, sign-in/out, discovery, booking/payment recovery, profile save and admin queue navigation across the matrix below. | No browser-specific failure blocks a core journey. No redirect race, navigation loop, broken upload/photo restore or unhandled error. Playwright WebKit success alone does not establish real Safari/device coverage. | Browser/version-specific results, recordings and traces |
| QA-26 / P1 — Mobile layout/accessibility | Test menu, logo-home link, forms, password visibility, toast, dialogs and long errors at 320/390/430 px, portrait/landscape, keyboard-only and 200% zoom. | No unintended horizontal scrolling or blocked controls. Labels/errors are readable and associated with fields. Focus and menu state are understandable. Toast is a compact inset card, not a full-width banner. Customer logo goes home; promotional card appears only on overview and quote is absent from customer working pages. | Screenshots, keyboard/focus notes and any accessibility findings |
| QA-27 / P1 — Animation and performance | Open home normally and with reduced motion; verify video playback on real mobile. Inspect black brand-animation band and text contrast. Measure home/discovery/booking under the agreed network/device profile. | Normal hero actually advances playback with muted inline video; compatible H.264 asset loads. Reduced motion uses poster and makes no decorative video request. If browser energy/autoplay policy prevents playback, a usable poster remains. Band is black with readable light text/icon. No layout shift blocks interaction. Performance meets the release owner's recorded targets; synthetic measures are labelled as such. | Video time/format, network capture, screenshots, device/network profile and performance report |
| QA-28 / P0 — Failure and stale-session recovery | In isolation, fail profile/availability/admin queue reads, interrupt booking writes, expire session during a save and test stale frontend chunks after deployment. | Failed reads do not become fake zero/default data. Availability cannot save defaults after failed load. Forms retain recoverable edits; protected writes fail after logout/expiry. No request loop or duplicate financial action. Stale bundles recover to the current app without an endless reload. | Failure status, recovery recording, request counts and console logs |

## 6. Browser/device matrix

Record exact versions; use currently supported versions agreed by the release owner. Mark an unavailable browser **Blocked**, not Passed.

| Browser/device | Minimum coverage | Result / evidence |
|---|---|---|
| Desktop Chrome/Chromium | All applicable cases | |
| Desktop Firefox | QA-04–QA-08, QA-10–QA-13, QA-15, QA-19–QA-20, QA-25–QA-28 | |
| Real Safari on macOS | Same critical coverage as Firefox | |
| Real iPhone Safari | Customer registration, upload, booking/payment recovery, logout, menu/forms and hero/poster behaviour | |
| Android Chrome | Same mobile critical coverage; include the reported mobile toast/layout behaviour | |
| Playwright Chromium desktop/mobile | Full automated regression suite | |
| Playwright WebKit | Supplemental Safari-engine regression checks, including sign-in redirect stability | |

Financial fault injection runs once in the isolated integration environment; repeat user-facing success/recovery on supported browsers without unnecessarily multiplying transactions. Admin financial controls require desktop coverage and mobile smoke coverage if mobile admin use is supported.

## 7. Expected state and accounting checks

| Action | Expected invariant |
|---|---|
| Booking replay | Same appointment identity, no duplicate booking/payment |
| Authorized booking accepted | One capture; backend and provider agree |
| Authorization cancelled/declined | Hold released; no captured-payment refund |
| Captured eligible cancellation | One refund, correct booking state and released slot |
| Partial refund | Accurate remaining refundable balance; no premature full-refund state |
| Completion | No second capture; payout eligibility respects hold policy |
| Dispute | Payout held; only authorized customer/admin can act |
| Resolution | Persisted decision and correct payout/refund disposition |
| Payout retry | One transfer to the intended connected account |

Do not decide success from a toast alone. Check UI, backend persistence and actual test-provider records for every financial case. Booking status and payment status are separate fields.

## 8. Evidence and defect reporting

For every case record: test ID, candidate revisions, environment, browser/device, fixture identifiers, steps actually executed, actual result, expected result, UTC/local timestamp, evidence links, defect ID and retest result.

Use one of: **Not run / Passed / Failed / Blocked / Not applicable**. Not applicable requires a written reason and owner approval. Existing automated evidence may be reused only when linked to the relevant candidate/scope; mocks must be labelled.

| Severity | Examples | Release treatment |
|---|---|---|
| Critical | Unauthorized access, real payment in a test run, duplicate charge/refund/payout, sensitive data exposure | Stop affected testing, notify owner immediately; blocks launch |
| High | Registration/booking/payment unavailable, incorrect totals/timezone, lost profile changes, unresolved provider reconciliation | Blocks affected core journey and launch until fixed/retested |
| Medium | Recoverable non-core defect, confusing state, significant layout/accessibility problem | Fix or obtain explicit scoped acceptance with workaround |
| Low | Minor cosmetic issue that does not obscure information/action | Track with owner and planned resolution |

P0/P1 above indicate test execution priority, not automatic defect severity. Severity follows the actual impact.

### Case result template

| Field | Value |
|---|---|
| Case ID / tester / timestamp | |
| Frontend SHA / backend image / environment | |
| Browser / OS / device | |
| Synthetic fixture IDs | |
| Actual steps and result | |
| Expected result / acceptance criteria | |
| Status / severity / defect link | |
| Screenshots, logs and provider evidence | |
| Retest result / candidate | |

## 9. Read-only VPS verification commands

An authorized operator can capture these without exposing secrets. Add `sudo` only if required by the host's Docker permissions.

```bash
docker inspect --format \
  'Status={{.State.Status}} Health={{if .State.Health}}{{.State.Health.Status}}{{else}}not-configured{{end}} Started={{.State.StartedAt}}' \
  rapidstylers-api
```

```bash
docker exec rapidstylers-api printenv SPRING_JPA_HIBERNATE_DDL_AUTO
```

```bash
docker exec rapidstylers-mysql sh -c \
  'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" rapid_stylers -e "SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;"' \
  2>/dev/null
```

```bash
docker logs --timestamps rapidstylers-api 2>&1 \
  | grep -Ei 'flyway|validated|migration|schema-validation|SchemaManagementException|Started .*Application'
```

Review/redact log output before sharing. Never print the full container environment or Stripe/Cloudinary credentials. Confirm timestamps correspond to the deployed candidate, not an older successful boot. These commands do not exercise the provider/payment workflow.

## 10. Automated checks for engineering

Run from the frontend repository with the candidate checked out. Browser tests use intercepted providers and supplement the real-provider tests above.

```bash
npm ci
npm audit --audit-level=moderate
npm test
npm run build
BUILD_VERIFY_REQUIRE_PRESENT=1 node scripts/verify-build-chunks.js
npx playwright test --workers=2 --retries=0
```

For parallel QA runs use a unique Playwright `--output` directory and an isolated server/port configuration to avoid shared trace cleanup or build/server interference. Record exit codes and final test summaries. Request backend fresh/upgrade/concurrency/security/provider evidence from the backend owner; do not run an unknown integration-test configuration against production.

`npm run release:check` additionally enforces clean committed `dev` and gate evidence. It is a verification command, not a way to mark gates passed. A permitted main push that bypasses the guard does not close launch readiness.

## 11. Support and incident readiness

Before inviting customers, confirm named coverage and contact paths for registration failures, payment uncertainty, cancelled appointments, refunds/disputes and payout delays. Confirm who can disable booking safely, reconcile money and revert frontend/backend releases. Record rollback revisions and database compatibility; do not assume application rollback permits reversing a schema migration. Alerting must surface repeated reconciliation/provider failures rather than relying on customers to report them.

## 12. Exit criteria and sign-off

Step 1 is complete only when:

- All P0 cases pass for the agreed scope; applicable P1 cases pass or have explicit owner acceptance.
- No open Critical or High defects affect launch journeys.
- Actual provider workflows and supported-browser results have evidence; blocked tests are not counted as passes.
- Frontend/backend candidate revisions, migration state, CI, secret scan and deployment status are recorded.
- Every financial fixture is reconciled across booking, Stripe refund/transfer and local accounting records.
- Support/incident owners, refund rules and rollback procedure are recorded.
- The release owner reviews evidence and updates pending gates to passed only where justified.

| Sign-off | Owner | Candidate / evidence | Decision and date |
|---|---|---|---|
| QA functional readiness | | | |
| Backend/provider readiness | | | |
| Frontend/browser readiness | | | |
| Support and operations readiness | | | |
| Release owner: approve invitation-only pilot | | | |

## 13. Cleanup

Identify every synthetic account, appointment, upload, notification and provider object created during this run. Use approved test cleanup procedures only. Preserve evidence needed for reconciliation/audit; do not delete uncertain financial records to make a queue appear clear. Engineering owns cleanup that needs database/provider administration.
