# Tribute — Current State

**Last updated:** 2026-10-09, after Phase 3 (profiles, organizations, events) merged to `main`.

This is a snapshot of what's actually built, how the pieces fit together, and how auth works end to end. For the product spec see `PROJECT_SPEC.md`; for architectural decisions and their rationale see `architecture.md`; for the security/quality bar every feature is held to see `ENGINEERING_SECURITY_STANDARDS.md`. The phased build plan (Phase 3 → 10) lives outside this repo in the planning session that produced it — this file tracks only what's landed.

## 1. Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Mobile | React Native + Expo (SDK 57) + TypeScript | `apps/mobile` |
| Navigation | Expo Router (file-based) | typed routes enabled |
| API | Node.js + Fastify + TypeScript | `apps/api` |
| Database | Supabase-hosted PostgreSQL | pooled (`DATABASE_URL`) + direct (`DIRECT_URL`) connections |
| ORM / migrations | Prisma | `packages/database` |
| Authentication | Supabase Auth | ES256 (asymmetric) JWTs, verified via JWKS |
| Validation | Zod | `packages/validation`, used in every API route |
| Server state (mobile) | TanStack Query | all API data; never duplicated in Zustand |
| Local UI state (mobile) | Zustand | not yet used — no UI-only state has needed it yet |
| Mobile session storage | `expo-secure-store` (native) / `localStorage` (web) | AES-encrypted blob, key held in Keychain/Keystore — see §4 |
| Testing (API) | Vitest | real integration tests against the live dev Supabase project, no mocks |
| Monorepo | pnpm workspaces + Turborepo | `turbo.json` |
| Images/video/payments/push/analytics | Cloudflare R2 & Stream, Stripe Connect, Expo Notifications, PostHog, Sentry | **none wired up yet** — all later phases |

## 2. What's actually built

### Phase 1 — Monorepo scaffold
`apps/mobile`, `apps/api`, `packages/{database,types,validation,config}`, pnpm + Turborepo wiring. No business logic.

