# SELVAGGI BUILT. ASSET MANIFEST

Every `ASSET-SLOT` comment in `index.html` is listed here, grouped by who is
responsible for delivering the missing asset. The site cannot launch until each
slot is either filled or formally waived in writing.

Regenerate this list any time the source changes:

```
grep -nE "ASSET-SLOT" "/Users/drazicq/Desktop/SELVAGGI WEBSITE/index.html"
```

The three JS templates (project cards, project detail, insight cards, insight
detail) expand at runtime, so the **runtime slot count is higher than the source
grep**. The runtime expansion is itemized at the bottom of this file.

Slot format in source: `ASSET-SLOT: <type> | <owner> | <where> | <action>`

---

## A. CD (Creative Director). logo and visual identity

| # | Where | Action |
|---|---|---|
| A1 | favicon (head) | REPLACE inline chevron SVG with official Selvaggi Built favicon |
| A2 | header logo | REPLACE chevron with official `SelvaggiBuilt_Logo_Chevron.svg` |
| A3 | footer logo | REPLACE chevron with official Selvaggi Built logo (light-on-dark variant) |

---

## B. Aaron Selvaggi. project photography, project metrics, founder bio, credentials

### B1. Real headshots (NO stock substitution)

| # | Where | Action |
|---|---|---|
| B1a | Founder note (Company view) | REQUIRED: real headshot of Aaron Selvaggi |
| B1b | Leadership card: Aaron Selvaggi | REQUIRED: real headshot of Aaron Selvaggi |

### B2. Project photography (stock placeholders OK until swap)

These are flagged `Representative` on screen. All need swapping.

| # | Where | Action |
|---|---|---|
| B2a | Hero collage tile 1 | Real Selvaggi sterile-core or hospital-corridor photo |
| B2b | Hero collage tile 2 | Real Selvaggi ICRA barrier / containment wall photo |
| B2c | Hero collage tile 3 | Real Selvaggi OR install or finishes photo |
| B2d | Hero collage tile 4 | Real Selvaggi pre-construction audit or BIM-review photo |
| B2e | Home sector teaser 01 (Hospitals) | Real hospital interior photo |
| B2f | Home sector teaser 02 (Behavioral) | Real behavioral health interior |
| B2g | Home sector teaser 03 (Surgery) | Real surgery-center photo |
| B2h | Home protocol teaser | Real ICRA containment / barrier photo |
| B2i | Expertise: sector card Hospitals | Real hospital interior photo |
| B2j | Expertise: sector card Medical Office | Real medical-office build photo |
| B2k | Expertise: sector card Behavioral | Real behavioral health interior |
| B2l | Expertise: sector card Imaging | Real imaging suite photo |
| B2m | Expertise: sector card Surgery | Real surgery center / OR photo |
| B2n | Expertise: sector card Laboratory | Real laboratory / pharmacy photo |
| B2o | Expertise: protocol hero | Real containment barrier / HEPA setup photo |
| B2p | Project card hero × 3 (project-01/02/03) | Real Selvaggi project photo per project |
| B2q | Project detail hero × 3 | Real hero photo per project |
| B2r | Project detail gallery × 9 (3 images × 3 projects) | Real photos per project |

### B3. Project text (titles, metrics, prose, outcomes)

For each of `project-01`, `project-02`, `project-03`:

| # | Where | Action |
|---|---|---|
| B3a | Card title × 3 | REQUIRED: real or credibly anonymized project title. No invented hospital. |
| B3b | Card SF × 3 | REQUIRED |
| B3c | Card schedule × 3 | REQUIRED |
| B3d | Card compliance tier × 3 | REQUIRED |
| B3e | Card outcome line × 3 | REQUIRED |
| B3f | Detail SF × 3 | REQUIRED |
| B3g | Detail schedule × 3 | REQUIRED |
| B3h | Detail compliance tier × 3 | REQUIRED |
| B3i | "The Challenge" prose × 3 | REQUIRED |
| B3j | "The Approach" prose × 3 | REQUIRED |
| B3k | "The Outcome" prose × 3 | REQUIRED |
| B3l | Optional client quote × 3 | OPTIONAL: real attributed quote with signed release; leave blank if none |

### B4. Founder bio

| # | Where | Action |
|---|---|---|
| B4a | Founder note (Company view) | REQUIRED: founder bio paragraph. Confirmed facts only. Approved by Aaron before publication. |
| B4b | Leadership card: Aaron Selvaggi | REQUIRED: full bio paragraph approved by Aaron |
| B4c | Leadership card: Aaron LinkedIn | OPTIONAL: LinkedIn URL |

### B5. Credentials

| # | Where | Action |
|---|---|---|
| B5a | HCAI / OSHPD track record | REQUIRED: completed project count or years active under HCAI |
| B5b | Safety certifications | REQUIRED: OSHA, ICRA, infection-control certs held by superintendents |
| B5c | Industry rankings / awards | REQUIRED: verified ranking or award. State "None" if not applicable. |
| B5d | Business certifications | REQUIRED: small business / minority / veteran if eligible. State "None" if not. |
| B5e | Insurance and bonding | REQUIRED: GL, umbrella, single / aggregate bonding capacity |
| B5f | Association memberships | REQUIRED: ASHE, AGC, CHA, etc. |

### B6. Testimonials (also needs Leslie's coordination on releases)

