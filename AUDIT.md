# Audit webu plushouse.cz

Datum auditu: 3. 5. 2026
Větev: `claude/review-website-audit-yHEN0`

Tento dokument shrnuje všechny nalezené problémy v repozitáři webu plushouse.cz.
Problémy jsou rozdělené podle závažnosti.

---

## 🔴 KRITICKÉ – BEZPEČNOST (řešit okamžitě!)

### 1. `info.php` veřejně vystavuje `phpinfo()`
**Soubor:** `info.php`
```php
<?php
  phpinfo();
?>
```
Tento soubor je veřejně dostupný na `https://www.plushouse.cz/info.php`
a vystavuje kompletní konfiguraci PHP, verze knihoven, environment proměnné
a cesty na serveru. Útočníci to využívají k vyhledání známých zranitelností.

**Akce:** Smazat soubor `info.php`.

---

### 2. `config.php` obsahuje hesla a API klíče v plain textu v gitu
**Soubor:** `config.php`
```php
$to_Email       = "tonda@plushouse.cz";
define('SMTP_HOST', 'wes1-smtp.wedos.net');
define('SMTP_USER', 'tonda@plushouse.cz');
define('SMTP_PASS', '1@m.Th23K`c4Em');
define('MC_APIKEY', '80c0cb054518dea608366800029674c4-us11');
```
**Akce:** 
- Přidat `config.php` do `.gitignore`
- Změnit SMTP heslo (`1@m.Th23K\`c4Em`) – bylo committnuto do gitu, považujte za kompromitované
- Otočit MailChimp API klíč
- Hesla přesunout do environment variables nebo `config.local.php` mimo git

---

### 3. `config.php` má rozbitou syntaxi (typografické uvozovky)
**Soubor:** `config.php`, řádek 3
```php
$mail_type = ?smtp?;   // znaky \223 a \224 = "smart quotes" z Wordu
```
Měly by být běžné ASCII uvozovky:
```php
$mail_type = 'smtp';
```
Důsledek: PHP od dubna 2024 zaznamenává Warning při každém odeslání formuláře. 
Logy v `php-error.log` to dokumentují (poslední záznam: 16. 12. 2025).

**Akce:** Přepsat řádek na `$mail_type = 'smtp';`.

---

### 4. `php-error.log` zveřejňuje cesty k souborům na serveru
**Soubor:** `php-error.log` (69 KB)
Obsahuje desítky záznamů s cestou `/data/web/virtuals/284558/virtual/www/pix_mail/...`
což útočníkům odhaluje strukturu a webhostingovou platformu (Wedos).

**Akce:** Smazat soubor a přidat `*.log` do `.gitignore`.

---

### 5. Chybějící `.gitignore`
V projektu není žádný `.gitignore`, proto se commitují i citlivé soubory
(`config.php`, `php-error.log`, `cenik.xlsx`).

**Akce:** Vytvořit `.gitignore` s minimálním obsahem:
```
config.php
*.log
*.xlsx
.DS_Store
```

---

## 🔴 KRITICKÉ – KONTAKTNÍ ÚDAJE (uniká byznys!)

### 6. Telefonní číslo má 3 různé varianty napříč webem
| Místo | Zobrazený text | href |
|---|---|---|
| Hlavička (button) | `+420 784 38 48 58` | `tel:+420783384858` (= +420 783 38 48 58) |
| Sekce kontakt | `+420 734 38 48 58` | `tel:+420 734 38 48 58` |
| Patička (footer) | `+420 734 38 48 58` | text |

**Tři různá čísla!** V hlavičce je text `784` ale link `783`, jinde je `734`.
Klient klikající na tlačítko v hlavičce vytočí jiné číslo, než vidí na stránce.

**Soubory:** `kontakt.html:220-221`, `fototermika.html:220-221`, `kontakt_fv.html:203-204`,
`kontakt_ts.html:221-222`, `ohrev_vody_senior.html:115-116`, `zasady_ochrany_os_udaju.html:152-153`

**Akce:** Sjednotit na jedno správné číslo (pravděpodobně `+420 734 38 48 58`)
a opravit jak text, tak `tel:` link.

---

