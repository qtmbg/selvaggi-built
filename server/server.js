// ============================================================
// Selvaggi Built. AI Proxy
// Front end calls /api/ai and /api/contact. This server holds
// the Anthropic API key server-side and routes the three tools
// (rfp, icra, estimator) through Claude Sonnet.
// ============================================================
//
// REQUIRED env vars (.env, never committed):
//   ANTHROPIC_API_KEY        Anthropic key
//   ANTHROPIC_MODEL          e.g. claude-sonnet-4-6
//   PORT                     default 3000
//   CRM_WEBHOOK_URL          [REQUIRED before launch] CRM ingest URL
//   CRM_AUTH_HEADER          [OPTIONAL] auth header value for CRM
//   SALES_INBOX              fallback email if CRM webhook absent
//
// Run:
//   cd server && npm install && npm start
//
// Serves the static site from ../ and the two API routes.
// ============================================================

'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const KEY = process.env.ANTHROPIC_API_KEY;

if (!KEY) {
    console.warn('[selvaggi-built] WARNING: ANTHROPIC_API_KEY is not set. /api/ai will respond 503.');
}

const app = express();
app.use(express.json({ limit: '64kb' }));

// Tiny per-IP rate limit so the proxy is not abused
const buckets = new Map();
function rateLimit(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const max = 12;
    const bucket = buckets.get(ip) || [];
    const recent = bucket.filter(t => now - t < windowMs);
    if (recent.length >= max) return res.status(429).json({ error: 'rate_limited' });
    recent.push(now);
    buckets.set(ip, recent);
    next();
}

// ============================================================
// SYSTEM PROMPTS (server-side only)
// ============================================================
const PROMPTS = {
    rfp: `You are a senior healthcare construction estimator for Selvaggi Built, Inc., a California healthcare interior construction company. The user will provide rough, fragmented notes for an interior renovation inside an active medical facility. Convert these notes into a structured Project Brief.

Output ONLY valid HTML, no markdown fences. Use <h4> for the following exact headers in this order: "Project Overview", "Estimated ICRA Containment Tier", "Operational Risks", "Next Steps". Use <ul> and <li> for lists.

Tone: expert, objective, restrained. No marketing words. No em dashes. No exclamation points. Do not use the words: solutions, best-in-class, world-class, industry-leading, unparalleled, passionate, leverage, game-changer, cutting-edge. Do not output dollar figures. Do not invent client names or project specifics that are not in the user's notes.`,

    icra: `You are an Infection Preventionist and healthcare construction consultant for Selvaggi Built. Given the user's parameters, evaluate against current ICRA guidance from ASHE and APIC and output an ICRA matrix.

Output ONLY valid HTML, no markdown fences. Use exactly these <h4> headers in this order: "Assigned ICRA Level", "Required Precautions and Barrier Systems", "Monitoring Frequency", "Mitigation Checklist". State the assigned level prominently (e.g., "Class IV"). Where applicable, detail HEPA filtration, negative-pressure monitors, rigid anterooms, sticky mats, and after-hours work windows.

Tone: clinical, authoritative, restrained. No em dashes. No marketing language. Reference output only; the final ICRA permit requires authorization from facility Infection Prevention personnel.`,

    estimator: `You are a senior healthcare construction estimator for Selvaggi Built. Given the user's parameters, output a baseline forecast for an interior renovation inside an active California healthcare facility.

Output ONLY valid HTML, no markdown fences. Use exactly these <h4> headers in this order: "Expected Baseline Schedule", "Critical Path and Process", "ICRA and Compliance Roadmap". Use <ul> and <li> for lists.

Do NOT output dollar figures, budget ranges, $/SF figures, or any pricing. Pricing requires an on-site audit and is communicated under separate cover.

Tone: expert, restrained, objective. No em dashes. No marketing language. State that the output is baseline estimation only, not a contractual schedule, subject to site conditions and facility sign-off.`
};

