# Backend handoff

Current status: see [the architecture gap re-audit](architecture-gap-status-2026-10-10.md). This document records earlier findings; implementations and verification status have changed.
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

## 6. Stylist registration and upload reconciliation

The frontend now preserves the verified signup upload token on signature and cleanup requests. Verify that this limited token can sign and reclaim only assets owned by that signup, expires promptly, and cannot delete another account's files. Exercise profile-upload success followed by ID-upload failure and rejected account creation. Add server cleanup for abandoned assets.

Account creation needs a reliable way to resolve an unknown outcome after a network interruption (idempotent replay or an authenticated status/recovery contract). The frontend currently preserves uploaded assets and blocks another create request when the result is unknown, with a sign-in recovery link. Verify duplicate email handling, OTP/token expiry, and field validation return safe, useful errors.

## 7. Admin refunds and data contracts

Provide an authorized payment lookup before refund confirmation: customer, currency, captured amount, previous refunds and remaining refundable amount. Define partial refund behavior; the inspected implementation marks the appointment refunded and prevents a later refund even after a partial refund. Ensure provider idempotency and reconciliation prevent duplicate refunds after lost responses. Until then, frontend review displays entered values and asks the admin to check payment records.

Confirm list pagination/filtering contracts for categories, stylists, blog posts, support tickets, reviews, logs, business accounts and payouts. Frontend search and pagination currently cover only records returned by each existing endpoint.

## Live signup blockers observed October 10

A user-controlled signup retry returned HTTP200 from both get_upload_signature calls, then HTTP401 Invalid Signature from both Cloudinary uploads. Cloudinary's expected string lists allowed_formats, folder and timestamp. The current CloudinaryController signer also includes max_file_size; the response instructs the frontend to forward that field. Frontend forwards the exact returned parameters. Fix backend signature generation against supported Cloudinary parameters, preferably the official SDK, and enforce file-size constraints using supported provider/server validation. Verify profile and ID uploads in a real dev provider account before production. Do not expose the Cloudinary API secret in frontend code.

Production logs separately show Google Places REQUEST_DENIED. GeocodingService calls the legacy autocomplete endpoint using GOOGLE_API_KEY. Check API enablement, billing, credentials and the server IP restriction for that endpoint; migrate to the new Places API if this project cannot use the legacy API. Capture Google's safe error_message and return a distinguishable unavailable result instead of silently reporting an empty suggestion list. Manual address entry remains supported.

## 8. Service dispute resolution detail for the customer

The customer now sees the outcome of a service dispute, plus what they reported
and the team's resolution note, in the appointment card. The frontend already
renders `serviceDisputeReason`, `serviceDisputeResolutionNote` and
`serviceDisputeResolvedAt` from the appointment payload and omits each one until
the backend supplies it, so nothing is broken today, but the resolution note is
not reachable yet.

Current backend state: `BookAppointmentEntity` stores `serviceDisputeReason`,
`serviceDisputeStatus` and `serviceDisputedAt`, but there is no field for the
admin's resolution note or the resolved time. `resolveDispute` writes the note
to the audit log only, and `AppointmentDTO` exposes neither the reason nor any
note.

Required backend work:

- Persist the admin's resolution note and a resolved timestamp on the
  appointment when a dispute is resolved.
- Expose `serviceDisputeReason`, `serviceDisputeResolutionNote` and
  `serviceDisputeResolvedAt` on `AppointmentDTO`, populated in `DTOService`
  alongside the existing `serviceDisputeStatus`/`disputeWindowEndsAt`.

Acceptance: a resolved dispute returns the note and the resolved time; an open
one returns the customer's reason; all three are null/absent when the
appointment was never disputed. Keep the note length bounded (the frontend and
`ServiceDisputeData` already cap it at 1000 characters).