### 7. E-mail v patičce je `info@plushouse.com` místo `info@plushouse.cz`
Doména `.com` neexistuje – e-maily na ni odeslané se nedoručí.

**Soubory s touto chybou (8×):**
- `index.html:2440`
- `kontakt.html:435`
- `kontakt_fv.html:429`
- `kontakt_ts.html:403`
- `fotovoltaika.html:744`
- `fototermika.html:741`
- `trafostanice.html:465`
- `ohrev_vody_senior.html:260`
- `zasady_ochrany_os_udaju.html:364`

V kontaktní sekci výše na stránkách je e-mail správně (`info@plushouse.cz`).

**Akce:** Najít a nahradit `info@plushouse.com` → `info@plushouse.cz`.

---

### 8. Recipient e-mail v `config.php` je `tonda@plushouse.cz`
Formuláře z webu posílají na `tonda@plushouse.cz`, ne na `info@plushouse.cz`.
Pokud je to záměr, je třeba se ujistit, že schránka funguje a je čtená.
Pokud ne, opravit.

---

## 🔴 KRITICKÉ – ROZBITÁ NAVIGACE A OBSAH

### 9. `fototermika.html` má všechny menu odkazy `href="X"`
**Soubor:** `fototermika.html`, řádky 230, 234, 236, 238, 240, 242, 244

```html
<li><a href="X" ...>DOMŮ</a>
<li><a href="X" ...>FOTOVOLTAIKA</a>
<li><a href="X" ...>TRAFOSTANICE</a>
...
```
Žádný odkaz v hlavním menu na fototermika.html nefunguje.

**Akce:** Doplnit správné URL (`https://www.plushouse.cz/`, `/fotovoltaika`, atd.)

---

### 10. `fototermika.html` obsah je o fotovoltaice, ne o fototermice
Stránka mluví v sekci o produktech a referenci o fotovoltaice:
- Řádek 442: *„Tohle jsou borci co fotovoltaiku co u nás fotovoltaiku montují.“* (dvojitý překlep + špatné téma)
- Řádek 457: *„Fotovoltaika pro Rodinné domy“* – nadpis na stránce o fototermice
- Řádky 469–504: produktové karty pro Solax/fotovoltaika, ne pro fototermiku

**Title, description, keywords** jsou kopie z `fotovoltaika.html`:
```html
<title>Nechte Slunce Pracovat Pro Vás: Naše Solární Elektrárny Mění Pravidla Hry</title>
<meta name="description" content="PlusHouse je váš spolehlivý partner pro stavbu moderních fotovoltaických zařízení..."">
<meta name="keywords" content="fotovoltaika, solární energie, fotovoltaická zařízení...">
```

**Akce:** Buď stránku kompletně přepsat na téma fototermiky, nebo `fototermika.html` smazat
a v menu odkazovat jinam.

---

### 11. Odkazy `Kontakt FV.html` (s mezerou v URL)
**Soubor:** `fototermika.html`, řádky 387, 405, 424, 471, 486, 498

```html
<a href="Kontakt FV.html" ...>
```
Tlačítka odkazují na URL s mezerou, která neodpovídá žádnému souboru. 
Správná stránka je `kontakt_fv.html`.

**Akce:** Nahradit `Kontakt FV.html` → `kontakt_fv` (resp. `https://www.plushouse.cz/kontakt_fv`).

---

### 12. Hlavní menu na všech stránkách: REKUPERACE / FOTOTERMIKA / TEPELNÁ ČERPADLA / NABÍJECÍ STANICE vede všechno na `/kontakt`
Z hlavní stránky tak nelze dostat na produktové podstránky. Přitom **`fototermika.html`
existuje** jako samostatná stránka, ale není nikam přilinkovaná.

```html
<a href=".../kontakt" ...>FOTOTERMIKA</a>     <!-- mělo by být /fototermika -->
<a href=".../kontakt" ...>REKUPERACE</a>
<a href=".../kontakt" ...>TEPELNÁ ČERPADLA</a>
<a href=".../kontakt" ...>NABÍJECÍ STANICE</a>
```

**Soubory:** `index.html:142-151` a obdobně v `fotovoltaika.html`, `trafostanice.html`,
`kontakt.html`, `kontakt_fv.html`, `kontakt_ts.html`, `zasady_ochrany_os_udaju.html`,
`ohrev_vody_senior.html`.