// ============================================================
// /api/ai. Claude Sonnet
// Body: { tool: 'rfp' | 'icra' | 'estimator', payload: object }
// ============================================================
app.post('/api/ai', rateLimit, async (req, res) => {
    if (!KEY) return res.status(503).json({ error: 'backend_unavailable' });

    const { tool, payload } = req.body || {};
    if (!tool || !PROMPTS[tool]) return res.status(400).json({ error: 'invalid_tool' });

    let userText = '';
    if (tool === 'rfp') {
        if (!payload || !payload.text) return res.status(400).json({ error: 'missing_text' });
        userText = String(payload.text).slice(0, 4000);
    } else if (tool === 'icra') {
        userText = `Evaluate this scenario:
- Construction Activity: ${payload.activity || ''}
- Patient Risk Group: ${payload.risk || ''}
- Project Duration: ${payload.duration || ''}
- Adjacent Occupancy: ${payload.occupancy || ''}`;
    } else if (tool === 'estimator') {
        userText = `Generate a baseline schedule and compliance roadmap (no pricing):
- Facility Type: ${payload.facility || ''}
- Square Footage: ${payload.sqft || ''}
- Adjacent Operations: ${payload.ops || ''}
- HCAI / Structural: ${payload.hcai || ''}`;
    }

    try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 1500,
                system: PROMPTS[tool],
                messages: [{ role: 'user', content: userText }]
            })
        });
        if (!r.ok) {
            const errText = await r.text();
            console.error('[anthropic]', r.status, errText.slice(0, 400));
            return res.status(502).json({ error: 'upstream_error' });
        }
        const data = await r.json();
        const blocks = (data.content || []).filter(b => b.type === 'text');
        const text = blocks.map(b => b.text).join('\n').replace(/```html\n?/g, '').replace(/```\n?/g, '');
        res.json({ content: text });
    } catch (err) {
        console.error('[anthropic] exception', err);
        res.status(502).json({ error: 'upstream_error' });
    }
});

// ============================================================
// /api/contact. STUB
// REQUIRED before launch: connect to the production CRM
// (Salesforce, HubSpot, Pipedrive, etc.) or to a sales inbox
// via Postmark / SendGrid / SES. The stub returns 503 unless
// CRM_WEBHOOK_URL is configured, so the front end NEVER tells
// a user "message received" without a successful POST.
// ============================================================
app.post('/api/contact', rateLimit, async (req, res) => {
    const body = req.body || {};
    if (!body || !body.kind) return res.status(400).json({ error: 'missing_kind' });

    const webhook = process.env.CRM_WEBHOOK_URL;
    if (!webhook) {
        console.warn('[contact] CRM_WEBHOOK_URL not configured. Payload kept in log only.');
        console.log('[contact:unsent]', JSON.stringify(body));
        return res.status(503).json({ error: 'crm_not_configured' });
    }

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (process.env.CRM_AUTH_HEADER) headers['Authorization'] = process.env.CRM_AUTH_HEADER;
        const r = await fetch(webhook, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                source: 'selvaggibuilt.com',
                received_at: new Date().toISOString(),
                ...body
            })
        });
        if (!r.ok) {
            console.error('[contact] CRM responded', r.status);
            return res.status(502).json({ error: 'crm_error' });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('[contact] exception', err);
        res.status(502).json({ error: 'crm_error' });
    }
});

// ============================================================
// STATIC HOSTING. serves the SPA from the parent directory
// ============================================================
const staticRoot = path.resolve(__dirname, '..');
app.use(express.static(staticRoot, { extensions: ['html'] }));
app.get('/', (req, res) => res.sendFile(path.join(staticRoot, 'index.html')));

app.listen(PORT, () => {
    console.log(`[selvaggi-built] proxy listening on http://localhost:${PORT}`);
    console.log(`[selvaggi-built] model: ${MODEL}`);
    console.log(`[selvaggi-built] CRM webhook: ${process.env.CRM_WEBHOOK_URL ? 'configured' : 'NOT configured (form will 503)'}`);
});
