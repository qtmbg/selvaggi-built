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
  (`tailwind.config.js` and `tailwind-input.css` are checked in at the repo root; the config
  mirrors the old inline `tailwind.config` — custom colors map to the CSS variables, custom
  letter-spacings `tighter/subhead/caption/logo`.) Dynamic class names built with `${...}`
  must keep every possible class as a complete literal string in the file or the extractor
  won't see it.
- **⚠️ KNOWN ISSUE — slash-opacity utilities on the brand colors do nothing.**
  `tailwind.config.js` maps the brand colors to CSS variables (`ebony: 'var(--ebony)'`).
  Tailwind cannot compute an alpha channel from a `var()`, so **every `text-ebony/80`,
  `border-copper/40`, `text-ivory/90`, etc. generates no rule at all** — `assets/css/tailwind.css`
  contains only `.text-ebony`, with no opacity variants. There are ~130 such usages in
  `index.html`. What they render as today: `text-ebony/80` inherits its parent's color, and
  `border-copper/40` falls back to Tailwind preflight's `border: 0 solid #e5e7eb`, so those
  card borders are **light gray, not copper**.
  This predates the CDN→static migration (the Play CDN had the same `var()` limitation), so the
  site the client approved is the gray-bordered one. **Fixing it is a site-wide visual change,
  not a bug fix — get sign-off first.** The fix is to give the config real color values so
  Tailwind can compute alpha (`ebony: '#101820'`, …; the `--ebony` CSS variables stay for the
  hand-written rules in the `<style>` block), then rebuild. Verify the border and body-copy
  changes against a screenshot pass before shipping.
  Until then: **new markup should use classes that actually exist** — plain `text-ebony`,
  `text-copper`, or a hand-written rule in the `<style>` block (as `.metric-note` and
  `.tool-btn-ghost` do).
- The site contains placeholder content awaiting client-provided assets — see `ASSET-MANIFEST.md`.
- Client (Drew / CEO) reviews via the live Vercel URL, so deploy + verify before handing off.

## Continuity notes (new machine)
- This folder is the full project. After cloning, run `vercel link` and select the
  `selvaggi-built` project (same Vercel account) to restore deploy access.
- Recreate `server/.env` from `.env.example` if running the proxy locally.
- Cross-session "memory" from prior work lived in the `claude-mem` plugin on the old machine
  (`~/.claude-mem/`) and does NOT travel with this folder. This file is the portable substitute.
