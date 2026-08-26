# Compliance & claims notes (implementation-facing)

> Not legal advice. Reflects rules encoded in `src/lib/legal/marketing-compliance.ts` and public site patterns.

## Encoded public disclaimers
- Clinical individuality copy  
- Doctor-led disclaimer (results vary; treatment only if clinically appropriate)  
- **No patient testimonials** in advertising of regulated health services  
- Pharmacy dispensing copy (where used)  
- Refund if not clinically appropriate (first-month)  

## Banned public medication terms (examples)
semaglutide, tirzepatide, ozempic, wegovy, mounjaro, saxenda, sildenafil, tadalafil, finasteride, minoxidil, spironolactone, glp-1  

## Banned marketing phrases (examples)
medication included, secure medication delivery, clinically proven treatments, money-back guarantee, real people real results, discreet delivery to your door, etc.

## Banned outcome / testimonial-style claims (examples)
Specific kg-loss figures, “biological age reversed”, “83% see visible improvement”, named patient stories, large subscriber counts, etc.

## Claim audit areas on current marketing

| Claim / area | Surfaces | Risk | Note for evaluators |
|--------------|----------|------|---------------------|
| **$1/day / $365 annual** | Homepage, membership, programs | Medium | Confirm billing truth + fine print |
| **70+ biomarkers** | MembershipPricingCard | Medium | Conflicts with 85+ elsewhere |
| **85+ biomarkers** | Journey stats, labs, bento | Medium | Align catalogue reality |
| **500+ diseases** | LabsSection homepage | **High** | Strong disease claim — verify evidence & wording |
| **AHPRA-registered / 100% Australian doctors** | Journey, trust rows | Medium | Must be accurate |
| **First 30 days of care program included** | Membership / programs | Medium | Eligibility conditions clear? |
| **AI insights** | Lifestyle banner | Medium | Disclose what “AI” means; avoid overclaim |
| **Testimonials section** | Homepage | **High** | Conflicts with no-testimonials policy if outcome stories shown |
| Drug brand names on public pages | Verticals | **High** | Must remain absent |
| Before/after implied outcomes | Hair / weight creative | High | Check imagery + copy |

## Vertical pages expected to show compliance blocks
Men’s health, hair health, menopause, ED, sexual health (and similar regulated surfaces via `PublicComplianceBlock`).

## Indexing posture
Root metadata + Netlify headers set **noindex** — appropriate for private/UAT; must be flipped deliberately for public launch.
