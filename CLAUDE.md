# CLAUDE.md — Selvaggi Built Website

Context for any Claude Code session picking up this project (including on a new machine).

## What this is
Marketing website for **Selvaggi Built** — a healthcare-construction company. Static
single-page app plus two Vercel serverless functions. No build step, no framework.

- **Live site:** https://selvaggi-built.vercel.app
- **Vercel project:** `selvaggi-built` (deploy with the *same* Vercel account this is linked to)

## Architecture
- **`index.html`** — the entire front end (~179 KB). Single-page app with **hash routing**
  and a glass-morphism visual design. This file is ~95% of the project; most edits happen here.
- **Routes (hash-based):** `#/home`, `#/expertise`, `#/projects` (+ `#/projects/<slug>`),
  `#/tools`, `#/insights` (+ `#/insights/<slug>`), `#/company`, `#/how-we-work`, `#/contact`.
  Vercel `cleanUrls` is on, so `/how-we-work` also resolves.
- **Tools page (`#/tools`, "The Toolkit"):** hosts the ICRA Level Assessor, the Process and
  Compliance Roadmap generator (both moved from Expertise, which now cross-links to it),
  and a Project Brief Builder card that opens the RFP modal.
- **Insights (`#/insights`):** the SEO article section. Articles live in the `insights` data
  array in `index.html` (slug, category, dates, excerpt, metaDescription, HTML `body`).
  Article pages set their own title/meta description and inject BlogPosting JSON-LD.
  To add an article, append an entry to the array — no other wiring needed.
- **`api/ai.js`** — Vercel serverless function. Server-side proxy to Google Gemini (free tier) for
  the RFP / ICRA / Estimator features. Holds the API key server-side; never expose it to the client.
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
- `GEMINI_API_KEY` — for `/api/ai` (free tier, from console.google.com / aistudio.google.com)
- `GEMINI_MODEL` — default `gemini-2.5-flash`
- `RESEND_API_KEY` + `RESEND_FROM` — for `/api/contact` (Resend free tier, 3,000 emails/month;
  `RESEND_FROM` must be on a domain verified in Resend)
- `SALES_INBOX` — sales@selvaggibuilt.com

Never commit `.env`. Never ship keys to the client.

## Conventions / things to know
- Edits are almost always direct to `index.html`. Match the surrounding glass-morphism styling
  and the existing section-header rhythm (section headers use `mb-12`).
- The site contains placeholder content awaiting client-provided assets — see `ASSET-MANIFEST.md`.
- Client (Drew / CEO) reviews via the live Vercel URL, so deploy + verify before handing off.

## Continuity notes (new machine)
- This folder is the full project. After cloning, run `vercel link` and select the
  `selvaggi-built` project (same Vercel account) to restore deploy access.
- Recreate `server/.env` from `.env.example` if running the proxy locally.
- Cross-session "memory" from prior work lived in the `claude-mem` plugin on the old machine
  (`~/.claude-mem/`) and does NOT travel with this folder. This file is the portable substitute.
