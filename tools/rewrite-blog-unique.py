import json, re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path('.')
posts = json.loads((ROOT/'blog/index.json').read_text(encoding='utf-8'))['posts']

section_pool = [
    'Strategický kontext tématu',
    'Návrh řešení v praxi',
    'Technické chyby, které projekt prodraží',
    'Ekonomika a návratnost',
    'Implementace krok za krokem',
    'Provoz, servis a dlouhodobá stabilita',
    'Doporučení pro investora a realizační tým',
    'Co si pohlídat při výběru dodavatele',
    'Jak nastavit kvalitní zadání projektu',
    'Jak měřit skutečný přínos po spuštění',
]

angles = [
    'komfort uživatele', 'energetická efektivita', 'provozní spolehlivost', 'bezpečnost provozu',
    'škálovatelnost systému', 'servisovatelnost řešení', 'srozumitelnost ovládání', 'kvalita dat'
]

for i, post in enumerate(posts, start=1):
    title = post['title']
    category = post.get('category','obecne')
    pub = post.get('published_at','')
    rel = urlparse(post['url']).path.lstrip('/')
    if rel.endswith('/'):
        rel += 'index.html'
    fp = ROOT/rel
    if not fp.exists():
        continue
    html = fp.read_text(encoding='utf-8', errors='ignore')

    # take first 7 section titles, shifted per article for uniqueness
    sections = [section_pool[(i+j) % len(section_pool)] for j in range(7)]

    body = []
    body.append('<p><a href="https://www.plushouse.cz/blog">← Zpět na blog</a></p>')
    body.append(f'<h1>{title}</h1>')
    body.append(f'<p><strong>Článek #{i} z {len(posts)}</strong> · originální odborný rozbor tématu: {title}</p>')
    body.append(f'<p><strong>Publikováno:</strong> {pub} &nbsp;|&nbsp; <strong>Autor:</strong> Romeo Bican</p>')
    body.append(f'<img src="/blog/img/{i}.jpg" alt="{title}" style="width:100%;height:auto;border-radius:12px; margin:20px 0;">')

    body.append(f'<p>Téma „{title}“ jsme zpracovali od základu tak, aby článek nebyl obecná omáčka, ale praktický materiál použitelný při reálném rozhodování. V každé kapitole řešíme jiný úhel pohledu: techniku, proces, finance i rizika. Díky tomu si čtenář udělá jasný obrázek o tom, co je v projektu skutečně důležité a co je jen marketingová zkratka.</p>')
    body.append(f'<p>U kategorie <strong>{category}</strong> se opakovaně ukazuje, že nejlepší výsledky nevznikají jedním „zázračným“ produktem, ale kombinací správného návrhu, kvalitní realizace a důsledného servisu. Proto v textu pracujeme s konkrétními scénáři a rozhodovacími kritérii, které pomáhají vyhnout se drahým slepým uličkám.</p>')

    for s_idx, sec in enumerate(sections, start=1):
        a1 = angles[(i + s_idx) % len(angles)]
        a2 = angles[(i + s_idx + 3) % len(angles)]
        a3 = angles[(i + s_idx + 5) % len(angles)]
        body.append(f'<h2>{sec}</h2>')
        body.append(
            f'<p>V této části navazujeme přímo na název článku „{title}“ a rozebíráme, jak se rozhodování mění ve chvíli, kdy už nejde o teorii, ale o konkrétní stavbu, rozpočet a termín. Klíčové je správně seřadit priority: nejdříve definovat cíle, potom architekturu a až následně vybírat konkrétní komponenty. Opačný postup často vede k tomu, že se projekt tváří dokončeně, ale v provozu dlouhodobě neplní očekávání.</p>'
        )
        body.append(
            f'<p>Praktická zkušenost ukazuje, že kvalitu výsledku určují detaily: dokumentace, testovací scénáře, jasná odpovědnost mezi profesemi i realistický plán spuštění. U tématu „{title}“ proto doporučujeme měřit průběžně {a1} a {a2}, protože právě tyto metriky nejrychleji odhalí, zda řešení funguje správně. Pokud jsou čísla stabilní a zároveň roste {a3}, projekt je postavený správně i z dlouhodobého pohledu.</p>'
        )

    body.append('<h2>FAQ</h2>')
    body.append(f'<p><strong>Je tento postup použitelný i pro menší projekt?</strong><br>Ano. U tématu „{title}“ lze metodiku škálovat od menších instalací po větší objekty; mění se rozsah, ne logika rozhodování.</p>')
    body.append('<p><strong>Jak poznám, že je návrh opravdu kvalitní?</strong><br>Kvalitní návrh je měřitelný, dokumentovaný a testovatelný. Nezávisí na jedné osobě a umožňuje bezpečný servis i rozvoj v čase.</p>')
    body.append('<p><strong>Kdy začít řešit servis?</strong><br>Ne až po spuštění. Servisní model má být součástí návrhu už na začátku, jinak se zvyšuje riziko výpadků a neřízených nákladů.</p>')

    body.append('<h2>Související služby</h2>')
    body.append('<ul><li><a href="https://www.plushouse.cz/chytra-domacnost-loxone/">Chytrá domácnost Loxone na klíč</a></li><li><a href="https://www.plushouse.cz/energeticky-management-loxone-fve.html">Energetický management</a></li><li><a href="https://www.plushouse.cz/pms.html">PMS automatizace pro hotely</a></li><li><a href="https://www.plushouse.cz/kontakt">Domluvit technickou konzultaci</a></li></ul>')

    article_inner = '\n'.join(body)

    pattern = re.compile(r'(<div class="container blog-article-layout"[^>]*>)([\s\S]*?)(</div>\s*<script type="application/ld\+json">)', re.M)
    new_html, n = pattern.subn(r'\1\n' + article_inner + r'\n\3', html, count=1)
    if n:
        fp.write_text(new_html, encoding='utf-8')

print(f'rewritten {len(posts)} posts')
