// ============================================================
// Selvaggi Built. AI Proxy
// Front end calls /api/ai and /api/contact. This server holds
// the Gemini API key server-side and routes the three tools
// (rfp, icra, estimator) through Google Gemini (free tier), and
// sends contact-form submissions to SALES_INBOX via Resend.
// ============================================================
//
// REQUIRED env vars (.env, never committed):
//   GEMINI_API_KEY           Google AI Studio key (free tier)
//   GEMINI_MODEL             e.g. gemini-2.5-flash
//   PORT                     default 3000
//   RESEND_API_KEY           [REQUIRED before launch] Resend key
//   RESEND_FROM              verified sender, e.g. "Selvaggi Built Website <notifications@selvaggibuilt.com>"
//   SALES_INBOX              inbox that receives form submissions
//
// Run:
//   cd server && npm install && npm start
//
// Serves the static site from ../ and the two API routes.
// ============================================================

'use strict';

const path = require('path');
const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const KEY = process.env.GEMINI_API_KEY;

if (!KEY) {
    console.warn('[selvaggi-built] WARNING: GEMINI_API_KEY is not set. /api/ai will respond 503.');
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
// /api/ai. Google Gemini
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
        const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: PROMPTS[tool] }] },
                    contents: [{ role: 'user', parts: [{ text: userText }] }],
                    generationConfig: { maxOutputTokens: 1500 }
                })
            }
        );
        if (!r.ok) {
            const errText = await r.text();
            console.error('[gemini]', r.status, errText.slice(0, 400));
            return res.status(502).json({ error: 'upstream_error' });
        }
        const data = await r.json();
        const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        const text = parts.map(p => p.text || '').join('\n').replace(/```html\n?/g, '').replace(/```\n?/g, '');
        res.json({ content: text });
    } catch (err) {
        console.error('[gemini] exception', err);
        res.status(502).json({ error: 'upstream_error' });
    }
});

// ============================================================
// /api/contact. Sends submissions to SALES_INBOX via Resend.
// Returns 503 until RESEND_API_KEY / RESEND_FROM are configured,
// so the front end NEVER tells a user "message received" without
// a successful send.
// ============================================================
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildEmail(body) {
    if (body.kind === 'rfp') {
        return {
            subject: 'Selvaggi Built website — RFP draft submission',
            html: `<h2>RFP draft submission</h2>
<h3>Raw notes</h3><p>${escapeHtml(body.raw || '').replace(/\n/g, '<br>')}</p>
<h3>Generated draft</h3><p>${escapeHtml(body.draft || '').replace(/\n/g, '<br>')}</p>`
        };
    }
    return {
        subject: `Selvaggi Built website — contact form: ${escapeHtml(body.name || 'unknown')}`,
        html: `<h2>New contact form submission</h2>
<p><strong>Name:</strong> ${escapeHtml(body.name || '')}</p>
<p><strong>Organization:</strong> ${escapeHtml(body.organization || '')}</p>
<p><strong>Email:</strong> ${escapeHtml(body.email || '')}</p>
<p><strong>Phone:</strong> ${escapeHtml(body.phone || '')}</p>
<p><strong>Message:</strong><br>${escapeHtml(body.message || '').replace(/\n/g, '<br>')}</p>`
    };
}

app.post('/api/contact', rateLimit, async (req, res) => {
    const body = req.body || {};
    if (!body || !body.kind) return res.status(400).json({ error: 'missing_kind' });

    const RKEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM;
    const TO = process.env.SALES_INBOX || 'sales@selvaggibuilt.com';
    if (!RKEY || !FROM) {
        console.warn('[contact] RESEND_API_KEY/RESEND_FROM not configured. Payload kept in log only.');
        console.log('[contact:unsent]', JSON.stringify(body));
        return res.status(503).json({ error: 'email_not_configured' });
    }

    try {
        const { subject, html } = buildEmail(body);
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RKEY}`
            },
            body: JSON.stringify({
                from: FROM,
                to: [TO],
                reply_to: body.email || undefined,
                subject,
                html
            })
        });
        if (!r.ok) {
            const errText = await r.text();
            console.error('[resend]', r.status, errText.slice(0, 400));
            return res.status(502).json({ error: 'email_error' });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('[resend] exception', err);
        res.status(502).json({ error: 'email_error' });
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
    console.log(`[selvaggi-built] Resend: ${process.env.RESEND_API_KEY ? 'configured' : 'NOT configured (form will 503)'}`);
});
