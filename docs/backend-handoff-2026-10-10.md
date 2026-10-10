# Backend handoff

Frontend changes are deployed separately from these unresolved backend requirements. Do not mark release gates passed until the evidence below exists. Use a non-production environment and test provider credentials.

## 1. Booking retry safety — highest priority

Return the original committed booking response when an idempotency key is replayed. Keep the claim and response for the same retention window (the inspected implementation used a 24-hour claim and a 1-hour response). Define pending, completed and failed results; permit retry after definitive failure. Tie completion to durable database commit without weakening unique slot constraints.

Acceptance: concurrent duplicate requests create one booking; lost responses replay that booking; delayed retries still replay it; transaction and Redis failures never confirm a nonexistent booking. Reject reuse of a key for a different request or account.

## 2. Database migration verification

Run migrations against a fresh database and a copy of an existing database. Resolve baseline/schema differences, then verify production with SPRING_JPA_HIBERNATE_DDL_AUTO=validate. Do not rely on automatic schema updates for production migrations.

Acceptance: both migration paths succeed and application startup validates the resulting schema. Record the migration version and rollback/recovery procedure.

## 3. Stylist profile editing and timezone contract

Provide authenticated endpoints for personal information, business information and cover photo updates, plus an authoritative account timezone field. Confirm request/response contracts with frontend before implementation. Current frontend uses support notices for unsupported saves.

Acceptance: validate fields and timezone IDs; authorize updates from the authenticated identity; reject edits to another stylist. Persist updates and return the saved profile. Cover photos must use validated signed uploads and asset ownership checks. Define moderation/reapproval behavior.

## 4. Provider workflow evidence

Configure a dev environment with seeded customer, stylist and admin accounts; Stripe test mode; email/OTP test delivery; and signed-upload test storage. Supply the URL and configuration through local environment files, never chat.

Acceptance: successful, declined and authentication-required payments; signed webhook verification and duplicate handling; booking/payment reconciliation; cancellation and refund flows; OTP expiry, resend limits and replay rejection; upload type/size/ownership checks. Test authorization denials across account roles. Share reproducible results without secrets.

## 5. Session follow-up

Verify logout revokes refresh tokens, refresh-token rotation rejects reused tokens, and old sessions cannot refresh after logout. Browser Back must not restore access to authenticated API data. The frontend clears its session immediately and redirects protected routes, including after refresh.

Consider HttpOnly Secure cookie or BFF sessions to reduce JavaScript access to credentials; coordinate CSRF, CORS and deployment contracts before changing authentication transport.

## Frontend-owned verification

Actual Safari and Firefox checks remain frontend work. Chromium desktop/mobile fixture tests verify frontend behavior but do not establish real provider or backend correctness. CI must pass before future promotion; GitHub previously allowed normal main pushes while reporting a required-check bypass, so repository administrators should enforce the intended branch protection and deployment gating.
