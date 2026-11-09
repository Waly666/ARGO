#!/bin/bash
# Sube un APK de curso virtual directo al backend (bypass Cloudflare ~100 MB).
#
# Servial:
#   cd /opt/argo-servial
#   bash deploy/upload-curso-apk-vps.sh /tmp/curso-13.apk 13 'TOKEN_JWT'
#
# Finstruvial:
#   cd /opt/argo
#   bash deploy/upload-curso-apk-vps.sh /tmp/curso-16.apk 16 'TOKEN_JWT'
#
# Token: ERP logueado → F12 → Authorization (solo el JWT, sin "Bearer ").
set -euo pipefail

APK="${1:?Falta ruta al APK (ej. /tmp/curso-13.apk)}"
ID="${2:?Falta idPrograma}"
TOKEN="${3:?Falta token JWT del ERP}"
TOKEN="${TOKEN#Bearer }"
TOKEN="${TOKEN#bearer }"

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
  if [[ "$cwd" == *"/opt/argo"* ]] || [[ "${ARGO_CLIENT:-}" == "finstruvial" ]]; then
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
  echo "ERROR: API no detectada en :5002 ni :5012. Use ARGO_API_PORT=5012"
  exit 1
fi

URL="http://127.0.0.1:${PORT}/api/aula-virtual/admin/cursos/${ID}/apk"
APK_NAME="$(basename "$APK")"

if [[ ! -f "$APK" ]]; then
  echo "ERROR: no existe $APK"
  exit 1
fi

SIZE_MB="$(du -m "$APK" | awk '{print $1}')"
echo ">> Puerto API ${PORT}"
echo ">> Subiendo ${APK} (${SIZE_MB} MB) → curso ${ID}"
echo ">> URL: ${URL}"

HTTP_CODE="$(curl -sS --max-time 1800 -w '%{http_code}' -o /tmp/argo-upload-apk-resp.json -X POST "$URL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "apk=@${APK}" \
  -F "apkNombre=${APK_NAME}")"

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
  echo "ERROR HTTP ${HTTP_CODE}"
  cat /tmp/argo-upload-apk-resp.json 2>/dev/null || true
  echo ""
  if [[ "$HTTP_CODE" == "413" ]]; then
    echo ">> 413 = nginx o límite multer. Revise client_max_body_size y AULA_VIRTUAL_APK_MAX_MB."
  fi
  exit 1
fi

cat /tmp/argo-upload-apk-resp.json
echo ""
echo ">> APK publicada. Verificar en ERP (ficha curso → Contenido)."
