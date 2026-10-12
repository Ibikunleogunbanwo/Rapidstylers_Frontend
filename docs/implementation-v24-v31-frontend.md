# V24–V31 frontend and email integration

Scope approved October 11, 2026. Production migration output supplied by owner confirms V24–V31 success; runtime/API verification remains separate.

## Implementation

- Appointment-location settings, published profile labels and booking restrictions.
- Service-area and promotion administration, customer promo validation and server-calculated discount preview.
- Anonymous signup-visit beacon and admin funnel reporting.
- Content draft forms, preview, publish/unpublish, history and restore; public homepage/FAQ/SEO consumers.
- Newsletter consent, confirm/unsubscribe routes, signed-in preferences; admin campaigns, subscriber/suppression lists.
- Backend published transactional templates, authenticated provider bounce webhook and newsletter one-click unsubscribe.

## Verification

Unit/component tests for failures, permissions, validation and successful mutations. Desktop/mobile browser tests against controlled API fixtures. Backend tests for template fallback, authenticated event handling and one-click unsubscribe.

No campaign will be sent to real recipients and no provider settings or production database will be changed during implementation. Deployment requires separate provider configuration and candidate verification.

## Handoff

Implemented admin routes: `/admin/content`, `/admin/newsletter`, `/admin/service-areas`, `/admin/promotions`, `/admin/signup-funnel`. Stylist settings: `/styler-dashboard/appointment-locations`. Public newsletter routes: `/newsletter/confirm` and `/newsletter/unsubscribe` accept `token` from the email URL and require an explicit action. Existing booking location and promo request values remain server-validated.

Verification: full frontend run with two workers passed 1,013 tests. Cross-browser follow-up passed 25 checks covering logo playback, discovery, admin navigation, newsletter confirmation and stylist navigation; an additional 35 browser checks passed for the new admin/settings pages, permissions, newsletters and mobile layouts (some newsletter checks overlap). Build/chunk verification passed. API fixtures do not prove real provider delivery.

Backend source commit `52d06eb` implements published customer/stylist welcome and booking requested/confirmed/cancelled templates, signed Resend permanent-bounce/complaint suppression, and RFC 8058 one-click unsubscribe headers/POST handling. Related test reports record no failures. Booking-reminder scheduling is still absent; that template must not be presented as an active automatic email.

Deployment: configure the Resend webhook endpoint and `RESEND_WEBHOOK_SECRET`; verify sender SPF/DKIM/DMARC and received raw List-Unsubscribe headers. Do not promote newsletter subscription until frontend routes and matching backend endpoints are deployed and a synthetic opt-in/unsubscribe journey passes. No real campaigns were sent. Frontend changes are local and have not been pushed by this task.

Final publication checks: 1,013 frontend tests and all 150 functional tests across desktop/mobile Chromium, Firefox, desktop WebKit and iPhone WebKit passed. Dependency audit reported zero vulnerabilities; staged secret scan reported no leaks. Temporary reload diagnostic spec is excluded from the release.
