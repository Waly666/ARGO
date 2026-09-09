#!/usr/bin/env bash
# Despliegue completo Servial en /opt/argo-servial
# Uso:
#   cd /opt/argo-servial
#   bash deploy/servial-deploy.sh
#
# Solo migraciones (sin rebuild):
#   SKIP_BUILD=1 bash deploy/servial-deploy.sh
#
# Sin backup Mongo:
#   SKIP_BACKUP=1 bash deploy/servial-deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml)
BACKEND=argo-servial-backend
MONGO=argo-servial-mongo
SERVICES=(argo-backend argo-frontend argo-aula-virtual)

echo "=========================================="
echo " ARGO — Despliegue Servial"
echo " Carpeta: $ROOT"
echo "=========================================="

echo ""
echo ">> git pull origin main"
git pull origin main

if [[ "${SKIP_BACKUP:-}" != "1" ]]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  echo ""
  echo ">> Respaldo Mongo (argo) → /tmp/backup-servial-$STAMP"
  docker exec "$MONGO" mongodump --db=argo --out="/tmp/backup-servial-$STAMP" --quiet
  echo "   Backup listo en contenedor $MONGO:/tmp/backup-servial-$STAMP"
else
  echo ""
  echo ">> SKIP_BACKUP=1 — sin respaldo Mongo"
fi

if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  echo ""
  echo ">> docker compose build ${SERVICES[*]}"
  "${COMPOSE[@]}" build "${SERVICES[@]}"

  echo ""
  echo ">> docker compose up -d --force-recreate ${SERVICES[*]}"
  "${COMPOSE[@]}" up -d --force-recreate "${SERVICES[@]}"
else
  echo ""
  echo ">> SKIP_BUILD=1 — sin rebuild Docker"
fi

echo ""
echo ">> Esperando backend..."
sleep 3

echo ""
echo ">> Migraciones Mongo (portal SEO Servial)"
docker exec "$BACKEND" sh -c '
  set -e
  cd /app
  node scripts/migrate-cursos-conduccion-guion.js
  node scripts/migrate-trabajo-en-alturas-guion.js
  node scripts/migrate-mercancias-peligrosas-guion.js
  node scripts/migrate-primeros-auxilios-guion.js
  node scripts/migrate-servicios-hub-seo.js
  node scripts/migrate-aula-virtual-seo.js
  node scripts/migrate-enlaces-relacionados-servial.js
'

echo ""
echo ">> Estado contenedores"
"${COMPOSE[@]}" ps

echo ""
echo ">> Health checks"
curl -sf "http://127.0.0.1:5012/api/health" && echo " API Servial OK (5012)" || echo " ERROR API"
curl -sI "http://127.0.0.1:8093" | head -1
curl -sI "http://127.0.0.1:8095" | head -1

echo ""
echo "=========================================="
echo " Despliegue terminado."
echo " Portal: https://servial.edu.co (Ctrl+F5)"
echo " ERP:    https://app.servial.edu.co"
echo "=========================================="
