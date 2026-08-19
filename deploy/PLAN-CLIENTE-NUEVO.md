# Plan de implementación — Cliente nuevo en VPS compartido

Guía de **planificación y ejecución** para agregar un cliente adicional a ARGO cuando:

- Se usa **el mismo repositorio Git** para todos los clientes (sin fork ni rama por cliente).
- El nuevo cliente va en **el mismo VPS** que un cliente existente, en **otra carpeta** (dos instalaciones ARGO independientes).
- El portal del **aula virtual** tendrá **colores y diseño propios** (tú lo mantienes como admin desde el ERP).
- **No** se usa `argo-sitio` (solo ERP + aula virtual + apps móviles).
- Una **regla de negocio nueva** aplica solo a este cliente, pero se implementa en el **producto base** como **opción activable en Configuración** (toggle on/off por instalación), no como variable de entorno ni rama Git.

---

## Resumen ejecutivo

| Decisión | Elección |
|----------|----------|
| Repositorio | **Uno solo** (`main` en GitHub) |
| Separación entre clientes | **Carpeta + `.env` + Mongo + dominios** en el VPS |
| Diseño portal | **Config en Mongo** (Aula virtual → Sitio del portal) |
| Regla de negocio exclusiva | **Toggle en Configuración ERP** (desactivado por defecto en otras instalaciones) |
| Orden de trabajo | **1. Local → 2. Pruebas → 3. Migración al VPS** |
| `argo-sitio` | **No desplegar** |

---

## Fase 0 — Antes de escribir código

Recopilar del cliente 3:

| Dato | Ejemplo | ¿Listo? |
|------|---------|---------|
| Nombre comercial / CEA | Acme Formación | ☐ |
| Dominio portal alumnos | `acme.edu.co` | ☐ |
| Dominio ERP staff | `app.acme.edu.co` | ☐ |
| IP del VPS (compartido) | misma que cliente existente | ☐ |
| Carpeta en el VPS | `/opt/argo-acme` | ☐ |
| Colores / referencia visual | logo, hex, sitio de referencia | ☐ |
| SMTP del cliente | cuenta correo transaccional | ☐ |
| Wompi (si pago en línea) | claves del comercio | ☐ |
| Turnstile (captcha) | site key + secret | ☐ |
| **Descripción exacta de la regla de negocio nueva** | ver sección 5 | ☐ |

---

## Fase 1 — Desarrollo en local (tu PC)

Todo el trabajo de producto se hace **una vez** en `main`. Luego cada instalación activa o no lo que necesite.

### 1.1 Regla de negocio (toggle en configuración)

**Patrón acordado:** no `FEATURE_XXX` en `.env`, sino documento en colección `config` (como alertas, facturación, aula virtual).

**Implementación prevista:**

1. **Backend:** servicio `configCliente.js` (o ampliar módulo existente) con clave Mongo, p. ej. `reglas_cliente`.
2. **Campos iniciales** (ajustar cuando se defina la regla):
   ```js
   {
     clave: 'reglas_cliente',
     // Ejemplo — renombrar según la regla real:
     activarReglaXxx: false,  // default: apagado en todas las instalaciones
     // parámetros opcionales de la regla...
   }
   ```
3. **ERP:** pantalla en **Configuración** (solo admin) con interruptor + ayuda contextual.
4. **Lógica de negocio:** donde aplique la regla, consultar `await reglaXxxActiva()` antes de ejecutar el comportamiento distinto.
5. **Cliente 3 en producción:** tras el deploy, activas el toggle en su ERP.
6. **Clientes 1 y 2:** el toggle queda en **off** → comportamiento actual sin cambios.

> **Ventaja:** un solo `git pull` en todos los VPS; cada cliente decide en su propia base de datos.

**Pendiente definir contigo:** nombre de la regla, módulo afectado (matrícula, certificados, jornadas, pagos, etc.) y comportamiento exacto.

### 1.2 Diseño del portal (aula virtual)

No requiere cambios de código para colores básicos:

1. En local: ERP → **Aula virtual → Sitio del portal**.
2. Aplicar plantilla de galería (Finstruvial, Cotransvial u otra) o ajustar tema manualmente.
3. Exportar JSON del diseño (`argo-portal-diseno`) como respaldo.
4. En producción del cliente 3: importar o replicar desde la galería.

