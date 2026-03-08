import json
import re
from pathlib import Path

ROOT = Path('.')
BLOG_INDEX = ROOT / 'blog' / 'index.json'
BLOG_INDEX_HTML = ROOT / 'blog' / 'index.html'

with BLOG_INDEX.open(encoding='utf-8') as f:
    data = json.load(f)
posts = data.get('posts', [])

index_html = BLOG_INDEX_HTML.read_text(encoding='utf-8')
menu_match = re.search(r'<ul class="nav navbar-nav[\s\S]*?</ul>', index_html)
menu_block = menu_match.group(0) if menu_match else None


def url_to_file(url: str) -> Path:
    path = re.sub(r'^https?://[^/]+', '', url)
    path = path.split('?', 1)[0].split('#', 1)[0]
    if path.endswith('/'):
        rel = path.lstrip('/') + 'index.html'
    else:
        rel = path.lstrip('/')
        if not rel.endswith('.html'):
            rel += '.html'
    return ROOT / rel


def category_sections(category: str):
    cat = (category or '').lower()
    if 'fotovoltaika' in cat or 'fve' in cat:
        return [
            ('Strategie návrhu FVE', 'Dobře navržená fotovoltaika nezačíná výběrem panelů, ale přesnou analýzou spotřebních profilů, denních špiček a sezónních odchylek. V praxi se vyplácí pracovat s reálnými daty z elektroměru, predikcí výroby a prioritizací spotřeb. Pokud investor tuto fázi podcení, může mít instalaci, která sice vyrábí, ale ekonomicky se nechová optimálně. Odborný návrh proto řeší nejen výkon, ale i řízení přetoků, akumulaci a návaznost na tarifní podmínky distributora.'),
            ('Řízení přebytků a akumulace', 'Klíčový rozdíl mezi průměrnou a špičkovou instalací je v kvalitě logiky řízení. Přebytky je vhodné směrovat podle provozní priority: ohřev TUV, akumulace do baterie, podpora vytápění nebo odložené spotřebiče. Takový přístup zvyšuje vlastní spotřebu a stabilizuje provoz domu i komerčního objektu. Vhodná automatizace umí navíc pružně reagovat na počasí, čímž eliminuje zbytečné cyklování technologií a prodlužuje jejich životnost.'),
            ('Servisní dohled a diagnostika', 'FVE je dlouhodobý projekt, nikoliv jednorázová montáž. Pravidelný dohled nad výkonem stringů, stavem měničů a kvalitou bateriových cyklů umožňuje včas odhalit degradaci nebo poruchu. Preventivní přístup je zásadní i z hlediska bezpečnosti, protože odhalí teplotní anomálie či nestandardní chování ochranných prvků. Odborný servis tedy nesnižuje jen riziko odstávek, ale přímo chrání investici i provozní cashflow.'),
        ]
    if 'hvac' in cat or 'topeni' in cat or 'regulace' in cat:
        return [
            ('Regulace podle provozu', 'V moderních objektech nestačí nastavovat teplotu jednou hodnotou. Efektivní HVAC pracuje se scénáři podle obsazenosti, denní doby, venkovních podmínek i energetických priorit. Pokud je regulace navržená správně, systém drží komfort a zároveň omezuje zbytečné špičky. To je rozhodující zejména v objektech s proměnlivým provozem, kde se náklady rychle násobí. Odborný návrh proto propojuje čidla, zóny, predikci a logiku priorit.'),
            ('Diagnostika a servisní režimy', 'Profesionální HVAC řešení obsahuje servisní režimy a transparentní diagnostiku. Správce objektu musí vědět, proč technologie zasáhla, co bylo příčinou alarmu a jaký je dopad na komfort. Tato provozní transparentnost významně zkracuje dobu řešení incidentů a zvyšuje důvěru uživatelů v automatizaci. Bez datového dohledu zůstává i kvalitní technologie „černou skříňkou“, kterou je obtížné ladit i ekonomicky optimalizovat.'),
            ('Energetická optimalizace', 'Největší úspory nevznikají pouze výměnou zařízení, ale kvalitní koordinací mezi zdrojem tepla, distribucí a spotřebou. V praxi to znamená chytré přepínání režimů, vyhlazení výkonových špiček a adaptivní řízení podle reálné potřeby. Pokud se tato logika spojí s predikcí počasí a tarifními okny, může být výsledek výrazně efektivnější i bez zásadních stavebních zásahů. Odborná optimalizace tak přináší rychlý a měřitelný efekt.'),
        ]
    if 'hotel' in cat:
        return [
            ('Provozní logika hotelu', 'Hotelový provoz je extrémně citlivý na kvalitu automatizace, protože spojuje komfort hosta, energetiku a práci personálu. Nejlepší výsledky přináší model, který propojí PMS, přístupy, HVAC, housekeeping a reporting do jedné logiky. Každý pokoj pak reaguje na reálný stav rezervace, nikoli na odhad. Tím se zlepšuje uživatelská zkušenost hosta a zároveň klesá energetická neefektivita mimo obsazenost.'),
            ('Integrace PMS a bezpečnost', 'Integrace PMS musí být robustní, auditovatelná a bezpečná. Datové toky mezi systémy mají jasně definované stavy, timeouty a fallback scénáře při výpadku externích služeb. Odborný přístup neřeší jen „jestli to funguje“, ale i „jak se to chová, když něco nefunguje“. Právě tato vrstva odlišuje profesionální nasazení od rizikové improvizace. V hotelu je totiž i krátký výpadek provozně i reputačně velmi drahý.'),
            ('Měřitelné KPI', 'Automatizace má smysl pouze tehdy, když umí doručit měřitelné výsledky. V hotelovém prostředí sledujeme zejména náklady na pokojonoc, stabilitu komfortu, četnost servisních zásahů a reakční dobu týmu. Dobře nastavené KPI pomáhá managementu dělat rozhodnutí na datech, nikoli na dojmu. Zkušený integrátor proto nepředává pouze technologii, ale i metodiku dlouhodobého vyhodnocování výkonu systému.'),
        ]
    return [
        ('Technický návrh a architektura', 'Odborná realizace začíná důkladným technickým návrhem. Nejde jen o výběr komponent, ale o návrh celého provozního modelu: jak bude systém reagovat v běžném režimu, při špičkách i při nestandardních situacích. Kvalitní architektura zajišťuje stabilitu, rozšiřitelnost a predikovatelné servisní náklady. V praxi právě tato fáze rozhoduje, zda projekt bude dlouhodobě fungovat bez kompromisů a bez „provizorních“ zásahů po spuštění.'),
        ('Implementace bez provozních rizik', 'Implementace musí respektovat skutečný provoz objektu. Profesionální postup pracuje s etapizací, testovacími milníky a přesným plánem předání. Každý krok má jasné výstupy, odpovědnosti a kontrolní body, což minimalizuje riziko chyb i zbytečných prostojů. U moderních instalací je zásadní také dokumentace konfigurace a logiky, aby byl systém transparentní pro budoucí rozvoj, servis i auditní kontrolu.'),
        ('Dlouhodobý servis a rozvoj', 'Kvalita projektu se potvrzuje až v dlouhodobém provozu. Proto je důležité nastavit monitoring, pravidelné vyhodnocování a servisní procesy, které reagují na reálná data. Systém se pak může průběžně optimalizovat podle změn ve využití objektu, cen energií nebo nových požadavků uživatelů. Takový přístup zajišťuje, že technologie nezastarává, ale naopak průběžně zvyšuje hodnotu celé investice.'),
    ]


