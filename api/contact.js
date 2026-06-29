// ============================================================
// /api/contact  (Vercel serverless function)
// Relay contact-form + RFP-modal submissions to a CRM webhook.
// Returns 503 until CRM_WEBHOOK_URL is configured in Vercel env.
// The browser must NEVER claim "message received" without a 2xx
// from this endpoint, by design.
// ============================================================

const buckets = new Map();
function rateLimit(req) {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const max = 6;
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

    const body = req.body || {};
    if (!body.kind) return res.status(400).json({ error: 'missing_kind' });

    const webhook = process.env.CRM_WEBHOOK_URL;
    if (!webhook) {
        console.warn('[contact] CRM_WEBHOOK_URL not configured. Payload logged only.');
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
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[contact] exception', err);
        return res.status(502).json({ error: 'crm_error' });
    }
};
