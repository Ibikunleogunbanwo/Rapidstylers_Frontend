# Page-by-page functionality audit — October 10, 2026

## Scope and evidence

Reviewed the route table and public/admin/stylist/customer page implementations. Ran desktop and iPhone-viewport Chromium smoke checks against the actual API using an authorized disposable local database. All external traffic was blocked. These checks verify rendering, navigation, initial reads and absence of uncaught browser errors; they do not establish every save/payment/OTP/upload workflow. Content of input placeholders and clearly labelled coming-soon features is not itself a defect.

38 distinct page destinations were checked in browsers: 11 public, 12 customer, 6 admin and 9 stylist. Source inspection additionally covered stylist profile-edit screens, onboarding/authentication continuations and shared controls. Real Safari/Firefox, tablet layouts and failure injection across all workflows remain separate checks. Final results are in progress.md and the release-readiness report.

## Fixed in this pass

- Customer mobile menu was an invisible white image on white, with a mouse-only click handler. Replaced it with a visible labelled button, expanded/control semantics and an accessible close button. Return focus on close and support Escape. Aligned customer sidebar and menu breakpoints at lg; the old md desktop sidebar could overlap the one-column tablet layout.
- Customer shell trusted cached Redux profile data without checking token or role. Added token and CUSTOMER-role checks, redirecting other authenticated roles to their own dashboard. Regressions reproduce cached-profile access with no token and with a stylist token.
- The stylist mobile menu fixes from the preceding review remain in place.

## Admin

| Page | Implementation and remaining gap | Priority |
| --- | --- | --- |
| Login | Dedicated admin sign-in and role handling wired; real local login checked. Inputs lack programmatically associated labels. Captcha, rejected credentials and step-up outcomes need full workflow tests. | P2 |
| Categories | Create/edit/delete call backend; initial list loads in browser. Load failure is replaced by an empty array; no persistent error/retry state. Complete CRUD/failure tests still needed. | P2 |
| Blog | Publish/update/delete wired with inline mutation errors. Failed list load becomes an empty array; saved article content and image rendering need create/read/update/delete integration tests. | P2 |
| Stylists | Verification/moderation and portfolio deletion wired. Failed queue/gallery reads become empty lists; image deletion has no per-image pending lock. Explicit error/retry states needed. | P2 |
| Operations | Seven reads are joined by Promise.all; one failure discards the whole load. Review moderation and support-ticket async handlers have no try/catch or pending lock. Ticket status/response use window.prompt rather than validated UI; cancellation of the second prompt still sends an update with null response. | P1 workflow reliability |
| Payments | Refund and reconciliation wired, including password step-up. Loading is turned off immediately after starting the refund read; a slow/failed read can be displayed as an empty ledger. Confirm uncertain refund retry/idempotency semantics with backend before money workflows are approved. | P1 release verification / P2 display |
| Recovery | Refresh/list wired. A failed campaign read is displayed as no abandoned sign-ups and zero metrics. | P2 |
| Legacy admin dashboard/create-account files | Neither is mounted/imported by App. The account screen links to an unregistered admin dashboard and has a no-op address change handler. Dormant prototypes, not reachable admin product pages. Remove or deliberately replace them; do not count them as working features. | P3 cleanup |

## Stylist

