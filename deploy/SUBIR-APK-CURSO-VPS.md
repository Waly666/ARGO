# Subir APK de curso virtual en producción (WinSCP + VPS)

Guía repetible para publicar el **APK Android offline** de un curso cuando el archivo pesa **más de ~100 MB** o la subida desde el ERP se queda en «Subiendo…» / falla con **413**.

ARGO guarda el APK en el servidor y registra la ruta en Mongo; el alumno lo descarga desde **Mi aula → Tus cursos** según la regla **Al matricular** / **Al pagar** (ERP → curso → *Reglas y acceso*).

---

## ¿Por qué no subir solo desde el ERP?

| Origen | Límite habitual |
|--------|------------------|
| **Cloudflare** (nube naranja en `app.*.edu.co`) | ~**100 MB** máximo en `POST` |
| **VPS + nginx + backend** | hasta **400 MB** (config actual) |

Un APK de **141 MB** suele funcionar en local pero **no** a través de Cloudflare. Solución: copiar el archivo al servidor con **WinSCP** y ejecutar `deploy/upload-curso-apk-vps.sh` (llama al API en `127.0.0.1`, sin Cloudflare).

---

## Rutas importantes en la VPS

| Qué | Carpeta |
|-----|---------|
| **Donde usted deja el archivo con WinSCP** (paso temporal) | `/tmp/` — ej. `/tmp/curso-13.apk` |
| **Donde ARGO guarda el APK después del script** (Servial) | `/opt/argo-servial/data/uploads/aula-virtual-apk/{idPrograma}/` |
| **Donde ARGO guarda el APK** (Finstruvial) | `/opt/argo/data/uploads/aula-virtual-apk/{idPrograma}/` |
| **Repositorio / scripts** | `/opt/argo-servial` (Servial) o `/opt/argo` (Finstruvial) |

