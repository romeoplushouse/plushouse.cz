const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE = 'https://www.plushouse.cz';
const DEFAULT_OG_IMAGE = `${BASE}/uploads/uploads/ogfoto.jpg`;
const GTAG = `<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-GVQ2MF6LY5"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n\n  gtag('config', 'G-GVQ2MF6LY5');\n</script>`;

const ICO_BLOCK = `<!--ICO -->\n<link rel="apple-touch-icon" sizes="57x57" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-57x57.png">\n<link rel="apple-touch-icon" sizes="60x60" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-60x60.png">\n<link rel="apple-touch-icon" sizes="72x72" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-72x72.png">\n<link rel="apple-touch-icon" sizes="76x76" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-76x76.png">\n<link rel="apple-touch-icon" sizes="114x114" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-114x114.png">\n<link rel="apple-touch-icon" sizes="120x120" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-120x120.png">\n<link rel="apple-touch-icon" sizes="144x144" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-144x144.png">\n<link rel="apple-touch-icon" sizes="152x152" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-152x152.png">\n<link rel="apple-touch-icon" sizes="180x180" href="https://www.plushouse.cz/uploads/uploads/ico/apple-icon-180x180.png">\n<link rel="icon" type="image/png" sizes="192x192" href="https://www.plushouse.cz/uploads/uploads/ico/android-icon-192x192.png">\n<link rel="icon" type="image/png" sizes="32x32" href="https://www.plushouse.cz/uploads/uploads/ico/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="96x96" href="https://www.plushouse.cz/uploads/uploads/ico/favicon-96x96.png">\n<link rel="icon" type="image/png" sizes="16x16" href="https://www.plushouse.cz/uploads/uploads/ico/favicon-16x16.png">\n<link rel="manifest" href="https://www.plushouse.cz//manifest.json">\n<meta name="msapplication-TileColor" content="#ffffff">\n<meta name="msapplication-TileImage" content="/ms-icon-144x144.png">\n<meta name="theme-color" content="#ffffff">\n<!--ICO -->`;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.endsWith('.html')) out.push(p);
  }
  return out;
}

function canonicalFor(absPath) {
  const rel = path.relative(ROOT, absPath).replace(/\\/g, '/');
  if (rel === 'index.html') return `${BASE}/`;
  if (rel.endsWith('/index.html')) return `${BASE}/${rel.slice(0, -'index.html'.length)}`;
  return `${BASE}/${rel}`;
}

function ensureTag(head, tag) {
  return head.includes(tag) ? head : `${head}\n${tag}`;
}

function stripOldGtag(head) {
  let h = head;
  h = h.replace(/\s*<!--\s*Google tag \(gtag\.js\)\s*-->\s*/gi, '\n');
  h = h.replace(/\s*<!--\s*Google tag \(gtag\.js\)\s*-->[\s\S]*?<\/script>\s*<\/script>/gi, '\n');
  h = h.replace(/\s*<script[^>]*src=["'][^"']*googletagmanager\.com\/gtag\/js\?id=G-GVQ2MF6LY5[^"']*["'][^>]*><\/script>\s*/gi, '\n');
  h = h.replace(/\s*<script>\s*window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\];[\s\S]*?gtag\('config',\s*'G-GVQ2MF6LY5'\);\s*<\/script>\s*/gi, '\n');
  return h;
}

function stripOldIco(head) {
  let h = head;
  h = h.replace(/\s*<!--ICO -->[\s\S]*?<!--ICO -->\s*/gi, '\n');
  h = h.replace(/\s*<link\s+rel=["']apple-touch-icon["'][^>]*>\s*/gi, '\n');
  h = h.replace(/\s*<link\s+rel=["']icon["'][^>]*>\s*/gi, '\n');
  h = h.replace(/\s*<link\s+rel=["']manifest["'][^>]*>\s*/gi, '\n');
  h = h.replace(/\s*<meta\s+name=["']msapplication-TileColor["'][^>]*>\s*/gi, '\n');
  h = h.replace(/\s*<meta\s+name=["']msapplication-TileImage["'][^>]*>\s*/gi, '\n');
  h = h.replace(/\s*<meta\s+name=["']theme-color["'][^>]*>\s*/gi, '\n');
  return h;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<head[\s>]/i.test(html)) continue;
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!m) continue;
  let head = m[1];

  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = (titleM ? titleM[1].trim() : 'PLUS HOUSE').replace(/\s+/g, ' ');
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
    head = ensureTag(head, '<meta property="og:type" content="website">');
  }
  if (!/rel=["']canonical["']/i.test(head)) {
    head = ensureTag(head, `<link rel="canonical" href="${canonicalFor(file)}">`);
  }

  head = stripOldIco(head).trim();
  head = `${head}\n${ICO_BLOCK}`;

  head = stripOldGtag(head).trim();
  head = `${head}\n${GTAG}`;

  const next = html.replace(m[1], `\n${head}\n`);
  if (next !== html) {
    fs.writeFileSync(file, next, 'utf8');
    changed++;
  }
}

console.log(`updated ${changed} html files`);
