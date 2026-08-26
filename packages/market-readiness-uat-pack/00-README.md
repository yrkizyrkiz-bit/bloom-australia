# Sanative — Market Readiness & UAT Evaluation Pack

**Generated:** 2026-08-13  
**Product:** Sanative Health (Australian doctor-led biomarker membership + care programs)  
**Codebase:** SANATIVE/-v680 (Next.js 15.5 / Netlify)  
**Canonical domain (code):** https://sanative.com.au  
**Staging/deploy example:** https://eclectic-semolina-eac900.netlify.app  

## How to use this pack with Chat

1. Upload **all files in this folder** (or the zip) into ChatGPT / Claude / Cursor.
2. Paste the contents of **`01-CHAT-MASTER-PROMPT.md`** as your first message.
3. Ask the model to work section-by-section: Market readiness → Compliance → UAT scripts → Priority fixes.
4. Optionally attach live screenshots of homepage, membership checkout, and one program funnel.

## Contents

| File | Purpose |
|------|---------|
| `01-CHAT-MASTER-PROMPT.md` | Paste-ready evaluation brief for Chat |
| `02-PRODUCT-BRIEF.md` | Positioning, offer, ICP, value props |
| `03-SITE-MAP-AND-FUNNELS.md` | Routes, CTAs, conversion paths |
| `04-HOMEPAGE-INVENTORY.md` | Exact homepage section order + copy |
| `05-UAT-TEST-SCRIPTS.md` | Executable UAT cases by journey |
| `06-COMPLIANCE-AND-CLAIMS.md` | AHPRA/TGA-aligned rules + claim audit areas |
| `07-MARKET-READINESS-SCORECARD.md` | Rubric for scoring readiness |
| `08-OPEN-QUESTIONS.md` | Gaps for product/legal/ops to answer |

## Environments for UAT

- **Local:** http://localhost:3000  
- **Netlify prod deploy (example):** https://eclectic-semolina-eac900.netlify.app  
- **Note:** Site metadata is set to **noindex** (private / pre-launch posture).

## Out of scope of this pack

- Full admin portal QA  
- Stripe live payment keys / production secrets  
- Clinical protocol documents  
- Legal advice (compliance notes are implementation-facing only)