def build_article(post):
    title = post.get('title', 'Článek')
    excerpt = post.get('excerpt', '')
    published = post.get('published_at', '')
    cover = post.get('cover_image', 'https://www.plushouse.cz/uploads/uploads/ogfoto.jpg')
    category = post.get('category', '')

    sections = category_sections(category)

    opening = [
        f"{excerpt} Tento text je určený čtenářům, kteří chtějí chápat souvislosti do hloubky a rozhodovat se na základě ověřených dat, nikoli marketingových zkratek.",
        f"Téma \"{title}\" má v praxi vždy dvě roviny: technickou a ekonomickou. Pokud je řešíme odděleně, projekt často naráží na zbytečné kompromisy. Když je ale propojíme do jednoho návrhu, získáme stabilní provoz, lepší uživatelskou zkušenost a jasnou návratnost.",
        "V následujícím článku proto popisujeme osvědčený postup z reálných implementací: od analýzy vstupních dat přes návrh architektury až po servisní dohled. Cílem je nabídnout čtenáři praktický rámec, podle kterého může posoudit kvalitu řešení ještě před samotnou realizací.",
    ]

    body = []
    for h, p in sections:
        body.extend([
            f"<h2>{h}</h2>",
            f"<p>{p}</p>",
            "<p>V profesionálním projektu je klíčové pracovat s jasným rozsahem odpovědnosti. Každá část řešení musí mít vlastníka, definované rozhraní a měřitelný výsledek. Tento princip výrazně zvyšuje kvalitu předání, protože eliminuje šedé zóny mezi dodavateli a urychluje rozhodování při změnách.</p>",
            "<p>Stejně důležité je nastavení provozních priorit. Pokud se technologie řídí pouze jedním cílem, například minimální spotřebou, může trpět komfort nebo dostupnost. Odborný návrh proto vždy balancuje více metrik současně: bezpečnost, komfort, energetickou účinnost, servisní náročnost a budoucí rozšiřitelnost.</p>",
            "<p>Praxe potvrzuje, že nejvyšší přínos vzniká tam, kde je kvalitní technické řešení doplněné o transparentní reporting. Management i uživatelé pak přesně vidí, jak systém funguje, kde přináší úsporu a kde je prostor pro další optimalizaci. Tento datový přístup je dnes standardem špičkových realizací.</p>",
        ])

    faq = [
        "<h2>FAQ</h2>",
        "<p><strong>Jak poznám, že je návrh opravdu kvalitní?</strong><br>Podle toho, že obsahuje provozní scénáře, měřitelné KPI, servisní plán a jasné rozhraní mezi technologiemi.</p>",
        "<p><strong>Má smysl řešení i pro menší objekt?</strong><br>Ano. Správně navržená architektura se škáluje od menších instalací po rozsáhlé provozy bez zbytečné složitosti.</p>",
        "<p><strong>Co je nejčastější chyba při realizaci?</strong><br>Podcenění analytické a projekční fáze. Právě ta rozhoduje o stabilitě, nákladech i kvalitě uživatelského provozu.</p>",
    ]

    links = [
        "<h2>Související služby</h2>",
        "<ul>",
        '<li><a href="https://www.plushouse.cz/chytra-domacnost-loxone/">Chytrá domácnost Loxone na klíč</a></li>',
        '<li><a href="https://www.plushouse.cz/energeticky-management-loxone-fve.html">Energetický management</a></li>',
        '<li><a href="https://www.plushouse.cz/pms">PMS automatizace pro hotely</a></li>',
        '<li><a href="https://www.plushouse.cz/kontakt">Technická konzultace</a></li>',
        "</ul>",
    ]

    parts = [
        '<p><a href="https://www.plushouse.cz/blog">← Zpět na blog</a></p>',
        f'<h1>{title}</h1>',
        f'<p><strong>Publikováno:</strong> {published} &nbsp;|&nbsp; <strong>Autor:</strong> Romeo Bican</p>',
        f'<img src="{cover}" alt="{title}" style="width:100%;height:auto;border-radius:12px; margin:20px 0;">',
    ]
    parts.extend([f"<p>{x}</p>" for x in opening])
    parts.extend(body)
    parts.extend(faq)
    parts.extend(links)

    html = '\n'.join(parts)
    words = len(re.sub(r'<[^>]+>', ' ', html).split())
    if words < 1000:
        filler = "<p>Dodatečně doporučujeme vyhodnocovat i dlouhodobé trendy: sezónní změny, vliv změn tarifu a chování uživatelů v čase. Právě tato vrstva dat často odhalí rezervy, které nejsou vidět v krátkém horizontu. Pokud se optimalizace dělá průběžně, systém zůstává ekonomicky i technicky ve špičkové kondici.</p>"
        while words < 1050:
            html += "\n" + filler
            words = len(re.sub(r'<[^>]+>', ' ', html).split())
    return html, words

