#!/bin/bash
# Sube un ZIP de curso virtual directo al backend (bypass Cloudflare 100 MB).
#
# Finstruvial (/opt/argo) — API puerto 5002:
#   cd /opt/argo
#   bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN_JWT'
#
# Servial (/opt/argo-servial) — API puerto 5012:
#   cd /opt/argo-servial
#   bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN_JWT'
#
# Forzar puerto: ARGO_API_PORT=5002 bash deploy/upload-curso-zip-vps.sh ...
#
# Token: ERP logueado → F12 → Network → header Authorization: Bearer ...
set -euo pipefail

ZIP="${1:?Falta ruta al ZIP (ej. /tmp/curso-11.zip)}"
ID="${2:?Falta idPrograma (ej. 11)}"
TOKEN="${3:?Falta token JWT del ERP}"

resolve_api_port() {
  if [[ -n "${ARGO_API_PORT:-}" ]]; then
    echo "$ARGO_API_PORT"
    return
  fi
  local cwd
  cwd="$(pwd)"
  if [[ "$cwd" == *argo-servial* ]] || [[ "${ARGO_CLIENT:-}" == "servial" ]]; then
    echo 5012
    return
  fi
  if [[ "$cwd" == *"/opt/argo"* ]] || [[ "${ARGO_CLIENT:-}" == "finstruvial" ]] || [[ "${ARGO_CLIENT:-}" == "educarte" ]]; then
    echo 5002
    return
  fi
  if curl -sf --max-time 2 "http://127.0.0.1:5002/api/health" >/dev/null 2>&1; then
    echo 5002
    return
  fi
  if curl -sf --max-time 2 "http://127.0.0.1:5012/api/health" >/dev/null 2>&1; then
    echo 5012
    return
  fi
  echo ""
}

PORT="$(resolve_api_port)"
if [[ -z "$PORT" ]]; then
  echo "ERROR: No responde la API en 127.0.0.1:5002 (Finstruvial) ni :5012 (Servial)."
  echo ""
  echo "  Finstruvial → cd /opt/argo"
  echo "               ARGO_API_PORT=5002 bash deploy/upload-curso-zip-vps.sh ..."
  echo ""
  echo "  Servial     → cd /opt/argo-servial"
  echo "               ARGO_API_PORT=5012 bash deploy/upload-curso-zip-vps.sh ..."
  echo ""
  echo "  Verificar:  curl -sf http://127.0.0.1:5002/api/health   # Finstruvial"
  echo "              curl -sf http://127.0.0.1:5012/api/health   # Servial"
  exit 1
fi

URL="http://127.0.0.1:${PORT}/api/aula-virtual/admin/cursos/${ID}/paquete"

if [[ ! -f "$ZIP" ]]; then
  echo "ERROR: no existe $ZIP"
  exit 1
fi

if ! curl -sf --max-time 3 "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
  echo "ERROR: API no responde en puerto ${PORT} antes de subir."
  echo "       ¿Estás en la carpeta correcta del cliente?"
  exit 1
fi

SIZE_MB="$(du -m "$ZIP" | awk '{print $1}')"
echo ">> Cliente detectado: puerto API ${PORT}"
echo ">> Subiendo ${ZIP} (${SIZE_MB} MB) → curso ${ID}"
echo ">> URL: ${URL}"

curl -f -S -X POST "$URL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "paquete=@${ZIP}"

echo ""
echo ">> Listo. Verificar:"
echo "   curl -sI http://127.0.0.1:${PORT}/uploads/aula-virtual-cursos/${ID}/index.html"
