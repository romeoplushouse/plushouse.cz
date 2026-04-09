#!/usr/bin/env python3
"""
Stáhne obrázky z Unsplash pro všechny blogové články.

Použití:
  1. Zaregistrujte se na https://unsplash.com/developers
  2. Vytvořte novou aplikaci (demo, zdarma - 50 req/hod)
  3. Zkopírujte "Access Key"
  4. Spusťte: python3 download_images.py VÁŠE_ACCESS_KEY

Obrázky se uloží do blog/img/ a index.json se automaticky aktualizuje.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(SCRIPT_DIR, "img")
INDEX_JSON = os.path.join(SCRIPT_DIR, "index.json")

# Mapování: slug článku → vyhledávací dotaz na Unsplash
ARTICLE_IMAGES = {
    # Automatizace budov - MaR systém, rozvaděč, BMS řídící panel
    "automatizace-budov-mar": "building management system BMS touchscreen panel commercial",
    # Chytrá domácnost + FVE - solární panely na střeše rodinného domu s tabletem
    "chytra-domacnost-a-fve-jedna-logika-rizeni": "solar panels roof modern house tablet control",
    # Chytrá domácnost Loxone - interiér s chytrým osvětlením a ovládáním
    "chytra-domacnost-loxone": "smart home interior touchscreen wall panel lighting",
    # Měření spotřeby - elektroměr, chytrý měřič, graf spotřeby na displeji
    "chytra-domacnost-mereni-spotreby-krok-za-krokem": "smart energy meter display electricity consumption graph",
    # Přístupy a zabezpečení - čtečka otisků, klávesnice, kamera u dveří
    "chytra-domacnost-pristupy-a-zabezpeceni": "smart door lock keypad fingerprint access entry",
    # Řízení osvětlení - stmívatelné LED světlo, scéna v obýváku
    "chytra-domacnost-rizeni-osvetleni-v-praxi": "dimmable LED ceiling light modern living room evening",
    # Stínění a přehřívání - venkovní žaluzie na okně, stín, slunce
    "chytra-domacnost-stineni-a-prehrivani-domu": "exterior window blinds shading sunlight modern facade",
    # Novostavba checklist - hrubá stavba, projekt, plány na stole
    "chytra-domacnost-v-novostavbe-checklist": "new house construction blueprint planning architecture",
    # Rekonstrukce postup - bourání, nová elektroinstalace ve zdi
    "chytra-domacnost-v-rekonstrukci-postup": "home renovation electrical wiring wall open cables",
    # Větrání a kvalita vzduchu - rekuperační jednotka, čidlo CO2
    "chytra-domacnost-vetrani-a-kvalita-vzduchu": "indoor air quality sensor ventilation unit modern",
    # Zóny a klima - termostat na zdi, zónové vytápění, pohodlí
    "chytra-domacnost-zony-a-klima": "wall thermostat digital temperature zone control room",
    # Zóny vytápění - podlahové topení s rozdělovačem, termostatická hlavice
    "chytra-domacnost-zony-vytapeni-bez-kompromisu": "floor heating manifold pipes thermostatic valve",
    # Členství +House - servisní technik, vzdálená správa, monitoring
    "clenstvi-house": "technician remote monitoring laptop maintenance service",
    # Elektroinstalace - otevřený rozvaděč, jističe, kabeláž
    "elektroinstalace": "electrical distribution board circuit breakers wiring panel open",
    # FVE záloha kritických okruhů - baterie, záložní zdroj, UPS
    "fotovoltaika-a-zaloha-kritickych-okruhu": "home battery backup storage system wall mounted",
    # FVE baterie kdy se vyplatí - lithiové baterie, úložiště, garáž
    "fotovoltaika-baterie-kdy-se-vyplati": "lithium battery storage residential garage solar",
    # FVE obecně - fotovoltaické panely na střeše rodinného domu
    "fotovoltaika-fve": "photovoltaic solar panels rooftop residential house blue sky",
    # FVE monitoring - graf výkonu, aplikace, dashboard
    "fotovoltaika-monitoring-a-vyhodnoceni-vykonu": "solar energy monitoring app dashboard graph production",
    # FVE revize a bezpečnost - technik na střeše kontroluje panely
    "fotovoltaika-revize-bezpecnost-a-normy": "solar panel inspection technician rooftop safety harness",
    # FVE řízení přebytků do TUV - bojler, ohřev vody, trubky
    "fotovoltaika-rizeni-prebytku-do-tuv": "water heater boiler tank domestic hot water system",
    # FVE spotové ceny - burza elektřiny, graf cen, obchodování
    "fotovoltaika-spotove-ceny-a-rizeni-odberu": "electricity spot price chart stock energy market screen",
    # FVE wallbox - nabíjecí stanice, elektromobil v garáži
    "fotovoltaika-wallbox-a-dynamicke-nabijeni": "electric vehicle charging wallbox garage home EV cable",
    # HVAC chlazení - klimatizace split jednotka, léto, chlazený interiér
    "hvac-chlazeni-v-lete-bez-plytvani": "split air conditioner unit wall mounted cooling interior",
    # HVAC rekuperace - rekuperační jednotka, potrubí, filtr
    "hvac-inteligentni-rizeni-rekuperace": "heat recovery ventilation unit HRV filter ductwork ceiling",
    # HVAC tepelné čerpadlo s FVE - venkovní jednotka TČ u domu
    "hvac-rizeni-tepelneho-cerpadla-s-fve": "heat pump outdoor unit garden residential modern house",
    # HVAC servis a diagnostika - servisní technik, nářadí, měření
    "hvac-servisni-rezimy-a-diagnostika": "HVAC technician multimeter diagnostic service maintenance",
    # HVAC vlhkost a kondenzace - orosené okno, vlhkost, kapky
    "hvac-vlhkost-a-kondenzace-co-hlidat": "window condensation moisture droplets indoor humidity glass",
    # Loxone energetický management - dashboard spotřeby na tabletu
    "loxone-a-energeticky-management-domu": "home energy dashboard tablet consumption solar graph",
    # Loxone Miniserver Gen2 - zelená deska, server, řídící jednotka
    "loxone-miniserver-gen2-co-prinasi": "smart home automation controller server green circuit board",
    # Regulace predikce počasí - meteogram, předpověď, oblačnost
    "regulace-jak-pracovat-s-predikci-pocasi": "weather forecast app screen cloud sun temperature",
    # Regulace hystereze - termostat nastavení, teplotní křivka
    "regulace-jak-spravne-nastavit-hysterezi": "digital thermostat display temperature setting adjustment",
    # Regulace PID v HVAC - průmyslový regulátor, displej, graf
    "regulace-pid-v-hvac-jednoduse": "industrial PID controller display process automation panel",
    # Regulace prioritizace spotřeb - pračka, myčka, spotřebiče, chytrá zásuvka
    "regulace-prioritizace-spotreb-v-domacnosti": "smart plug socket appliance washing machine energy",
    # Regulace zátěžové špičky - elektroměr, hlavní jistič, ampérmetr
    "regulace-zatezove-spicky-a-rizeni-vykonu": "electric meter main breaker panel amperage load",
    # Topení ekvitermní regulace - kotelna, kotel, potrubí, rodinný dům
    "topeni-ekvitermni-regulace-pro-rodinny-dum": "boiler room heating system pipes residential house",
    # Topení noční útlum - dům v noci, teplé okno, útulný interiér
    "topeni-optimalizace-nocniho-utlumu": "house night warm window glow cozy winter exterior",
    # Topení podlahovka - pokládka podlahového topení, trubky v betonu
    "topeni-podlahovka-a-inteligentni-rizeni": "underfloor heating pipes installation concrete floor laying",
    # Topení radiátory vs podlahovka - radiátor vedle podlahového topení
    "topeni-radiatory-vs-podlahovka-v-automatizaci": "radiator heating modern room white wall interior clean",
    # Kolik stojí chytrá domácnost - rozvaděč, kalkulačka, projekt
    "chytra-domacnost-kolik-stoji": "smart home project planning calculator cost estimate blueprint",
    # Novostavba vs rekonstrukce - nový dům vedle starého
    "chytra-domacnost-loxone-novostavba-vs-rekonstrukce": "new modern house old house comparison renovation contrast",
    # Energetický management FVE + Loxone - graf spotřeby, baterie, panely
    "energeticky-management-fve-loxone-co-umi": "solar energy management system battery inverter dashboard",
    # Hotel automatizace PMS - hotelový pokoj, karta, ovládání
    "hotel-automatizace-pms-previo-prinosy": "hotel room keycard smart thermostat bedside modern luxury",
    # Loxone vs bezdrátové systémy - kabely vs bezdrátový senzor
    "loxone-vs-bezdratove-systemy-co-dava-smysl": "network cable ethernet wiring structured cabling rack",
    # Nejčastější chyby elektroinstalace - špatné zapojení, chyba, varování
    "nejcastejsi-chyby-pri-chytre-elektroinstalaci": "electrician checking wiring junction box installation work",
}


def get_slug_from_url(url):
    """Extrahuje slug z URL článku."""
    path = url.rstrip("/").split("/")[-1]
    return path.replace(".html", "").replace("index", "").rstrip("/")


def search_unsplash(query, access_key):
    """Vyhledá obrázek na Unsplash."""
    encoded_query = urllib.parse.quote(query)
    api_url = (
        f"https://api.unsplash.com/search/photos"
        f"?query={encoded_query}&per_page=1&orientation=landscape"
    )
    req = urllib.request.Request(api_url)
    req.add_header("Authorization", f"Client-ID {access_key}")
    req.add_header("Accept-Version", "v1")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            results = data.get("results", [])
            if results:
                photo = results[0]
                return {
                    "download_url": photo["urls"]["regular"],
                    "photographer": photo["user"]["name"],
                    "unsplash_url": photo["links"]["html"],
                    "id": photo["id"],
                }
    except Exception as e:
        print(f"  Chyba při vyhledávání: {e}")
    return None


def download_image(url, filepath):
    """Stáhne obrázek z URL do souboru."""
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "PlusHouse-Blog-Image-Downloader/1.0")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(filepath, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"  Chyba při stahování: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Použití: python3 download_images.py <UNSPLASH_ACCESS_KEY>")
        print()
        print("Získejte klíč zdarma na: https://unsplash.com/developers")
        sys.exit(1)

    access_key = sys.argv[1]

    os.makedirs(IMG_DIR, exist_ok=True)

    # Načti index.json
    with open(INDEX_JSON, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    posts = index_data.get("posts", [])
    credits = []

    print(f"Zpracovávám {len(posts)} článků...\n")

    for i, post in enumerate(posts):
        url = post.get("url", "")
        slug = get_slug_from_url(url)
        title = post.get("title", "")

        query = ARTICLE_IMAGES.get(slug)
        if not query:
            print(f"[{i+1}/{len(posts)}] {title}")
            print(f"  Nemám vyhledávací dotaz pro slug: {slug}")
            print(f"  Přeskakuji.\n")
            continue

        filename = f"{slug}.jpg"
        filepath = os.path.join(IMG_DIR, filename)

        print(f"[{i+1}/{len(posts)}] {title}")
        print(f"  Hledám: {query}")

        if os.path.exists(filepath):
            print(f"  Již existuje: {filename}")
            post["cover_image"] = f"https://www.plushouse.cz/blog/img/{filename}"
            print()
            continue

        result = search_unsplash(query, access_key)
        if not result:
            print(f"  Nenalezen žádný obrázek.\n")
            continue

        print(f"  Fotograf: {result['photographer']}")
        print(f"  Stahuji...")

        if download_image(result["download_url"], filepath):
            post["cover_image"] = f"https://www.plushouse.cz/blog/img/{filename}"
            credits.append({
                "article": title,
                "photographer": result["photographer"],
                "unsplash_url": result["unsplash_url"],
            })
            print(f"  Uloženo: {filename}")
        else:
            print(f"  Stažení selhalo.")

        print()

        # Rate limiting: Unsplash demo = 50 req/hod
        time.sleep(1.5)

    # Ulož aktualizovaný index.json
    with open(INDEX_JSON, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    print(f"\nindex.json aktualizován.")

    # Ulož kredity fotografů
    if credits:
        credits_path = os.path.join(IMG_DIR, "CREDITS.md")
        with open(credits_path, "w", encoding="utf-8") as f:
            f.write("# Fotografie z Unsplash\n\n")
            f.write("Všechny fotografie jsou použity pod [Unsplash License](https://unsplash.com/license).\n\n")
            for c in credits:
                f.write(f"- **{c['article']}** — foto: [{c['photographer']}]({c['unsplash_url']})\n")
        print(f"Kredity uloženy do: {credits_path}")

    print(f"\nHotovo! Staženo {len(credits)} obrázků.")
    print("Nahrajte složku blog/img/ na server.")


if __name__ == "__main__":
    main()
