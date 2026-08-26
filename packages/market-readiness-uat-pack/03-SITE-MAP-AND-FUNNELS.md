# Site map & funnels

## Canonical conversion destination
Almost all marketing CTAs consolidate into:

**`/membership/checkout`**  
Optional query params: `intent`, `source`, `package`  
Legacy redirects: `/biomarker-intake`, `/biomarkers/checkout`, `/checkout`

Checkout steps (high level): verify → payment → onboard → booking → quiz → complete

---

## Marketing routes

### Core
| Path | Role |
|------|------|
| `/` | Homepage |
| `/labs` | Labs marketing |
| `/labs/biomarkers` | Biomarker education |
| `/labs/action-plan` | Action plan (redirect/anchor behaviour may apply) |
| `/membership/checkout` | Membership purchase |
| `/services` | Services overview |
| `/pricing` | Pricing |
| `/faqs` | FAQs |
| `/contact` | Contact |
| `/join` | Referral / clinic join |

### Weight
| Path | Role |
|------|------|
| `/weight-management` | Program landing |
| `/weight-management/assessment` | Eligibility / intake quiz |
| `/weight-management/dietitian-support` | Dietitian support |

### Hair
| Path | Role |
|------|------|
| `/hair-health` | Program landing |
| `/hair-assessment` | Assessment quiz |

### Men’s
| Path | Role |
|------|------|
| `/mens-health` | Program landing |
| `/mens-health/assessment` | Assessment (+ `?concern=`) |
| `/mens-health/sexual-health` | Sexual health landing |
| `/mens-health/erectile-dysfunction` | ED landing |

### Women’s
| Path | Role |
|------|------|
| `/womens-health` | Program landing |
| `/womens-health/assessment` | Assessment (+ category) |
| `/womens-health/menopause` | Menopause landing |
| `/womens-health/book` | Booking |

### Metabolic / Organ Care
| Path | Role |
|------|------|
| `/metabolic-care` | Hub |
| `/metabolic-care/fatty-liver` | Fatty liver |
| `/metabolic-care/fatty-liver/assessment` | Assessment |
| `/metabolic-care/heart-health` | Heart |
| `/metabolic-care/kidney-health` | Kidney |
| `/metabolic-care/pcos` | PCOS |
| `/metabolic-care/pcos/book` | PCOS booking |

### B2B / Legal
| Path | Role |
|------|------|
| `/for-doctors`, `/for-doctors/register` | GP / clinic |
| `/medical-disclaimer`, `/terms`, `/privacy`, `/refund-policy`, `/subscription-terms`, `/telehealth-consent` | Legal |

---

## Funnel maps (happy path)

### A. Membership-first (homepage)
1. Land `/`  
2. CTA **Start my labs** → `/biomarker-intake?package=advanced` → redirects to membership checkout  
3. Complete Stripe + onboarding steps  
4. Portal access `/dashboard`

### B. Weight program
1. `/weight-management`  
2. Either membership CTA (`intent=weight_management`) **or** `/weight-management/assessment`  
3. Membership checkout  
4. Program unlock / portal weight area

### C. Hair program
1. `/hair-health`  
2. Membership (`intent=hair_loss`) and/or `/hair-assessment`  
3. Checkout → portal

### D. Men’s / Women’s
1. Vertical landing  
2. Assessment with optional concern/category  
3. Membership checkout (legacy biomarker checkout remaps)  
4. Portal program area

### E. Labs education
1. `/labs` or `/labs/biomarkers`  
2. Start testing → membership checkout  

---

## Auth / portal (UAT-relevant)

| Path | Role |
|------|------|
| `/login` | Member login |
| `/auth/magic` | Magic link |
| `/forgot-password` | Reset |
| `/dashboard/*` | Member portal (biomarkers, organ-care, programs, weight/mens/womens areas, billing, messages) |
| `/gp/login`, `/gp/dashboard` | GP surface |
| `/admin` | Internal ops |

---

## Primary CTA destinations to verify

| Label (examples) | Destination |
|------------------|-------------|
| Start my labs | `/biomarker-intake?package=advanced` or `/biomarker-intake` |
| Learn more (hero) | `/labs` |
| Join Sanative | `/membership/checkout` |
| Start assessment (men’s) | `/mens-health/assessment` |
| Start Your Assessment (women’s) | `/womens-health/assessment` |
| Start losing weight | `/membership/checkout?intent=weight_management` |