Archivos de referencia en el repo:

- `argo-frontend/src/app/core/constants/portal-plantillas.ts` — presets de color
- `argo-backend/src/services/aulaVirtualPortal.js` — persistencia en Mongo

Si el cliente 3 necesita una **plantilla nueva con nombre** (p. ej. en galería), se puede añadir un preset en `portal-plantillas.ts` en `main` (no rompe a otros clientes; solo es una opción más en la galería).

### 1.3 Pruebas locales

| Prueba | Cómo |
|--------|------|
| Regla off (default) | Comportamiento igual que clientes actuales |
| Regla on | Comportamiento nuevo solo cuando el toggle está activo |
| Portal | Colores y secciones en `localhost:4202` |
| Correos / certificados / recibos | SMTP de prueba en `.env` local |
| Apps móviles | Apuntar al backend local o staging |

Checklist local:

- [ ] Toggle de regla visible en Configuración
- [ ] Con toggle **off**: flujos existentes sin regresión
- [ ] Con toggle **on**: regla nueva funciona según especificación
- [ ] Portal con colores del cliente 3
- [ ] `pnpm`/build sin errores en backend, frontend y aula-virtual
- [ ] Commit + push a `main`

---

## Fase 2 — Preparar segunda instalación en el VPS (mismo servidor)

