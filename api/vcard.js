// ============================================================
// /api/vcard?slug=<slug>   (Vercel serverless function)
//
// Serves a downloadable .vcf for one employee. Server-rendered rather than
// built in the browser on purpose: iOS Safari hands a real text/vcard response
// straight to Contacts, while a blob or data: URL download is unreliable there
// and silently does nothing on some versions. Since the whole point of this is
// a business-card QR code scanned by an iPhone camera, that difference matters.
//
// The records are NOT duplicated here. This reads the same `team` array out of
// index.html at runtime, so editing a phone number in one place updates the
// contact page and the vCard together and they cannot drift apart.
// ============================================================

const fs = require('fs');
const path = require('path');

const ORG = 'Selvaggi Built, Inc.';
const SITE = 'https://selvaggibuilt.com';
const ADR = { street: '5100 E. La Palma Ave., Ste 110', city: 'Anaheim', region: 'CA', zip: '92807', country: 'USA' };

let cache = null;

// Find the array literal assigned to `name`, tracking string state so a bracket
// inside any value cannot end it early.
function extractArraySource(src, name) {
    const start = src.indexOf('const ' + name + ' = [');
    if (start === -1) return null;
    let i = src.indexOf('[', start);
    const open = i;
    let depth = 0;
    let quote = null;
    for (; i < src.length; i++) {
        const c = src[i];
        const next = src[i + 1];
        if (quote) {
            if (c === '\\') { i++; continue; }
            if (c === quote) quote = null;
            continue;
        }
        // Comments must be skipped, not scanned. These arrays carry explanatory
        // comments between entries, and an apostrophe in one of them ("Aaron's")
        // would otherwise open a string that swallows the closing bracket.
        if (c === '/' && next === '/') {
            const nl = src.indexOf('\n', i);
            if (nl === -1) return null;
            i = nl;
            continue;
        }
        if (c === '/' && next === '*') {
            const close = src.indexOf('*/', i + 2);
            if (close === -1) return null;
            i = close + 1;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
        if (c === '[') depth++;
        else if (c === ']') {
            depth--;
            if (depth === 0) return src.slice(open, i + 1);
        }
    }
    return null;
}

function loadTeam() {
    if (cache) return cache;
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const src = extractArraySource(html, 'team');
    if (!src) throw new Error('team array not found in index.html');
    // Our own source, pure data literals, no calls. Not user input.
    cache = new Function('return ' + src)();
    return cache;
}

// RFC 6350: escape backslash, comma, semicolon and newlines in text values.
function esc(v) {
    return String(v == null ? '' : v)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function buildVCard(m) {
    const name = m.first + ' ' + m.last;
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:' + esc(m.last) + ';' + esc(m.first) + ';;;',
        'FN:' + esc(name),
        'ORG:' + esc(ORG)
    ];
    if (m.title) lines.push('TITLE:' + esc(m.title));
    // A null field is omitted rather than emitted empty: a blank TEL line shows
    // up as an empty row in the phone's contact card.
    if (m.mobile) lines.push('TEL;TYPE=CELL,VOICE:' + esc(m.mobile));
    if (m.office) lines.push('TEL;TYPE=WORK,VOICE:' + esc(m.office));
    if (m.email) lines.push('EMAIL;TYPE=WORK,INTERNET:' + esc(m.email));
    lines.push('URL:' + SITE);
    if (m.linkedin) lines.push('URL;TYPE=LinkedIn:' + esc(m.linkedin));
    lines.push('ADR;TYPE=WORK:;;' + esc(ADR.street) + ';' + esc(ADR.city) + ';' + esc(ADR.region) + ';' + esc(ADR.zip) + ';' + esc(ADR.country));
    lines.push('NOTE:' + esc('Healthcare interior construction. CSLB License #1079406.'));
    lines.push('END:VCARD');
    // CRLF is required by the spec; some Android importers reject bare LF.
    return lines.join('\r\n') + '\r\n';
}

module.exports = function handler(req, res) {
    try {
        const url = new URL(req.url, SITE);
        const slug = url.searchParams.get('slug');
        const roster = loadTeam();
        // Same matching rules as the front end: case-insensitive and
        // alias-aware, so /api/vcard?slug=michelle-murrey works even though the
        // printed card says Michelle-Murray.
        const key = String(slug || '').toLowerCase();
        const m = roster.find(x =>
            x.slug.toLowerCase() === key ||
            (x.aliases || []).some(a => String(a).toLowerCase() === key)
        );

        if (!m) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(404).send('No contact for that slug.');
        }

        const filename = (m.first + '-' + m.last).replace(/[^A-Za-z0-9-]/g, '') + '.vcf';
        res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
        // Short cache: a corrected phone number should propagate quickly.
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        res.setHeader('X-Robots-Tag', 'noindex');
        return res.status(200).send(buildVCard(m));
    } catch (err) {
        console.error('[vcard]', err && err.message);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(500).send('Could not generate that contact.');
    }
};
