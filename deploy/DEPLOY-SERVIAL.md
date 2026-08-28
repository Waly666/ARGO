# Despliegue ARGO — Servial (VPS compartido con Educarte)

Instalación de **Servial** en `/opt/argo-servial` del mismo VPS donde corre **Educarte** (`/opt/argo-educarte` o carpeta equivalente con puertos por defecto).

> **Regla de oro:** en Servial **siempre** usa el override `deploy/docker-compose.servial.yml`. El `docker-compose.yml` base trae puertos 5002/8083/8085; si Educarte ya los usa, Servial no arranca (`port is already allocated`).

---

## Mapa de puertos en el VPS

| Cliente | Carpeta | API | ERP | Portal | Sitio |
|---------|---------|-----|-----|--------|-------|
| **Educarte** | `/opt/argo` (o similar) | **5002** | **8083** | **8085** | **8084** (`argo-sitio`) |
| **Servial** | `/opt/argo-servial` | **5012** | **8093** | **8095** | **8084** (compartido o propio) |

Contenedores Docker de Servial: `argo-servial-backend`, `argo-servial-frontend`, `argo-servial-aula`, `argo-servial-mongo`.

---

## Nginx (producción)

| Dominio | Rol | `proxy_pass` |
|---------|-----|--------------|
| `app.servial.edu.co` | ERP | `http://127.0.0.1:8093` |
| `servial.edu.co` / `www` | API, uploads, socket.io, sitemap | `http://127.0.0.1:5012/...` |
| `servial.edu.co` / `www` | Portal aula virtual | `http://127.0.0.1:8095` |

Archivos en el servidor:

- `/etc/nginx/sites-available/app.servial.edu.co.conf`
- `/etc/nginx/sites-available/servial.edu.co.conf`

Snippets del repo: `/opt/argo-servial/deploy/nginx/snippets/`.

Verificar que Educarte sigue en 8083/8085/5002 y **no** mezclar puertos entre clientes:

```bash
grep -r "proxy_pass" /etc/nginx/sites-available/ 2>/dev/null | grep -E '5002|5012|8083|8093|8085|8095'
```

---

## Comando de despliegue (día a día)

Tras `git push` desde tu PC:

```bash
cd /opt/argo-servial
git pull origin main

docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml build argo-aula-virtual argo-backend argo-frontend
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml up -d --force-recreate argo-aula-virtual argo-backend argo-frontend
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml ps
```

Ajusta la lista de servicios en `build` según lo que hayas tocado (`argo-sitio`, etc.).

**Alias opcional** en el servidor (añadir a `~/.bashrc`):

```bash
alias dc-servial='docker compose -f /opt/argo-servial/docker-compose.yml -f /opt/argo-servial/deploy/docker-compose.servial.yml'
```

Luego: `dc-servial up -d --force-recreate argo-backend`.

---

## Verificación rápida

```bash
curl -sf http://127.0.0.1:5012/api/health && echo " OK API Servial"
curl -sI http://127.0.0.1:8093 | head -1   # ERP
curl -sI http://127.0.0.1:8095 | head -1   # Portal
```

En el navegador: recarga forzada **Ctrl+F5** en `https://app.servial.edu.co` y `https://servial.edu.co`.

---

## Problema frecuente: puerto ya en uso

**Síntoma:**

```
Bind for 0.0.0.0:5002 failed: port is already allocated
```

**Causa:** se ejecutó `docker compose up` sin el override, o el `docker-compose.yml` local tiene puertos de Educarte.

**Diagnóstico:**

```bash
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
ss -tlnp | grep -E '5002|5012|8083|8093|8085|8095'
grep -E '^\s+-\s+"[0-9]+:' /opt/argo-servial/docker-compose.yml
```

**Recuperación:**

```bash
cd /opt/argo-servial
git pull origin main   # trae deploy/docker-compose.servial.yml

# Si el compose base quedó mal editado, corregir o usar solo el override:
docker rm -f argo-servial-backend argo-servial-frontend argo-servial-aula 2>/dev/null
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml up -d
```

**No toques** los contenedores `argo-educarte-*` ni los puertos 5002/8083/8085.

---

## Primer despliegue / build completo

VPS con poca RAM:

```bash
cd /opt/argo-servial
chmod +x deploy/build-sequential.sh
# Editar build-sequential.sh si hace falta pasar -f deploy/docker-compose.servial.yml
```

Build y arranque completo:

```bash
cd /opt/argo-servial
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml build
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml up -d
```

---

## Qué hace `deploy/docker-compose.servial.yml`

- `name: argo-servial` — proyecto Compose y volúmenes separados de Educarte
- Puertos host: 5012, 8093, 8095 (y 8084 para sitio)
- `container_name` prefijados con `argo-servial-*`

No commitees cambios de puertos en el `docker-compose.yml` raíz solo para Servial; usa siempre este override.

---

## Documentación relacionada

| Archivo | Contenido |
|---------|-----------|
| [GUIA-GIT-DESPLIEGUE.md](./GUIA-GIT-DESPLIEGUE.md) | Flujo commit → push → pull → docker |
| [GUIA-NUEVO-CLIENTE-VPS.md](./GUIA-NUEVO-CLIENTE-VPS.md) | § 6.1 — dos instalaciones en un VPS |
| [PLAN-CLIENTE-NUEVO.md](./PLAN-CLIENTE-NUEVO.md) | Plan fases cliente nuevo |

---

*Última actualización: agosto 2026 — Servial en `/opt/argo-servial`, Educarte en puertos por defecto.*
