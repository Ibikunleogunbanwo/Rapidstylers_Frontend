# Auth transport proposal for owner review

**Status:** proposal only. No authentication transport, CORS policy, cookie, or backend code has been changed. The website owner must approve the hosting/deployment contract before implementation.

## Selected direction

Use a same-origin backend-for-frontend (BFF). The browser sends application requests to the website origin. The BFF owns the server-to-server API call and stores the session credential in a `Secure`, `HttpOnly` cookie. The browser does not receive the backend bearer or refresh token in JavaScript-readable storage.

This avoids credentialed cross-origin browser requests and wildcard-CORS mistakes. It does **not** remove CSRF risk: browsers attach cookies automatically, so the BFF still needs explicit request-origin checks and a CSRF defense for state-changing routes.

## Required deployment decisions

The owner and backend operator must confirm all of the following before implementation:

1. Which same-origin route/prefix the BFF will own, and where it will run (for example `/api/*` on the web host versus a separately hosted service behind a reverse proxy).
2. The exact production and non-production origins, proxy trust boundaries, TLS termination, and whether any direct browser-to-backend callers must remain supported during migration.
3. Whether the session cookie is host-only (preferred), its name, `Path`, `SameSite` policy, idle/absolute lifetime, and rotation behavior. Production session cookies must be `Secure` and `HttpOnly`; do not put access or refresh tokens in local/session storage.
4. How CSRF tokens will be issued and checked for unsafe methods (recommended: synchronizer token bound to the server session plus exact `Origin`/`Referer` validation; reject missing or untrusted origins). Define handling for multipart uploads, redirects, and any third-party callback paths.
5. Which existing backend routes the BFF calls, how it attaches credentials and API identification keys server-side, and how logout/revocation and refresh rotation propagate through the BFF.
6. A staged rollout and rollback plan that invalidates old browser sessions safely and does not expose credentials through URLs, logs, analytics, or error reporting.

## Security acceptance criteria

- Cross-site forms, fetches, and navigations cannot perform authenticated state changes; negative CSRF tests cover missing, invalid, replayed, and wrong-origin tokens.
- State-changing requests require an allowed origin and valid CSRF proof. CORS is not treated as a CSRF defense.
- Browser JavaScript cannot read the session cookie or backend tokens. Cookie flags and scope are verified in production-like HTTPS tests.
- Login, refresh rotation, logout/revocation, idle expiry, absolute expiry, and concurrent session changes are verified end to end.
- The BFF never forwards arbitrary browser-supplied `Authorization`, `Host`, or hop-by-hop headers; it has explicit route/method allowlists and bounded request sizes/timeouts.
- Tests cover unauthenticated access, customer/stylist/admin separation, cross-origin denial, and safe error/log redaction.

## Current blockers

- This proposal is a frontend buddy recommendation, not an owner agreement. No backend/BFF repository was edited.
- The backend handoff says CSRF, CORS, and deployment contracts must be coordinated before changing transport.
- Implementation should not start until the owner confirms the hosting route, exact origins, cookie/session attributes, and CSRF mechanism above.
