# Sanative v680 — Audit Brief (updated 2026-06-26)

**Purpose:** Market-readiness audit for a doctor-led telehealth platform handling patient data, payments, and AHPRA/TGA-aligned public marketing.

**Production URL:** https://eclectic-semolina-eac900.netlify.app  
**Stack:** Next.js 15.5.19 (App Router), Prisma/PostgreSQL, Stripe, NextAuth, Netlify

See **`CHANGES_SUMMARY.md`** for the full change log since the prior audit (2026-06-25).

---

## Requested audit outputs

Please produce a **market-ready report** covering:

1. **Security posture** — auth, payments, rate limiting, secrets, RSC/dependency CVEs, cron routes
2. **Regulatory / marketing compliance** — AHPRA/TGA public copy, consent before payment, telehealth disclaimers
3. **Clinical funnel integrity** — WM, organ care, men's sexual health public flows; booking after payment
4. **Production readiness** — env vars, migrations, error handling, skip paths, admin access controls
5. **Priority remediation list** — P0 (block launch) / P1 (before scale) / P2 (nice-to-have)

---

## Priority audit areas

### Security

- `src/lib/security/` — patient access, cron auth, session tampering guards
- `src/app/api/auth/*` — verification codes, login, password reset + new rate limits
- `src/app/api/stripe/*`, `src/app/api/bookings/*` — payment verification, consent enforcement
- `src/__tests__/security*.test.ts`, `pre-payment-consent.test.ts`, `rate-limit.test.ts`

### Compliance copy

- `src/lib/legal/marketing-compliance.ts` + `PublicComplianceBlock.tsx`
- Public verticals: hair, men's (incl. `/mens-health/sexual-health`), women's, labs, WM, metabolic
- Legal pages: terms, privacy, telehealth consent, refund, medical disclaimer

### Funnels & checkout

- **Organ care:** `/membership/checkout` — pay → profile → internal booking (not Cal.com)
- **Men's sexual health:** `/mens-health/assessment?concern=sexual-health` — portal-aligned quiz, no biomarker upsell
- **WM / unified checkout:** `UnifiedCheckoutScreen.tsx`, `StripePaymentForm.tsx`, consent checkbox

### Admin / clinical staff

- Doctor brief, patient brief, decision APIs — authZ checks
- CRM, triage, debug-session (must be 404 in production)

---

## Run tests

```bash
bun install
bun run test src/__tests__/smoke.test.ts
bun run test src/__tests__/security.test.ts
bun run test src/__tests__/pre-payment-consent.test.ts
bun run test src/__tests__/mens-sexual-health-public-flow.test.ts
bun run test src/__tests__/rate-limit.test.ts
```

Integration tests in `security.test.ts` expect a running dev server on `localhost:3000`.

---

## Patterns enforced (marketing)

- Doctor-led assessment → doctor reviews → options only if clinically appropriate
- No medication brand/class names on public pages
- No named patients, kg lost, disease-resolution, or % outcome stats
- No “no questions asked” / “money-back guarantee” / “180-day guarantee”
- Pharmacy: “Where clinically appropriate, items may be dispensed by Australian-registered pharmacies”

---

## Out of scope in this package

- Full `node_modules`, `.env`, `.next` build output
- Complete admin portal (curated subset only)
- Mobile apps / native clients
