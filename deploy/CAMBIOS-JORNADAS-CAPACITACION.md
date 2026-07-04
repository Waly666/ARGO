# Cambios — Jornadas de capacitación (ARGO frontend + backend + móvil)

Documento **vivo** para registrar cada cambio del módulo de **jornadas de capacitación** en este repo (**Finstruvial / ARGO**) y poder **replicarlo** en otros despliegues (p. ej. Educarte, otro cliente con fork o copia del producto).

---

## Cómo usar este documento

1. **Antes de codificar:** anotar aquí el cambio pedido (sección «Pendientes»).
2. **Al terminar en ARGO:** completar la entrada en «Historial de cambios» (archivos, commits, pasos).
3. **En el otro repo:** seguir la misma entrada como checklist; marcar qué aplica y qué no (cada cliente puede pedir variantes).

| Campo | Descripción |
|-------|-------------|
| **ID** | `JOR-001`, `JOR-002`, … (incremental) |
| **Cliente origen** | Donde se implementó primero (ej. Finstruvial) |
| **Alcance** | `frontend` \| `backend` \| `móvil` \| combinación |
| **Commit ARGO** | Hash en `main` cuando se suba |
| **¿Replica obligatoria?** | Sí / No / Parcial (explicar) |

---

## Repos y contexto

| Repo | Ruta local (ejemplo) | Notas |
|------|----------------------|-------|
| **ARGO (Finstruvial)** | `c:\proyectos-js\ARGO` | Repo producto; cambios base documentados aquí |
| **Otro cliente** | `c:\proyectos-js\ARGO-EDUCARTE` (u otro) | Replicar según historial; adaptar textos/branding si aplica |

**Rama habitual:** `main`  
**Despliegue web:** ver [GUIA-GIT-DESPLIEGUE.md](./GUIA-GIT-DESPLIEGUE.md) (si existe) o checklist al final.  
**API producción (móvil):** `https://app.finstruvial.edu.co/api`  
**App móvil:** carpeta `argo-mobile-jornadas/` (Expo / EAS). Conectar Expo al monorepo con **Base directory** = `argo-mobile-jornadas`.

### Commits de referencia (lote principal)

| Commit | Resumen |
|--------|---------|
| `47c79d7` | Lote grande: móvil, informes, carpas, meta alumnos, QR, operación en campo |
| `9be6d70` | Móvil: `X-ARGO-Cliente: jornadas` en todas las peticiones |
| `a679da9` | Móvil: arranque al login + script `start:tunnel` |

---

## Mapa del módulo (referencia para replicar)

### Rutas ERP (`argo-frontend`)

| Ruta | Componente | Permisos |
|------|------------|----------|
| `/app/jornadas` | `jornadas-hub.component` | `jornadas.ver`, `jornadas.gestionar`, `jornadas.operar` |
| `/app/jornadas/instructor` | `jornada-instructor.component` | `jornadas.operar`, `jornadas.gestionar` |
| `/app/jornadas/clases-hoy` | `clases-hoy-lista.component` | `jornadas.ver`, `jornadas.gestionar`, `jornadas.operar` |
| `/app/jornadas/en-proceso` | `jornadas-en-proceso-lista.component` | `jornadas.ver`, `jornadas.gestionar` |
| `/app/jornadas/certificados` | `certificados-jornada-lista.component` | `jornadas.ver`, `jornadas.gestionar` |
| `/app/jornadas/informes` | `jornadas-informes.component` | `jornadas.ver`, `jornadas.gestionar` |
| `/app/jornadas/alumnos` | alumnos (modo jornadas) | `alumnos.*`, `jornadas.ver` |
| `/app/contratos` | `contratos-lista.component` | `jornadas.ver`, `jornadas.gestionar` |

Definición en: `argo-frontend/src/app/app.routes.ts`  
Menú: `argo-frontend/src/app/layout/shell/shell.component.ts` (grupo **Jornadas Cap.** → Informes).

### Frontend — carpetas y servicios clave