**Akce:** Buď vytvořit chybějící stránky (rekuperace, tepelná čerpadla, nabíječky)
a propojit je, nebo přiznat, že existuje pouze fototermika a alespoň ji nalinkovat.

---

## 🟠 STŘEDNĚ ZÁVAŽNÉ – CHYBNÉ ÚDAJE A CENY

### 13. Cena „od 1 Kč“ v sekci OHŘEV VODY na hlavní stránce
**Soubor:** `index.html`, řádek 783
```html
<span style="font-weight: 700;">od 1Kč
</span>
<div><span style="font-weight: 700;">S dotací NZU LIGHT</span></div>
```
Kontext: ECO – Ohřev vody – úspora od 9 000 Kč/rok – „od 1Kč“

Podle `ohrev_vody_senior.html` (`<title>Ohřev vody pro seniory už od 7 000Kč
s dotací 90 000Kč</title>`) má být cena `od 7 000 Kč` po dotaci 90 000 Kč.

**Akce:** Opravit na `od 7 000 Kč` (nebo aktuálně platnou částku).

---

### 14. Copyright © 2023 ve všech patičkách
**Soubory:** všechny HTML stránky, footer
```
PlusHouse Copyright © 2023
```
Aktuální rok je **2026**.

**Akce:** Aktualizovat na `2026` (nebo udělat dynamicky `© 2017-2026`).

---

### 15. Jednotky výkonu psané velkými písmeny
SI jednotka kilowatt je `kW`, kilowatthodina `kWh`, megawatt `MW`. 
Velké K a MW se na webu objevují špatně:

| Soubor | Řádek | Špatně | Správně |
|---|---|---|---|
| `fototermika.html` | 382 | `3-40KWp` | `3-40 kWp` |
| `fototermika.html` | 385 | `5,8-46,4KWh` | `5,8–46,4 kWh` |
| `fototermika.html` | 400 | `10-40KWp` | `10-40 kWp` |
| `fototermika.html` | 403 | `11,6-46,4KWh` | `11,6–46,4 kWh` |
| `fototermika.html` | 419 | `Až 10MWp` | `Až 10 MWp` |
| `fototermika.html` | 422 | `0-10MWh` | `0–10 MWh` |
| `fotovoltaika.html` | 387 | `5,8-46,4KWh` | `5,8–46,4 kWh` |
| `fotovoltaika.html` | 405 | `11,6-46,4KWh` | `11,6–46,4 kWh` |

(Ostatní místa používají správně `kWp`, `kWh`, `kW`.)

---

### 16. Mezera mezi cenou a měnou chybí
Web uvádí ceny ve formátu `1 000 000Kč`, `239 000Kč`, `9 000Kč/rok` apod.
Podle českých typografických pravidel patří mezi číslo a `Kč` mezera (nezlomitelná):
`1 000 000 Kč`, `239 000 Kč`, `9 000 Kč/rok`.

Týká se desítek míst v `index.html`, `fotovoltaika.html`, `fototermika.html`,
`ohrev_vody_senior.html`.

---

### 17. „získali předem 90000Kč“ – chybí mezera
**Soubor:** `ohrev_vody_senior.html`, řádek 156
> *získali předem 90000Kč na financování projektu*

Mělo by být `90 000 Kč`.

---

## 🟠 STŘEDNĚ ZÁVAŽNÉ – SEO A META TAGY

### 18. Překlep `uft-8` místo `utf-8` v charsetu
Téměř všechny HTML stránky (8 z 10) mají v hlavičce:
```html
<meta charset="uft-8" />
```

**Soubory:** `index.html` (musíš zkontrolovat – nemá meta charset přímo),
`kontakt.html:4`, `snizte-spotrebu.html:4`, `fotovoltaika.html:4`, `kontakt_fv.html:4`,
`fototermika.html:4`, `kontakt_ts.html:4`, `trafostanice.html:4`.

Naštěstí druhý meta tag níže má charset správně, takže prohlížeče zatím funguje,
ale je to nepořádek.

**Akce:** Hromadně nahradit `uft-8` → `utf-8`.

