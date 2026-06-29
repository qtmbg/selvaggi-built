// Generates 12 Instagram post HTML files (1080x1350, 4:5) for Selvaggi Built.
// Shared template + brand tokens from the website so the series reads as one system.
const fs = require('fs');
const path = require('path');

const C = {
  ebony: '#101820',
  slate: '#3F4A4F',
  stone: '#D4CEC2',
  copper: '#B77C4A',
  ivory: '#F5F0E6',
  white: '#FFFFFF',
};

const posts = [
  {
    theme: 'dark',
    eyebrow: 'Healthcare Construction',
    headline: 'We build around operations.',
    body: 'Selvaggi Built renovates active healthcare facilities across California. Patients stay. Medical teams keep working. Schedules hold.',
    kicker: 'A 12-post look at how we build inside live hospitals.',
  },
  {
    theme: 'light',
    eyebrow: 'Our Philosophy',
    headline: 'A hospital is a living system.',
    body: 'It never closes, never pauses, and never waits for construction. So we never ask it to. We build around it.',
  },
  {
    theme: 'dark',
    eyebrow: 'Our Method',
    headline: 'The Zero-Disruption Protocol.',
    body: 'Every Selvaggi Built renovation runs on one system: engineer the entire build sequence around facility operations — before a single tool is mobilized.',
    kicker: 'Steps 1–3 in the next posts.',
  },
  {
    theme: 'light',
    eyebrow: 'Protocol · Step 1',
    bignum: '01',
    headline: 'Scan before we cut.',
    body: 'Ground-penetrating radar scans. Critical utility mapping. Isolation zones established. We know what is behind every wall before we open it.',
  },
  {
    theme: 'dark',
    eyebrow: 'Protocol · Step 2',
    bignum: '02',
    headline: 'Contain everything.',
    body: 'ICRA Level 4 barriers. Rigid wall systems. HEPA-filtered negative air machines. Nothing crosses from the work zone into patient care.',
  },
  {
    theme: 'light',
    eyebrow: 'Protocol · Step 3',
    bignum: '03',
    headline: 'Build on their clock.',
    body: 'Disruptive tie-ins happen only in designated after-hours windows. Every phase is approved by facility directors and Inspectors of Record.',
  },
  {
    theme: 'copper',
    quote: true,
    headline: 'The schedule serves the hospital. Not the build.',
    body: 'Selvaggi Built field standard',
  },
  {
    theme: 'light',
    eyebrow: 'Sectors',
    headline: 'Who we build for.',
    list: ['Hospitals', 'Medical Office', 'Behavioral Health', 'Imaging & Diagnostic', 'Surgery Centers', 'Laboratory'],
  },
  {
    theme: 'dark',
    eyebrow: 'Compliance',
    headline: 'ICRA Level 4. Every project.',
    body: 'The strictest infection-control tier in healthcare construction — full barriers, negative pressure, and daily compliance logs. It is our default, not our upgrade.',
  },
  {
    theme: 'light',
    eyebrow: 'Credentials',
    headline: 'Licensed. Certified. Verified.',
    list: ['HCAI project experience', 'ICRA-certified superintendents', 'CSLB License #1079406', 'Daily compliance documentation'],
  },
  {
    theme: 'dark',
    eyebrow: 'The Outcome',
    headline: 'Built for continuity.',
    body: 'Patients stay. Medical teams keep working. Schedules hold. We build the spaces where healing happens — without stopping the healing.',
  },
  {
    theme: 'copper',
    eyebrow: 'Work With Us',
    headline: 'Have a project in an active facility?',
    body: 'Submit a project for review and we will respond with a scoped, compliance-ready plan.',
    cta: 'selvaggibuilt.com',
  },
];

function palette(theme) {
  if (theme === 'dark') return { bg: C.ebony, fg: C.ivory, sub: C.stone, accent: C.copper, rule: 'rgba(245,240,230,0.25)' };
  if (theme === 'copper') return { bg: C.copper, fg: C.ivory, sub: 'rgba(245,240,230,0.85)', accent: C.ebony, rule: 'rgba(245,240,230,0.35)' };
  return { bg: C.ivory, fg: C.ebony, sub: C.slate, accent: C.copper, rule: 'rgba(16,24,32,0.2)' };
}

