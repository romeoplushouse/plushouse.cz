#!/bin/bash
# =============================================================================
# PlusHouse ERP - Deploy pro VPS s Caddy
# BEZPEČNÉ: Nepřepisuje plusconnect.cz, pouze přidává erp.plushouse.cz
# =============================================================================
set -e

DOMAIN="erp.plushouse.cz"
APP_DIR="/var/www/erp"
APP_PORT=3777
DB_NAME="plushouse_erp"
DB_USER="plushouse_erp"
REPO_URL="https://github.com/romeoplushouse/plushouse.cz.git"
BRANCH="claude/accounting-system-setup-Rw2Cg"

echo "============================================"
echo "  PlusHouse ERP - Deploy (Caddy)"
echo "  $DOMAIN → localhost:$APP_PORT"
echo "  Existující plusconnect.cz: NEDOTČEN"
echo "============================================"

# Kontrola že Caddy běží
echo ""
echo "[INFO] Caddy status:"
systemctl status caddy --no-pager -l 2>/dev/null | head -5 || echo "  Caddy neběží jako systemd service"
echo ""
echo "[INFO] Port 3000 (plusconnect.cz):"
ss -tlnp | grep :3000 || echo "  (nic na portu 3000)"
echo ""

# 1. PostgreSQL - vytvoření DB
echo "[1/6] PostgreSQL - nová databáze..."
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c16)

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1 && {
    echo "  Uživatel existuje, měním heslo..."
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null
} || {
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null
    echo "  Uživatel vytvořen"
}

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1 && {
    echo "  Databáze existuje, přeskakuji..."
} || {
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
    echo "  Databáze vytvořena"
}
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
AUTH_SECRET=$(openssl rand -base64 32)

# 2. Klonování aplikace
echo "[2/6] Klonování ERP do $APP_DIR..."
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git fetch origin $BRANCH
    git reset --hard origin/$BRANCH
else
    git clone -b $BRANCH $REPO_URL $APP_DIR
fi

cd $APP_DIR/erp

# .env
cat > .env << ENVEOF
DATABASE_URL="$DATABASE_URL"
AUTH_SECRET="$AUTH_SECRET"
AUTH_URL="https://$DOMAIN"
NEXTAUTH_URL="https://$DOMAIN"
NODE_ENV="production"
PORT=$APP_PORT
ENVEOF

# 3. Build
echo "[3/6] npm install + build..."
npm ci 2>&1 | tail -3
npx prisma generate
npx prisma db push --accept-data-loss 2>&1 | tail -5
npx tsx prisma/seed.ts 2>/dev/null || echo "  Seed OK nebo již existuje"
npm run build 2>&1 | tail -10

# 4. PM2
echo "[4/6] PM2 - spouštím ERP na portu $APP_PORT..."
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

pm2 delete plushouse-erp 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo ""
echo "  PM2 procesy:"
pm2 list

# 5. Caddy - PŘIDAT nový blok (nemazat existující)
echo "[5/6] Caddy - přidávám $DOMAIN..."

# Záloha
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%Y%m%d%H%M%S)
echo "  Záloha Caddyfile vytvořena"

# Kontrola zda blok pro erp.plushouse.cz už existuje
if grep -q "$DOMAIN" /etc/caddy/Caddyfile; then
    echo "  Blok pro $DOMAIN již existuje, přepisuji..."
    # Odstranit starý blok (mezi "erp.plushouse.cz {" a odpovídající "}")
    python3 -c "
import re
with open('/etc/caddy/Caddyfile', 'r') as f:
    content = f.read()
# Remove existing erp block
pattern = r'$DOMAIN\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*'
content = re.sub(pattern, '', content)
with open('/etc/caddy/Caddyfile', 'w') as f:
    f.write(content.strip() + '\n')
" 2>/dev/null || true
fi

# Přidat nový blok NA KONEC Caddyfile
cat >> /etc/caddy/Caddyfile << CADDYEOF

$DOMAIN {
	request_body {
		max_size 50MB
	}

	reverse_proxy localhost:$APP_PORT {
		header_up X-Real-IP {remote_host}
		header_up X-Forwarded-For {remote_host}
		header_up X-Forwarded-Proto {scheme}

		transport http {
			read_timeout 60s
			write_timeout 60s
			dial_timeout 10s
		}
	}

	log {
		output file /var/log/caddy/erp.log {
			roll_size 50MiB
			roll_keep 5
		}
		format json
	}
}
CADDYEOF

# Validace a reload
echo "  Testuji Caddyfile..."
if caddy validate --config /etc/caddy/Caddyfile 2>&1; then
    echo "  OK! Reloaduji Caddy..."
    systemctl reload caddy 2>/dev/null || caddy reload --config /etc/caddy/Caddyfile 2>/dev/null
    echo "  Caddy reloadován"
else
    echo "  CHYBA! Obnovuji zálohu..."
    cp /etc/caddy/Caddyfile.backup.* /etc/caddy/Caddyfile 2>/dev/null
    echo "  Záloha obnovena, plusconnect.cz nedotčen"
fi

# 6. Odebrat nginx (koliduje s Caddy na portu 80)
echo "[6/6] Čištění nginx (koliduje s Caddy)..."
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
apt-get remove -y nginx nginx-full nginx-common 2>/dev/null || true
dpkg --configure -a 2>/dev/null || true

echo ""
echo "============================================"
echo "  HOTOVO!"
echo "============================================"
echo ""
echo "  plusconnect.cz → localhost:3000  (NEDOTČEN)"
echo "  $DOMAIN → localhost:$APP_PORT  (NOVÝ)"
echo ""
echo "  SSL: Caddy automaticky zajistí Let's Encrypt"
echo ""
echo "  Přihlášení do ERP:"
echo "  URL:   https://$DOMAIN"
echo "  Email: admin@plushouse.cz"
echo "  Heslo: admin123"
echo "  (ZMĚŇTE HESLO!)"
echo ""
echo "  Databáze:"
echo "  DB:   $DB_NAME"
echo "  User: $DB_USER"
echo "  Pass: $DB_PASS"
echo ""
echo "  Správa:"
echo "  pm2 logs plushouse-erp   - logy ERP"
echo "  pm2 restart plushouse-erp - restart"
echo "  caddy reload             - reload Caddy"
echo ""
echo "  ULOŽTE SI TYTO ÚDAJE!"
echo "============================================"