| Page | Implementation and remaining gap | Priority |
| --- | --- | --- |
| Overview | Fixed slot arrays open hardcoded John Wick/date/address/price details. The cancel control has no action; calendar icon has no navigation handler. Connect failure is displayed as NOT_STARTED. Replace with actual appointments, links and error/retry behavior. | P1 |
| Appointments | Real list and accept/decline/complete/cancel handlers. Failed load is indistinguishable from no appointments; server-authoritative action paths need happy/failure/concurrency tests. | P2 |
| Calendar | Real appointment-based month view and actions. Failed list can appear empty. Browser date selection is not consistently based on the professional's zone (today uses UTC toISOString while month cursor uses browser local time). Verify boundary dates and expose fetch failures. | P2 |
| Availability | Weekly slots, exceptions and travel settings call backend. Three reads use Promise.all; failed load can leave editable defaults. Disable saving until authoritative settings load or expose a safe retry. | P1 overwrite risk |
| Services | API-backed add/edit/delete. Price input only checks non-empty, allowing nonnumeric/negative values to be submitted for server rejection; load failure looks empty. Validate finite positive amounts locally and test save failures. | P2 |
| My work | Signed upload, portfolio save and delete wired. Failed portfolio read appears empty and image limit is derived from that list. Some labels are not associated with inputs. Verify upload rollback/restrictions and failed-load handling. | P2 |
| Payouts | Summary and Connect actions wired; summary failure is shown explicitly. Complete test-mode Connect onboarding/payout/error paths are unverified. | Release gate |
| Reviews | API-backed approved averages, pagination and moderation status. Failure falls back to an unrated/empty state. | P2 |
| My profile | Shares a hardcoded Bitly sign-in URL, not the actual public profile; copy is a clickable span. Profile-edit links exist but their save flows below are prototypes. | P1 |
| Cover photo | Local file selection/preview only; no signed upload/profile-save action. | P1 / backend contract |
| Business information | Loads category options but lacks populated account binding and save request. | P1 / backend contract |
| Personal information | Unbound inputs and a save-looking button with no handler. | P1 / backend contract |
| Shared summaries | Popular-services card says Loading indefinitely after a failed summary request. Revenue privacy toggle is a clickable div. Reviews card converts failed reads into unrated/empty display. | P2 |

## Customer

| Page | Implementation and remaining gap | Priority |
| --- | --- | --- |
| Dashboard | Real profile/appointments/reviews. Appointment hooks swallow request errors, showing empty results. Token/role gate fixed; failure and session-change workflow coverage still needed. | P2 |
| Book appointment | Professional search wired; server booking implementation has replay defects recorded separately. Booking/payment decline, authentication-required and lost-response cases need live test-mode checks. | P1 release gate |
| Account settings | Links to profile, password, notifications, loyalty and support are mounted and browser-checked. | No dead control identified; saves unverified |
| Update personal information | Customer form is populated and has a backend update handler, unlike stylist form. Verify success, validation, address-service failure and persistence. | Verification |
| Change password | Customer update-password action wired. Verify old-password rejection, session revocation and subsequent sign-in. | Verification |
| Saved stylists | API-backed list/removal. List failure appears as empty saved list; remove errors are surfaced. | P2 |
| Notification settings | Initial read failure is swallowed; hardcoded true defaults become editable, and an update submits the whole preferences object. This can overwrite preferences that never loaded. | P1 |
| Notifications | List/read/read-all wired. Fetch failure looks empty; per-item read has no pending guard. | P2 |
| Support | Create ticket and list wired; mutation errors shown inline. List failure looks like no tickets; subject/message lack associated labels. | P2 |
| Loyalty | Referral apply wired with inline mutation errors. Failed account read needs a retry state and safe handling before apply. Referral input lacks associated label. | P2 |
| Feedback | Form dispatches an async thunk and reads payload.statusCode without handling rejected actions; a network failure returns undefined payload. Dropdown label is not associated with select. | P2 |
| Search professional | Actual search wired. Responses have no supersession guard; older request can overwrite newer results. Search failures are swallowed and can leave stale content. | P2 |
| Reschedule control | Explicitly disabled/labelled coming soon. This is an unfinished capability, not a false working control. Requires backend reschedule contract before enablement. | Product backlog |

## Public and authentication