---

### 19. Duplicitní title a description napříč stránkami
| Stránka | Title | Problém |
|---|---|---|
| `fotovoltaika.html` | „Nechte Slunce Pracovat Pro Vás...“ | OK |
| `kontakt_fv.html` | „Nechte Slunce Pracovat Pro Vás...“ | **Stejný jako fotovoltaika** |
| `fototermika.html` | „Nechte Slunce Pracovat Pro Vás...“ | **Špatný – mluví o fotovoltaice!** |
| `trafostanice.html` | „PLUSHOUSE: Společnost pro Moderní Transformační Stanice...“ | OK |
| `kontakt_ts.html` | „PLUSHOUSE: Společnost pro Moderní Transformační Stanice...“ | **Stejný jako trafostanice** |
| `zasady_ochrany_os_udaju.html` | `Index` | **Title „Index“ a prázdné description/keywords** |
| `snizte-spotrebu.html` | `NÁKLADY DOLŮ` | Není moc profesionální |
| `kontakt.html` | „KONTAKT \| PLUS HOUSE“ | OK |

**Akce:** Každá stránka by měla mít unikátní title a description odpovídající obsahu.

---

### 20. Extra uvozovka v meta description
**Soubory:** `fotovoltaika.html:8`, `fototermika.html:8`, `kontakt_fv.html:8`
```html
<meta name="description" content="...obnovitelná energie."">
                                                          ↑ extra " navíc
```

---

### 21. Sitemap.xml je neúplný
**Soubor:** `sitemap.xml` obsahuje:
- `/`
- `/kontakt`
- `/fotovoltaika`
- `/trafostanice`
- `/kontakt_fv`

**Chybí:**
- `/fototermika`
- `/kontakt_ts`
- `/ohrev_vody_senior` (nebo to bude smazáno?)
- `/snizte-spotrebu` (nebo to bude smazáno?)
- `/zasady_ochrany_os_udaju`

`lastmod` je `2023-08-18` ve všech položkách – zastaralé.

Navíc existují tři různé sitemapy: `sitemap.xml`, `sitemap1.xml`, `sitemap2.xml`
se stejným obsahem. Slouží jenom jeden.

---

## 🟠 STŘEDNĚ ZÁVAŽNÉ – FORMULÁŘE

### 22. Anglické placeholdery a tlačítko ve formuláři „Nechte nám vzkaz“
Modal formulář na všech stránkách:
```html
<input ... placeholder="Enter Your Full Name">
<input ... placeholder="Enter Your Email Address" required="">
<textarea ... placeholder="Enter Your Message Here..."></textarea>
<button ...><strong>Send Information</strong></button>
```

Pro český web by mělo být `Vaše celé jméno`, `Vaše emailová adresa`, 
`Váš vzkaz`, tlačítko `ODESLAT`.

**Soubory:** `index.html:2570-2578`, `kontakt.html:520-528`, 
`fototermika.html:826-834`, `fotovoltaika.html:829-837`, 
`kontakt_fv.html:514-522`, `kontakt_ts.html:488-496`, 
`trafostanice.html:550-558`.

---

### 23. Statický placeholder „Text“ v patičce popupu
**Soubory:** `index.html:2634`, `kontakt.html:574`, `fototermika.html:880`, 
`fotovoltaika.html:883`, `kontakt_fv.html:568`
```html
<p class="pix-gray"><span class="pix_edit_text">Text</span></p>
```
Pravděpodobně neodstraněný placeholder z editoru. Buď doplnit obsah, nebo smazat.

---

### 24. DIČ v hlavičce contact section nemá hodnotu
**Soubor:** `index.html:2505`
```html
<span style="color: rgb(255, 255, 255);">DIČ:
```
DIČ je uvedeno bez hodnoty, ačkoli v patičce je správně `CZ09648852`.

---

## 🟡 KOSMETICKÉ A POPISNÉ

### 25. Cesty `uploads/uploads/` (dvojitý uploads)
Všechny stránky mají cesty k favicon a OG obrázku ve formátu:
```html
<meta property="og:image" content="https://www.plushouse.cz/uploads/uploads/ogfoto.jpg">
<link rel="icon" ... href="uploads/uploads/ico/favicon-32x32.png">
```
Pokud složka skutečně je `/uploads/uploads/` na serveru, je to OK, ale 
naznačuje to, že se obsah složky `uploads` přesouval z jiné struktury 
a nikdo to nepřepsal.

