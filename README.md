# Selvaggi Built. Website

Healthcare interior construction marketing site for Selvaggi Built, Inc.
California only. CSLB #1079406. Anaheim, CA.

This is a **mockup / placeholder build**. The site is wired end-to-end, but the
content layer is intentionally not filled. Every missing real-world asset is
marked with an `ASSET-SLOT` comment and surfaced in
[`ASSET-MANIFEST.md`](./ASSET-MANIFEST.md).

---

## 1. File tree

```
SELVAGGI WEBSITE/
├── index.html              ← single-file SPA, hash router, all views
├── ASSET-MANIFEST.md       ← every ASSET-SLOT grouped by supplier
├── README.md               ← this file
├── .env.example            ← copy to server/.env, fill in keys
├── .gitignore              ← never commit .env or node_modules
└── server/
    ├── server.js           ← Gemini AI proxy + Resend contact relay
    └── package.json        ← express + dotenv
```

The SPA is one file by design (no build step). The proxy is a tiny Node/Express
service that holds the Gemini key and the Resend key out of the browser.

---

## 2. Routes (hash router)

| Route | View |
|---|---|
| `#/home` | Hero, trust strip, sector teaser, protocol teaser, projects teaser, CTA |
| `#/expertise` | Sectors expanded, capabilities list, full Zero-Disruption Protocol, ICRA Assessor, Process Roadmap |
| `#/projects` | Index of three case studies with sector filter |
| `#/projects/project-01` | Case-study detail template |
| `#/projects/project-02` | Case-study detail template |
| `#/projects/project-03` | Case-study detail template |
| `#/insights` | Index of six articles |
| `#/insights/insight-01` … `insight-06` | Article detail template |
| `#/company` | How we work, founder note, leadership (3), credentials, testimonials |
| `#/contact` | NAP, contact form, map slot |

Each route updates `document.title`, the `meta description`, moves focus to the
view's `<h1>`, scrolls to top, and announces via `aria-live`.

Detail templates render from in-file JS data structures (`projects` and
`insights` constants in `index.html`). Add new entries to those arrays; routes
flow automatically.

---

## 3. Running the site

### Without the AI tools (static preview)

Open `index.html` directly in a browser. Navigation, mobile menu, reveals,
modals, and the project filter all work. The three AI tools and the contact
form will show "Backend required" / "Sending failed" fallback messages, by
design.

### With the AI tools and contact form (full)

```
cp .env.example server/.env
# Fill in GEMINI_API_KEY and RESEND_API_KEY / RESEND_FROM (see Sections 4 and 5)

cd server
npm install
npm start
```

The proxy serves the SPA on `http://localhost:3000` and exposes:

- `POST /api/ai`       Gemini calls (rfp / icra / estimator)
- `POST /api/contact`  Resend email relay

---

## 4. AI proxy

Front end calls `POST /api/ai` with `{ tool, payload }`. The proxy:

1. Validates the `tool` is one of `rfp`, `icra`, `estimator`.
2. Loads the matching server-side system prompt (the prompts are **never**
   sent to the browser).