```
argo-frontend/src/app/features/jornadas/
  jornadas-hub.component.*
  jornada-instructor.component.*
  jornada-clase-editor.component.*
  clases-hoy-lista.component.*
  jornadas-en-proceso-lista.*
  certificados-jornada-lista.*
  jornadas-informes.component.*       # Informes pantalla + PDF + Excel
  jornadas-informe-document.ts        # HTML/PDF con encabezado empresa
  jornada-alumno-qr.util.ts           # Payload QR ARGOJOR|1|doc|nombre
  jornada-etiqueta-qr.service.ts      # Impresión etiquetas QR
  meta-alumnos-jornada-banner.*       # Alarma tope alumnos
  contratos-lista.component.*
  jornada-ui.util.ts                  # Cápsulas, labels, capCarpa (rosa)

argo-frontend/src/app/features/alumnos/
  alumno-jornada-qr-panel.component.ts
  tabs/datos-principales.*            # Panel QR en ficha alumno

argo-frontend/src/app/core/services/
  jornada-cap.service.ts
  meta-alumnos-jornada-alert.service.ts
  jornada-live-sync.service.ts
  certificado-jornada-alert.service.ts
  certificado-jornada-bloqueo.service.ts
```

### Backend

```
argo-backend/src/routes/jornadas.js
argo-backend/src/controllers/jornadaCapController.js
argo-backend/src/controllers/programaController.js   # idCarpa en programas jornada
argo-backend/src/middleware/turnstile.js             # X-ARGO-Cliente: jornadas
argo-backend/src/models/ClaseJornadaCap.js           # idCarpa
argo-backend/src/models/catalogos.js                 # catálogo carpas
argo-backend/src/services/catalogoMeta.js
argo-backend/src/services/carpaJornada.js
argo-backend/src/services/contratoJornadaSync.js
argo-backend/src/services/metaAlumnosJornada.js
argo-backend/src/services/informesJornadaCap.js
argo-backend/src/services/programacionClasesJornada.js
argo-backend/src/services/asistenciaJornadaCap.js
argo-backend/src/services/instructorJornada.js
argo-backend/src/services/certificadoJornadaAuto.js
```

### App móvil (`argo-mobile-jornadas`)

```
argo-mobile-jornadas/
  app.config.ts / eas.json / package.json
  src/config/apiBase.ts          # Default: https://app.finstruvial.edu.co/api
  src/api/client.ts              # X-ARGO-Cliente: jornadas en todas las peticiones
  src/screens/                   # Home, JornadasHoy, Clases, ClaseDetalle, Certificados
  src/utils/jornadaAlumnoQr.ts
  src/utils/metaAlumnosAlert.ts
```

**Login nativo:** header `X-ARGO-Cliente: jornadas` (sin Turnstile; MFA solo web si `MFA_STAFF_WEB_ONLY=1`).  
**Permiso mínimo:** `jornadas.operar` o `jornadas.gestionar`.

### Endpoints nuevos / relevantes

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/jornadas/informes` | JSON informes (filtros contrato/jornada/clase/fechas) |
| GET | `/api/jornadas/informes/export` | Excel (`tipo=completo\|por-clase\|por-jornada\|por-contrato\|certificados`) |
| GET | `/api/jornadas/jornadas/del-dia` | Jornadas del día + `totalClases`, `alumnosLleva`, `metaAlumnos`, `metaAlcanzada` |
| POST | `/api/auth/login` | Con `X-ARGO-Cliente: jornadas` → sesión sin MFA web |
| GET | `/api/auth/config` | Config pública (no existe `config-publica`) |

---

## Plantilla por cambio (copiar y rellenar)

```markdown
### JOR-XXX — Título corto del cambio

- **Fecha:** YYYY-MM-DD
- **Cliente origen:** Finstruvial
- **Alcance:** frontend | backend | móvil | …
- **Commit ARGO:** `xxxxxxxx`
- **Replica en otro repo:** Sí | No | Parcial

#### Qué pide el cliente / problema
…

