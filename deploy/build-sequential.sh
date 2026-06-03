#!/bin/bash
# Build secuencial (evita quedarse sin RAM en VPS pequeños).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Backend..."
docker compose build argo-backend

echo "==> Frontend ERP..."
docker compose build argo-frontend

echo "==> Sitio marketing..."
docker compose build argo-sitio

echo "==> Levantando servicios..."
docker compose up -d

echo "==> Estado:"
docker compose ps
curl -sf http://127.0.0.1:5002/api/health && echo || echo "API aún no responde — revisa: docker compose logs argo-backend --tail 40"
