# Guía: cursos virtuales grandes en VPS (Servial / Finstruvial)

Casos frecuentes al subir o abrir cursos pesados (ej. **mercancías peligrosas**, ~150–300 MB en ZIP).

---

## Mapa rápido de errores

| Síntoma | Código | Quién lo causa | Dónde mirar |
|---------|--------|----------------|-------------|
| Subida ZIP falla, HTML dice `cloudflare` | **413** | **Cloudflare** (~100 MB máx.) | Esta guía § 1 |
| Subida ZIP falla, sin mención a Cloudflare | **413** | Nginx o backend | § 2 y § 3 |
| `Invalid SSL certificate` en navegador | **526** | Cloudflare + nginx sin HTTPS | § 4 |
| Curso en blanco / recursos no cargan | **404** | Archivos no en `data/uploads/` | § 5 |
| Carga muy lenta y se corta | **504** | Timeout nginx en `/uploads/` | § 6 |
| Disco lleno al extraer | **507** | VPS sin espacio | § 7 |

**Timeout ≠ 413.** Timeout suele ser **504** o **502**. **413 = archivo demasiado grande** para quien recibe la petición.

---

## 1. Error 413 con `<center>cloudflare</center>` (más común)

### Qué pasa

Cloudflare (plan Free/Pro) **bloquea subidas mayores a ~100 MB** antes de que lleguen al VPS.  
Aunque nginx y el backend tengan límite de 400 MB, **la petición no llega**.

### Cómo confirmarlo

- F12 → Network → petición `POST .../admin/cursos/XX/paquete`
- Respuesta HTML con título **413 Payload Too Large** y texto **cloudflare**

### Qué hacer (Servial)

**Opción A — Subir desde la VPS (recomendado)**

1. Copiar ZIP con WinSCP → `/tmp/curso-11.zip` (cambia `11` por `idPrograma`)
2. Token JWT del ERP: F12 → Network → cualquier `/api/` → header `Authorization: Bearer ...`
3. En la VPS:

```bash
cd /opt/argo-servial
git pull origin main
bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN_JWT_AQUI'
```

**Opción B — Nube gris en Cloudflare (solo durante la subida)**

1. Cloudflare → DNS → `app.servial.edu.co` → nube **naranja → gris**
2. Subir ZIP desde el ERP
3. Volver a nube **naranja** al terminar

**Opción C — Copiar carpeta ya extraída**

Destino Servial:

```text
/opt/argo-servial/data/uploads/aula-virtual-cursos/{idPrograma}/
```

Verificar:

```bash
curl -sI http://127.0.0.1:5012/uploads/aula-virtual-cursos/11/index.html
```

### Finstruvial

Mismo principio. Cambiar puerto API a **5002** y carpeta a `/opt/argo/data/uploads/`:

```bash
cd /opt/argo
ARGO_API_PORT=5002 bash deploy/upload-curso-zip-vps.sh /tmp/curso-11.zip 11 'TOKEN'
```

---

## 2. Error 413 sin Cloudflare (nginx del VPS)

### Qué pasa

Nginx del host o del contenedor ERP rechaza el cuerpo de la petición (`client_max_body_size` bajo o ausente en el bloque **443**).

### Qué debe tener Servial

En `/etc/nginx/sites-available/app.servial.edu.co.conf`, en el bloque con `listen 443 ssl`:

```nginx
client_max_body_size 400m;

location / {
    client_max_body_size 400m;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    proxy_request_buffering off;
    ...
}
```

Comprobar:

```bash
grep -n client_max_body_size /etc/nginx/sites-available/app.servial.edu.co.conf
sudo nginx -t && sudo systemctl reload nginx
```

Plantillas en el repo: `deploy/nginx/app.servial.edu.co.conf`, `deploy/nginx/servial.edu.co.conf`.

**Instalar / actualizar nginx + SSL:**

```bash
cd /opt/argo-servial
sudo bash deploy/setup-nginx-ssl-servial.sh
```

---

## 3. Error 413 del backend (Multer)

### Qué pasa

El ZIP llegó al backend pero supera el límite interno.

### Qué hacer

En `deploy/.env`:

```env
AULA_VIRTUAL_ZIP_MAX_MB=400
```

Recrear backend (y frontend si hace falta nginx interno):

```bash
cd /opt/argo-servial
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml build argo-backend argo-frontend
docker compose -f docker-compose.yml -f deploy/docker-compose.servial.yml up -d --force-recreate argo-backend argo-frontend
```

Verificar:

```bash
docker exec argo-servial-backend node -e "console.log(process.env.AULA_VIRTUAL_ZIP_MAX_MB || 'default')"
```

---

## 4. Error 526 — Invalid SSL certificate (Cloudflare)

### Qué pasa