No copie el APK **a mano** solo dentro de `uploads/aula-virtual-apk/`: el ERP no quedaría enlazado. Use siempre el **script** (o la subida ERP con Cloudflare en **DNS only** — ver [Alternativa: nube gris](#alternativa-nube-gris-cloudflare)).

---

## Referencia por cliente

| Cliente | Carpeta en VPS | Puerto API local | ERP producción |
|---------|----------------|------------------|----------------|
| **Servial** | `/opt/argo-servial` | **5012** | `https://app.servial.edu.co` |
| **Finstruvial** | `/opt/argo` | **5002** | `https://app.finstruvial.edu.co` |

Contenedor backend (logs): `argo-servial-backend` o `argo-backend`.

---

## Requisitos previos

1. Código en el servidor actualizado (incluye el script):

   ```bash
   cd /opt/argo-servial    # o /opt/argo
   git pull origin main
   chmod +x deploy/upload-curso-apk-vps.sh
   ```

2. Conocer el **`idPrograma`** del curso (ERP → Aula virtual → curso → URL o ficha, ej. `13`).

3. Acceso **SFTP/SSH** al VPS (WinSCP + PuTTY o terminal).

4. El curso debe admitir modalidad virtual (tarifa virtual configurada), igual que para el ZIP.

---

## Paso 1 — Copiar el APK con WinSCP

1. Abra **WinSCP** → sesión **SFTP** (o SCP).
2. **Host:** IP del VPS · **Usuario** y **contraseña** (o clave privada).
3. Conecte.
4. Panel **izquierdo** (PC): carpeta donde está el `.apk`.
5. Panel **derecho** (servidor): abra **`/tmp/`**.
6. Arrastre el archivo, por ejemplo: **`/tmp/curso-13.apk`**.
7. Espere a que termine la transferencia (archivos grandes pueden tardar varios minutos).

Comprobar por SSH:

```bash
ls -lh /tmp/curso-13.apk
```

Debe mostrar el tamaño esperado (ej. 141M).

> El nombre del archivo en `/tmp/` puede ser cualquiera; use la **misma ruta** en el comando del paso 3.

---

## Paso 2 — Obtener token JWT del ERP

1. En el navegador, entre al ERP de producción (Servial o Finstruvial) y **inicie sesión**.
2. **F12** → pestaña **Red** / **Network**.
3. Navegue (ej. Aula virtual) hasta aparecer una petición a **`/api/...`**.
4. Clic en la petición → **Encabezados** → **`Authorization: Bearer eyJ...`**
5. Copie **solo** el token (la parte después de `Bearer `), **sin** la palabra `Bearer`.

Si el script responde **401**, el token expiró: genere uno nuevo y repita.

---

## Paso 3 — Ejecutar el script en la VPS

Conéctese por **SSH** (PuTTY, terminal integrada de WinSCP: *Comandos → Abrir en PuTTY*, etc.).

### Servial

```bash
cd /opt/argo-servial
curl -sf http://127.0.0.1:5012/api/health && echo " API OK"

bash deploy/upload-curso-apk-vps.sh /tmp/curso-13.apk 13 'PEGA_EL_TOKEN_AQUI'
```

### Finstruvial

```bash
cd /opt/argo
curl -sf http://127.0.0.1:5002/api/health && echo " API OK"

bash deploy/upload-curso-apk-vps.sh /tmp/curso-16.apk 16 'PEGA_EL_TOKEN_AQUI'
```

**Parámetros:**

| # | Significado | Ejemplo |
|---|-------------|---------|
| 1 | Ruta del APK **en el servidor** | `/tmp/curso-13.apk` |
| 2 | `idPrograma` | `13` |
| 3 | Token JWT | `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'` |

**Éxito:** JSON con `message` y `config` (APK publicada).

Forzar puerto si hace falta:

```bash
ARGO_API_PORT=5012 bash deploy/upload-curso-apk-vps.sh /tmp/curso-13.apk 13 'TOKEN'
```

---

## Paso 4 — Verificar

**En disco (Servial):**

```bash
ls -lh /opt/argo-servial/data/uploads/aula-virtual-apk/13/
```

**En el ERP:** Aula virtual → curso → pestaña **Contenido** → debe verse APK publicada y nombre de archivo.

**En el portal:** alumno matriculado (y pago si aplica) → **Mi aula → Tus cursos** → **Descargar APK**.

---

## Errores frecuentes

| Síntoma | Causa probable | Qué hacer |
|---------|----------------|-----------|
| ERP se queda «Subiendo…» minutos | Cloudflare >100 MB | Use esta guía (WinSCP + script) |
| HTTP **401** | Token inválido o expirado | Nuevo token desde F12; sin `Bearer` duplicado |
| HTTP **400** | Curso sin virtual, APK no válido | Lea `message` en el JSON del script |
| HTTP **413** | Límite nginx/multer | `client_max_body_size` en nginx; APK máx. 400 MB en backend |
| `No existe /tmp/...` | Ruta mal escrita en el script | `ls -lh` y repita con la ruta correcta |
| Script no encontrado | `git pull` pendiente | `cd /opt/argo-servial && git pull && chmod +x deploy/upload-curso-apk-vps.sh` |

Respuesta del script guardada en: `/tmp/argo-upload-apk-resp.json` (revisar con `cat`).

---

## Alternativa: nube gris (Cloudflare)

Si el APK pesa **menos de ~100 MB** o acepta el riesgo de timeout:

1. Cloudflare → DNS → `app.servial.edu.co` (o Finstruvial) → **DNS only** (nube **gris**).
2. Suba el APK desde el ERP → **Contenido**.
3. Vuelva a **Proxied** (nube **naranja**).

Para APK grandes, **WinSCP + script** es más fiable.

---

## Cuándo subir desde el ERP (navegador)

| Tamaño APK | Recomendación |
|------------|----------------|
| &lt; ~80 MB | ERP en producción (con Cloudflare) suele bastar |
| &gt; ~100 MB | **WinSCP + `upload-curso-apk-vps.sh`** |

En desarrollo local (`localhost`) no aplica el límite de Cloudflare.

---

## Documentos relacionados

| Archivo | Contenido |
|---------|-----------|
| [DEPLOY-SERVIAL.md](./DEPLOY-SERVIAL.md) | Despliegue Docker Servial (`git pull`, `build`, `up`) |
| [GUIA-CURSOS-VIRTUALES-VPS.md](./GUIA-CURSOS-VIRTUALES-VPS.md) | ZIP grandes, 413, Cloudflare, `upload-curso-zip-vps.sh` |
| `deploy/upload-curso-apk-vps.sh` | Script de subida APK |
| `deploy/upload-curso-zip-vps.sh` | Script de subida paquete ZIP |

---

## Checklist rápido (Servial)

- [ ] `git pull` en `/opt/argo-servial`
- [ ] WinSCP → APK en `/tmp/curso-XX.apk`
- [ ] Token JWT desde `https://app.servial.edu.co`
- [ ] `bash deploy/upload-curso-apk-vps.sh /tmp/curso-XX.apk XX 'TOKEN'`
- [ ] Verificar ERP **Contenido** y portal **Descargar APK**
