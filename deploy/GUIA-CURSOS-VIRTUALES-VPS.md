# Guía: cursos virtuales grandes en VPS (Finstruvial / Servial)

Casos frecuentes al subir o abrir cursos pesados (ej. **mercancías peligrosas**, ~150–300 MB en ZIP).

---

## ⚠️ Puertos distintos por cliente (no mezclar)

| | **Finstruvial** | **Servial** |
|---|-----------------|-------------|
| **Carpeta VPS** | `/opt/argo` | `/opt/argo-servial` |
| **API backend** | **5002** | **5012** |
| **ERP** | **8083** | **8093** |
| **Portal** | **8085** | **8095** |
| **Dominio ERP** | `app.finstruvial.edu.co` | `app.servial.edu.co` |
| **Dominio portal** | `finstruvial.edu.co` | `servial.edu.co` |
| **Contenedor backend** | `argo-backend` | `argo-servial-backend` |
| **Uploads en disco** | `/opt/argo/data/uploads/` | `/opt/argo-servial/data/uploads/` |

**Error típico:** `Failed to connect to 127.0.0.1 port 5012` en Finstruvial → estás usando el puerto de **Servial**. Finstruvial usa **5002**, no 5012 ni 5212.

Comprobar qué API está viva:

```bash
curl -sf http://127.0.0.1:5002/api/health && echo " → Finstruvial OK"
curl -sf http://127.0.0.1:5012/api/health && echo " → Servial OK"
```

---

## Mapa rápido de errores

| Síntoma | Código | Quién lo causa | Sección |
|---------|--------|----------------|---------|
| Subida ZIP, HTML dice `cloudflare` | **413** | Cloudflare (~100 MB máx.) | § 1 |
| Subida ZIP, sin `cloudflare` | **413** | Nginx o backend | § 2–3 |
| `Invalid SSL certificate` | **526** | Nginx sin HTTPS tras copiar `.conf` | § 4 |
| Curso en blanco | **404** | Archivos no en `data/uploads/` | § 5 |
| Carga lenta y se corta | **504** | Timeout nginx `/uploads/` | § 6 |
| Disco lleno | **507** | VPS sin espacio | § 7 |
| `Failed to connect` puerto | — | **Puerto incorrecto** (5002 vs 5012) | Arriba |

**413 = tamaño. 504/502 = timeout. No son lo mismo.**

---

## 1. Error 413 con `<center>cloudflare</center>`

Cloudflare (Free/Pro) **bloquea subidas > ~100 MB** antes del VPS.

### Confirmar

F12 → Network → `POST .../admin/cursos/XX/paquete` → respuesta HTML con **cloudflare**.

### Solución — subir desde la VPS (bypass Cloudflare)

**Finstruvial:**

```bash
cd /opt/argo
git pull origin main

# Debe detectar puerto 5002 solo por estar en /opt/argo
bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN_JWT_AQUI'

# O explícito:
ARGO_API_PORT=5002 bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN'
```

**Servial:**

```bash
cd /opt/argo-servial
git pull origin main

bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN_JWT_AQUI'

# O explícito:
ARGO_API_PORT=5012 bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN'
```

**Token JWT:** ERP logueado → F12 → Network → cualquier `/api/` → header `Authorization` → copie **solo** la parte después de `Bearer ` (sin la palabra Bearer).

Si sale **401**: token expirado, mal copiado, o incluyó `Bearer` dos veces. Genere uno nuevo entrando otra vez al ERP.

### Alternativa — nube gris Cloudflare

1. DNS → `app.finstruvial.edu.co` o `app.servial.edu.co` → nube **gris**
2. Subir ZIP desde el ERP
3. Volver nube **naranja**

### Verificar paquete

**Finstruvial:**

```bash
curl -sI http://127.0.0.1:5002/uploads/aula-virtual-cursos/11/index.html
ls -la /opt/argo/data/uploads/aula-virtual-cursos/11/ | head
```

**Servial:**

```bash
curl -sI http://127.0.0.1:5012/uploads/aula-virtual-cursos/11/index.html
ls -la /opt/argo-servial/data/uploads/aula-virtual-cursos/11/ | head
```

---

## 2. Error 413 sin Cloudflare (nginx)

Nginx rechaza el cuerpo (`client_max_body_size` bajo o falta en bloque **443**).

**Finstruvial** — revisar:

```bash
grep client_max_body_size /etc/nginx/sites-available/app.finstruvial.edu.co.conf
grep client_max_body_size /etc/nginx/sites-available/finstruvial.edu.co.conf
sudo nginx -t && sudo systemctl reload nginx
```

Plantillas: `deploy/nginx/app.finstruvial.edu.co.conf`, `deploy/nginx/finstruvial.edu.co.conf`

