import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path('.')
INDEX = ROOT / 'blog' / 'index.json'

data = json.loads(INDEX.read_text(encoding='utf-8'))
posts = data.get('posts', [])
total = len(posts)

CATEGORY_NOTES = {
    'chytra-domacnost': 'praktický provoz chytré domácnosti, scénáře komfortu a dlouhodobou servisovatelnost',
    'fve': 'výrobu, akumulaci a řízení vlastní spotřeby včetně ekonomiky provozu',
    'automatizace': 'BMS/MaR architekturu, datové body, alarm management a provozní standardy',
    'elektroinstalace': 'návrh rozvaděčů, kabeláže, jištění a budoucí rozšiřitelnost systému',
    'topeni': 'ekvitermní regulaci, zónové řízení a stabilní tepelný komfort bez přetápění',
    'regulace': 'logiku regulace, práci s daty, hysterézi a provozní stabilitu',
    'hvac': 'řízení větrání, kvalitu vzduchu, vlhkostní režimy a energetickou bilanci',
    'clenstvi-house': 'dlouhodobý servis, SLA, pravidelné revize a plán rozvoje systému'
}

for i, post in enumerate(posts, start=1):
    title = post.get('title', '').strip()
    category = post.get('category', '')
    topic = CATEGORY_NOTES.get(category, 'technický návrh, měření a dlouhodobou optimalizaci')

    post['order'] = i
    post['cover_image'] = f'https://www.plushouse.cz/blog/img/{i}.jpg'

    path = urlparse(post['url']).path.lstrip('/')
    if path.endswith('/'):
        path += 'index.html'
    fp = ROOT / path
    if not fp.exists():
        continue

    html = fp.read_text(encoding='utf-8', errors='ignore')

    # Hero image path
    html = re.sub(
        r'<img src="[^"]+" alt="([^"]*)" style="width:100%;height:auto;border-radius:12px; margin:20px 0;">',
        f'<img src="/blog/img/{i}.jpg" alt="\\1" style="width:100%;height:auto;border-radius:12px; margin:20px 0;">',
        html,
        count=1
    )

    # Numbering line directly after H1
    number_line = f'<p><strong>Článek #{i} z {total}</strong> · tematicky zaměřeno na: {title}</p>'
    html = re.sub(r'(</h1>\s*)', r'\1  ' + number_line + '\n', html, count=1)

    # Ensure pub+author line exists and is not duplicated by repeated runs
    html = re.sub(r'<p><strong>Článek #[^<]+</p>\s*<p><strong>Článek #[^<]+</p>', number_line, html)

    # Add unique section block after first hero image
    unique_block = (
        f'<section class="article-unique-block">\n'
        f'  <h2>Proč je téma „{title}“ specifické</h2>\n'
        f'  <p>Tento článek je postavený jako samostatný odborný průvodce, který řeší konkrétně {topic}. '
        f'U tématu „{title}“ nestačí obecné rady – důležité je pochopit návaznost mezi návrhem, realizací, commissioningem a následnou správou. '
        f'Právě tato návaznost rozhoduje, jestli bude systém fungovat stabilně i za 3–5 let.</p>\n'
        f'  <p>V praxi doporučujeme začínat měřitelným cílem: co má být výsledkem po 6 měsících provozu, jaké KPI budeme sledovat a jaký zásah obsluha opravdu zvládne. '
        f'Pro článek #{i} proto používáme konkrétní technické scénáře, kde je jasně vidět dopad rozhodnutí na komfort, bezpečnost i ekonomiku.</p>\n'
        f'</section>\n'
    )

    if 'article-unique-block' not in html:
        html = re.sub(r'(</h1>[\s\S]*?<img src="/blog/img/' + str(i) + r'\.jpg"[^>]*>\s*)', r'\1\n' + unique_block, html, count=1)

    fp.write_text(html, encoding='utf-8')

INDEX.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Updated {total} posts with numbering and image placeholders.')
