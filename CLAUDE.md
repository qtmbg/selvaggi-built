# CLAUDE.md — Selvaggi Built Website

Context for any Claude Code session picking up this project (including on a new machine).

## What this is
Marketing website for **Selvaggi Built** — a healthcare-construction company. Static
single-page app plus two Vercel serverless functions. No build step, no framework.

- **Live site:** https://selvaggi-built.vercel.app
- **Vercel project:** `selvaggi-built` (deploy with the *same* Vercel account this is linked to)

## Architecture
- **`index.html`** — the entire front end (~179 KB). Single-page app with **clean path-based
  routing** (History API) and a glass-morphism visual design. This file is ~95% of the project;
  most edits happen here.
- **Routes (clean paths):** `/` (home), `/expertise`, `/projects` (+ `/projects/<slug>`),
  `/tools`, `/insights` (+ `/insights/<slug>`), `/company`, `/how-we-work`, `/contact`, `/faq`,
  `/privacy`, `/terms`.
  `vercel.json` rewrites an **explicit allowlist** of these paths to `/index` (extensionless
  because `cleanUrls` is on — a `.html` destination 404s at the Edge).
  **⚠️ Adding a new top-level route means adding it to the `rewrites` allowlist in `vercel.json`,
  or it will 404.** New `/insights/<slug>` and `/projects/<slug>` entries need no config change.
  The allowlist replaced an old `/((?!api/).*)` catch-all that served the SPA with a **200 for
  every URL on the site** — that made every dead WordPress URL and every typo a soft-404 that
  Google would happily index. Anything outside the allowlist now serves `404.html` with a real
  HTTP 404.
  A JS shim redirects any old `/#/route` bookmark to its clean path; each route sets its own
  title/description/canonical, and there is a `sitemap.xml` + `robots.txt`.
- **Legacy WordPress redirects:** `vercel.json` `redirects` maps the old WordPress URL set
  (`/services/*`, `/case-studies/*`, `/project/*`, `/about-us`, `/contact-us`, the eight old blog
  posts, etc.) to current pages with 308s. The inventory came from the Wayback Machine CDX API
  (`http://web.archive.org/cdx/search/cdx?url=selvaggibuilt.com&matchType=domain&fl=original&collapse=urlkey`)
  — re-run that if more legacy URLs surface. Note Vercel applies `trailingSlash` normalization
  *before* custom redirects, so sources are written **without** trailing slashes; adding `/foo/`
  variants creates dead rules.
- **Tools page (`/tools`, "The Toolkit"):** hosts the ICRA Level Assessor, the Process and
  Compliance Roadmap generator (both moved from Expertise, which now cross-links to it),
  and a Project Brief Builder card that opens the RFP modal.
- **Insights (`/insights`):** the SEO article section. Articles live in the `insights` data
  array in `index.html` (slug, category, dates, excerpt, metaDescription, HTML `body`).
  Article pages set their own title/meta description and inject BlogPosting JSON-LD.
  To add an article, append an entry to the array — no other wiring needed.
- **Per-route metadata:** every view carries `data-title` / `data-description`, and `setMeta()`
  applies them. **Detail routes are the exception and own their metadata entirely:**
  `renderProjectDetail()` and `renderInsightDetail()` set title, description, social card, and
  JSON-LD themselves, and `router()` must **not** call `setMeta()` for them — doing so is what
  made all three case studies share the title "Project | Selvaggi Built".
- **Social cards:** `setSocialMeta()` rewrites the `og:*` / `twitter:*` tags per route. That only
  reaches Googlebot, which renders JS. LinkedIn, Facebook, Slack, and X read raw HTML, so
  `vercel.json` routes **those user-agents only** to `api/og.js`, which server-renders the same
  tags. Humans and Googlebot keep the plain static file, so a fault in `api/og.js` cannot take
  the real pages down. It parses the `projects` / `insights` arrays out of `index.html` at
  runtime, so **adding an article still needs no other wiring**. If you rename those arrays or
  change their field names, update `api/og.js`.
  `og:image:width` / `og:image:height` must describe the image actually served — declaring
  Del Amo's portrait hero as 1200x630 made social cards crop it badly, which is why each project
  carries explicit `ogImage` / `ogImageWidth` / `ogImageHeight`.
- **`api/ai.js`** — Vercel serverless function. Server-side proxy to Anthropic Claude for
  the RFP / ICRA / Estimator features. Holds the API key server-side; never expose it to the client.
- **`api/og.js`** — serves social crawlers an OG-populated copy of `index.html` (see above).
- **`api/contact.js`** — Vercel serverless function. Sends contact-form submissions to `SALES_INBOX`
  via Resend. Returns 503 until `RESEND_API_KEY` / `RESEND_FROM` are configured.
- **`server/`** — local Express version of the same proxy (`server.js`) for running off-Vercel.
- **`instagram/`** — generated Instagram post assets (12-post healthcare-construction series).
- **`vercel.json`** — security headers, `cleanUrls`, function `maxDuration` limits. No build command.

## Deploy
```bash
vercel --prod        # deploys to the linked selvaggi-built project
```
Then verify the live URL returns 200 and the changed route serves the new content.

## Environment variables (NOT in the repo — by design)
Secrets live in Vercel's dashboard (Project → Settings → Environment Variables) and, for local
runs, in `server/.env` (copy from `.env.example`). Required keys:
- `ANTHROPIC_API_KEY` — for `/api/ai` (prepaid; from console.anthropic.com, set a spend cap)
- `ANTHROPIC_MODEL` — default `claude-sonnet-5` (code falls back to `claude-haiku-4-5`)
- `RESEND_API_KEY` + `RESEND_FROM` — for `/api/contact` (Resend free tier, 3,000 emails/month;
  `RESEND_FROM` must be on a domain verified in Resend)
