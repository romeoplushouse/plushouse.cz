# PlusHouse ERP - Project Memory

## Projekt
- **Firma:** PLUS HOUSE s.r.o. | IČ: 09648852 | DIČ: CZ09648852
- **Web:** plushouse.cz | **ERP:** erp.plushouse.cz | **Dashboard:** plusconnect.cz
- **Obor:** Automatizace budov, Loxone smart home, FVE, tepelná čerpadla, elektroinstalace, MaR

## VPS
- **IP:** 46.28.109.85
- **SSH:** root / U3VfmS5
- **OS:** Debian Buster (4.19 kernel)
- **Node.js:** v22.22.2 (přes nvm)
- **ERP port:** 3777 (Caddy reverse proxy → erp.plushouse.cz)
- **PlusConnect port:** 3000 (Caddy → plusconnect.cz)
- **PM2 process:** plushouse-erp
- **DB:** PostgreSQL - plushouse_erp / plushouse_erp / PlusH0use2026
- **Caddy:** /etc/caddy/Caddyfile (oba sites)
- **ERP kód:** /var/www/erp/erp
- **Deploy repo:** /tmp/erp-deploy
- **Claude Code CLI:** nainstalovaný a autorizovaný na VPS

## Tech Stack
- Next.js 16.2.1 (App Router, Turbopack)
- TypeScript, Tailwind CSS
- Prisma 7 ORM + PrismaPg adapter
- PostgreSQL (na VPS)
- NextAuth.js v5 (beta)
- PM2 + Caddy
- Branch: claude/accounting-system-setup-Rw2Cg

## Brand
- **Primary:** #B5E126 (lime green)
- **Primary hover:** #b5e154
- **Dark bg:** #0f1117, cards: #1a1d24, borders: #2a2d35
- **Sidebar:** #0a0c10
- **Font:** Montserrat
- **Design:** Dark mode, glassmorphism, glow efekty

## Moduly (42+ routes)
1. Dashboard (/) - real-time statistiky
2. Účetnictví (/ucetnictvi) - podvojné, deník, hlavní kniha, předvaha, účtový rozvrh CZ
3. Faktury (/faktury) - vydané, přijaté, zálohové, proforma, dobropisy, QR kódy
4. Nabídky (/faktury/nabidky)
5. Smlouvy (/smlouvy) - elektronický podpis s BankID, eIDAS, šablony HPP/DPP/DPČ/SoD/RS
6. Platby (/platby) - evidence, auto-párování dle VS
7. Daně (/ucetnictvi/dane) - DPH XML, kontrolní hlášení, DPPO
8. CRM/Adresář (/crm) - kontakty, filtry, detail, import CSV/XLSX
9. Analýza partnera (/crm/analyza/[id]) - ARES, DPH spolehlivost, insolvence, scoring
10. Import kontaktů (/crm/import) - CSV/XLSX s mapováním sloupců
11. Zakázky (/zakazky) - úkoly, materiál, kvalita, foto evidence, pracovníci
12. Subdodavatelé (/subdodavatele) - ceníky, rámcové smlouvy, hodnocení
13. Zaměstnanci & Mzdy (/mzdy) - CRUD, výpočet mezd CZ (ZP 4.5%, SP 6.5%, daň 15%)
14. Kniha jízd (/kniha-jizd) - služební/osobní, GPS, stravné, daňový odpočet 5.60 Kč/km
15. GPS Sledování (/sledovani) - vozidla, SOS, geofencing
16. Tachograf (/sledovani/tachograf) - DDD import, EU 561/2006, denní souhrny, přestupky
17. Vozidla (/sledovani/vozidla) - fleet management, geofence regiony
18. Nastavení (/nastaveni) - organizace, bankovní spojení

## API Endpoints
- /api/auth/[...nextauth] - NextAuth autentizace
- /api/sso - SSO pro cross-domain (plushouse.cz + plusconnect.cz + erp.plushouse.cz)
- /api/platform - prolinkování služeb, unified profil, overdue reminders

## Bezpečnost
- Auth proxy (src/proxy.ts) - Next.js 16 convention, redirect na /prihlaseni
- SSO s validací return_url proti allowlistu
- Deploy generuje unikátní secrets (ne hardcoded)
- Audit trail na smlouvách

## Prisma Schema
- 50+ modelů včetně: User, Contact, Invoice, JournalEntry, Project, Employee, Vehicle, Tachograph*, Contract*, WorkSession*, ProjectMessage*, ProjectDocument*, etc.
- České účty dle vyhlášky 500/2002 Sb. (85 syntetických účtů)

## Deploy
- `finish-deploy.sh` v rootu repo - kompletní deploy script pro Caddy
- Build: `rm -rf .next && npm run build && pm2 restart plushouse-erp`
- Rychlý update: `cp -r erp/src /var/www/erp/erp/src && cd /var/www/erp/erp && rm -rf .next && npm run build && pm2 restart plushouse-erp`

## Známé problémy
- Seed nefunguje (PrismaClient adapter issue v seed.ts) - admin vytvořen ručně přes SQL
- Admin účet: email v DB je tomnemecek@msn.com (ne admin@plushouse.cz)
- Některé stránky mají ještě light-mode texty (text-gray-900 místo text-white) - postupně opravit
- xlsx package potřeba doinstalovat na VPS: `npm install xlsx`

## SSO Widget (pro plushouse.cz)
```html
<script src="https://erp.plushouse.cz/sso-widget/plushouse-login.js"></script>
<div id="plushouse-login"></div>
```

## Kontakt
- Romeo Bican (majitel)
- tonda@plushouse.cz / info@plushouse.cz
- Tel: 734384858