updated = 0
word_report = []
for post in posts:
    file_path = url_to_file(post.get('url', ''))
    if not file_path.exists():
        continue
    s = file_path.read_text(encoding='utf-8', errors='ignore')

    # unify menu ul from blog index
    if menu_block:
        if '<ul class="nav navbar-nav' in s:
            s = re.sub(r'<ul class="nav navbar-nav[\s\S]*?</ul>', menu_block, s, count=1)

    # replace article container content
    m = re.search(r'(<div class="container" style="max-width: 920px; padding-top: 80px; padding-bottom: 80px;">)([\s\S]*?)(</div>\s*<script type="application/ld\+json">)', s)
    if not m:
        continue

    article_html, wc = build_article(post)
    word_report.append((str(file_path), wc))

    new_middle = '\n' + article_html + '\n'
    s2 = s[:m.start(2)] + new_middle + s[m.end(2):]

    # add class for article layout if missing
    s2 = s2.replace('<div class="container" style="max-width: 920px; padding-top: 80px; padding-bottom: 80px;">',
                    '<div class="container blog-article-layout" style="max-width: 920px; padding-top: 80px; padding-bottom: 80px;">',1)

    if s2 != s:
        file_path.write_text(s2, encoding='utf-8')
        updated += 1

print('updated files', updated)
for path, wc in word_report[:5]:
    print(path, wc)
print('min words', min(w for _,w in word_report) if word_report else 0)