Ver detalle técnico en [GUIA-NUEVO-CLIENTE-VPS.md § Dos instalaciones en un mismo VPS](./GUIA-NUEVO-CLIENTE-VPS.md#dos-instalaciones-en-un-mismo-vps).

### 2.1 Estructura en disco

```
/opt/
├── argo-cliente-a/          ← instalación existente (sin tocar puertos)
│   ├── deploy/.env
│   ├── data/
│   └── docker compose → puertos 5002, 8083, 8085
│
└── argo-cliente-c/          ← cliente nuevo
    ├── deploy/.env          ← secretos y dominios NUEVOS
    ├── data/                ← vacío al inicio
    └── docker compose → puertos 5012, 8093, 8095 (ejemplo)
```

### 2.2 Puertos — no compartir entre instalaciones

| Servicio | Cliente A (existente) | Cliente C (nuevo) |
|----------|----------------------|-------------------|
| API `argo-backend` | `5002:3000` | `5012:3000` |
| ERP `argo-frontend` | `8083:80` | `8093:80` |
| Portal `argo-aula-virtual` | `8085:80` | `8095:80` |
| `argo-sitio` | (opcional) | **No levantar** |
| MongoDB | volumen `argo_mongo_data` | volumen `argo_acme_mongo_data` |

Usar **proyecto Compose distinto** para no mezclar contenedores:

```bash
cd /opt/argo-cliente-c
export COMPOSE_PROJECT_NAME=argo-acme
docker compose up -d
```

### 2.3 Servicios a levantar (cliente 3)

```bash
docker compose up -d argo-mongo argo-backend argo-frontend argo-aula-virtual
# NO: argo-sitio
```

### 2.4 Nginx

Dos pares de `server_name` adicionales apuntando a los **puertos del cliente C**:

- `app.cliente-c.com` → `127.0.0.1:8093`
- `portal.cliente-c.com` → `127.0.0.1:8095`
- API y `/uploads/` del portal → `127.0.0.1:5012`

Certbot con los dominios nuevos (no reutilizar certificado del otro cliente).

### 2.5 `deploy/.env` del cliente 3

Generar **todo nuevo** (nunca copiar del otro cliente):

- `JWT_SECRET` — `openssl rand -hex 32`
- `BACKUP_CLAVE_CIFRADO` — frase única
- `CORS_ORIGIN` — solo dominios del cliente C
- `PORTAL_SITE_URL` — URL del portal del cliente C
- `MFA_TOTP_ISSUER` — nombre del cliente C
- SMTP, Wompi, Turnstile — cuentas del cliente C
- Soporte maestro — credenciales distintas (recomendado)

Plantilla: `deploy/env.example`

---

## Fase 3 — Configuración funcional en producción (cliente 3)

Orden recomendado en el ERP (`https://app.cliente-c.com`):

1. **Configuración → Empresa** — NIT, razón social, logo.
2. **Configuración → Sedes** — sede principal.
3. **Configuración → Comprobantes de caja** — prefijos CI/CE.
4. **Configuración → Certificados** — plantillas por tipo.
5. **Aula virtual → Sitio del portal** — colores, hero, secciones (o importar JSON de local).
6. **Configuración → [Regla nueva]** — activar toggle **solo aquí**.
7. **Configuración → Roles y usuarios** — personal del cliente.
8. **Sistema → Copias de seguridad** — programar respaldo automático.
9. Migración de datos históricos (si aplica): **Sistema → Migración**.

---

## Fase 4 — Apps móviles

Cada instalación expone su propia API en `app.<dominio-cliente>.com`.

| App | Acción |
|-----|--------|
| Cajero | Build o configuración con URL del cliente C |
| Aula móvil | Idem |
| APK en portal | Subir a `/apk` del contenedor `argo-aula-virtual` del cliente C |

Si hoy las apps tienen URL fija de un solo cliente, planificar build por cliente o selector de URL en la app.

---

## Fase 5 — Actualizaciones futuras

En **cada carpeta** del VPS, de forma independiente:

```bash
cd /opt/argo-cliente-c
git pull origin main
docker compose build argo-backend argo-frontend argo-aula-virtual
docker compose up -d --force-recreate argo-backend argo-frontend argo-aula-virtual
```

El toggle de la regla de negocio **persiste en Mongo** del cliente; un deploy de código no lo apaga ni lo enciende solo.

---

## Qué NO hacer

| Error | Por qué |
|-------|---------|
| Repo Git por cliente | Duplicas mantenimiento sin beneficio |
| Rama permanente por cliente | Difícil mezclar mejoras del producto |
| Dos clientes, un solo Mongo | Mezcla datos — inaceptable |
| Mismos puertos Docker en el VPS | Conflicto entre instalaciones |
| Copiar `deploy/.env` entre clientes | Compromete seguridad (JWT, backups) |
| Regla de negocio solo en `.env` | Obliga a redeploy para activar/desactivar |
| Levantar `argo-sitio` si no lo usan | Recursos y nginx innecesarios |

---

## Cronograma sugerido

| Etapa | Actividad | Responsable |
|-------|-----------|-------------|
| **S1** | Definir regla de negocio (especificación escrita) | Tú + cliente |
| **S2** | Implementar toggle + lógica en local | Desarrollo |
| **S3** | Diseño portal en local / plantilla | Tú (admin) |
| **S4** | Pruebas locales + commit a `main` | Desarrollo |
| **S5** | Crear carpeta VPS, puertos, `.env`, nginx, SSL | Ops |
| **S6** | Deploy imágenes + config ERP + activar toggle | Ops + tú |
| **S7** | Migración datos (si hay) + capacitación | Tú + cliente |
| **S8** | Apps móviles apuntando al dominio correcto | Desarrollo |

---

## Documentación relacionada

| Archivo | Contenido |
|---------|-----------|
| [GUIA-NUEVO-CLIENTE-VPS.md](./GUIA-NUEVO-CLIENTE-VPS.md) | Instalación, seguridad, dos carpetas en un VPS |
| [GUIA-GIT-DESPLIEGUE.md](./GUIA-GIT-DESPLIEGUE.md) | Commit, push, deploy día a día |
| [SOPORTE-MAESTRO-GUIA.md](./SOPORTE-MAESTRO-GUIA.md) | Acceso proveedor por instalación |
| [GUIA-PASARELA-WOMPI.md](./GUIA-PASARELA-WOMPI.md) | Pago en línea por cliente |

---

## Siguiente paso inmediato

1. **Tú:** describir la regla de negocio nueva (módulo, disparador, comportamiento con toggle on/off).
2. **Desarrollo:** implementar toggle en Configuración + lógica en local.
3. **Tú:** definir colores/plantilla del portal en local.
4. **Cuando local esté estable:** ejecutar Fase 2 en el VPS siguiendo esta guía.

---

*Última actualización: agosto 2026 — plan cliente 3, VPS compartido, regla configurable en ERP.*
