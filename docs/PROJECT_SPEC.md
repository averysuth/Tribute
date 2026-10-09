# Tribute — Product Requirements & Technical Specification

**Status:** Working product specification  
**Platform:** iOS and Android  
**Target:** MVP v3 public pilot by June 2027  
**Initial audience:** Powwow dancers, spectators, and powwow organizers

## 1. Project overview

**Tribute** is a mobile-first social networking and event discovery platform connecting performers, event organizers, and spectators. It launches with the North American powwow community and is architected to support other performance communities later.

Dancers can share their journeys, dance styles, photos and videos, connect with followers, declare powwow attendance, and eventually receive financial support. Organizers can publish events, posters, dates, locations, and announcements. Spectators can discover performers and events, follow accounts, interact with content, and support eligible dancers.

### Mission

Create a community-centered platform that increases performer visibility, strengthens connections between performers and audiences, and makes cultural events easier to discover and participate in.

### Product thesis

The distinctive experience is the connection between **events, attending performers, and ongoing performer communities**:

1. Discover a powwow.
2. See dancers who plan to attend.
3. Explore and follow a dancer.
4. Engage with their posts and, where available, support them.
5. Return to discover future events and performers.

## 2. Problems addressed

| Problem | Proposed solution |
| --- | --- |
| Performer profiles are fragmented across general social platforms | Dedicated dancer profiles with journey, styles, and content |
| Powwow details are scattered | Centralized event pages with posters, dates, locations, and updates |
| Audiences cannot easily discover who will attend | Event-specific, consent-based dancer attendance lists |
| Emerging dancers are difficult to discover | Trending, rising, and event-specific discovery |
| Organizers need community-specific tools | Organization accounts and event-management features |
| Financial support is fragmented | Optional supporter payments for eligible recipients |
| Livestreams are dispersed | Future event livestream viewing and replays |

## 3. Users and account model

### 3.1 Community member / spectator

Every individual begins with a standard user account and may:

- Follow dancers, other users, and powwow organizations.
- View, like, and comment on posts.
- Discover, follow, and save events.
- Indicate interest in events where applicable.
- Support eligible dancers when payments are launched.
- Maintain a basic profile and manage privacy settings.

### 3.2 Dancer / performer

An individual may activate an additional performer profile and retain all standard account capabilities. Performer profiles include:

- Biography and dancing journey.
- One or more dance styles.
- Photos and short videos.
- Optional region and community affiliation.
- Upcoming powwow attendance.
- Follower counts and engagement.
- Optional support payments, subject to eligibility.

### 3.3 Powwow organization

Organizations are separate entities managed by individual accounts. Authorized members may:

- Manage organization profiles.
- Publish and edit events, posters, dates, locations, and links.
- Publish announcements and updates.
- Review event attendance and optionally verify registration.
- Manage staff permissions.
- Eventually host or embed livestreams.

### 3.4 Permissions model

Roles are **not mutually exclusive**. One individual may be a spectator, dancer, and member of multiple organizations.

```text
User Account
├── Standard Profile
├── Optional Performer Profile
└── Organization Memberships
    ├── Owner
    ├── Administrator
    └── Editor
```

Platform moderators and administrators have separate permissions.

## 4. Core features

### 4.1 Authentication and onboarding

- Email signup, login, logout, verification, password reset, and persistent sessions.
- Username, display name, avatar, and optional biography.
- Optional performer-profile activation during or after onboarding.
- Performer onboarding for dance styles, journey, and optional region/community information.
- No requirement to publicly disclose Nation or community affiliation.

### 4.2 Dancer profiles

- Avatar, cover image, username, display name, biography, journey, and dance styles.
- Posts, photos, videos, followers, following, and upcoming events.
- Follow/unfollow actions.
- Support button when eligible and enabled.
- Editing and visibility controls for personal details.

### 4.3 Social content

- Text, image, and short-video posts.
- Posts authored by users or organizations.
- Optional event association.
- Likes, comments, sharing, pagination, and deletion.
- Chronological following feed initially; recommendations later.
- Reporting, blocking, and comment controls.

### 4.4 Organizations and events

Organization profiles show description, logo, links, and events. Each event contains:

- Name, poster, description, start/end times, time zone.
- Venue, location, map link, and registration link.
- Organizer details and announcements.
- Attending dancer list and filters.
- Optional organizer-verified attendance.
- Event schedules and livestreams in later releases.

An organization can publish multiple events over time. Organizations and events must not be modeled as the same entity.

### 4.5 Event attendance

- Dancers may mark **Interested**, **Attending**, or **Competing**.
- Attendance is self-reported unless explicitly verified by an organizer.
- Organizers must not publicly claim a dancer's participation without appropriate permission.
- Event pages display attending dancers and allow dance-style filtering.
- Users can find which followed dancers are attending.