### Phase 2 — Data foundation
- Prisma schema: `UserProfile`, `PerformerProfile`, `DanceStyle`, `PerformerDanceStyle`, `Organization`, `OrganizationMember`, `Event`, `EventAttendance` (attendance types exist in the schema but have no API/UI yet — that's Phase 4).
- Supabase JWT verification (`modules/auth`) and the error-handling/logging conventions every module since has followed.

### Phase 3 — Profiles, organizations, events (current)
**API** (`apps/api/src/modules/`):
- `users` — `POST /api/v1/users/me` (find-or-create sync from JWT), `GET /api/v1/users/me` (onboarding-gate check, 404 if not yet synced).
- `profiles` — `PUT /DELETE /api/v1/profiles/me` (self-only activate/update/deactivate a performer profile, with dance styles), `GET /api/v1/profiles/:userId` (public read).
- `organizations` — `POST /api/v1/organizations` (creator becomes `OWNER`), `GET /:slug` (public), `PATCH /:organizationId` (owner/admin only), membership management (`GET/POST /:organizationId/members`, `PATCH/DELETE /:organizationId/members/:userId`) with last-owner protection and owner-only owner-grants.
- `events` — `GET/POST /api/v1/organizations/:organizationId/events`, `GET/PATCH/DELETE /api/v1/events/:eventId`, scoped to org membership.
- `dance-styles` — `GET /api/v1/dance-styles` (public reference data, seeded catalog).
- 30 Vitest integration tests across these modules, run as real HTTP requests (`app.inject()`) against the live dev Supabase Postgres/Auth — see §5.

**Mobile** (`apps/mobile/`):
- Expo Router tabs: Home, Discover, Create, Powwows, Profile (Discover/Create are placeholders — real content starts Phase 5/6).
- Auth screens (`app/auth/`) using the Supabase Auth SDK directly.
- Onboarding (`app/onboarding/`): username/display name, optional performer-profile activation with a dance-style picker.
- Organization create/detail (`app/organization/`), event create/detail (`app/event/`).
- `services/*.ts` — thin typed wrappers around each API resource, called through TanStack Query.
- `providers/auth-provider.tsx` — Supabase session state via React context.
- `lib/supabase.ts` + `lib/large-secure-store.ts` — see §4.

### Not built yet
Everything social/content-facing: posts, media, likes, comments, follows, attendance declarations, notifications, moderation, search, trending, payments. See the phased plan for sequencing.

## 3. How a request flows (API)

Every module follows the same shape, established in `modules/users` and repeated since:

```
route (Fastify path + preHandler) 
  -> controller (parses request w/ Zod, calls service, shapes the reply)
    -> service (business logic, authorization checks)
      -> repository (Prisma calls only)
```

- **Validation**: every mutating route has a Zod schema with `.strict()` where it matters, so unknown/forbidden client fields (e.g. a client trying to set `role` or `createdBy`) are rejected with `400 VALIDATION_ERROR`, not silently dropped or trusted.
- **Authorization**: never inferred from client input. Organization/event mutations call `requireOrgRole(userId, organizationId, allowedRoles)` (`modules/organizations/organization.authorization.ts`), which re-reads the caller's membership row from the database for *that specific organization* on every call. Profile mutations are hard-scoped to `request.user.id` — there is no route that takes a target user ID for writes.
- **Errors**: every `AppError` subclass (`AuthenticationError` 401, `AuthorizationError` 403, `ConflictError` 409, `NotFoundError` 404, `ValidationError` 400) maps to a consistent `{ error: { code, message } }` shape via `lib/error-handler.ts`. Unmapped Prisma errors get sane defaults (unique violation → 409, not found → 404, FK violation → 400).

## 4. Authentication flow, end to end

```
Mobile (Supabase Auth SDK, anon key)
   |  email/password sign-in or sign-up
   v
Supabase Auth  --issues-->  ES256-signed JWT (access + refresh token)
   |
   v
Session stored on-device (LargeSecureStore)
   |  every API call attaches: Authorization: Bearer <access_token>
   v
Tribute API (Fastify)
   |  auth.plugin.ts verifies the JWT signature against Supabase's
   |  published JWKS (<SUPABASE_URL>/auth/v1/.well-known/jwks.json),
   |  algorithm pinned to ES256. No per-request network call to
   |  Supabase — jose caches the public keys and only refetches if a
   |  token references an unrecognized key id (e.g. after rotation).
   v
request.user = { id, email }  (from verified JWT claims `sub`/`email`)
   |
   v
Route's service layer re-checks authorization against the database
(organization membership role, or "is this the profile owner") —
request.user tells you WHO is calling, never WHAT they're allowed to do.
```

Key details worth remembering:
- **This Supabase project signs tokens with ES256, not the legacy shared-secret HS256.** This was a real bug found and fixed during Phase 3 testing — every authenticated route was silently rejecting valid tokens until the verifier was switched from an HS256 shared secret to JWKS verification. If auth ever starts rejecting everything again, check this first.
- **Mobile never holds anything more sensitive than the Supabase anon key.** The service-role key and all other secrets live only in `apps/api/.env`, never in the mobile bundle.
- **Session storage is platform-dependent**: on iOS/Android, `large-secure-store.ts` generates a random AES key, encrypts the Supabase session blob with it, stores the ciphertext in AsyncStorage and the key itself in `expo-secure-store` (iOS Keychain / Android Keystore) — this sidesteps SecureStore's ~2KB item-size limit while still keeping the token encrypted at rest. On web, `expo-secure-store` has no implementation, so the adapter falls back to plain `localStorage` (web is a dev convenience only, not a shipping target — see §6).
- **No instant revocation.** Verification is local/offline, so a banned user's existing token stays valid until it naturally expires (Supabase's default lifetime is ~1 hour). Accepted tradeoff for now; revisit if trust & safety tooling needs instant revocation later.
- **Authorization is NOT enforced by Supabase Row Level Security.** The API uses a privileged Prisma connection and does all authorization itself, in the service layer, per `ENGINEERING_SECURITY_STANDARDS.md`.

## 5. Testing

`apps/api` has a Vitest suite (`pnpm test`, wired into `turbo.json` as an uncached task) that makes real HTTP requests (via Fastify's `app.inject()`) against the actual dev Supabase Postgres + Auth — no mocks. `src/test/helpers.ts` creates/reuses fixture users through the Supabase Admin API (bypassing email confirmation) and logs them in through the real password-grant flow to get real JWTs.

Every module's test file sits next to its implementation (`*.test.ts`) and covers, per `ENGINEERING_SECURITY_STANDARDS.md`'s required adversarial cases: unauthenticated access, cross-user/cross-org access attempts, forbidden-field injection, duplicate/retried requests, and not-found handling. 30 tests passing as of this writeup.

No automated tests exist for the mobile app yet, and there is no CI pipeline (`.github/workflows`) — checks currently only run locally (`pnpm turbo run typecheck lint test`). Both are known gaps, deferred by choice rather than oversight.

## 6. Known gaps / deliberate deferrals

- **No poster/image upload** — `Event.posterUrl` exists in the schema but nothing sets it; Cloudflare R2 integration is Phase 5 work.
- **No CI** — `.github/workflows` doesn't exist. All checks are run manually/locally.
- **No formal written security review** — the adversarial *testing* required by `ENGINEERING_SECURITY_STANDARDS.md` §2 has been done for every Phase 3 module, but the actual review document (feature/PR/reviewer/date template) has not been filled out.
- **Web is a dev convenience only.** Tribute targets iOS and Android (per `PROJECT_SPEC.md` §1). Expo web boots and was used to quickly smoke-test changes during development, but it is not a target platform and isn't exercised beyond that.
- **No platform-admin/moderator role.** Performer profiles are strictly self-edit-only; there's no override, and the schema has no platform-moderator concept yet (spec explicitly defers this).
- **`EventAttendance` has no API or UI** despite existing in the schema since Phase 2 — it's the first thing Phase 4 builds.
