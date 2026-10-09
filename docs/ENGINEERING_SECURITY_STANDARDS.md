# Tribute — Engineering & Security Standards

**Purpose:** A concise, enforceable checklist for implementing and reviewing every feature of Tribute, the React Native/Expo + Fastify/TypeScript + Supabase PostgreSQL/Prisma application.

**Applies to:** Mobile app, API, database, media services, organization management, and future payments.

## 1. Non-negotiable engineering standards

### Authentication and authorization
- [ ] Verify Supabase access tokens on every protected API route (signature, issuer, audience, expiry); derive user identity from the verified token, never the request body.
- [ ] Authorize **each resource and action** on the server: profile ownership, organization membership/role, event editing, media access, private records.
- [ ] Assume privileged Prisma database connections **do not automatically enforce Supabase RLS**. Apply authorization in API services; test it.
- [ ] Use least-privilege database roles and credentials. Never ship database passwords, service-role keys, Stripe keys, or Cloudflare credentials in Expo builds.
- [ ] Store sensitive mobile session data using an appropriate secure-storage solution; redact tokens and secrets from logs.

### API and data integrity
- [ ] Validate request bodies, parameters, and queries with Zod. Explicitly allowlist mutable fields; reject unknown or forbidden properties where appropriate.
- [ ] Use consistent, safe error responses; never return stack traces, raw SQL errors, or secret configuration to clients.
- [ ] Add rate limits, request size limits, timeouts, and sensible quotas to abuse-prone endpoints (comments, follows, search, uploads).
- [ ] Use Prisma parameterized queries; avoid unsafe raw SQL. Use transactions for changes that must succeed or fail together.
- [ ] Make retryable operations idempotent; enforce uniqueness at the database level (follows, attendance, webhook events).
- [ ] Create and review Prisma migrations; add foreign keys and indexes for real query patterns, not indiscriminately.

### Mobile performance and media
- [ ] Use `expo-image` with memory/disk caching for avatars, posters, and thumbnails; serve appropriately sized variants via CDN.
- [ ] Use TanStack Query for API response caching and targeted invalidation; do not store server state redundantly in Zustand.
- [ ] Use cursor pagination and virtualized lists for feeds, search, and attendee lists. Avoid N+1 database queries.
- [ ] Upload media directly to R2/Cloudflare Stream using short-lived, scoped credentials. Never expose storage secrets.
- [ ] Enforce upload ownership, size/type limits, quotas, completion checks, and safe publication states. Avoid publicly exposing private files or location metadata.
- [ ] Handle loading, empty, offline, retry, and failure states; don't endlessly retry non-idempotent actions.

### Reliability, observability, and delivery
- [ ] Use structured logs with request IDs and durations; exclude personal data, credentials, and payment secrets.
- [ ] Track crashes, failed uploads, API errors, and key product events with Sentry/PostHog as appropriate.
- [ ] Run formatting, linting, strict TypeScript checks, and automated tests in CI before merging.
- [ ] Separate dev/staging/production configuration; use secret scanning and dependency vulnerability checks.
- [ ] Maintain database backups and periodically test recovery before launch.
- [ ] Implement reporting, blocking, and moderation when enabling public user-generated content.

### Payments (required before enabling support payments)
- [ ] Create and confirm Stripe payments server-side; never trust client-supplied prices, fees, or recipient eligibility.
- [ ] Verify Stripe webhook signatures using the raw request body; handle duplicate and out-of-order events safely.
- [ ] Use idempotency keys, audit records, and reconciliation. Do not store raw card information.

## 2. Feature security and quality review — REQUIRED

**Complete this review for every pull request that introduces or changes an API endpoint, database access, user-generated content, media, organization permissions, or payment behavior.** Mark `N/A` only with a reason.

### Feature / PR details
- **Feature:**
- **PR / issue:**
- **Author / reviewer:**
- **Date:**
- **Data touched:** (public / account / private / financial)

### A. Access and trust boundaries
- [ ] Who may read this data? Who may create, update, and delete it? Permissions are enforced server-side.
- [ ] Resource ownership and organization roles are checked against trusted database state.
- [ ] IDs, roles, prices, upload keys, and other client inputs are treated as untrusted.
- [ ] Cross-user access and privilege-escalation attempts are covered by negative tests.

### B. Input and data safety
- [ ] All external input is validated and bounded (type, length, size, pagination limits).
- [ ] Queries use safe parameters; database constraints and transactions protect integrity.
- [ ] Responses include only necessary fields; no private information or internal errors leak.
- [ ] Retry, duplicate submission, and concurrent-request behavior is safe.

### C. Performance and reliability
- [ ] API/database requests are bounded and paginated; no avoidable N+1 queries.
- [ ] Appropriate image/API caching and invalidation are defined; private data is not publicly cached.
- [ ] Slow network, timeout, upload failure, and empty states are handled.
- [ ] Logs/metrics make failures diagnosable without exposing sensitive information.

### D. Abuse, privacy, and release
- [ ] Rate limits, quotas, spam controls, and moderation implications are considered.
- [ ] Media access, storage permissions, and sensitive metadata are protected where relevant.
- [ ] CI checks and appropriate unit/integration tests pass.
- [ ] Schema migrations, rollback considerations, and configuration changes are documented.
- [ ] For payments: webhook verification, idempotency, authorization, and reconciliation are tested.

### Required adversarial test cases
At minimum, test as applicable:
1. Unauthenticated request to a protected endpoint → rejected.
2. User A tries to read or edit User B's private resource → rejected.
3. Non-admin organization member tries to edit an event → rejected.
4. Client submits forbidden fields such as `role`, `userId`, or `paymentStatus` → ignored or rejected.
5. Duplicate/retried request → no unintended duplicate records or charges.
6. Oversized or invalid upload → rejected; unauthorized media access → rejected.
7. Expired/invalid JWT → rejected.
8. Empty, slow, or interrupted network request → safe and understandable behavior.

### Review outcome
- **Decision:** [ ] Approved  [ ] Changes requested  [ ] Blocked
- **Unresolved risks:**
- **Mitigations / follow-up issues:**
- **Reviewer notes:**

## 3. Definition of done

A feature is **not done** until:
1. It works for authorized users and denies unauthorized users.
2. Input validation, safe error handling, and necessary data constraints are implemented.
3. Relevant tests pass, including negative permission tests.
4. Caching/pagination and slow-network behavior have been considered.
5. Logs, metrics, and documentation are sufficient to operate and troubleshoot it.
6. The feature review above is completed and approved.

## 4. Implementation guidance for coding assistants

When implementing a Tribute feature:
1. Read `docs/PROJECT_SPEC.md` and this file before coding.
2. Identify affected routes, database tables, trust boundaries, and permissions.
3. Describe security and performance risks briefly before implementation.
4. Implement the smallest maintainable change; avoid premature Redis, queues, or microservices.
5. Add tests for both allowed and forbidden actions, plus edge cases.
6. Complete the feature review and report remaining risks before declaring the work done.

**Recommended repository path:** `docs/ENGINEERING_SECURITY_STANDARDS.md`

**References:** [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) · [OWASP MASVS](https://mas.owasp.org/)
