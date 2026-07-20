# Sanative v680 — Changes Summary (2026-06-26)

Audit package for market-readiness review. Production deploy: `eclectic-semolina-eac900.netlify.app`.

## 1. Security & platform

| Area | Change |
|------|--------|
| **Next.js** | Upgraded `15.3.7` → **`15.5.19`** (Dec 2025 RSC CVE chain + Jan/Apr 2026 RSC DoS: CVE-2026-23864, CVE-2026-23869 / GHSA-q4gf-8mx6-v5v3) |
| **Rate limiting** | DB-backed limits on auth + checkout routes via `RateLimitBucket` table |
| **Pre-payment consent** | Checkbox + API enforcement before Stripe confirm; stored with IP/UA |
| **Edge middleware** | Removed — Netlify edge bundler incompatible; route-level limits remain |

### Rate-limited endpoints

- `/api/auth/send-verification`, `/verify-code`, `/forgot-password`, `/check-email`
- `/api/stripe/subscription` (POST/PUT), `/api/members/create-payment-intent`

### Security test commands

```bash
bun run test src/__tests__/security.test.ts
bun run test src/__tests__/security-authenticated.test.ts
bun run test src/__tests__/pre-payment-consent.test.ts
bun run test src/__tests__/rate-limit.test.ts
bun run test src/__tests__/smoke.test.ts
```

## 2. Organ & Metabolic Care checkout

| Issue | Fix |
|-------|-----|
| Infinite spinner after payment on “Book consultation” | Replaced Cal.com embed with internal booking (`MembershipConsultationBooking`) |
| Booking APIs | `ORGAN_CARE` program type on hold/confirm; membership PI verification |

**Key paths:** `/membership/checkout`, `src/components/membership/`, `src/lib/stripe/verify-organ-care-booking-payment.ts`

## 3. Men's sexual health public funnel

| Change | Detail |
|--------|--------|
| **Reframe** | ED/PE marketing → “Sexual health” (doctor-led, WM-style) |
| **Landing** | New `/mens-health/sexual-health`; ED page redirects |
| **Public quiz** | `/mens-health/assessment?concern=sexual-health` aligned with portal quiz |
| **Flow** | No biomarker upsell; consent → unified checkout → appointment booking |
| **Branding** | Quiz header “Sanative” (was “bloom”) |

**Key paths:** `src/lib/funnel/mens-sexual-health-public-flow.ts`, `src/app/(public)/mens-health/`

## 4. Checkout & payment UX

- Unified checkout: “Select a time” copy (removed “on the left”)
- Stripe empty-field messages: friendlier validation before confirm
- Consent wired through `StripePaymentForm` + checkout handlers

## 5. Marketing compliance (carried forward from 2026-06-25)

- Shared constants: `src/lib/legal/marketing-compliance.ts`
- Smoke tests ban prohibited phrases across `PUBLIC_VERTICAL_PATHS`
- Doctor-led language; no medication marketing; no named patient testimonials

## 6. Database migrations to apply

```bash
bunx prisma db execute --file prisma/migrations/20260620_rate_limit_buckets/migration.sql --schema prisma/schema.prisma
```

## 7. Known gaps / audit focus

1. ~~**Next.js** — Consider `15.5.16+` for remaining advisory CVEs on 15.3.x line~~ **Resolved:** now on `15.5.19`
2. **Rate limiting** — DB limits only (no edge middleware); login/NextAuth not yet rate-limited at route level
3. **Organ care skip UX** — “Skip booking” still shows “Consultation confirmed” on thank-you
4. **Production secrets** — Verify `CRON_SECRET`, Stripe webhooks, `NEXTAUTH_SECRET` in Netlify env
5. **HIPAA/privacy** — Consent records, audit logs, patient access controls (see security tests)

## 8. File manifest highlights (new since last audit)

```
src/app/(public)/membership/checkout/page.tsx
src/app/(public)/mens-health/assessment/page.tsx
src/app/(public)/mens-health/sexual-health/page.tsx
src/components/membership/MembershipConsultationBooking.tsx
src/components/legal/PrePaymentConsentCheckbox.tsx
src/lib/security/rate-limit-*.ts
src/lib/funnel/mens-sexual-health-public-flow.ts
src/lib/stripe/verify-organ-care-booking-payment.ts
prisma/migrations/20260620_rate_limit_buckets/migration.sql
```