**Servial** — revisar:

```bash
grep client_max_body_size /etc/nginx/sites-available/app.servial.edu.co.conf
sudo bash /opt/argo-servial/deploy/setup-nginx-ssl-servial.sh
```

Debe haber `client_max_body_size 400m;` en el bloque con `listen 443 ssl`.

---

## 3. Error 413 del backend (Multer)

En `deploy/.env` del cliente:

```env
AULA_VIRTUAL_ZIP_MAX_MB=400
```

**Finstruvial:**

```bash
cd /opt/argo
docker compose build argo-backend argo-frontend
docker compose up -d --force-recreate argo-backend argo-frontend
docker exec argo-backend node -e "console.log(process.env.AULA_VIRTUAL_ZIP_MAX_MB || 'default')"
```

**Servial:**

```bash
cd /opt/argo-servial
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml build argo-backend argo-frontend
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml up -d --force-recreate argo-backend argo-frontend
docker exec argo-servial-backend node -e "console.log(process.env.AULA_VIRTUAL_ZIP_MAX_MB || 'default')"
```

---

## 4. Error 526 — Invalid SSL certificate

Copiar plantilla nginx **solo puerto 80** encima de config con Certbot borra HTTPS.

**Servial:** `sudo bash deploy/setup-nginx-ssl-servial.sh`  
**Finstruvial:** `sudo bash deploy/setup-nginx-ssl.sh` (desde `/opt/argo`)

Parche rápido Cloudflare: **Flexible**. Luego restaurar **Full (strict)**.

> No hagas solo `sudo cp deploy/nginx/*.conf` sin re-ejecutar Certbot.

---

## 5. Curso no carga / 404

Los paquetes **no van en Git**. Deben existir en disco:

| Cliente | Ruta |
|---------|------|
| Finstruvial | `/opt/argo/data/uploads/aula-virtual-cursos/{id}/index.html` |
| Servial | `/opt/argo-servial/data/uploads/aula-virtual-cursos/{id}/index.html` |

---

## 6. Timeout al cargar PDFs/videos (504)

Incluir en nginx del host, bloque `/uploads/`:

```nginx
proxy_read_timeout 600s;
proxy_send_timeout 600s;
proxy_connect_timeout 600s;
proxy_buffering off;
```

Snippet: `deploy/nginx/snippets/argo-uploads-proxy.conf`

**Finstruvial:** incluido en `deploy/nginx/finstruvial.edu.co.conf` → proxy a **5002**  
**Servial:** incluido en `deploy/nginx/servial.edu.co.conf` → proxy a **5012**

---

## 7. Disco lleno (507)

```bash
df -h /opt/argo/data              # Finstruvial
df -h /opt/argo-servial/data      # Servial
```

Dejar **≥ 1 GB libre** antes de extraer un curso grande.

---

## Checklist Finstruvial

```bash
cd /opt/argo
git pull origin main

df -h /opt/argo/data
curl -sf http://127.0.0.1:5002/api/health && echo " API OK (5002)"
grep AULA_VIRTUAL_ZIP_MAX_MB deploy/.env

# Subir ZIP (>100 MB → script, no ERP directo)
ARGO_API_PORT=5002 bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN'

curl -sI http://127.0.0.1:5002/uploads/aula-virtual-cursos/11/index.html
```

---

## Checklist Servial

```bash
cd /opt/argo-servial
git pull origin main

df -h /opt/argo-servial/data
curl -sf http://127.0.0.1:5012/api/health && echo " API OK (5012)"
grep AULA_VIRTUAL_ZIP_MAX_MB deploy/.env

ARGO_API_PORT=5012 bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN'

curl -sI http://127.0.0.1:5012/uploads/aula-virtual-cursos/11/index.html
```

---

## Archivos útiles

| Archivo | Uso |
|---------|-----|
| `deploy/upload-curso-zip-vps.sh` | Subir ZIP bypass Cloudflare (auto-detecta 5002/5012) |
| `deploy/setup-nginx-ssl.sh` | SSL Finstruvial |
| `deploy/setup-nginx-ssl-servial.sh` | SSL Servial |
| `deploy/nginx/finstruvial.edu.co.conf` | Portal Finstruvial → API **5002**, SPA **8085** |
| `deploy/nginx/app.finstruvial.edu.co.conf` | ERP Finstruvial → **8083** |
| `deploy/nginx/servial.edu.co.conf` | Portal Servial → API **5012**, SPA **8095** |
| `deploy/DEPLOY-SERVIAL.md` | Despliegue general Servial |

---

*Última actualización: septiembre 2026 — puertos Finstruvial 5002/8083/8085 vs Servial 5012/8093/8095.*
