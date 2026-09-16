#!/bin/bash
# Sube un ZIP de curso virtual directo al backend (bypass Cloudflare 100 MB).
# Uso en la VPS (Servial):
#   bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TU_TOKEN_JWT'
#
# Token: en el ERP logueado → F12 → Application → localStorage → token (o header Authorization de cualquier /api/)
set -euo pipefail

ZIP="${1:?Falta ruta al ZIP (ej. /tmp/curso-11.zip)}"
ID="${2:?Falta idPrograma (ej. 11)}"
TOKEN="${3:?Falta token JWT del ERP}"

PORT="${ARGO_API_PORT:-5012}"
URL="http://127.0.0.1:${PORT}/api/aula-virtual/admin/cursos/${ID}/paquete"

if [[ ! -f "$ZIP" ]]; then
  echo "ERROR: no existe $ZIP"
  exit 1
fi

SIZE_MB="$(du -m "$ZIP" | awk '{print $1}')"
echo ">> Subiendo ${ZIP} (${SIZE_MB} MB) → curso ${ID} via ${URL}"

curl -f -S -X POST "$URL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "paquete=@${ZIP}"

echo ""
echo ">> Listo. Verificar:"
echo "   curl -sI http://127.0.0.1:${PORT}/uploads/aula-virtual-cursos/${ID}/index.html"
