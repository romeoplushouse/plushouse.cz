#!/bin/bash
# =============================================================================
# PlusHouse ERP - VPS Deployment Script
# Spusťte jako root na VPS: bash deploy-erp.sh
# =============================================================================
set -e

DOMAIN="erp.plushouse.cz"
APP_DIR="/var/www/erp"
DB_NAME="plushouse_erp"
DB_USER="plushouse"
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c16)
AUTH_SECRET=$(openssl rand -base64 32)
REPO_URL="https://github.com/romeoplushouse/plushouse.cz.git"
BRANCH="claude/accounting-system-setup-Rw2Cg"

echo "============================================"
echo "  PlusHouse ERP - Instalace na VPS"
echo "  Doména: $DOMAIN"
echo "============================================"

# 1. System update
echo "[1/9] Aktualizace systému..."
apt-get update -qq
apt-get upgrade -y -qq

# 2. Install Node.js 22
echo "[2/9] Instalace Node.js 22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# 3. Install PostgreSQL
echo "[3/9] Instalace PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt-get install -y postgresql postgresql-contrib
fi
systemctl enable postgresql
systemctl start postgresql

# Create database and user
echo "[3b/9] Vytváření databáze..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo "Database URL: postgresql://$DB_USER:***@localhost:5432/$DB_NAME"

# 4. Install PM2
echo "[4/9] Instalace PM2..."
npm install -g pm2 2>/dev/null

# 5. Install nginx
echo "[5/9] Instalace nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi
systemctl enable nginx

# 6. Clone and build app
echo "[6/9] Klonování a build aplikace..."
mkdir -p /var/www
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git fetch origin $BRANCH
    git reset --hard origin/$BRANCH
else
    git clone -b $BRANCH $REPO_URL $APP_DIR
fi

cd $APP_DIR/erp

# Create .env
cat > .env << ENVEOF
DATABASE_URL="$DATABASE_URL"
AUTH_SECRET="$AUTH_SECRET"
AUTH_URL="https://$DOMAIN"
NEXTAUTH_URL="https://$DOMAIN"
NODE_ENV="production"
ENVEOF

echo "Instalace závislostí..."
npm ci --production=false

echo "Generování Prisma klienta..."
npx prisma generate

echo "Migrace databáze..."
npx prisma db push --accept-data-loss

echo "Seed databáze (účtový rozvrh + admin)..."
npx tsx prisma/seed.ts 2>/dev/null || echo "Seed již proběhl nebo chyba - pokračuji"

echo "Build aplikace..."
npm run build

# 7. PM2 setup
echo "[7/9] Konfigurace PM2..."
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'plushouse-erp',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/erp/erp',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
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

# 8. Nginx config
echo "[8/9] Konfigurace nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx

# 9. SSL (Let's Encrypt)
echo "[9/9] SSL certifikát (Let's Encrypt)..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi

echo ""
echo "============================================"
echo "  INSTALACE DOKONČENA!"
echo "============================================"
echo ""
echo "  URL: http://$DOMAIN"
echo ""
echo "  Pro SSL spusťte:"
echo "  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m tonda@plushouse.cz"
echo ""
echo "  Přihlašovací údaje:"
echo "  Email: admin@plushouse.cz"
echo "  Heslo: admin123"
echo "  (ZMĚŇTE HESLO PO PRVNÍM PŘIHLÁŠENÍ!)"
echo ""
echo "  Databáze:"
echo "  DB: $DB_NAME"
echo "  User: $DB_USER"
echo "  Pass: $DB_PASS"
echo "  URL: $DATABASE_URL"
echo ""
echo "  Správa:"
echo "  pm2 status          - stav aplikace"
echo "  pm2 logs            - logy"
echo "  pm2 restart all     - restart"
echo ""
echo "  ULOŽTE SI TYTO ÚDAJE!"
echo "============================================"