| # | Where | Action |
|---|---|---|
| B6a | Testimonial 01 | REQUIRED: real attributed healthcare-client testimonial with signed release |
| B6b | Testimonial 02 | REQUIRED |
| B6c | Testimonial 03 | REQUIRED |

---

## C. Leslie Lentz. Insights migration, editorial imagery, LinkedIn, map

### C1. Real headshot (NO stock substitution)

| # | Where | Action |
|---|---|---|
| C1a | Leadership card: Leslie Lentz | REQUIRED: real headshot of Leslie Lentz |
| C1b | Leadership card: Leslie bio | REQUIRED: full bio paragraph approved by Leslie |
| C1c | Leadership card: Leslie LinkedIn | OPTIONAL: LinkedIn URL |

### C2. Insights migration (6 articles)

For each of `insight-01` through `insight-06`:

| # | Where | Action |
|---|---|---|
| C2a | Card image × 6 | REPLACE stock placeholder with editorial photo |
| C2b | Card excerpt × 6 | MIGRATE excerpt from live selvaggibuilt.com post. Scrub any "ground-up" / commercial / industrial language. |
| C2c | Detail hero image × 6 | REPLACE stock placeholder with editorial image |
| C2d | Publication date × 6 | REQUIRED from source post |
| C2e | Full article body × 6 | MIGRATE full body from live selvaggibuilt.com post. Healthcare interior only. |
| C2f | Pull-quote × 6 | OPTIONAL: surfaces from migrated body |

Confirmed article titles (already hardcoded):
1. `insight-01`. Key Takeaways From Leading Pharmaceutical Construction Projects
2. `insight-02`. What You Should Know About Medical Architecture
3. `insight-03`. What Makes Medical Building Construction Stand Out
4. `insight-04`. The Ultimate Guide To Laboratory Construction
5. `insight-05`. How To Reduce Costs In Healthcare Construction Projects
6. `insight-06`. Exploring 10 Styles In Medical Building Architecture

### C3. Footer LinkedIn

| # | Where | Action |
|---|---|---|
| C3a | Footer | REQUIRED: official company LinkedIn URL. No `linkedin.com/` root link. |

### C4. Office map

| # | Where | Action |
|---|---|---|
| C4a | Contact view, map slot | REQUIRED: embedded Google Map iframe of 1130 N. Kraemer Blvd., Suite N, Anaheim CA 92806 |

---

## D. Joel Hernandez

| # | Where | Action |
|---|---|---|
| D1a | Leadership card: Joel Hernandez headshot | REQUIRED: real headshot of Joel Hernandez |
| D1b | Leadership card: Joel bio | REQUIRED: full bio paragraph approved by Joel |
| D1c | Leadership card: Joel LinkedIn | OPTIONAL: LinkedIn URL |

---

## E. Legal. required before forms go live or site launches

| # | Where | Action |
|---|---|---|
| E1 | Privacy line above contact form | REQUIRED before launch |
| E2 | Footer Privacy link | REQUIRED: legally vetted Privacy Policy |
| E3 | Footer Accessibility link | REQUIRED: Accessibility statement |
| E4 | Footer Terms link | REQUIRED: Terms of use |

---

## F. Stock images to swap before launch (consolidated)

Every photo flagged "Representative" on screen plus every `data-placeholder="true"`
element. Owner: **Aaron** (project photography) and **Leslie** (insight editorial).

```
Home / hero collage              4 images   → Aaron
Home / sector teaser             3 images   → Aaron
Home / protocol teaser           1 image    → Aaron
Expertise / sector cards         6 images   → Aaron
Expertise / protocol hero        1 image    → Aaron
Projects / card hero × 3         3 images   → Aaron
Projects / detail hero × 3       3 images   → Aaron
Projects / gallery 3 × 3         9 images   → Aaron
Insights / card image × 6        6 images   → Leslie
Insights / detail hero × 6       6 images   → Leslie

TOTAL stock images to swap:     42 images
```

Logo files (CD): favicon + header + footer = 3 instances of the same logo asset.

---

## G. Person-image slots that NEVER receive a stock substitute

These render as labeled Ebony placeholder blocks with a `REQUIRED HEADSHOT`
label. They stay as placeholder blocks until a real photo of the named person is
provided.

| # | Person | Where |
|---|---|---|
| G1 | Aaron Selvaggi | Founder note (Company view) |
| G2 | Aaron Selvaggi | Leadership card |
| G3 | Leslie Lentz | Leadership card |
| G4 | Joel Hernandez | Leadership card |

---

## H. Launch gate summary

Site is **NOT launch-ready** until:

- [ ] All `B1*`, `C1a`, `D1a` real headshots delivered
- [ ] All `B3*` project text fields filled
- [ ] All `B5*` credentials fields filled
- [ ] At least one `B6*` real testimonial with signed release
- [ ] All `C2*` insight bodies migrated and scrubbed
- [ ] `C3a` LinkedIn URL added
- [ ] `C4a` office map embedded
- [ ] All `E*` legal pages drafted and published
- [ ] `.env` configured with `ANTHROPIC_API_KEY` and `CRM_WEBHOOK_URL`
- [ ] At least 30 of 42 stock images replaced with real photography (rest before public launch)
- [ ] CD logo files swapped in (A1, A2, A3)