#### Qué se hizo
…

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-frontend/...` | … |

#### Pasos para replicar en otro repo
1. …
2. …

#### Variantes por cliente
| Cliente | ¿Aplica? | Notas |
|---------|----------|-------|
| Finstruvial | Sí | … |
| Educarte | … | … |

#### Verificación
- [ ] Build frontend OK
- [ ] Flujo probado: …
- [ ] Backend (si aplica): …
- [ ] Móvil (si aplica): …
```

---

## Pendientes (próximos cambios)

| ID | Descripción | Prioridad | Notas |
|----|-------------|-----------|-------|
| — | _(Sin pendientes abiertos en este documento)_ | — | Conectar Expo a GitHub (`Base directory` = `argo-mobile-jornadas`) y generar APK cuando el cliente lo pida |

---

## Historial de cambios

| ID | Fecha | Resumen | Commit | Alcance |
|----|-------|---------|--------|---------|
| JOR-010 | 2026-07-03 | App móvil: cliente nativo + arranque login + API producción | `9be6d70`, `a679da9` | móvil |
| JOR-009 | 2026-07-03 | Informes web: Excel, PDF con encabezado empresa, filtros contrato/jornada/clase | `47c79d7` | backend + frontend |
| JOR-008 | 2026-07-03 | Alarma tope alumnos jornada (meta `numeObjeJornada`) | `47c79d7` | backend + frontend + móvil |
| JOR-007 | 2026-07-03 | Catálogo carpas; programa → clase hereda carpa; sin «Carpa #» de índice | `47c79d7` | backend + frontend + móvil |
| JOR-006 | 2026-07-03 | QR alumno jornadas + etiquetas; registro móvil por QR | `47c79d7` | backend + frontend + móvil |
| JOR-005 | 2026-07-03 | App Expo instructores (campo): jornadas hoy, clases, certificados | `47c79d7` | móvil |
| JOR-004 | 2026-07-03 | UX cards, instructor en clase, finalizar/certificados, sin auto-reabrir | `47c79d7` | backend + frontend + móvil |
| JOR-003 | 2026-07-02 | Jornadas/clases extra con sync automático en contrato | `47c79d7` | backend + frontend |
| JOR-002 | 2026-07-02 | Contrato: clases/jornada, horas/clase, cert global/por_clase; autogenerar clases | `47c79d7` | backend + frontend |
| JOR-001 | 2026-07-02 | UX simplificada: pestaña Clases + modal «Nueva clase» | `47c79d7` | frontend |

---

### JOR-010 — Móvil: cliente nativo y arranque

- **Fecha:** 2026-07-03
- **Cliente origen:** Finstruvial
- **Alcance:** móvil
- **Commit ARGO:** `9be6d70`, `a679da9`
- **Replica en otro repo:** Sí (cambiar dominio API por cliente)

#### Qué se hizo
- Default API: `https://app.finstruvial.edu.co/api` (`apiBase.ts`, `eas.json`, `app.config.ts`).
- Migración automática si el servidor guardado era `localhost` / `infravial.cloud`.
- Header `X-ARGO-Cliente: jornadas` en **todas** las peticiones (Turnstile + MFA web omitidos si `MFA_STAFF_WEB_ONLY=1`).
- Login visible de inmediato (sin overlay de splash bloqueante).
- Scripts: `pnpm start:tunnel`, `pnpm start:lan`.

#### Verificación servidor
```bash
grep MFA_STAFF deploy/.env   # MFA_STAFF_WEB_ONLY=1
curl -sS -X POST https://app.finstruvial.edu.co/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-ARGO-Cliente: jornadas" \
  -d '{"username":"USUARIO","password":"CLAVE"}'
# Esperado: "step":"complete" + token
```

---

### JOR-009 — Informes de jornadas (pantalla, PDF, Excel)

- **Fecha:** 2026-07-03
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Menú **Jornadas Cap. → Informes** (`/app/jornadas/informes`).
- Pestañas: por clase, por jornada, por contrato, certificados.
- Filtros: **contrato**, **jornada**, **clase**, desde/hasta.
- Export Excel (pestaña o completo, varias hojas).
- PDF / imprimir con encabezado de empresa (colores azul oscuro tipo media carta).
- Pantalla en **tema oscuro**; PDF en papel blanco.
- Destacados grandes: código contrato, ID jornada, ID clase según filtros.
- PDF usa las **mismas filas filtradas** que la pantalla (no mezcla todos los contratos).