### 4.6 Discovery and trending

- Search by performer name, username, dance style, organization, and event.
- Browse upcoming events and discover performers associated with them.
- Discovery views may include Trending, Rising, Most Followed, Most Supported, and Dancers to Watch at an Event.
- Engagement-based rankings are **not** presented as objective assessments of dance skill.
- Favor unique engagement and recency, with safeguards against spam and manipulation.
- Keep monetary support separate from the main trending score, rather than allowing large tips to buy rank.

### 4.7 Financial support (MVP v3 candidate)

- Stripe Connect onboarding for eligible recipients.
- One-time support/tip payments, optional messages, and privacy choices.
- Payment records, confirmation, refunds/disputes, payout eligibility, and receipts.
- Server-side payment creation and webhook verification.
- No card details or secret keys stored in the app database or mobile bundle.
- Use charitable-donation language only for properly qualified recipients.

### 4.8 Livestreaming (post-MVP)

- Powwow event livestream viewing within the app.
- Organizer broadcasting initially through an external tool such as OBS.
- Stream notifications and optional replays.
- Later: in-app broadcasting, live chat, reactions, and moderator controls.

## 5. Mobile information architecture

Primary bottom tabs:

1. **Home:** Following feed, event updates, suggested content.
2. **Discover:** Search dancers, powwows, styles, and trending content.
3. **Create:** Create a text, photo, or video post.
4. **Powwows:** Upcoming, followed, saved, and nearby events.
5. **Profile:** Personal profile, posts, followers, and account settings.

Secondary screens: authentication, onboarding, dancer profile, organization profile, event details, post details, comments, notifications, support payments, and organizer management.

## 6. Technical architecture

### 6.1 Stack

| Layer | Technology |
| --- | --- |
| Mobile | React Native, Expo, TypeScript |
| Navigation | Expo Router |
| API | Node.js, Fastify, TypeScript |
| Database | Supabase-hosted PostgreSQL |
| Authentication | Supabase Auth |
| ORM and migrations | Prisma |
| Validation | Zod |
| Server state | TanStack Query |
| Local UI state | Zustand |
| Images/posters | Cloudflare R2 |
| Videos/livestreams | Cloudflare Stream |
| Payments | Stripe Connect |
| Push notifications | Expo Notifications |
| Analytics | PostHog |
| Error monitoring | Sentry |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions + Expo EAS |
| API hosting | Railway or Render initially |

### 6.2 Architecture

```text
React Native + Expo (iOS / Android)
       ├── Supabase Auth (sign-in and sessions)
       └── HTTPS / REST
                ↓
       Node.js + Fastify API
          ├── Prisma → Supabase PostgreSQL
          ├── Cloudflare R2 → photos and posters
          ├── Cloudflare Stream → videos and live
          ├── Stripe Connect → support payments
          └── Notifications / webhooks
```

- The mobile app may use Supabase Auth for session management.
- Application business operations go through the Fastify API.
- The API verifies Supabase JWTs and enforces authorization.
- Prisma migrations own application-schema changes.
- R2/Stream uploads use short-lived direct-upload authorization; large media should not transit the API.
- Begin as a **modular monolith**. Do not add microservices, Redis, queues, or Kubernetes prematurely.

### 6.3 Monorepo

