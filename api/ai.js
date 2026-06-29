// ============================================================
// /api/ai  (Vercel serverless function)
// Routes RFP / ICRA / Estimator calls to Claude Sonnet.
// Key is held server-side via ANTHROPIC_API_KEY env var.
// Never expose this endpoint's logic or prompts to the client.
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

// Tiny per-instance rate limit. Cold starts reset it; good enough.
const buckets = new Map();
function rateLimit(req) {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const max = 12;
    const bucket = (buckets.get(ip) || []).filter(t => now - t < windowMs);
    if (bucket.length >= max) return false;
    bucket.push(now);
    buckets.set(ip, bucket);
    return true;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'method_not_allowed' });
    }
    if (!rateLimit(req)) return res.status(429).json({ error: 'rate_limited' });

    const KEY = process.env.ANTHROPIC_API_KEY;
    const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    if (!KEY) return res.status(503).json({ error: 'backend_unavailable' });

    const body = req.body || {};
    const { tool, payload } = body;
    if (!tool || !PROMPTS[tool]) return res.status(400).json({ error: 'invalid_tool' });

    let userText = '';
    if (tool === 'rfp') {
        if (!payload || !payload.text) return res.status(400).json({ error: 'missing_text' });
        userText = String(payload.text).slice(0, 4000);
    } else if (tool === 'icra') {
        userText = `Evaluate this scenario:
- Construction Activity: ${(payload && payload.activity) || ''}
- Patient Risk Group: ${(payload && payload.risk) || ''}
- Project Duration: ${(payload && payload.duration) || ''}
- Adjacent Occupancy: ${(payload && payload.occupancy) || ''}`;
    } else if (tool === 'estimator') {
        userText = `Generate a baseline schedule and compliance roadmap (no pricing):
- Facility Type: ${(payload && payload.facility) || ''}
- Square Footage: ${(payload && payload.sqft) || ''}
- Adjacent Operations: ${(payload && payload.ops) || ''}
- HCAI / Structural: ${(payload && payload.hcai) || ''}`;
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
        return res.status(200).json({ content: text });
    } catch (err) {
        console.error('[anthropic] exception', err);
        return res.status(502).json({ error: 'upstream_error' });
    }
};
