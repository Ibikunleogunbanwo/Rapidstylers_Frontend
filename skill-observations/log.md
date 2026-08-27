# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill
updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue —
resolved statuses always carry their resolution date

---

## 2026-08-26

### Observation 1: Codebase scan completed — RapidStylers frontend

**Status:** OPEN
**Date:** 2026-08-26
**Session context:** Initial codebase scan of RapidStyler_frontend
**Skill:** New skill candidate: codebase-onboarding
**Type:** open-source
**Phase:** Exploration

**Issue:** Full codebase mapped in one session — React 18 CRA app, ~70+ API endpoints, 3 user roles (customer/stylist/admin), Redux Toolkit + Context, Stripe payments, Cloudinary uploads. 13 test files exist but coverage is sparse relative to the ~80+ component/page files.

**Suggested improvement:** A reusable "first-scan" workflow that: (1) maps directory structure, (2) identifies routing/auth/state patterns, (3) catalogs API surface, (4) notes test coverage gaps, (5) flags architectural observations. Could be a skill for onboarding to any new codebase.

**Principle:** A structured initial scan produces a durable mental model faster than ad-hoc exploration; the output (directory map + architecture summary) is reusable across sessions.

### Observation 2: Security audit — critical secrets in .env and JS bundle

**Status:** OPEN
**Date:** 2026-08-26
**Session context:** Security vulnerability scan of RapidStylers frontend
**Skill:** New skill candidate: frontend-security-audit
**Type:** open-source
**Phase:** Security review

**Issue:** REACT_APP_API_KEY and REACT_APP_DECRYPT_KEY are hardcoded in .env files. CRA bakes all REACT_APP_* vars into the production JS bundle — these secrets are publicly visible to anyone who inspects the source. CryptoJS uses AES-ECB mode (no IV), which is cryptographically weak. All API traffic defaults to http:// (not https).

**Suggested improvement:** (1) Move all sensitive crypto/API key operations to the backend; (2) never put decryption keys in frontend code; (3) enforce HTTPS in all env configs; (4) switch from ECB to GCM/CBC with random IV if client-side encryption is needed; (5) add a pre-commit hook that blocks REACT_APP_* vars containing known secret patterns.

**Principle:** Client-side secrets are not secrets — any REACT_APP_* value in a CRA app is embedded in the JS bundle and fully visible in the browser. Sensitive operations must happen server-side.

### Observation 3: Security hardening batch — 12 fixes across 14 files

**Status:** OPEN
**Date:** 2026-08-26
**Session context:** Implementing security fixes from vulnerability audit
**Skill:** New skill candidate: frontend-security-hardening
**Type:** open-source
**Phase:** Security remediation

**Issue:** 14 security findings required fixes across 14 files. Key patterns: (1) CRA bakes REACT_APP_* into the JS bundle — secrets in .env are not actually secret in production; (2) GET requests for OTP codes and destructive actions are CSRF/leak risks; (3) AES-ECB mode is cryptographically broken; (4) admin route guards checking only token existence are bypassable by any authenticated user.

**Suggested improvement:** A reusable security hardening checklist for React/CRA apps: (1) scan all REACT_APP_* for secrets; (2) audit all GET requests for sensitive params; (3) validate all server-redirected URLs; (4) add security headers to deployment config; (5) check encryption modes; (6) add role-based client guards. Could be a skill triggered after a security audit.

**Principle:** Frontend security is defense-in-depth — client-side guards, security headers, and input validation don't replace server-side enforcement, but they reduce the attack surface and prevent common exploit chains.
