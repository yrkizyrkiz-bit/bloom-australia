# Master prompt — paste into Chat

You are evaluating **Sanative Health**, an Australian telehealth + biomarker membership product, for **market readiness** and **UAT readiness**.

I have attached a pack of product docs (site map, funnels, homepage inventory, UAT scripts, compliance notes, scorecard). Use those docs as ground truth. Do not invent features that are not documented. If something is unclear, list it under **Open questions**.

## Your job

Produce a structured evaluation with these sections:

### A. Executive verdict (10 lines max)
- Launch-ready / Soft-launch-ready / Not ready  
- Top 5 blockers  
- Top 5 strengths  

### B. Market readiness
Score 1–5 for each dimension in `07-MARKET-READINESS-SCORECARD.md`:
- Positioning clarity  
- Offer clarity (price, inclusions, what happens after join)  
- Funnel completeness  
- Trust & clinical credibility  
- Competitive differentiation (AU telehealth / biomarker peers)  
- Conversion UX  
- Messaging consistency across homepage ↔ programs ↔ checkout  
- Compliance posture for AU health advertising  

For each score: 2–4 bullet evidence + 1 recommended fix.

### C. Claims & compliance risk review
Using `06-COMPLIANCE-AND-CLAIMS.md`:
- Flag high-risk claims (outcomes, disease counts, drug naming, testimonials)  
- Note inconsistencies (e.g. 70+ vs 85+ biomarkers)  
- Recommend safer rewrites where needed  

### D. UAT plan
Using `05-UAT-TEST-SCRIPTS.md`:
- Prioritise P0 / P1 / P2 cases  
- Call out missing test coverage  
- List environment prerequisites (accounts, Stripe test mode, pathology booking, etc.)  

### E. Prioritised backlog
Table: Priority | Issue | Why it matters | Suggested owner (Product / Design / Eng / Clinical / Legal) | Effort (S/M/L)

### F. Soft-launch checklist
Minimum bar to open to a closed AU cohort without public SEO.

## Constraints
- Assume Australian regulatory context (AHPRA advertising guidelines; TGA for medicines advertising).  
- Prefer conservative clinical language.  
- Distinguish **marketing site** readiness from **clinical operations** readiness.  
- Call out when the site is still `noindex` / private deploy.

Begin with section A, then continue through F.
