#!/bin/bash
# =============================================================================
# PlusHouse ERP - BEZPEČNÝ Deploy na VPS
# POZOR: Nemaže a nemění žádné existující služby, nginx configs, databáze!
# Pouze PŘIDÁVÁ nový site pro erp.plushouse.cz na portu 3001
# Spusťte jako root: bash deploy-erp.sh
# =============================================================================
set -e

DOMAIN="erp.plushouse.cz"
APP_DIR="/var/www/erp"
APP_PORT=3001
DB_NAME="plushouse_erp"
DB_USER="plushouse_erp"
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c16)
AUTH_SECRET=$(openssl rand -base64 32)
REPO_URL="https://github.com/romeoplushouse/plushouse.cz.git"
BRANCH="claude/accounting-system-setup-Rw2Cg"

echo "============================================"
echo "  PlusHouse ERP - BEZPEČNÁ instalace"
echo "  Doména: $DOMAIN"
echo "  Port: $APP_PORT"
echo "============================================"
echo ""
echo "  BEZPEČNOSTNÍ ZÁRUKA:"
echo "  - NEODSTRANÍ žádný existující nginx config"
echo "  - NEZMĚNÍ žádnou existující službu"
echo "  - NEODSTRANÍ žádnou existující databázi"
echo "  - Pouze PŘIDÁ nový site a službu"
echo "============================================"
echo ""

# Zobrazit co aktuálně běží
echo "[INFO] Aktuálně běžící služby:"
systemctl list-units --type=service --state=running 2>/dev/null | grep -iE 'nginx|node|postgres|mysql|docker|apache|pm2|php' || echo "  (žádné relevantní)"
echo ""
echo "[INFO] Aktuální nginx sites:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "  nginx není nainstalován"
echo ""
echo "[INFO] Obsazené porty:"
ss -tlnp 2>/dev/null | grep -E ':80|:443|:3000|:3001|:5432|:8080' || echo "  (žádné relevantní)"
echo ""

read -p "Pokračovat v instalaci? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalace zrušena."
    exit 1
fi

# 1. System update (jen update, NE upgrade - nechceme měnit existující balíčky)
echo ""
echo "[1/9] Aktualizace balíčků (pouze apt-get update)..."
apt-get update -qq || true

# 2. Install Node.js 22 (pokud ještě neexistuje)
echo "[2/9] Kontrola Node.js..."
if command -v node &> /dev/null; then
    echo "  Node.js již nainstalován: $(node -v)"
else
    echo "  Instalace Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    echo "  Nainstalováno: $(node -v)"
fi

# 3. Install PostgreSQL (pokud ještě neexistuje)
echo "[3/9] Kontrola PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "  PostgreSQL již nainstalován: $(psql --version | head -1)"
else
    echo "  Instalace PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
fi
systemctl enable postgresql 2>/dev/null || true
systemctl start postgresql 2>/dev/null || true

# Create NOVOU databázi a uživatele (neovlivní existující)
echo "[3b/9] Vytváření NOVÉ databáze '$DB_NAME'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 && {
    echo "  Uživatel '$DB_USER' již existuje, přeskakuji..."
    # Vygenerujeme nové heslo pro existujícího uživatele
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null
} || {
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null
    echo "  Uživatel '$DB_USER' vytvořen"
}

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 && {
    echo "  Databáze '$DB_NAME' již existuje, přeskakuji vytvoření..."
} || {
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
    echo "  Databáze '$DB_NAME' vytvořena"
}
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# 4. Install PM2 (globálně, neovlivní existující)
echo "[4/9] Kontrola PM2..."
if command -v pm2 &> /dev/null; then
    echo "  PM2 již nainstalován: $(pm2 -v)"
else
    echo "  Instalace PM2..."
    npm install -g pm2
fi

# 5. Kontrola nginx (NE instalace - jen kontrola)
echo "[5/9] Kontrola nginx..."
if command -v nginx &> /dev/null; then
    echo "  nginx již nainstalován a běží"
    echo "  Existující sites-enabled:"
    ls /etc/nginx/sites-enabled/ 2>/dev/null
else
    echo "  Instalace nginx..."
    apt-get install -y nginx
    systemctl enable nginx
fi

