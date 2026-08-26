# UAT test scripts

**Pass criteria:** Expected result observed on desktop + mobile (390px), no console-blocking errors, correct destination URL, copy readable, CTAs clickable.

Legend: **P0** = launch blocker · **P1** = soft-launch important · **P2** = polish

---

## ENV-01 Environment smoke — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/` | Homepage loads < 5s |
| 2 | Open `/membership/checkout` | Checkout shell loads |
| 3 | Open `/login` | Login form loads |
| 4 | Check robots/meta | noindex present (pre-public) |

---

## HOME-01 Homepage hero & CTAs — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | View hero | H1 visible; marquee/person composition intact |
| 2 | Click Start my labs | Lands membership/biomarker intake path |
| 3 | Click Learn more | `/labs` |
| 4 | Mobile | CTAs not overlapping imagery |

---

## HOME-02 Bento program cards — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | Click each bento card | Correct program/labs URL |
| 2 | Weight card | `/weight-management` |
| 3 | Labs card | `/labs` |
| 4 | Hair / Men’s / Women’s / Metabolic | Matching landings |

---

## HOME-03 How Sanative works — P1
| Step | Action | Expected |
|------|--------|----------|
| 1 | Scroll journey | 4 steps stick/cascade |
| 2 | Desktop images | Main_Slide_1–4 |
| 3 | Mobile images | **Same** Main_Slide assets (not alternate mobile set) |
| 4 | Stats row | 85+ / AHPRA / Australian doctors / 24hrs |

---

## HOME-04 Membership block — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | Read price | $1/day and $365 annual clear |
| 2 | Feature list | Matches offer brief |
| 3 | Join Sanative | `/membership/checkout` |
| 4 | Programs section | Links to verticals / organ care |

---

## HOME-05 Questions cards — P1
| Step | Action | Expected |
|------|--------|----------|
| 1 | Exhausted card image | `Why_tired` membership asset |
| 2 | Each card CTA | Relevant biomarker intake / concern link |
| 3 | Animation | Cards become visible; no layout jump breaking clicks |

---

## FUNNEL-WM Weight — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | `/weight-management` | Hero + membership CTA |
| 2 | Start losing weight | checkout `intent=weight_management` |
| 3 | Assessment path | `/weight-management/assessment` completes or deep-links correctly |
| 4 | Compliance block | Doctor-led / individual results disclaimer visible where required |

---

## FUNNEL-HAIR Hair — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | `/hair-health` | Loads |
| 2 | Membership CTA | `intent=hair_loss` |
| 3 | `/hair-assessment` | Quiz progresses; no crash on gender toggle |
| 4 | Compliance | Public compliance block present |

---

## FUNNEL-MEN Men’s — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | `/mens-health` | Loads |
| 2 | Assessment | `/mens-health/assessment` |
| 3 | Sexual health / ED landings | Concern query preserved |
| 4 | Compliance | Present on regulated pages |

---

## FUNNEL-WOMEN Women’s — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | `/womens-health` | Loads |
| 2 | Assessment | Completes analyse step without crash |
| 3 | Menopause landing | Category deep-link works |
| 4 | Book flow | `/womens-health/book` |

---

## FUNNEL-LABS Labs — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | `/labs` | Comparison / practitioners / roadmap sections usable |
| 2 | Biomarkers page | Educational content + CTA |
| 3 | Start testing | Membership checkout |

---

## CHECKOUT-01 Membership purchase (Stripe test) — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | Enter checkout with test identity | Verify step works |
| 2 | Pay with Stripe test card | Payment succeeds in test mode |
| 3 | Onboarding | Account created / session established |
| 4 | Booking step | Pathology/consult booking UX completes or gracefully skips |
| 5 | Portal | Redirect/login to `/dashboard` |

**Prereq:** Stripe test keys, email delivery (or magic-link workaround), DB available.

---

## AUTH-01 Login & recovery — P0
| Step | Action | Expected |
|------|--------|----------|
| 1 | Password login | Valid user enters dashboard |
| 2 | Invalid password | Clear error |
| 3 | Forgot password | Email path or clear failure |
| 4 | Magic link | Token login works |

---

## PORTAL-01 Post-join smoke — P1
| Step | Action | Expected |
|------|--------|----------|
| 1 | `/dashboard` | Loads for new member |
| 2 | Biomarkers / Organ Care | Empty states sane |
| 3 | Billing | Membership visible |
| 4 | Program areas | Locked/unlocked states match purchase intent |

---

## LEGAL-01 Footer & policies — P1
| Step | Action | Expected |
|------|--------|----------|
| 1 | Open each legal page | 200 + readable |
| 2 | Medical disclaimer | Linked from regulated funnels |
| 3 | Refund / subscription / telehealth consent | Present |

---

## RESP-01 Responsive — P0
| Device | Check |
|--------|-------|
| 390×844 | Hero, journey, membership, checkout |
| 768 | Bento + labs |
| 1280+ | Sticky journey + lifestyle banner text position |

---

## A11Y-01 Basics — P2
| Check | Expected |
|-------|----------|
| Images | Meaningful alt or decorative empty alt |
| Focus | Keyboard reach CTAs |
| Contrast | Banner/hero text legible |
| Reduced motion | Journey/marquees degrade safely |