3. Calls `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
   with `model = process.env.GEMINI_MODEL` (default `gemini-2.5-flash`, free tier),
   the system prompt, and the user message.
4. Returns `{ content: <html string> }` to the browser.

If `GEMINI_API_KEY` is missing, the endpoint responds `503` and the front end
renders the "Backend required" state.

Per-IP rate limit: 12 requests / 60 seconds.

### Updating the system prompts

Edit `server/server.js` → `PROMPTS` object. Restart the server. The browser
never sees the prompts.

### Pricing safety

The Process Roadmap prompt explicitly forbids dollar figures, budget ranges, and
$/SF figures. Pricing is communicated under separate cover after on-site audit.
Do not loosen this without sign-off.

---

## 5. Contact form

Front end calls `POST /api/contact`. The proxy formats the payload as an email
and sends it via Resend to `SALES_INBOX` using `RESEND_API_KEY` and
`RESEND_FROM` (a sender address on a domain verified in Resend).

**Until `RESEND_API_KEY` / `RESEND_FROM` are configured, the endpoint returns
503.** The front end never tells the user "message received" without a
successful send. This is intentional. Do not change this behavior.

Expected volume is low (roughly 50 submissions/month across contact + RFP
modal), well inside Resend's free tier (3,000 emails/month).

The same endpoint receives RFP modal submissions, identified by `kind: 'rfp'`
in the payload.

---

## 6. Confirmed facts that are hardcoded

Everything else is an `ASSET-SLOT`.

| Field | Value |
|---|---|
| Legal name | Selvaggi Built, Inc. |
| License | CSLB #1079406 |
| Address | 1130 N. Kraemer Blvd., Suite N, Anaheim, CA 92806 |
| Phone | 657-201-3606 |
| Email (sales) | sales@selvaggibuilt.com |
| Email (founder) | aaron@selvaggibuilt.com |
| Service area | California only |
| Scope | Healthcare interior construction only |
| Founder | Aaron Selvaggi, CEO and Founder. Hospital construction and project management since 2017. |
| Marketing Director | Leslie Lentz |
| Project Manager | Joel Hernandez |
| Insight titles (6) | See `index.html` `insights` data structure |

---

## 7. Brand rules

- **Tokens:** ebony `#101820`, slate `#3F4A4F`, stone `#D4CEC2`, copper
  `#B77C4A`, ivory `#F5F0E6`, white `#FFFFFF`.
- **Copper** is an accent only. Never a background, never body copy. Used on
  ebony or white/ivory. Never on stone or slate.
- **Three tokens max** per composition.
- **Inter** throughout.
- **No em dashes.** Use periods, commas, or colons.
- **No exclamation points** outside literal safety warnings.
- **No emojis.**
- **Banned vocabulary:** solutions, best-in-class, world-class,
  industry-leading, unparalleled, passionate about, we believe, we are committed
  to, leverage (as verb), game-changer, cutting-edge.
- **Banned scope language:** ground-up, residential, commercial, industrial.
  Selvaggi Built builds healthcare interiors only. Migrated insight content must
  be scrubbed of these terms.

---

## 8. Image policy

- **Environmental and project images** can be stock placeholders until real
  Selvaggi project photography is delivered. They are visibly flagged
  "Representative" and marked `data-placeholder="true"`. A footer disclosure
  confirms the convention to visitors.
- **Person images** are **never** stock. Founder and team headshots render as
  labeled Ebony placeholder blocks until the named person provides a real
  headshot. This rule has no override.

A stock environmental image says "a real photo goes here." A stock face on a
real name says "this is the person," which is a false claim to a procurement
audience. The rule is enforced by the `ASSET-SLOT` type distinction
(`image` vs `person-image`).

---

## 9. Launch gates

Site is **not** launch-ready until every item in
[`ASSET-MANIFEST.md` Section H](./ASSET-MANIFEST.md#h-launch-gate-summary) is
checked. Highlights:

1. All four real headshots delivered (Aaron × 2, Leslie, Joel)
2. All three project case studies filled with real titles, metrics, prose
3. All six insight articles migrated and scrubbed of banned scope language
4. At least one real attributed testimonial with signed release
5. Privacy Policy, Accessibility Statement, Terms of Use published
6. Resend configured and domain verified (`RESEND_API_KEY`, `RESEND_FROM`)
7. Gemini API key configured (`GEMINI_API_KEY`)
8. Official LinkedIn URL added
9. CD logo files swapped in (favicon + header + footer)

---

## 10. Verification checks before each push

```bash
cd "/Users/drazicq/Desktop/SELVAGGI WEBSITE"

# Zero em dashes
grep -c "." index.html ASSET-MANIFEST.md README.md
# Expected: 0 0 0

# No client-side AI vendor identifiers
grep -cE "(gemini-key|openai|anthropic|claude-key)" index.html
# Expected: 0

# Every placeholder is labeled
grep -c "ASSET-SLOT" index.html
# Expected: > 50 (templates expand at runtime)

# No invented faces (person-slot count matches expected)
grep -c "person-slot" index.html
# Expected: 4 (Aaron founder note, Aaron card, Leslie card, Joel card)
```

If any check fails, fix before pushing.