```text
tribute/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   └── api/
│       └── src/
│           ├── modules/
│           ├── plugins/
│           ├── middleware/
│           └── config/
├── packages/
│   ├── database/
│   ├── validation/
│   ├── types/
│   └── config/
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 7. Core data model

| Entity | Purpose |
| --- | --- |
| UserProfile | Individual public account; linked to Supabase Auth UUID |
| PerformerProfile | Optional performer-specific data |
| DanceStyle | Dance-style catalog |
| PerformerDanceStyle | Performer/style association |
| Organization | Powwow organization or organizer |
| OrganizationMember | Staff membership and permissions |
| Event | Individual powwow event |
| EventAttendance | Self-reported/verified attendance |
| Post | User/organization post or announcement |
| Media | Image/video metadata and provider references |
| PostLike | Unique user-to-post likes |
| Comment | Comments and optional replies |
| UserFollow | User-to-user follows |
| OrganizationFollow | User-to-organization follows |
| SupportPayment | Support transaction and state |
| Notification | User-facing activity/event notifications |
| Report | Content/account reports |
| Block | User blocking relationships |

Use UUIDs, timestamps, relational constraints, appropriate indexes, and explicit cascade/delete rules. Design performer types and event categories for later generalization without compromising the powwow-specific launch experience.

## 8. Non-functional requirements

### Security and privacy

- Validate all API inputs; authorize every protected operation.
- Never expose database credentials, service-role keys, Stripe secrets, or Cloudflare credentials to clients.
- Keep private payment data and optional identity information appropriately restricted.
- Implement account deletion, content deletion, and privacy controls.

### Performance and reliability

- Paginate feeds, comments, search results, and event lists.
- Optimize images and stream video adaptively.
- Provide upload progress, clear errors, and retries where feasible.
- Handle weak connectivity common at events; cache key event information.

### Safety and community governance

- Support reporting, blocking, moderation, appeals, and organizer verification.
- Establish clear rules for filming, restricted cultural content, and removal requests.
- Consult dancers, organizers, and community advisors on terminology and governance.
- Establish a minors policy before launch, especially for public profiles and payments.

### Accessibility and operations

- Support readable text, screen readers, adequate contrast, and accessible controls.
- Track crashes and key product events while minimizing collection of sensitive information.
- Maintain separate development and production environments, backups, and migration procedures.

## 9. MVP milestones

### MVP v1 — Functional prototype (December 2026–January 2027)

- [ ] Authentication and onboarding
- [ ] User and dancer profiles
- [ ] Organization profiles and event pages
- [ ] Event posters, dates, and locations
- [ ] Dancer attendance
- [ ] Follow/unfollow
- [ ] Basic photo posts
- [ ] Core end-to-end flows tested

### MVP v2 — Closed community beta (March 2027)

- [ ] Short-video uploads and playback
- [ ] Likes and comments
- [ ] Following feed
- [ ] Search and discovery
- [ ] Notifications
- [ ] Organizer management tools
- [ ] Reporting and blocking
- [ ] Analytics and crash monitoring
- [ ] iOS TestFlight and Android closed testing
- [ ] Initial dancer, spectator, and organizer testers

### MVP v3 — Public pilot (June 2027)

- [ ] Support payments, if compliance and testing are complete
- [ ] Trending and event-specific dancer discovery
- [ ] Improved organizer verification and moderation
- [ ] Performance and reliability improvements
- [ ] Privacy policy, terms, and account deletion
- [ ] App Store / Play Store release or controlled public pilot
- [ ] Initial real-world community participation
- [ ] Pilot metrics and partner/buyer materials

**Out of scope for the June 2027 MVP:** native livestream broadcasting, direct messages, ticketing, competition judging, complex recommendation algorithms, and expansion into unrelated performer communities.

## 10. Development constraints

- Solo developer working full time elsewhere.
- Approximately 10–14 hours per week, including weeknights and weekends.
- Prefer small, verifiable development increments and regular stabilization time.
- Scope and launch readiness take priority over adding every planned feature.
- Use production-sensible patterns without overengineering.

## 11. Business model

Potential revenue streams, subject to validation:

1. Small platform fees on eligible support payments.
2. Sponsored event promotion.
3. Organization subscriptions for advanced event tools.
4. Relevant brand or community sponsorships.
5. Premium livestream/event services in later releases.

Basic profiles, following, and event discovery should remain broadly accessible.

## 12. Success metrics

The primary indicator of success is **meaningful, recurring community engagement**, not app downloads alone.

Illustrative June 2027 pilot targets (aspirational, not forecasts):

| Metric | Pilot target |
| --- | --- |
| Registered users | 100–200 |
| Dancer profiles | 25–50 |
| Participating powwow organizations | 5–10 |
| Four-week retention | 30%+ aspirational |

Additional measures:

- Signup and onboarding completion.
- Weekly active users.
- Percentage of dancers who publish content.
- Follows and meaningful interactions per active user.
- Event-page views and attendance declarations.
- Organizer posting and repeat event creation.
- Seven-day and 30-day retention.
- Eligible support-payment adoption and completion.

## 13. Long-term vision and strategic value

Tribute may expand into a broader platform for performers, event organizers, and their audiences. Potential later features include live event broadcasts, replay libraries, event registration, ticketing, deeper analytics, and additional performance communities.

Strategic value would come primarily from trusted community relationships, engaged performers, participating organizers, recurring usage, original content, and evidence of monetization—not merely from the application code.

Potential strategic partners or buyers may include creator platforms, event technology businesses, cultural organizations, media companies, and performance-community service providers. An acquisition is not guaranteed.

## 14. June 2027 definition of success

A dancer can create a profile, share content, follow others, mark attendance, and receive support if eligible. A spectator can discover performers, engage with content, and explore upcoming powwows and their attending dancers. An organizer can publish and maintain event information and communicate updates. The application is secure, moderated, instrumented, reliable enough for pilot users, and available through appropriate mobile distribution channels.

**Guiding principle:** Build the smallest excellent version of the dancer–powwow–spectator connection before expanding the feature set.
