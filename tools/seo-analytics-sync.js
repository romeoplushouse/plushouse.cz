const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE = 'https://www.plushouse.cz';
const DEFAULT_OG_IMAGE = `${BASE}/uploads/uploads/ogfoto.jpg`;
const GTAG = `<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-GVQ2MF6LY5"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n\n  gtag('config', 'G-GVQ2MF6LY5');\n</script>`;

function walk(dir, out=[]) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.endsWith('.html')) out.push(p);
  }
  return out;
}

function canonicalFor(absPath){
  const rel = path.relative(ROOT, absPath).replace(/\\/g,'/');
  if (rel === 'index.html') return `${BASE}/`;
  if (rel.endsWith('/index.html')) return `${BASE}/${rel.slice(0,-'index.html'.length)}`;
  return `${BASE}/${rel}`;
}

function ensureTag(head, tag){
  return head.includes(tag) ? head : head + '\n' + tag;
}

let changed=0;
for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  if (!/<head[\s>]/i.test(html)) continue;
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!m) continue;
  let head = m[1];

  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = (titleM ? titleM[1].trim() : 'PLUS HOUSE').replace(/\s+/g,' ');
  const descM = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?\s*>/i);
  const desc = descM ? descM[1].trim() : `${title} | PLUS HOUSE`;

  if (!/name=["']description["']/i.test(head)) {
    head = ensureTag(head, `<meta name="description" content="${desc}">`);
  }
  if (!/property=["']og:title["']/i.test(head)) {
    head = ensureTag(head, `<meta property="og:title" content="${title}">`);
  }
  if (!/property=["']og:description["']/i.test(head)) {
    head = ensureTag(head, `<meta property="og:description" content="${desc}">`);
  }
  if (!/property=["']og:image["']/i.test(head)) {
    head = ensureTag(head, `<meta property="og:image" content="${DEFAULT_OG_IMAGE}">`);
  }
  if (!/property=["']og:type["']/i.test(head)) {
    head = ensureTag(head, `<meta property="og:type" content="website">`);
  }
  if (!/rel=["']canonical["']/i.test(head)) {
    head = ensureTag(head, `<link rel="canonical" href="${canonicalFor(file)}">`);
  }

  if (!html.includes("G-GVQ2MF6LY5")) {
    head += '\n' + GTAG;
  }

  const next = html.replace(m[1], head);
  if (next !== html) {
    fs.writeFileSync(file, next, 'utf8');
    changed++;
  }
}

console.log(`updated ${changed} html files`);