#### Archivos principales
| Área | Archivos |
|------|----------|
| Backend | `informesJornadaCap.js`, `jornadaCapController.js`, `jornadas.js` |
| Frontend | `jornadas-informes.component.*`, `jornadas-informe-document.ts`, `jornada-cap.service.ts`, `shell.component.ts`, `app.routes.ts` |

#### Verificación
- [ ] Consultar con contrato filtrado → solo ese contrato en tabla y PDF
- [ ] Filtrar jornada/clase → PDF refleja el recorte
- [ ] Excel completo descarga 4 hojas

---

### JOR-008 — Alarma tope de alumnos de la jornada

- **Fecha:** 2026-07-03
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend + móvil
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Meta = `numeObjeJornada` (alumnos del contrato ÷ jornadas).
- Alumnos distintos = unión inscripciones + asistencias de las clases de la jornada.
- Respuesta de asistencia/matricular incluye `metaJornada` (`metaAlcanzada`, `metaSuperada`, mensaje).
- Web: banner rosado en cabecera + sonido.
- Móvil: alerta al registrar alumno y banner en cards de jornadas de hoy.
- `GET .../jornadas/del-dia` devuelve `totalClases`, `alumnosLleva`, `metaAlumnos`, `metaAlcanzada`.

#### Archivos principales
| Área | Archivos |
|------|----------|
| Backend | `metaAlumnosJornada.js`, `jornadaCapController.js` |
| Frontend | `meta-alumnos-jornada-alert.service.ts`, `meta-alumnos-jornada-banner.*`, shell |
| Móvil | `metaAlumnosAlert.ts`, `JornadasHoyScreen.tsx`, `ClaseDetalleScreen.tsx` |

---

### JOR-007 — Catálogo Carpas (sin índice «Carpa #»)

- **Fecha:** 2026-07-03
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend + móvil
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Catálogo admin **`carpas`** (`idCarpa`, `nombre`, `activo`).
- Campo `idCarpa` en **programa** (solo jornadas) y en **clase** (heredado al asignar programa).
- UI: cápsula **rosa** (`capCarpa` / chip `pink`).
- Eliminado el uso de `indiceEnDia` como «Carpa #» en listas y etiquetas (el índice interno del día se mantiene en BD para no duplicar jornadas el mismo día).

#### Configuración operativa
1. Configuración → Catálogos → **Carpas** (crear nombres).
2. Programas (tipo jornada) → asignar carpa.
3. Al crear/editar clase con ese programa, la carpa se hereda.

---

### JOR-006 — QR de alumno (solo jornadas)

- **Fecha:** 2026-07-03
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend + móvil
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Payload: `ARGOJOR|1|{numDoc}|{nombre}`.
- Panel QR en ficha alumno (Datos principales / ruta alumnos jornadas).
- Etiqueta imprimible: empresa + fecha jornada (no «JORNADAS ARGO»).
- Móvil: escanear QR para registrar; no imprime QR tras el registro.
- Bloqueo si el alumno ya está certificado en el contrato.

---

### JOR-005 — App móvil instructores (campo)

- **Fecha:** 2026-07-03
- **Cliente origen:** Finstruvial
- **Alcance:** móvil
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí (cambiar branding/API)

#### Qué se hizo
- Proyecto Expo `argo-mobile-jornadas` (package `co.argo.jornadas`).
- Flujos: login → jornadas de hoy → clases → detalle (programa, ubicación, horario, cronómetro, registrar alumno, finalizar y emitir certificados).
- Cards verdes de marca; cápsulas de color; clases terminadas en gris fuerte con texto blanco.
- Cards de jornada: `CÓDIGO_CONTRATO — ID_JORNADA` (ID corto).

