// ============================================================
// /api/contact  (Vercel serverless function)
// Sends contact-form + RFP-modal submissions to SALES_INBOX via Resend.
// Returns 503 until RESEND_API_KEY is configured in Vercel env.
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

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'method_not_allowed' });
    }
    if (!rateLimit(req)) return res.status(429).json({ error: 'rate_limited' });

    const body = req.body || {};
    if (!body.kind) return res.status(400).json({ error: 'missing_kind' });

    const KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM;
    const TO = process.env.SALES_INBOX || 'sales@selvaggibuilt.com';
    if (!KEY || !FROM) {
        console.warn('[contact] RESEND_API_KEY/RESEND_FROM not configured. Payload logged only.');
        console.log('[contact:unsent]', JSON.stringify(body));
        return res.status(503).json({ error: 'email_not_configured' });
    }

    try {
        const { subject, html } = buildEmail(body);
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KEY}`
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
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[resend] exception', err);
        return res.status(502).json({ error: 'email_error' });
    }
};
