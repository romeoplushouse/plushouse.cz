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
    "automatizace-budov-mar": "building automation control panel smart system",
    "chytra-domacnost-a-fve-jedna-logika-rizeni": "smart home solar panels integration",
    "chytra-domacnost-loxone": "smart home living room modern automation",
    "chytra-domacnost-mereni-spotreby-krok-za-krokem": "energy monitoring smart meter electricity",
    "chytra-domacnost-pristupy-a-zabezpeceni": "home security smart lock access control",
    "chytra-domacnost-rizeni-osvetleni-v-praxi": "smart lighting living room LED ambiance",
    "chytra-domacnost-stineni-a-prehrivani-domu": "window blinds shading sun protection house",
    "chytra-domacnost-v-novostavbe-checklist": "modern new house construction building",
    "chytra-domacnost-v-rekonstrukci-postup": "house renovation reconstruction remodel",
    "chytra-domacnost-vetrani-a-kvalita-vzduchu": "ventilation air quality indoor fresh air system",
    "chytra-domacnost-zony-a-klima": "smart thermostat climate zones comfort home",
    "chytra-domacnost-zony-vytapeni-bez-kompromisu": "underfloor heating thermostat zones warm",
    "clenstvi-house": "home maintenance service technician support",
    "elektroinstalace": "electrical panel wiring installation switchboard",
    "fotovoltaika-a-zaloha-kritickych-okruhu": "solar battery backup power supply home",
    "fotovoltaika-baterie-kdy-se-vyplati": "home battery storage energy solar wall",
    "fotovoltaika-fve": "solar panels roof house photovoltaic installation",
    "fotovoltaika-monitoring-a-vyhodnoceni-vykonu": "solar panel monitoring dashboard performance",
    "fotovoltaika-revize-bezpecnost-a-normy": "solar panel inspection safety technician roof",
    "fotovoltaika-rizeni-prebytku-do-tuv": "hot water tank solar energy heating boiler",
    "fotovoltaika-spotove-ceny-a-rizeni-odberu": "electricity price market energy trading graph",
    "fotovoltaika-wallbox-a-dynamicke-nabijeni": "electric car charging station wallbox EV home",
    "hvac-chlazeni-v-lete-bez-plytvani": "air conditioning cooling summer modern house",
    "hvac-inteligentni-rizeni-rekuperace": "heat recovery ventilation system HRV ductwork",
    "hvac-rizeni-tepelneho-cerpadla-s-fve": "heat pump outdoor unit residential house",
    "hvac-servisni-rezimy-a-diagnostika": "HVAC technician service maintenance diagnostic",
    "hvac-vlhkost-a-kondenzace-co-hlidat": "humidity condensation window moisture indoor",
    "loxone-a-energeticky-management-domu": "energy management dashboard home smart display",
    "loxone-miniserver-gen2-co-prinasi": "smart home server hub controller technology",
    "regulace-jak-pracovat-s-predikci-pocasi": "weather forecast sky clouds prediction sun",
    "regulace-jak-spravne-nastavit-hysterezi": "temperature control digital thermostat setting",
    "regulace-pid-v-hvac-jednoduse": "HVAC control panel industrial automation gauge",
    "regulace-prioritizace-spotreb-v-domacnosti": "smart home energy appliances kitchen modern",
    "regulace-zatezove-spicky-a-rizeni-vykonu": "electrical power grid energy peak load meter",
    "topeni-ekvitermni-regulace-pro-rodinny-dum": "heating house winter warm cozy family home",
    "topeni-optimalizace-nocniho-utlumu": "night house warm light cozy heating dark sky",
    "topeni-podlahovka-a-inteligentni-rizeni": "underfloor heating installation pipes floor",
    "topeni-radiatory-vs-podlahovka-v-automatizaci": "radiator heater white modern room interior",
    "chytra-domacnost-kolik-stoji": "smart home budget cost calculator modern house",
    "chytra-domacnost-loxone-novostavba-vs-rekonstrukce": "new build versus renovation house comparison",
    "energeticky-management-fve-loxone-co-umi": "energy management solar battery display screen",
    "hotel-automatizace-pms-previo-prinosy": "hotel room automation smart technology lobby",
    "loxone-vs-bezdratove-systemy-co-dava-smysl": "wired versus wireless smart home technology",
    "nejcastejsi-chyby-pri-chytre-elektroinstalaci": "electrical installation mistake wiring cable error",
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
