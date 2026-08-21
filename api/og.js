// ============================================================
// /api/og  (Vercel serverless function)
//
// Social crawlers (LinkedIn, Facebook, Slack, X, Discord, WhatsApp) fetch raw
// HTML and never run JavaScript. The SPA rewrites its Open Graph tags client
// side in setSocialMeta(), which Googlebot honors because it renders JS, but
// those crawlers do not, so every shared /projects/<slug> and /insights/<slug>
// link would unfurl with the homepage title and image.
//
// vercel.json routes ONLY those crawler user-agents here. Humans and Googlebot
// keep getting the plain static file, so a fault in this path can never take
// the real pages down.
//
// The page metadata is NOT duplicated here. This reads the same `projects` and
// `insights` arrays out of index.html at runtime, so appending an article still
// needs no other wiring (see CLAUDE.md).
// ============================================================

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://selvaggibuilt.com';
const DEFAULT_IMAGE = SITE_URL + '/assets/og/og-default.jpg';
const DEFAULT_ALT = 'Completed patient room renovation by Selvaggi Built.';

let cache = null;

// Find the array literal assigned to `name` and return its source text,
// tracking string state so brackets inside article HTML do not end it early.
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

function load() {
    if (cache) return cache;
    // index.html sits at the project root; this file runs from /api.
    const htmlPath = path.join(process.cwd(), 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const parse = (name) => {
        const src = extractArraySource(html, name);
        if (!src) return [];
        // Our own source, pure data literals, no calls. Not user input.
        return new Function('return ' + src)();
    };

    const projects = parse('projects');
    const insights = parse('insights');
    cache = { html, projects, insights };
    return cache;
}

function escapeAttr(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Swap the content="" of a tag carrying the given id.
function setById(html, id, value) {
    const re = new RegExp('(<meta\\b[^>]*\\bid="' + id + '"[^>]*>)', 'i');
    return html.replace(re, (tag) => {
        if (/content="/i.test(tag)) {
            return tag.replace(/content="[^"]*"/i, 'content="' + escapeAttr(value) + '"');
        }
        return tag.replace(/>$/, ' content="' + escapeAttr(value) + '">');
    });
}

function render(html, meta) {
    let out = html;
    out = out.replace(/<title id="pageTitle">[\s\S]*?<\/title>/i,
        '<title id="pageTitle">' + escapeAttr(meta.title) + '</title>');
    out = out.replace(/(<meta\b[^>]*\bid="pageDescription"[^>]*>)/i,
        (tag) => tag.replace(/content="[^"]*"/i, 'content="' + escapeAttr(meta.description) + '"'));
    out = setById(out, 'ogType', meta.type || 'article');
    out = setById(out, 'ogTitle', meta.title);
    out = setById(out, 'ogDescription', meta.description);
    out = setById(out, 'ogUrl', meta.url);
    out = setById(out, 'ogImage', meta.image);
    out = setById(out, 'ogImageWidth', meta.width);
    out = setById(out, 'ogImageHeight', meta.height);
    out = setById(out, 'ogImageAlt', meta.alt);
    out = setById(out, 'twTitle', meta.title);
    out = setById(out, 'twDescription', meta.description);
    out = setById(out, 'twImage', meta.image);
    out = setById(out, 'twImageAlt', meta.alt);
    return out;
}

module.exports = function handler(req, res) {
    let html;
    try {
        const data = load();
        html = data.html;

        const url = new URL(req.url, SITE_URL);
        const type = url.searchParams.get('type');
        const slug = url.searchParams.get('slug');

        let meta = null;
        if (type === 'projects') {
            const p = data.projects.find(x => x.slug === slug);
            if (p) {
                meta = {
                    title: p.metaTitle || (p.title + ' | Selvaggi Built'),
                    description: p.metaDescription || p.outcomeLine,
                    url: SITE_URL + '/projects/' + p.slug,
                    image: SITE_URL + (p.ogImage || p.heroImage),
                    width: p.ogImageWidth || 1200,
                    height: p.ogImageHeight || 630,
                    alt: p.heroAlt || DEFAULT_ALT
                };
            }
        } else if (type === 'insights') {
            const a = data.insights.find(x => x.slug === slug);
            if (a) {
                meta = {
                    title: a.title + ' | Selvaggi Built',
                    description: a.metaDescription || a.excerpt,
                    url: SITE_URL + '/insights/' + a.slug,
                    image: DEFAULT_IMAGE,
                    width: 1200,
                    height: 630,
                    alt: DEFAULT_ALT
                };
            }
        }

        if (meta) html = render(html, meta);
    } catch (err) {
        // Never fail the request over a card. Serving the unmodified SPA is the
        // same thing the static route would have served.
        console.error('[og] falling back to static index', err && err.message);
        if (!html) {
            try {
                html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
            } catch (readErr) {
                return res.status(500).send('');
            }
        }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
};