---

### 26. Citace bez uzavřené uvozovky
**Soubor:** `ohrev_vody_senior.html:153`
> *Když se jednoho dne dozvěděli o možnosti získat dotaci na instalaci 
> fotovoltaického ohřevu vody.*

Věta končí bez slovesa nebo dokončení (chybí asi „...rozhodli se to vyzkoušet.“).

---

### 27. Stylistické a pravopisné drobnosti
**`fotovoltaika.html:444`:** *„Tohle jsou borci co fotovoltaiku u nás montují.“* 
– „borci“ je hovorové, na firemní stránce vyznívá nejistě. Zvážit 
formálnější formulaci („Naši montéři“).

**`fotovoltaika.html:442`** (a `fototermika.html:442`): 
*„Tohle jsou borci co fotovoltaiku co u nás fotovoltaiku montují“* – 
**dvojité „fotovoltaiku“** v jedné větě v `fototermika.html` (chyba kopírování).

---

### 28. `cenik.xlsx` v repozitáři
Excel soubor s ceníkem (10 KB) je commitnutý v repu a pravděpodobně 
veřejně přístupný na URL `https://www.plushouse.cz/cenik.xlsx`. 
Pokud má být obchodním tajemstvím, je to únik.

---

### 29. CSS soubory rozbité v `snizte-spotrebu.html`
**Soubor:** `snizte-spotrebu.html`
Stránka odkazuje na CSS/JS v podsložkách, které neexistují:
```html
<link rel="stylesheet" type="text/css" href="css/bootstrap.css" />
<link rel="stylesheet" type="text/css" href="css/font-awesome.min.css" />
<script src="js/jquery-1.11.2.js"></script>
```
Reálné soubory jsou v rootu (`bootstrap.css`, ne `css/bootstrap.css`).
Stránka tak pravděpodobně nemá CSS ani JS – vypadá nestylovaně.

---

### 30. Tři identické sitemapy
`sitemap.xml`, `sitemap1.xml`, `sitemap2.xml` mají stejný obsah. Stačí jedna.

---

### 31. Zastaralé soubory v repu
- `font-style old.css` (51 KB) – pojmenování naznačuje že je nepoužívaný
- `bootstrap_960.css` (145 KB) – duplikát Bootstrapu
- `php-error.log` – viz výše
- Tyto soubory zbytečně zabírají místo a komplikují údržbu

---

## 📋 SHRNUTÍ – CO ŘEŠIT NEJDŘÍV

### Den 1 (kritické, ohrožení byznysu/bezpečnosti)
1. Smazat `info.php`
2. Změnit SMTP heslo a otočit MailChimp API klíč 
3. Opravit telefonní čísla – sjednotit na 1 správné (nejspíš `+420 734 38 48 58`)
4. Opravit `info@plushouse.com` → `info@plushouse.cz` ve všech patičkách
5. Vytvořit `.gitignore` a odstranit `config.php`, `php-error.log`, `cenik.xlsx` z gitu
6. Opravit cenu „od 1 Kč“ na hlavní stránce

### Týden 1 (rozbitá funkce)
7. Opravit menu v `fototermika.html` (`href="X"` → správné URL)
8. Opravit odkazy `Kontakt FV.html` → `kontakt_fv` ve `fototermika.html`
9. Opravit obsah `fototermika.html` aby byl o fototermice (nebo stránku smazat)
10. Opravit menu na všech stránkách aby vedlo na produktové stránky
11. Opravit `config.php` syntaxe (`?smtp?` → `'smtp'`)

### Týden 2 (SEO, UX, čistota)
12. Aktualizovat copyright na 2026
13. Sjednotit jednotky `KW` → `kW`, mezery v cenách
14. Přeložit anglické placeholdery formuláře
15. Unikátní title a meta description pro každou stránku
16. Opravit `uft-8` → `utf-8`
17. Aktualizovat sitemap.xml, smazat duplicity
18. Smazat zastaralé CSS soubory
