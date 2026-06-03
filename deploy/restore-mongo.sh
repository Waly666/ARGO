#!/bin/bash
# Restaura backup Mongo en el contenedor argo-mongo.
# Uso (desde /opt/argo): bash deploy/restore-mongo.sh backup/backup-argo.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${1:-$ROOT/backup/backup-argo.zip}"
TMP="/tmp/argo-mongo-restore"

if [ ! -f "$ZIP" ]; then
  echo "No se encontró: $ZIP"
  exit 1
fi

cd "$ROOT"

echo "==> Levantando Mongo..."
docker compose up -d argo-mongo
sleep 4

echo "==> Descomprimiendo backup..."
rm -rf "$TMP"
mkdir -p "$TMP"
unzip -qo "$ZIP" -d "$TMP"

DUMP_DIR=""
if [ -d "$TMP/backup-argo/argo" ]; then
  DUMP_DIR="$TMP/backup-argo/argo"
elif [ -d "$TMP/argo" ]; then
  DUMP_DIR="$TMP/argo"
else
  echo "Estructura del zip no reconocida. Debe contener backup-argo/argo o argo/"
  exit 1
fi

echo "==> Copiando dump al contenedor..."
docker cp "$DUMP_DIR" argo-mongo:/tmp/restore

echo "==> mongorestore (--drop)..."
docker exec argo-mongo mongorestore --drop --db argo /tmp/restore

echo "==> Listo. Colecciones restauradas en base 'argo'."
docker exec argo-mongo mongosh argo --quiet --eval 'db.getCollectionNames().length'

rm -rf "$TMP"