| Page/flow | Implementation and remaining gap | Priority |
| --- | --- | --- |
| Landing and signup modal | Public routes/search/newsletter links exist. Signup thunk result is read as payload.statusCode without rejected-action handling; failed OTP request can throw. The older hero on About also has this pattern. Header treats cached customer profile as logged-in even without a token. | P2 |
| Main login | Validation and role routing wired and regression-tested. Live stylist/customer login checked; role-incompatible intended-route handling needs explicit tests. | Verification |
| OTP / personal details / secure account | Continuation/verification and registration actions exist. Some handlers use rejected thunk payloads unsafely; delivery, expiry, reload recovery and actual account creation need isolated email/OTP fixtures. | P1 release verification |
| Stylist onboarding steps | Email verification, business/address, signed images and account creation wired. Full OTP/upload/verification loop not exercised because external provider traffic was blocked. | Release gate |
| Reset password | Request/code/password flow wired; successful/expired-code paths require isolated delivery fixtures. | Release gate |
| Search | Current public search suppresses superseded results. Category filters, backend widening and empty results present; live initial read checked. | No new dead control identified |
| Public stylist listing/profile | Category/profile APIs and booking entry wired; invalid identifiers, missing profiles, approval visibility and backend ownership need targeted live cases. | Verification |
| Gallery | Portfolio filters and detail UI wired. Browser emits a React 18 warning for the shared hero fetchPriority prop; use the compatible attribute form. Upload approval to public visibility not tested. | P2 |
| Blog / article | API-backed with fallback articles; fallback is duplicated across list/detail/landing and remote image URLs may expire. Do not delete purposeful fallback content without replacing failure behavior. | P3 consistency |
| About / FAQs / contact / terms / privacy | Mounted; routes render in browser and links reviewed. Contact methods are actual mailto/tel/route links. Published policies/contact details still require owner validation, not inferred technical approval. | Owner verification |
| Not found | Catch-all exists. | No dead control identified |
| Shared forms/footer | Several older inputs/selects use visual spans instead of associated labels; selects use selected on option rather than controlled value and produce React warnings. App-store links correctly say coming soon and lead to newsletter. | P2 accessibility |

## Backend handoff and next fix order

1. Repair real booking replay/claim lifecycle and verify schema rollout (release-readiness report contains exact backend evidence).
2. Provide authenticated stylist personal/business/image update endpoints with ownership, validation and verification rules. No corresponding controller mappings were found in the current backend source; do not make frontend buttons pretend to save.
3. Replace Overview prototype schedule and profile share URL; repair preferences/availability failed-load protection and admin action error/pending handling.
4. Give data-driven pages explicit loading/empty/error/retry states; fix rejected Redux thunk handling and remaining search races.
5. Run create/update/delete tests for every implemented workflow, then OTP/signed uploads/Stripe test-mode contracts and cross-role denial tests. Passing route smoke checks is not market-readiness certification.

All work stays on dev. Main has not been promoted. This is an actionable audit and limited fixes, not a claim that all recorded gaps have been resolved.

## Final verification for this audit pass

- Full unit suite: **745 tests / 76 files passed**, exit 0. The existing App routing fixtures were updated to establish a complete authenticated customer session, matching the strengthened gate.
- Production fixture browser suite: **14 passed**, including invalid login, protected routes, immediate logout and booking uncertain/empty-replay recovery.
- Real disposable-dev browser audit: **8 passed** across desktop/mobile. Public/customer/admin checks covered 29 pages per viewport; stylist navigation covered another 9 per viewport. Initial API read failures, uncaught browser errors and document overflow were absent in those audit results. No claim about untested mutations follows from that.
- Production build and chunk integrity passed; git diff --check passed.
- Customer navigation and cached-profile/role regressions were observed failing before their fixes and passing afterward.

Page-level findings above remain open unless explicitly listed as fixed. Backend source remains unmodified; isolated test data is separate from the existing development database.

Final live cross-role regression: **2 additional tests passed** (desktop/mobile). After real stylist login, cached customer data was injected and `/dashboard` correctly redirected to the stylist dashboard. Logout and subsequent protected-route denial also passed.

## Fix pass completed on dev

This section supersedes the open frontend findings in the original audit table above.