Se copió una plantilla nginx **solo con puerto 80** encima de la config que Certbot ya había dejado con **443 ssl**. Cloudflare intenta HTTPS al origen y no encuentra certificado válido.

### Síntoma

Pantalla Cloudflare: **Invalid SSL certificate** (526). Caen `app.servial.edu.co` y/o `servial.edu.co`.

### Arreglo rápido (2 min)

Cloudflare → SSL/TLS → **Flexible** (temporal).

### Arreglo definitivo

```bash
cd /opt/argo-servial
git pull origin main
sudo bash deploy/setup-nginx-ssl-servial.sh
sudo nginx -t && sudo systemctl reload nginx
```

Comprobar:

```bash
grep -E "listen 443|ssl_certificate" /etc/nginx/sites-available/app.servial.edu.co.conf
grep -E "listen 443|ssl_certificate" /etc/nginx/sites-available/servial.edu.co.conf
```

Volver Cloudflare a **Full (strict)** cuando el certificado esté OK.

### Regla

> **No hagas solo `sudo cp deploy/nginx/*.conf` en producción** sin volver a ejecutar Certbot o `setup-nginx-ssl-servial.sh`.

---

## 5. Curso no carga / 404 en `/uploads/`

### Qué pasa

El curso **no está en disco** en la VPS (los ZIP/carpetas **no van en Git**).

### Dónde deben estar (Servial)

```text
/opt/argo-servial/data/uploads/aula-virtual-cursos/{idPrograma}/index.html
```

### Diagnóstico

```bash
ls -la /opt/argo-servial/data/uploads/aula-virtual-cursos/
du -sh /opt/argo-servial/data/uploads/aula-virtual-cursos/*/
curl -sI http://127.0.0.1:5012/uploads/aula-virtual-cursos/11/index.html
```

- **404** → subir paquete (§ 1) o copiar carpeta
- **200** → el paquete existe; revisar acceso del alumno (pago, matrícula, `publicadoPortal`)

---

## 6. Timeout al cargar PDFs/videos del curso (504)

### Qué pasa

Nginx corta la descarga de archivos grandes en `/uploads/` (timeout por defecto ~60 s).

### Qué hacer

En nginx del host, bloque `/uploads/` debe incluir (snippet del repo):

```nginx
proxy_read_timeout 600s;
proxy_send_timeout 600s;
proxy_connect_timeout 600s;
proxy_buffering off;
```

Servial: `deploy/nginx/snippets/argo-uploads-proxy.conf` incluido en `servial.edu.co.conf`.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Disco lleno (507)

```bash
df -h /opt/argo-servial/data
```

El curso descomprimido puede ocupar **250 MB+**. Dejar al menos **1 GB libre** antes de subir.

---

## Checklist antes de subir un curso grande (Servial)

```bash
# 1. Espacio
df -h /opt/argo-servial/data

# 2. API viva
curl -sf http://127.0.0.1:5012/api/health && echo OK

# 3. Límite backend
grep AULA_VIRTUAL_ZIP_MAX_MB /opt/argo-servial/deploy/.env

# 4. Nginx ERP (400m en 443)
grep client_max_body_size /etc/nginx/sites-available/app.servial.edu.co.conf

# 5. Subida
#    - ZIP > 100 MB → usar upload-curso-zip-vps.sh (§ 1)
#    - ZIP < 100 MB → ERP normal o script

# 6. Verificar paquete
curl -sI http://127.0.0.1:5012/uploads/aula-virtual-cursos/11/index.html
```

---

## Puertos y rutas de referencia

| Cliente | Carpeta | API | ERP | Portal |
|---------|---------|-----|-----|--------|
| **Servial** | `/opt/argo-servial` | **5012** | **8093** | **8095** |
| **Finstruvial / Educarte** | `/opt/argo` | **5002** | **8083** | **8085** |

| Dominio Servial | Uso |
|-----------------|-----|
| `app.servial.edu.co` | ERP (subir ZIP desde UI) |
| `servial.edu.co` | Portal (alumnos abren curso) |

---

## Archivos útiles en el repo

| Archivo | Para qué |
|---------|----------|
| `deploy/upload-curso-zip-vps.sh` | Subir ZIP bypass Cloudflare |
| `deploy/setup-nginx-ssl-servial.sh` | Nginx + Certbot Servial |
| `deploy/nginx/app.servial.edu.co.conf` | Plantilla ERP |
| `deploy/nginx/servial.edu.co.conf` | Plantilla portal |
| `deploy/nginx/snippets/argo-uploads-proxy.conf` | Timeouts `/uploads/` |
| `deploy/DEPLOY-SERVIAL.md` | Despliegue general Servial |

---

*Última actualización: septiembre 2026 — casos reales: mercancías peligrosas, Cloudflare 413, nginx 526 Servial.*