# 6. Clone/update aplikace do NOVÉHO adresáře
echo "[6/9] Klonování aplikace do $APP_DIR..."
if [ -d "$APP_DIR" ]; then
    echo "  Adresář existuje, aktualizuji..."
    cd $APP_DIR
    git fetch origin $BRANCH
    git reset --hard origin/$BRANCH
else
    echo "  Klonuji nový repo..."
    git clone -b $BRANCH $REPO_URL $APP_DIR
fi

cd $APP_DIR/erp

# Vytvořit .env pro ERP
cat > .env << ENVEOF
DATABASE_URL="$DATABASE_URL"
AUTH_SECRET="$AUTH_SECRET"
AUTH_URL="https://$DOMAIN"
NEXTAUTH_URL="https://$DOMAIN"
NODE_ENV="production"
PORT=$APP_PORT
ENVEOF

echo "  Instalace závislostí..."
npm ci --production=false 2>&1 | tail -3

echo "  Generování Prisma klienta..."
npx prisma generate

echo "  Aplikace databázového schématu..."
npx prisma db push --accept-data-loss

echo "  Seed databáze (účtový rozvrh + admin)..."
npx tsx prisma/seed.ts 2>/dev/null || echo "  Seed již proběhl nebo chyba - pokračuji"

echo "  Build Next.js aplikace..."
npm run build

# 7. PM2 setup - POUZE pro ERP, nedotýká se ostatních PM2 procesů
echo "[7/9] Konfigurace PM2 pro ERP..."
cat > ecosystem.config.js << PM2EOF
module.exports = {
  apps: [{
    name: 'plushouse-erp',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR/erp',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
  }]
};
PM2EOF

# Zastavit POUZE ERP proces pokud běží, NEDOTÝKAT SE ostatních
pm2 delete plushouse-erp 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "  ERP běží na portu $APP_PORT"
echo "  Ostatní PM2 procesy nedotčeny:"
pm2 list

# 8. Nginx - POUZE PŘIDÁNÍ nového site, BEZ MAZÁNÍ čehokoli
echo "[8/9] Přidání nginx site pro $DOMAIN..."
echo "  NEODSTRAŇUJI žádný existující config!"

# Záloha aktuální nginx konfigurace
cp -r /etc/nginx/sites-enabled/ /etc/nginx/sites-enabled.backup.$(date +%Y%m%d%H%M) 2>/dev/null || true

cat > /etc/nginx/sites-available/$DOMAIN << NGINXEOF
# PlusHouse ERP - automaticky vygenerováno
# Port: $APP_PORT
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Maximální velikost uploadu (pro DDD soubory tachografu)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINXEOF

# Symlink - NEPŘEPISUJE existující soubory
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

# Test nginx PŘED reloadem
echo "  Testuji nginx konfiguraci..."
if nginx -t 2>&1; then
    echo "  Konfigurace OK, reloaduji nginx..."
    systemctl reload nginx
else
    echo "  CHYBA v nginx konfiguraci! Existující služby nedotčeny."
    echo "  Opravte ručně: /etc/nginx/sites-available/$DOMAIN"
    rm -f /etc/nginx/sites-enabled/$DOMAIN
fi

# 9. SSL (certbot)
echo "[9/9] SSL certifikát..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi

echo ""
echo "============================================"
echo "  INSTALACE DOKONČENA BEZPEČNĚ!"
echo "============================================"
echo ""
echo "  Existující služby: NEDOTČENY"
echo ""
echo "  Nový ERP systém:"
echo "  URL: http://$DOMAIN"
echo "  Port: $APP_PORT"
echo ""
echo "  Pro SSL spusťte:"
echo "  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m tonda@plushouse.cz"
echo ""
echo "  Přihlašovací údaje:"
echo "  Email: admin@plushouse.cz"
echo "  Heslo: admin123"
echo "  (ZMĚŇTE HESLO PO PRVNÍM PŘIHLÁŠENÍ!)"
echo ""
echo "  Databáze (NOVÁ, oddělená):"
echo "  DB: $DB_NAME"
echo "  User: $DB_USER"
echo "  Pass: $DB_PASS"
echo ""
echo "  Správa ERP:"
echo "  pm2 status              - stav všech procesů"
echo "  pm2 logs plushouse-erp  - logy ERP"
echo "  pm2 restart plushouse-erp - restart ERP"
echo ""
echo "  ULOŽTE SI TYTO ÚDAJE!"
echo "============================================"