- `SALES_INBOX` — sales@selvaggibuilt.com

Never commit `.env`. Never ship keys to the client.

## Conventions / things to know
- Edits are almost always direct to `index.html`. Match the surrounding glass-morphism styling
  and the existing section-header rhythm (section headers use `mb-12`).
- **Asset references must be root-relative** (`/assets/...`, never `assets/...`). There is no
  `<base>` tag (deliberate — 14 in-page `#` anchors would break under one), so a relative path
  resolves against the current route: on `/projects/<slug>` it becomes `/projects/assets/...`
  → 404 → broken image. This was the root cause of the Aug 2026 "image breaks" report.
- **Zero external render-time dependencies** (Aug 2026): the Tailwind Play CDN and Google Fonts
  were replaced with self-hosted static assets. Tailwind is pre-built to
  `assets/css/tailwind.css`; Inter is the self-hosted variable font at
  `assets/fonts/inter-latin-var.woff2` + `assets/fonts/inter.css`.
  **⚠️ If you add a Tailwind utility class that isn't already used somewhere in `index.html`,
  you must rebuild the stylesheet** (the old CDN generated CSS at runtime; the static file
  doesn't). Rebuild with:
  ```bash
  npx -y tailwindcss@3.4.17 -c tailwind.config.js -i tailwind-input.css \
    -o assets/css/tailwind.css --minify
  ```
  (`tailwind.config.js` and `tailwind-input.css` are checked in at the repo root. The config
  maps brand colors through the `--*-rgb` channel variables so alpha works — see the next
  bullet, and do not revert it to `var(--ebony)` — plus custom letter-spacings
  `tighter/subhead/caption/logo`.) Dynamic class names built with `${...}`
  must keep every possible class as a complete literal string in the file or the extractor
  won't see it.
- **Brand colors are mapped through channel variables so alpha works.**
  `:root` defines `--ebony-rgb: 16 24 32` (etc.) and composes `--ebony: rgb(var(--ebony-rgb))`
  from it. `tailwind.config.js` maps utilities to `rgb(var(--ebony-rgb) / <alpha-value>)`.
  **Do not point the config at `var(--ebony)` directly.** Tailwind cannot derive an alpha
  channel from a `var()` holding a hex, so it silently emits *no rule at all* for every
  slash-opacity class. That was the state until Aug 2026: ~130 usages of `text-ebony/80`,
  `text-ivory/90`, `border-copper/40` and friends generated nothing, and the affected text
  inherited full-strength colour instead of its intended opacity. Fixed by the channel-var
  indirection above, which keeps one source of truth and, unlike `color-mix()`, works in
  every browser. When adding a colour, add both the `-rgb` triplet and the composed var.
  Note the borders were never the problem: every `border-copper/40` sits on a `.glass`
  element, and `.glass` sets `border: 1px solid rgba(255,255,255,0.55)` in the inline
  `<style>` block, which loads after `tailwind.css` and therefore always wins.
- **Copper is two tokens, on purpose.** `--copper` (#B77C4A) is the brand accent:
  borders, fills, the logo, large display type, and copper text on dark panels (which
  already measures 5.11:1). `--copper-ink` (#96602F) is used **only where copper is text on
  a light surface**, because the brand value measures 3.50:1 on white and 3.08:1 on ivory,
  under the 4.5:1 AA floor for normal text. The switch is done by context in the `<style>`
  block (`.bg-white .text-copper`, `.bg-ivory .text-copper`), with `.bg-ebony`,
  `.glass-dark`, `.glass-footer` and `.top-bar` restoring the brand value **after** those
  rules — a `.glass-dark` card nested in a `.bg-ivory` section must not get the ink.
  `.btn-primary.glass-btn` is solid `--copper-ink`, not translucent: white-on-copper needs
  4.5:1 and the old `rgba(183,124,74,.78)` measured 2.56:1. The whole site measures **0 AA
  failures**; re-run the contrast sweep after any color change.
- **Analytics is Vercel Web Analytics, and that choice is load-bearing.** The script is
  served first-party from `/_vercel/insights/script.js`, so it needs **no CSP exception**
  and preserves the zero-external-render-dependency rule. It is cookieless, so the privacy
  policy's no-cookies statement stays true and **no consent banner is required**. Swapping
  in GA4 would break all three of those at once and would mean a banner plus a privacy
  rewrite. Custom events go through `track(name, data)`, which is wrapped in try/catch and
  no-ops when Web Analytics is disabled — analytics must never throw into a conversion path.
  Currently tracked: `icra_completed`, `roadmap_completed`, `rfp_opened`, `rfp_submitted`,
  `tool_result_printed`. **Web Analytics must be enabled in the Vercel dashboard** (Project
  → Analytics) or the script 404s and every event is silently dropped.
- The site contains placeholder content awaiting client-provided assets — see `ASSET-MANIFEST.md`.
- Client (Drew / CEO) reviews via the live Vercel URL, so deploy + verify before handing off.

## Continuity notes (new machine)
- This folder is the full project. After cloning, run `vercel link` and select the
  `selvaggi-built` project (same Vercel account) to restore deploy access.
- Recreate `server/.env` from `.env.example` if running the proxy locally.
- Cross-session "memory" from prior work lived in the `claude-mem` plugin on the old machine
  (`~/.claude-mem/`) and does NOT travel with this folder. This file is the portable substitute.