#### Expo / APK
- Código en monorepo: `argo-mobile-jornadas/`.
- En Expo: enlazar repo `Waly666/ARGO` y **Base directory** = `argo-mobile-jornadas`.
- Perfiles EAS `preview` / `production` generan APK con API `https://app.finstruvial.edu.co/api`.

---

### JOR-004 — Operación de clase e instructor

- **Fecha:** 2026-07-03
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend + móvil
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Instructor ve: clases **PROGRAMADA sin instructor** + **propias** (cualquier estado).
- Al operar (iniciar/finalizar/asistencia/matricular) se asigna instructor (`idEmpleadoInstructor`, `idUsuarioInstructor`, `idinstructor`) también para quien tiene `jornadas.gestionar`.
- Un botón «Registrar alumno»: matricular + asistencia; certificados **al finalizar** la clase.
- Finalizar acepta `horaInicio`/`horaFin` opcionales.
- Eliminada la auto-reapertura de clases FINALIZADO al cargar (solo «Reabrir» manual sin asistencias).
- Listas recargan al volver del detalle (estado actualizado).

---

### JOR-003 — Jornadas y clases extra (sync contrato)

- **Fecha:** 2026-07-02
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Servicio `contratoJornadaSync.js`: recalcula `numerojornadas`, `numeObjeJornada`, `clasesPorJornada`.
- `POST /contratos/:id/jornadas` — jornada extra.
- Sync al eliminar jornada / crear o eliminar clase.
- UI: «Agregar jornada extra» en hub.

---

### JOR-002 — Contrato ampliado + autogeneración + calendario

- **Fecha:** 2026-07-02
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Campos: `clasesPorJornada`, `horasPorClase`, `tipoCertificado` (`global` | `por_clase`).
- Generar faltantes: jornadas y clases (horarios planificados, sin instructor/programa).
- Certificado por_clase o global según contrato.

---

### JOR-001 — UX simplificada en carga de clases

- **Fecha:** 2026-07-02
- **Cliente origen:** Finstruvial
- **Alcance:** frontend
- **Commit ARGO:** `47c79d7`
- **Replica en otro repo:** Sí

#### Qué se hizo
- Modal Nueva clase en pasos (día → ubicación → programa).
- Labels amigables de estado; botón **Abrir →**.

---

## Checklist de despliegue (Finstruvial)

```bash
cd /opt/argo
git pull origin main
docker compose build argo-backend argo-frontend
docker compose up -d --force-recreate argo-backend argo-frontend
docker compose ps
curl -sS -o /dev/null -w "%{http_code}\n" https://app.finstruvial.edu.co/api/auth/config
# Esperado: 200
```

Variables relevantes en `deploy/.env`:

```bash
MFA_STAFF_REQUIRED=1
MFA_STAFF_WEB_ONLY=1
# CORS debe incluir https://app.finstruvial.edu.co
```

Prueba login móvil:

```bash
curl -sS -X POST https://app.finstruvial.edu.co/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-ARGO-Cliente: jornadas" \
  -d '{"username":"USUARIO","password":"CLAVE"}'
# Esperado: "step":"complete"
```

---

## Checklist rápido al replicar en otro repo

```powershell
# 1. En ARGO: ubicar commits
git log --oneline -- argo-frontend/src/app/features/jornadas/ argo-backend/src/ argo-mobile-jornadas/

# 2. Diff del lote
git show 47c79d7 --stat

# 3. Build web
cd argo-frontend
pnpm exec ng build --configuration=development

# 4. Móvil: cambiar DEFAULT_API_BASE / eas.json al dominio del cliente
```

---

## Notas

- Preferir **commits pequeños y temáticos** por cambio de jornadas (`feat(jornadas): …` o `fix(jornadas): …`).
- Si un cambio es **solo Finstruvial**, marcar «Replica: No» y explicar por qué.
- Si un cambio toca permisos o menú, revisar `app.routes.ts` y `shell.component.ts`.
- **No** usar la ruta inventada `/api/auth/config-publica`; la correcta es `/api/auth/config`.
- Expo monorepo: **Base directory** = `argo-mobile-jornadas` (no se elige carpeta en GitHub; se configura en Expo).