function render(p, i) {
  const n = String(i + 1).padStart(2, '0');
  const pal = palette(p.theme);

  let middle = '';
  if (p.quote) {
    middle = `
      <div class="quotemark">“</div>
      <h1 class="headline quote-h">${p.headline}</h1>
      <p class="attribution">— ${p.body}</p>`;
  } else {
    middle = `
      ${p.bignum ? `<div class="bignum">${p.bignum}</div>` : ''}
      <div class="eyebrow-row"><span class="accent-bar"></span><span class="eyebrow">${p.eyebrow}</span></div>
      <h1 class="headline">${p.headline}</h1>
      ${p.body ? `<p class="body">${p.body}</p>` : ''}
      ${p.list ? `<ul class="list">${p.list.map(x => `<li><span class="tick"></span>${x}</li>`).join('')}</ul>` : ''}
      ${p.kicker ? `<p class="kicker">${p.kicker}</p>` : ''}
      ${p.cta ? `<div class="cta">${p.cta}</div>` : ''}`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1080px; height:1350px; overflow:hidden; }
  body {
    font-family:'Inter',-apple-system,sans-serif;
    background:${pal.bg}; color:${pal.fg};
    display:flex; flex-direction:column;
    padding:72px 84px;
    -webkit-font-smoothing:antialiased;
  }
  .top {
    display:flex; justify-content:space-between; align-items:center;
    padding-bottom:36px; border-bottom:2px solid ${pal.rule};
  }
  .wordmark { font-size:34px; font-weight:800; letter-spacing:0.14em; }
  .counter { font-size:32px; font-weight:500; color:${pal.sub}; letter-spacing:0.06em; }
  .main { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .eyebrow-row { display:flex; align-items:center; gap:24px; margin-bottom:40px; }
  .accent-bar { display:block; width:88px; height:10px; background:${pal.accent}; }
  .eyebrow { font-size:34px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:${pal.accent}; }
  .bignum {
    font-size:200px; font-weight:800; line-height:1; color:transparent;
    -webkit-text-stroke:3px ${pal.accent}; margin-bottom:24px;
  }
  .headline { font-size:108px; font-weight:800; line-height:1.06; letter-spacing:-0.02em; margin-bottom:44px; }
  .body { font-size:44px; font-weight:400; line-height:1.45; color:${pal.sub}; max-width:860px; }
  .kicker { font-size:36px; font-weight:700; color:${pal.accent}; margin-top:48px; }
  .list { list-style:none; margin-top:8px; }
  .list li {
    font-size:50px; font-weight:700; line-height:1; padding:26px 0;
    display:flex; align-items:center; gap:28px;
    border-bottom:2px solid ${pal.rule};
  }
  .list li:last-child { border-bottom:none; }
  .tick { display:block; width:22px; height:22px; background:${pal.accent}; flex-shrink:0; }
  .cta {
    display:inline-block; align-self:flex-start; margin-top:56px;
    background:${pal.accent}; color:${p.theme === 'copper' ? C.ivory : C.ivory};
    font-size:42px; font-weight:800; letter-spacing:0.06em;
    padding:30px 48px;
  }
  .quotemark { font-size:220px; font-weight:800; line-height:0.6; color:${pal.accent}; margin-bottom:8px; }
  .quote-h { font-size:96px; }
  .attribution { font-size:38px; font-weight:500; color:${pal.sub}; }
  .bottom {
    display:flex; justify-content:space-between; align-items:center;
    padding-top:36px; border-top:2px solid ${pal.rule};
    font-size:28px; font-weight:500; color:${pal.sub}; letter-spacing:0.04em;
  }
</style></head>
<body>
  <div class="top">
    <div class="wordmark">SELVAGGI BUILT</div>
    <div class="counter">${n} / 12</div>
  </div>
  <div class="main">${middle}</div>
  <div class="bottom">
    <span>Healthcare Construction · Anaheim, CA</span>
    <span>CSLB #1079406</span>
  </div>
</body></html>`;
}

const outDir = __dirname;
posts.forEach((p, i) => {
  const n = String(i + 1).padStart(2, '0');
  fs.writeFileSync(path.join(outDir, `post-${n}.html`), render(p, i));
});
console.log('Wrote 12 HTML files');
