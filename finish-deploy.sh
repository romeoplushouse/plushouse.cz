#!/bin/bash
# Spusťte na VPS po nvm install 22:
# export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && bash /tmp/erp-deploy/finish-deploy.sh
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
echo "Node: $(node -v)"
echo "=== Build ==="
rm -rf /var/www/erp
cp -r /tmp/erp-deploy /var/www/erp
cd /var/www/erp/erp
cat > .env << 'E'
DATABASE_URL="postgresql://plushouse_erp:PlusH0use2026@localhost:5432/plushouse_erp"
AUTH_SECRET="x7k9m2p4q8r1t6u3w5y0z4a8b6c"
AUTH_URL="https://erp.plushouse.cz"
NEXTAUTH_URL="https://erp.plushouse.cz"
NODE_ENV="production"
PORT=3007
E
npm ci
npx prisma generate
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts || echo "Seed OK"
npm run build
echo "=== PM2 ==="
pm2 delete plushouse-erp 2>/dev/null || true
PORT=3007 pm2 start npm --name "plushouse-erp" -- start
pm2 save
echo "=== Caddy ==="
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak
if ! grep -q "erp.plushouse.cz" /etc/caddy/Caddyfile; then
cat >> /etc/caddy/Caddyfile << 'C'

erp.plushouse.cz {
	reverse_proxy localhost:3007
}
C
fi
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
echo "=== HOTOVO ==="
pm2 list
echo "https://erp.plushouse.cz"
echo "Login: admin@plushouse.cz / admin123"
