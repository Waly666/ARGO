#!/bin/bash
# Nginx + Let's Encrypt para servial.edu.co y app.servial.edu.co
# Ejecutar en el VPS como root, desde /opt/argo-servial después de git pull.
#
# IMPORTANTE: las plantillas deploy/nginx/*.servial*.conf solo traen puerto 80.
# Certbot añade listen 443 ssl. No vuelvas a cp encima sin re-ejecutar este script.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NGINX_AVAIL="/etc/nginx/sites-available"
NGINX_EN="/etc/nginx/sites-enabled"

echo "==> Comprobando DNS..."
THIS_IP="$(curl -4 -sf ifconfig.me || hostname -I | awk '{print $1}')"
for h in servial.edu.co www.servial.edu.co app.servial.edu.co; do
  RES="$(getent ahostsv4 "$h" 2>/dev/null | awk '{print $1; exit}' || true)"
  if [[ -z "$RES" ]]; then
    echo "AVISO: $h no tiene registro A IPv4 visible desde el VPS."
    continue
  fi
  echo "  $h → $RES (VPS: $THIS_IP)"
done

echo "==> Instalando sitios nginx (puerto 80)..."
cp "$ROOT/deploy/nginx/servial.edu.co.conf" "$NGINX_AVAIL/servial.edu.co.conf"
cp "$ROOT/deploy/nginx/app.servial.edu.co.conf" "$NGINX_AVAIL/app.servial.edu.co.conf"
ln -sf "$NGINX_AVAIL/servial.edu.co.conf" "$NGINX_EN/servial.edu.co.conf"
ln -sf "$NGINX_AVAIL/app.servial.edu.co.conf" "$NGINX_EN/app.servial.edu.co.conf"

nginx -t
systemctl reload nginx

echo "==> Certificados SSL (Certbot)..."
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
fi

certbot --nginx \
  -d servial.edu.co \
  -d www.servial.edu.co \
  -d app.servial.edu.co \
  --non-interactive --agree-tos --register-unsafely-without-email \
  --redirect || certbot --nginx \
  -d servial.edu.co \
  -d www.servial.edu.co \
  -d app.servial.edu.co

echo "==> Pruebas locales..."
curl -sfI "http://127.0.0.1:8093" | head -1 || true
curl -sfI "http://127.0.0.1:8095" | head -1 || true
curl -sf "http://127.0.0.1:5012/api/health" && echo " API OK" || true

echo "Listo. Recarga https://servial.edu.co y https://app.servial.edu.co (Ctrl+F5)."
