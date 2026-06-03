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

# ZIP creado en Windows (Compress-Archive) usa \\ — Python lo extrae bien.
if command -v python3 >/dev/null 2>&1; then
  python3 - "$ZIP" "$TMP" <<'PY'
import sys, zipfile
zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])
print("Extraído con python3")
PY
else
  unzip -qo "$ZIP" -d "$TMP" || true
fi

# Buscar carpeta del dump (contiene usuarios.bson o metadata.json)
DUMP_DIR=""
if USERS_BSON="$(find "$TMP" -type f -name 'usuarios.bson' 2>/dev/null | head -1)"; then
  DUMP_DIR="$(dirname "$USERS_BSON")"
elif META="$(find "$TMP" -type f -name 'metadata.json' -path '*/usuarios.metadata.json' 2>/dev/null | head -1)"; then
  DUMP_DIR="$(dirname "$META")"
elif [ -d "$TMP/backup-argo/argo" ]; then
  DUMP_DIR="$TMP/backup-argo/argo"
elif [ -d "$TMP/argo" ]; then
  DUMP_DIR="$TMP/argo"
else
  echo "ERROR: no se encontró usuarios.bson en el zip."
  echo "Contenido extraído:"
  find "$TMP" -maxdepth 4 -type f | head -30
  exit 1
fi

BSON_COUNT="$(find "$DUMP_DIR" -maxdepth 1 -name '*.bson' 2>/dev/null | wc -l | tr -d ' ')"
echo "==> Dump encontrado: $DUMP_DIR ($BSON_COUNT colecciones .bson)"

if [ "${BSON_COUNT:-0}" -eq 0 ]; then
  echo "ERROR: la carpeta del dump no tiene archivos .bson"
  exit 1
fi

echo "==> Copiando dump al contenedor..."
docker exec argo-mongo rm -rf /tmp/restore
docker cp "$DUMP_DIR/." argo-mongo:/tmp/restore/

echo "==> mongorestore (--drop)..."
docker exec argo-mongo mongorestore --drop --db argo /tmp/restore

USERS="$(docker exec argo-mongo mongosh argo --quiet --eval 'db.usuarios.countDocuments()')"
ALUMNOS="$(docker exec argo-mongo mongosh argo --quiet --eval 'db.datosAlumnos.countDocuments()')"
COLS="$(docker exec argo-mongo mongosh argo --quiet --eval 'db.getCollectionNames().length')"

echo "==> Restauración OK"
echo "    Colecciones: $COLS"
echo "    Usuarios:    $USERS"
echo "    Alumnos:     $ALUMNOS"

if [ "${USERS:-0}" -eq 0 ]; then
  echo "ERROR: usuarios=0 — el backup no restauró datos. Revisa el zip o vuelve a exportar desde el PC."
  exit 1
fi

rm -rf "$TMP"