| Area | Final behavior |
| --- | --- |
| Admin lists, recovery and refunds | Failed reads show a persistent error and Retry; refund loading lasts until the read settles. |
| Admin Operations | Independent reads preserve successful sections; action failures are visible; pending actions are disabled; invalid status and cancelled response prompts do not submit. |
| Stylist Overview | Real active pending/confirmed appointments (including overdue, oldest first) replace fabricated time slots and client details. Calendar and appointment management links work. Payout status failure has its own Retry rather than claiming the account is disconnected. Stripe redirects require HTTPS and an allowed host. |
| Stylist profile | Share link targets the current stylist's public profile. Copy is keyboard accessible and clipboard failures are handled. |
| Stylist profile edits | Removed inert forms and local-only image preview. These routes explain the support workflow and provide a mail link. Actual self-service updates remain blocked by missing backend endpoints. |
| Stylist data pages | Availability, services, appointments, calendar, portfolio, reviews, payouts and summary cards show loading/error/retry states. Availability cannot save defaults after failed reads. Service prices must be finite and positive. |
| Stylist calendar | Uses the professional's zone when appointment data supplies it. Empty accounts still need an authenticated account-zone contract; the fallback uses browser local date rather than UTC. |
| Customer settings and lists | Failed preferences cannot be overwritten by defaults. Notifications, support, loyalty and saved professionals distinguish failure from empty data; notification reads lock while pending. |
| Customer feedback and discovery | Rejected thunk actions do not dereference missing payloads. Search ignores superseded responses. Shared data hooks expose loading/error/Retry and suppress responses after navigation. |
| Public authentication and shared forms | Rejected signup actions display failure instead of throwing; expired cached profiles do not show authenticated navigation. Labels/errors are associated with controls; option selection and hero priority use React-compatible attributes. |
| Cleanup | Removed unmounted admin prototype pages and the fabricated appointment-details component after verifying references. |

Final verification: **808 unit tests / 84 files passed**; **18 production fixture browser tests passed**; **8 real disposable-dev page/navigation tests passed** (desktop and mobile). The live checks cover login, page reads, role routing, logout, navigation and layout; they do not certify every create/update/delete or external-provider workflow. Production build and chunk integrity passed (117 chunks / 140 files), dependency audit reported zero advisories, and git diff --check passed.

Remaining release work: backend booking replay/claim lifecycle, production schema validation, authenticated stylist profile save and account-zone contracts; end-to-end OTP delivery, signed upload approval, Stripe payments/webhooks/cancellation/refunds, ownership denial and real Safari/Firefox testing. Policies and business contact details require owner validation. Purposeful blog/gallery fallback content remains; duplicated fallback consolidation is deferred. No zero-vulnerability guarantee follows from passing tests or the dependency audit.

Work is uncommitted on dev. Main and backend source have not been modified or pushed.

Final independent code review identified that unclosed past bookings must not be labeled upcoming. The overview now labels them Active appointments and explains their ordering; the full appointment-management link remains available.

## Booking-page clarity follow-up

Reorganized booking discovery around location and service choice, followed by a separate name-search form. Replaced the vague automatic-selection button with Browse all professionals. Removed the promotional quote/advertisement from this route. Category images use the supplied image, then a matching local gallery photo, then an illustration if neither loads. Category loading/error/empty states leave browsing and name search available; category-empty copy makes no claim about professional availability.

Seven new regressions were observed failing before implementation and pass afterward. Full unit suite: **815 tests / 85 files passed**. Full production desktop/mobile browser suite: **20 passed**; two additional targeted browser checks confirmed the entered name survives navigation into search. Visual screenshots were reviewed on desktop/mobile, with no horizontal overflow. Production build/chunk integrity and git diff --check passed. No dependencies or backend source changed. Work remains uncommitted on dev.

## Dev checkpoint

The reviewed frontend changes, regression tests, architecture/audit reports and release script are included in a dev checkpoint. Local planning notes remain ignored; real environment files and test artifacts are excluded. Promotion to main remains blocked by release-gates.json. Latest unit verification includes 823 tests across 86 files; the production browser suite contains 20 desktop/mobile checks. Backend source remains unchanged.
