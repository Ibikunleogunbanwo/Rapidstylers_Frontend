# Stylist dashboard review — October 10, 2026

Scope: sign-in, dashboard overview, navigation and reachable screens. Work is on dev. The user authorized an isolated disposable local database with its own encryption key and synthetic accounts. Backend API started successfully against this database; existing database and environment files were preserved. Notification outbox publication and notification consumption were disabled. Stripe mode was test. No real payment, upload or outbound notification operation was attempted.

## Navigation

All nine dashboard destinations have registered routes and were reached through browser links after real local API sign-in: Overview, Appointments, Calendar, Availability, Services, My work, Payouts, Reviews and My profile. Profile also links to cover photo, business information and personal information screens; those screens were reviewed in source, not exercised as working save flows.

The mobile sidebar was hidden and the top-bar menu had no callback. Its image was also white on white. Fixed by sharing the existing navigation list with a mobile disclosure, adding a visible keyboard-accessible Menu button, expanded/control attributes, close-on-selection and Escape/focus-return behavior. Desktop retains its sidebar. Sign-out and subsequent protected-route denial were checked through the real API on desktop and mobile.

## Page gaps still open

| Page | Evidence | Required follow-up |
| --- | --- | --- |
| Overview | Fixed time-slot arrays open appointmentDetails.js, which contains John Wick, a fixed date/address, fixed prices and a cancellation control without an action. Slots are not loaded from appointments. | Replace prototype schedule/details with real appointment data and meaningful empty/error states; use existing server-authoritative appointment actions. |
| Overview | Calendar icon has no click/link handler. | Make it an accessible link to the Calendar page. |
| Overview | Connect-status request failure is presented as NOT_STARTED. | Show unavailable/retry state rather than asserting the stylist has not connected. Verify test-mode onboarding separately. |
| My profile | Share link is a hardcoded Bitly sign-in URL. Copy is a clickable span. | Build the actual public stylist-profile URL from authenticated stylist identity; use an accessible button and test copied/opened URL. |
| Personal information | Inputs have no current account binding, form submit or save request. | Define the authenticated backend update contract and wire validated load/save with success/failure behavior. |
| Business information | Categories load, but account details/save are not wired. | Confirm backend update/verification policy and implement populated validated save flow. |
| Cover photo | File selection creates a local preview; no signed upload/save operation. | Wire existing signed-upload restrictions and an authenticated profile-image update contract. |
| Dashboard summary | Failed summary fetch leaves Popular services saying Loading indefinitely. Revenue visibility uses a clickable div. | Distinguish loading/empty/error states and use a keyboard-accessible privacy toggle. |

Navigation tests establish reachability and absence of uncaught page errors. They do not prove every destination's create/update/payment workflow. Review each destination's functional paths next, starting with Overview and My profile; backend owner must supply missing authenticated update contracts. The complete stylist area is not yet market-ready.

## Verification

Mobile disclosure regression was observed failing before the fix, then 8 stylist shell tests passed. A real API browser run passed 2 tests (desktop and mobile), covering all nine sections, logout and subsequent signed-out guard. Final verification counts and limits are recorded in the release-readiness report. Screenshots are local ignored test artifacts. Live tests are opt-in with playwright.live.config.js and require synthetic account credentials from environment variables; they block all traffic outside the local frontend/API.
