# Cambios — Jornadas de capacitación (ARGO frontend + backend + móvil)

Documento **vivo** para registrar cada cambio del módulo de **jornadas de capacitación** en este repo (**Finstruvial / ARGO**) y poder **replicarlo** en otros despliegues (p. ej. Educarte, otro cliente con fork o copia del producto).

**Última auditoría código ↔ MD:** 2026-07-13 — JOR-025 (`c092f0b`), JOR-026 (`0065414`); lote JOR-011…024 en `75f08b7`.

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
| `0065414` | Programas: persistir tipo capacitación y combos; nginx portal API/uploads → backend |
| `c092f0b` | idServ contrato configurable (Config → Jornadas); fallback 53 |
| `75f08b7` | Lote JOR-011…024: informes, cobro contrato, formularios, celular, hub jornadas |
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
| `/app/configuracion/jornadas` | `config-jornadas.component` | `jornadas.gestionar` |
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

argo-frontend/src/app/features/config/
  config-jornadas.component.*         # Modo operación fuera del día + idServ contrato (JOR-011, JOR-025)

argo-frontend/src/app/features/programas/
  programas-admin.component.*         # Alta/edición programas (JOR-026: tipo capacitación)

argo-frontend/src/app/shared/
  catalogo-enum-buscar/                 # Combobox formularios (JOR-026)

deploy/
  nginx/finstruvial.edu.co.conf         # Portal: /api y /uploads directo al backend (JOR-026)
  diagnose-vps-domains.sh               # Prueba HTTP cursos/API portal (JOR-026)

argo-frontend/src/app/core/services/
  jornada-cap.service.ts
  jornadas-operacion-config.service.ts
  programa.service.ts                 # excluirJornadasCap en matrícula (JOR-024)
  facturacion.service.ts              # Cobro contrato (JOR-021)
  meta-alumnos-jornada-alert.service.ts
  jornada-live-sync.service.ts
  certificado-jornada-alert.service.ts
  certificado-jornada-bloqueo.service.ts
  jornada-hub-deeplink.service.ts     # tab=avance (JOR-016)
```

### Backend

```
argo-backend/src/routes/jornadas.js
argo-backend/src/controllers/jornadaCapController.js
argo-backend/src/controllers/programaController.js   # idCarpa en programas jornada
argo-backend/src/middleware/turnstile.js             # X-ARGO-Cliente: jornadas
argo-backend/src/models/Contratacion.js          # plan cobro, programas, metas (JOR-012/013/021)
argo-backend/src/models/Ingreso.js               # idContrato en ingresos contrato (JOR-021)
argo-backend/src/models/JornadaCap.js
argo-backend/src/constants/servicioContratoCap.js
argo-backend/src/services/catalogoMeta.js
argo-backend/src/services/carpaJornada.js
argo-backend/src/services/contratoJornadaSync.js
argo-backend/src/services/metaAlumnosJornada.js
argo-backend/src/services/informesJornadaCap.js
argo-backend/src/services/programacionClasesJornada.js
argo-backend/src/services/programacionJornadas.js
argo-backend/src/services/asistenciaJornadaCap.js
argo-backend/src/services/instructorJornada.js
argo-backend/src/services/certificadoJornadaAuto.js
argo-backend/src/services/jornadaCapacitacion.js
argo-backend/src/services/configJornadasOperacion.js    # JOR-011
argo-backend/src/services/jornadasOperacionEspecial.js  # JOR-011
argo-backend/src/services/programasContratoJornada.js   # JOR-012
argo-backend/src/services/avanceContratoJornada.js      # JOR-016
argo-backend/src/services/contratoCobroCap.js           # JOR-021
argo-backend/src/services/cuentaCobroHtml.js            # JOR-021
argo-backend/src/services/servicioContratoCap.js        # JOR-021
argo-backend/src/services/facturaContratoCap.js         # JOR-021
argo-backend/src/controllers/certificadoController.js   # JOR-023 vencidos
argo-backend/src/controllers/ingresoController.js       # JOR-021
argo-backend/src/controllers/programaController.js        # idCarpa + excluirJornadasCap
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
| GET | `/api/jornadas/informes/export` | Excel (`tipo=completo\|contratos\|trazabilidad\|jornadas\|clases\|alumnos\|instructores\|certificados` + alias `resumen-contratos`, `catalogo-jornadas`, `catalogo-clases`) |
| GET | `/api/jornadas/contratos/:id/avance` | Panel avance contrato (JOR-016) |
| GET | `/api/jornadas/contratos/:id/cobro` | Estado plan de cobro / cuotas (JOR-021) |
| POST | `/api/jornadas/contratos/:id/comprobantes-ingreso` | Comprobante ingreso por cuota (JOR-021) |
| POST | `/api/jornadas/contratos/:id/cuenta-cobro/generar` | Generar cuenta de cobro (JOR-021) |
| GET | `/api/jornadas/contratos/:id/cuenta-cobro/html` | HTML imprimible cuenta de cobro (JOR-021) |
| GET | `/api/jornadas/config/operacion` | Config jornadas: modo especial + idServ contrato (JOR-011, JOR-025) |
| PUT | `/api/jornadas/config/operacion` | Actualizar config jornadas (JOR-011, JOR-025) |
| GET | `/api/jornadas/config/operacion/estado` | Estado efectivo para el usuario (JOR-011) |
| GET | `/api/jornadas/clases/:id/inscritos-clase-anterior` | Alumnos clase anterior misma jornada (JOR-019) |
| DELETE | `/api/jornadas/clases/:id` | Borrar clase (incl. finalizada; JOR-020) |
| PUT/DELETE | `/api/jornadas/certificados-generados/:id` | Editar / anular certificado jornada (JOR-017) |
| GET | `/api/jornadas/jornadas/del-dia` | Jornadas del día + `totalClases`, `alumnosLleva`, `metaAlumnos`, `metaAlcanzada` |
| POST | `/api/jornadas/:id/cerrar-operacion` | Cerrar jornada manual (modo operación especial) |
| POST | `/api/jornadas/:id/reabrir-operacion` | Reabrir jornada al estado por fecha (modo especial) |
| GET | `/api/programas?excluirJornadasCap=1` | Buscador programas sin jornadas CAP (JOR-024) |
| POST | `/api/jornadas/:id/cerrar-operacion` | Cerrar jornada manual (modo operación especial) |
| POST | `/api/jornadas/:id/reabrir-operacion` | Reabrir jornada al estado por fecha (modo especial) |
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
| — | VPS Finstruvial: Config → Jornadas → idServ **129** | Alta | Tras desplegar `c092f0b` |
| — | VPS: aplicar `deploy/nginx/finstruvial.edu.co.conf` + `nginx -t && systemctl reload nginx` | Alta | Tras `0065414` (portal cursos/API) |
| — | Verificación manual checklists JOR-011…026 | Media | Probar `/app/jornadas` y `/app/programas` |
| — | Conectar Expo a GitHub y generar APK | Baja | Cuando el cliente lo pida |

> **Nota auditoría 2026-07-13:** JOR-011…024 en `75f08b7`; JOR-025 en `c092f0b`; JOR-026 en `0065414`.

---

## Mapa archivos por commit (auditoría 2026-07-13)

Referencia cruzada **ID → archivos** por commit en `main` (útil al replicar en otro cliente).

| ID | Commit | Archivos nuevos | Archivos modificados relevantes |
|----|--------|-----------------|----------------------------------|
| **JOR-011** | `75f08b7` | `configJornadasOperacion.js`, `jornadasOperacionEspecial.js`, `config-jornadas.component.*`, `jornadas-operacion-config.service.ts` | `jornadaCapController.js`, `jornadas.js`, `asistenciaJornadaCap.js`, `estadoJornadaCap.js`, `jornadas-hub.*`, `jornada-clase-editor.*`, `jornada-instructor.*`, `clases-hoy-lista.*`, `app.routes.ts`, `shell.component.ts` |
| **JOR-012** | `75f08b7` | `programasContratoJornada.js` | `Contratacion.js`, `programacionClasesJornada.js`, `jornadaCapController.js`, `jornadas-hub.*`, `jornada-cap.service.ts` |
| **JOR-013** | `75f08b7` | — | `contratoJornadaSync.js`, `programacionJornadas.js`, `Contratacion.js`, `JornadaCap.js`, `jornadas-hub.*`, `jornada-calendario.util.ts` |
| **JOR-014** | `75f08b7` | — | `jornadaCapacitacion.js`, `asistenciaJornadaCap.js` |
| **JOR-015** | `75f08b7` | — | `certificadoJornadaAuto.js`, `jornadaCapController.js`, `jornadas-hub.*`, `jornada-clase-editor.*` |
| **JOR-016** | `75f08b7` | `avanceContratoJornada.js` | `jornadaCapController.js`, `jornadas.js`, `jornadas-hub.*`, `jornada-hub-deeplink.service.ts` |
| **JOR-017** | `75f08b7` | — | `jornadaCapController.js`, `jornadas.js`, `certificados-jornada-lista.*` |
| **JOR-018** | `75f08b7` | — | `certificadoJornadaAuto.js` |
| **JOR-019** | `75f08b7` | — | `jornadaCapController.js` (`alumnosClaseAnterior`), `jornadas-hub.*`, `jornada-clase-editor.*` |
| **JOR-020** | `75f08b7` | — | `jornadaCapController.js` (`eliminarClase`), `jornadas-hub.*`, `jornada-clase-editor.*` |
| **JOR-021** | `75f08b7` | `servicioContratoCap.js`, `contratoCobroCap.js`, `cuentaCobroHtml.js`, `constants/servicioContratoCap.js` | `Contratacion.js`, `Ingreso.js`, `ingresoController.js`, `facturaContratoCap.js`, `notaCredito.js`, `configRecibo.js`, `jornadas-hub.*`, `jornada-cap.service.ts`, `facturacion.service.ts` |
| **JOR-022** | `75f08b7` | — | `informesJornadaCap.js`, `jornadas-informes.component.*`, `jornada-cap.service.ts` |
| **JOR-023** | `75f08b7` | — | `certificadoController.js` |
| **JOR-024** | `75f08b7` | — | `programaController.js`, `programa.service.ts`, `servicios.component.ts` |
| **JOR-025** | `c092f0b` | `constants/servicioContratoCap.js` (si no venía de JOR-021) | `configJornadasOperacion.js`, `servicioContratoCap.js`, `config-jornadas.component.*`, `jornada-cap.service.ts`, `jornadaCapController.js`, `ingresoController.js` |
| **JOR-026** | `0065414` | — | `programas-admin.component.*`, `catalogo-enum-buscar/*`, `programaController.js`, `deploy/nginx/finstruvial.edu.co.conf`, `deploy/diagnose-vps-domains.sh` |
| **Compartidos** | `75f08b7` | `clase-modal.scss` | `form-modal.component.*`, `hora-12-input.component.scss` (UX modal clase) |

---

## Historial de cambios

| ID | Fecha | Resumen | Commit | Alcance |
|----|-------|---------|--------|---------|
| JOR-026 | 2026-07-13 | Programas: persistir tipo capacitación y combos; nginx portal API | `0065414` | backend + frontend + deploy |
| JOR-025 | 2026-07-09 | idServ contrato configurable (comprobantes/factura); fallback 53 | `c092f0b` | backend + frontend |
| JOR-024 | 2026-07-09 | Matrícula alumno (Servicios): ocultar programas de jornadas en buscador | `75f08b7` | backend + frontend |
| JOR-023 | 2026-07-09 | Certificados vencidos: no listar si hay vigente del mismo programa | `75f08b7` | backend |
| JOR-022 | 2026-07-09 | Informes: pestañas por entidad, filtros reactivos, limpiar filtros, sin bloque empresa en pantalla | `75f08b7` | backend + frontend |
| JOR-021 | 2026-07-08 | Cobro contrato: plan cuotas, comprobantes ingreso, factura contrato, cuenta de cobro | `75f08b7` | backend + frontend |
| JOR-020 | 2026-07-08 | Eliminar clases (incl. finalizadas) con anulación de certificados por_clase | `75f08b7` | backend + frontend |
| JOR-019 | 2026-07-09 | Copiar alumnos de la clase anterior de la misma jornada (matrícula rápida) | `75f08b7` | backend + frontend |
| JOR-018 | 2026-07-08 | Certificado por_clase: encabezado y horas del programa de la clase | `75f08b7` | backend |
| JOR-017 | 2026-07-08 | Anular/editar certificados generados en módulo Jornadas | `75f08b7` | backend |
| JOR-016 | 2026-07-08 | Panel avance contrato: clases dictadas, alumnos capacitados/certificados | `75f08b7` | backend + frontend |
| JOR-015 | 2026-07-08 | Emitir certificados al cerrar clase vía guardar horario (modo especial) + reprocesar | `75f08b7` | backend + frontend |
| JOR-014 | 2026-07-08 | Asignar empresa del contrato al matricular en jornada | `75f08b7` | backend |
| JOR-013 | 2026-07-08 | Metas de contrato estables + generar jornadas por rango inicio/fin | `75f08b7` | backend + frontend |
| JOR-012 | 2026-07-08 | Programas del contrato y reparto equitativo al autogenerar clases | `75f08b7` | backend + frontend |
| JOR-011 | 2026-07-08 | Config operación fuera del día programado (casos especiales / carga histórica) | `75f08b7` | backend + frontend |
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

### JOR-022 — Informes: pestañas por entidad, filtros reactivos y UI

- **Fecha:** 2026-07-09
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`
- **Replica en otro repo:** Sí

#### Problema
- Las pestañas «Por clase», «Por jornada» y «Por contrato» repetían el mismo listado de alumnos con distinta agrupación.
- Faltaba una vista resumida por tipo de registro (contratos, jornadas, clases, instructores, alumnos, certificados).
- Los filtros exigían pulsar **Consultar** manualmente.
- En pantalla aparecía el bloque de logo/datos de la empresa (NIT, teléfono, dirección…) innecesario para el uso diario.

#### Qué se hizo
- **Pestañas nuevas** (sin repetir alumnos × clase/jornada/contrato):
  - **Contratos** — resumen por contrato.
  - **Trazabilidad** — detalle alumno × jornada (agrupado por jornada; se mantiene para análisis fino).
  - **Jornadas** — catálogo de jornadas con conteos.
  - **Clases** — una fila por clase (programa, instructor, inscritos, asistieron).
  - **Instructores** — una fila por instructor/clase.
  - **Alumnos** — todos los alumnos del contrato con buscador local (nombre, documento, empresa).
  - **Certificados** — listado con **encabezado** del certificado (nombre del curso/capacitación) destacado.
- **Backend** (`informesJornadaCap.js`):
  - `construirCatalogoClases` — una fila por clase con conteos.
  - `construirResumenAlumnos` — alumnos únicos por contrato.
  - Respuesta API: `resumenContratos`, `trazabilidad`, `catalogoJornadas`, `catalogoClases`, `alumnos`, `instructores`, `certificados` (+ `porClase` interno para agregaciones).
  - Excel actualizado con hojas `Contratos`, `Clases`, `Alumnos`, etc.
- **Frontend** (`jornadas-informes.component.*`, `jornada-cap.service.ts`):
  - Filtros **reactivos**: al cambiar contrato, jornada, clase o fechas se recarga automáticamente (debounce 350 ms en fechas).
  - Botón **Limpiar filtros** (deshabilitado si no hay filtros activos).
  - Eliminado botón **Consultar** y bloque de empresa en la vista previa (logo, NIT, teléfono, dirección, pie). El **PDF** exportado sigue llevando encabezado de empresa vía `jornadas-informe-document.ts`.
  - UI informes: cápsulas/badges sin bordes blancos; columna **Empresa** en certificados; estilo destacado para **encabezado** certificado.
- Eliminadas de la UI las pestañas `porClase`, `porJornada`, `porContrato`.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/services/informesJornadaCap.js` | Catálogo clases, alumnos, Excel, encabezado cert |
| `argo-backend/src/controllers/jornadaCapController.js` | Endpoints informes (si aplica) |
| `argo-backend/src/routes/jornadas.js` | Rutas informes/export |
| `argo-frontend/src/app/features/jornadas/jornadas-informes.component.ts` | Pestañas, filtros reactivos, limpiar |
| `argo-frontend/src/app/features/jornadas/jornadas-informes.component.html` | UI pestañas, sin empresa en pantalla |
| `argo-frontend/src/app/features/jornadas/jornadas-informes.component.scss` | Estilos tabla/cápsulas/filtros |
| `argo-frontend/src/app/core/services/jornada-cap.service.ts` | Tipos API y export Excel |

#### Verificación
- [ ] Sin filtros → todas las pestañas muestran datos del periodo.
- [ ] Filtrar contrato → Contratos muestra solo ese contrato; Alumnos lista alumnos del contrato.
- [ ] Clases → una fila por clase, no alumno × alumno.
- [ ] Certificados → columna **Encabezado** visible.
- [ ] Cambiar filtro → datos se actualizan sin pulsar Consultar.
- [ ] Limpiar filtros → vuelve a vista global.
- [ ] PDF pestaña / completo → sigue con datos de empresa en el documento impreso.
- [ ] Excel por pestaña y completo con hojas nuevas.

---

### JOR-023 — Certificados vencidos: excluir renovados

- **Fecha:** 2026-07-09
- **Alcance:** backend
- **Commit ARGO:** `75f08b7`

#### Problema
- En el listado de certificados vencidos seguían apareciendo alumnos que ya tenían un certificado **vigente** del **mismo programa** (`idProg`).

#### Qué se hizo
- Pipeline en `certificadoController.js` con `$lookup` para excluir vencidos cuando existe vigente del mismo `idProg` y `numDoc`.
- Aplicado a listado web, export Excel y endpoint `alertas-vencidos`.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/controllers/certificadoController.js` | Filtro vencidos renovados |

#### Verificación
- [ ] Alumno con cert vencido + cert vigente mismo programa → solo aparece el vigente en listas normales; el vencido no en alertas vencidos.
- [ ] Excel vencidos coherente con el listado.

---

### JOR-024 — Matrícula alumno: sin programas de jornadas

- **Fecha:** 2026-07-09
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`

#### Problema
- Al crear matrícula desde la ficha del alumno (pestaña Servicios), el buscador de programas mostraba programas de **Jornadas de capacitación**, que no aplican a matrícula académica tradicional.

#### Qué se hizo
- `programaController.js`: query `excluirJornadasCap=1` filtra programas tipo jornada.
- `programa.service.ts` + `servicios.component.ts`: envían ese filtro en el buscador de programas al matricular.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/controllers/programaController.js` | Filtro `excluirJornadasCap` |
| `argo-frontend/src/app/core/services/programa.service.ts` | Parámetro en búsqueda |
| `argo-frontend/src/app/features/alumnos/tabs/servicios.component.ts` | Usa filtro al matricular |

#### Verificación
- [ ] Ficha alumno → nueva matrícula → buscador de programas no lista programas de jornadas CAP.
- [ ] Hub jornadas / contrato sigue viendo sus programas con normalidad.

---

### JOR-026 — Programas: persistir tipo capacitación y combos del formulario

- **Fecha:** 2026-07-13
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend + deploy nginx
- **Commit ARGO:** `0065414`
- **Replica en otro repo:** Sí (programas jornadas y portal aula virtual)

#### Problema
- En **Programas educativos** (`/app/programas`), al crear o editar, el **tipo de capacitación** (y otros combos) no persistía: siempre quedaba «Técnico Laboral por Competencias».
- El combobox mostraba un texto distinto al valor guardado si el usuario escribía o filtraba sin hacer clic en la lista.
- Catálogo legacy con `idTipCap` tipo `"1) TECNICO..."` se emparejaba mal con ids numéricos.
- En **www.finstruvial.edu.co**, la página de cursos del portal fallaba con **502** en `/api` (nginx interno del contenedor aula-virtual no alcanzaba el backend).

#### Qué se hizo
- **Combobox** (`catalogo-enum-buscar`): al salir del campo o al guardar, confirma la opción si el texto coincide; no pisa el texto mientras se filtra.
- **Programas admin**: normaliza `idTipCap` del catálogo (id canónico `1`, `2`, `3`…); sincroniza combos antes de guardar.
- **Backend** `PUT /api/programas/:id`: exige `idTipCap` en body y no reutiliza el valor anterior por defecto.
- **Nginx portal** (`deploy/nginx/finstruvial.edu.co.conf`): `/api/` y `/uploads/` van directo a `127.0.0.1:5002` (backend); el SPA sigue en `:8085`.
- Script `deploy/diagnose-vps-domains.sh`: prueba HTTP de `/api/aula-virtual/cursos` en el dominio del portal.

#### Despliegue VPS
```bash
cd /opt/argo && git pull origin main
docker compose build argo-backend argo-frontend
docker compose up -d --force-recreate argo-backend argo-frontend
cp deploy/nginx/finstruvial.edu.co.conf /etc/nginx/sites-available/finstruvial.edu.co
nginx -t && systemctl reload nginx
```

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-frontend/src/app/features/programas/programas-admin.component.*` | Normalización idTipCap, confirmar combos al guardar |
| `argo-frontend/src/app/shared/catalogo-enum-buscar/*` | Blur/guardar confirma selección |
| `argo-backend/src/controllers/programaController.js` | idTipCap obligatorio en PUT |
| `deploy/nginx/finstruvial.edu.co.conf` | Proxy API/uploads al backend |
| `deploy/diagnose-vps-domains.sh` | Diagnóstico API portal |

#### Verificación
- [ ] Programas → editar → cambiar tipo capacitación → guardar → recargar → tipo correcto.
- [ ] Programa jornadas: tipo «Jornadas de Capacitación» + carpa persisten.
- [ ] `https://www.finstruvial.edu.co/api/aula-virtual/cursos` → HTTP 200 (no 502).
- [ ] Portal `/cursos` lista cursos publicados.

---

### JOR-025 — idServ contrato configurable (comprobantes y factura)

- **Fecha:** 2026-07-09
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `c092f0b`

#### Problema
- Comprobantes de ingreso y facturas de contratos de capacitación usaban **idServ 53** fijo en código.
- En desarrollo local el servicio es **53**; en VPS Finstruvial es **129** (mismo rol: capacitación con valor definido por el contrato).

#### Qué se hizo
- Config BD `jornadas-operacion`: campo `idServCapacitacionContrato` (fallback constante **53** si no está guardado).
- `servicioContratoCap.js` lee el id desde config al causar liquidaciones y armar factura.
- Validación al guardar: el servicio debe existir en catálogo.
- Pantalla **Configuración → Jornadas**: selector de servicio global (sin programa).
- API `GET/PUT /api/jornadas/config/operacion` devuelve/acepta el nuevo campo junto con el modo operación especial.

#### Despliegue Finstruvial
Tras publicar, entrar a **Configuración → Jornadas** y elegir el servicio con **idServ 129** antes de generar comprobantes o facturas de contrato.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/services/configJornadasOperacion.js` | Campo `idServCapacitacionContrato` |
| `argo-backend/src/services/servicioContratoCap.js` | Lee id desde config |
| `argo-backend/src/constants/servicioContratoCap.js` | Solo fallback desarrollo |
| `argo-backend/src/controllers/jornadaCapController.js` | Validación + auditoría |
| `argo-backend/src/controllers/ingresoController.js` | Comentario |
| `argo-frontend/src/app/features/config/config-jornadas.component.*` | UI selector servicio |
| `argo-frontend/src/app/core/services/jornada-cap.service.ts` | Tipo `ConfigOperacionJornadas` |

#### Verificación
- [ ] Local: sin tocar config → sigue usando idServ 53.
- [ ] Cambiar a otro idServ válido en Config → Jornadas → comprobante contrato causa ese servicio.
- [ ] Factura contrato usa el mismo idServ e IVA del catálogo.
- [ ] idServ inexistente al guardar → error claro.
- [ ] VPS: configurar **129** y probar un comprobante de contrato.

---

### JOR-021 — Cobro contrato: plan cuotas, CI y cuenta de cobro

- **Fecha:** 2026-07-08
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`

#### Qué se hizo
- **Valor del contrato** persistente (serialización Decimal128 al listar/cargar).
- **Plan de cobro** en contrato: cuotas con montos manuales (deben sumar el valor).
- **Preferencia** `comprobantesIngresoCaja` en contrato + override al generar cada comprobante.
- **Comprobante de ingreso** por cuota (`INGRESO CONTRATO`): sin caja por defecto; pagos no efectivo exigen referencia + soporte (imagen), igual que cobros de alumnos.
- **Causación de servicio** al generar cada comprobante: servicio del catálogo configurado en **Configuración → Jornadas** (`idServCapacitacionContrato`; fallback **53**) → liquidación pagada vinculada al ingreso.
- **Factura electrónica** del contrato: misma referencia de servicio configurable; **IVA dinámico** según catálogo de Servicios (gravado/exento/sin IVA); retenciones según regla fiscal del tipo de contratante.
- **Anulación**: comprobantes vía `DELETE /ingresos/:id` (revierte cuota y liquidación causada); factura vía nota crédito total (libera el contrato para nueva emisión).
- **Cuenta de cobro** (una por contrato, consecutivo CC): HTML imprimible hacia la empresa contratante.

#### API
- `GET /api/jornadas/contratos/:id/cobro`
- `POST /api/jornadas/contratos/:id/cuenta-cobro/generar`
- `GET /api/jornadas/contratos/:id/cuenta-cobro/html`
- `POST /api/jornadas/contratos/:id/comprobantes-ingreso`

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/constants/servicioContratoCap.js` | Fallback idServ 53 |
| `argo-backend/src/services/servicioContratoCap.js` | Causación servicio contrato (id configurable, JOR-025) |
| `argo-backend/src/services/contratoCobroCap.js` | Plan cuotas, comprobantes |
| `argo-backend/src/services/cuentaCobroHtml.js` | Plantilla cuenta de cobro |
| `argo-backend/src/services/facturaContratoCap.js` | Factura contrato (idServ configurable) |
| `argo-backend/src/models/Contratacion.js` | valorContrato, plan cobro |
| `argo-backend/src/models/Ingreso.js` | idContrato en ingreso |
| `argo-backend/src/controllers/ingresoController.js` | Comprobantes contrato |
| `argo-backend/src/controllers/jornadaCapController.js` | Endpoints cobro |
| `argo-backend/src/routes/jornadas.js` | Rutas cobro |
| `argo-frontend/src/app/core/services/jornada-cap.service.ts` | API cobro contrato |
| `argo-frontend/src/app/core/services/facturacion.service.ts` | Integración facturación |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.*` | UI facturación contrato |

#### Verificación
- [ ] Valor contrato persiste al recargar contrato.
- [ ] Plan 2–3 cuotas + suma = valor → guardar contrato.
- [ ] Comprobante sin caja → aparece en Todos los ingresos, no en sesión caja.
- [ ] Pago no efectivo → referencia + imagen soporte obligatorias (igual que alumnos).
- [ ] Comprobante con caja → suma en caja abierta.
- [ ] Comprobante → liquidación con idServ configurado causada y pagada; ingreso con `idLiquidacion`.
- [ ] Emitir factura contrato → ítem con `idServ` configurado (no código CAP-CONTRATO-*).
- [ ] Anular comprobante de cuota → cuota pendiente, liquidación del servicio eliminada, ingreso en estado ANULADO.
- [ ] Anular factura contrato (nota crédito total) → contrato libre para volver a facturar.
- [ ] Cuenta de cobro generada e imprimible.

---

### JOR-020 — Eliminar clases (incl. finalizadas)

- **Fecha:** 2026-07-08
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`

#### Problema
- Las clases finalizadas no se podían borrar (409 en backend; botones ocultos en UI).
- No había acción **Borrar clase** en el pie del modal de edición.

#### Qué se hizo
- **Backend** (`eliminarClase`): elimina inscripciones, asistencias y foto de evidencia; **anula** certificados con `idClaseJornada` antes de borrar la clase; responde `certificadosAnulados`.
- **Frontend:** `claseJornadaSePuedeEliminar()` siempre `true` (permiso real: `jornadas.gestionar`); botón **Borrar clase** en lista, panel inferior y modal (hub + editor standalone); confirmación distinta si la clase está finalizada; aviso de certificados anulados.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/controllers/jornadaCapController.js` | `eliminarClase` |
| `argo-backend/src/routes/jornadas.js` | `DELETE /clases/:id` |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.*` | Botón borrar clase |
| `argo-frontend/src/app/features/jornadas/jornada-clase-editor.component.*` | Botón borrar en editor |

#### Verificación
- [ ] Admin borra clase PROGRAMADA / EN PROCESO / FINALIZADA.
- [ ] Clase finalizada con certificados por_clase → certificados anulados en listado.
- [ ] Usuario sin `jornadas.gestionar` no ve botón ni puede DELETE.

---

### JOR-018 — Encabezado certificado por_clase vs global

- **Fecha:** 2026-07-08
- **Alcance:** backend
- **Commit ARGO:** `75f08b7`

#### Problema
- Con `tipoCertificado: por_clase`, el certificado usaba `nombreCertificacion` del contrato (o el texto genérico «Jornadas de Capacitación») en lugar del **programa de la clase**.
- Las horas caían en `numeroHorascert` del contrato (modo global) en vez de horas por clase / programa.

#### Qué se hizo
- **Global:** sigue usando `nombreCertificacion` y `numeroHorascert` del contrato.
- **Por clase:** encabezado = `nomCert` / descripción / `nombreProg` del programa de la clase; horas = `horasCertificadas` de la clase → `horasPorClase` del contrato → horas del programa.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/services/certificadoJornadaAuto.js` | Encabezado y horas por_clase vs global |

#### Verificación
- [ ] Contrato global + encabezado contrato → certificado con ese título.
- [ ] Contrato por_clase sin encabezado contrato → certificado con nombre del programa de cada clase.
- [ ] Horas por_clase desde horas por clase del contrato o del programa.

---

### JOR-017 — Anular certificado en listado Jornadas

- **Fecha:** 2026-07-08
- **Alcance:** backend
- **Commit ARGO:** `75f08b7`

#### Problema
- `DELETE /api/jornadas/certificados-generados/:id` devolvía **403** porque usaba el controlador académico, que rechaza certificados de jornada.

#### Qué se hizo
- Handlers propios `actualizarCertificadoGenerado` y `eliminarCertificadoGenerado` en `jornadaCapController`.
- Anulación (estado `anulado`) con auditoría; el listado excluye anulados.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/controllers/jornadaCapController.js` | `actualizarCertificadoGenerado`, `eliminarCertificadoGenerado` |
| `argo-backend/src/routes/jornadas.js` | Rutas certificados-generados |

#### Verificación
- [ ] Eliminar certificado en Jornadas → Certificados desaparece de la lista.
- [ ] Editar certificado jornada guarda cambios.
- [ ] Tras anular, el alumno puede volver a recibir certificado si cumple requisitos.

---

### JOR-016 — Panel de avance del contrato

- **Fecha:** 2026-07-08
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`

#### Qué se hizo
- API `GET /api/jornadas/contratos/:id/avance` con resumen y listado de alumnos con asistencia.
- KPIs: clases dictadas/faltantes, meta contractual, alumnos capacitados y certificados, jornadas.
- Sección «Avance del contrato» como **pestaña 2. Avance** (misma ficha que Jornadas, Clases y Certificados).
- URL: `?contrato=ID&tab=avance` abre directamente la ficha de avance.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/services/avanceContratoJornada.js` | Lógica KPIs y alumnos |
| `argo-backend/src/controllers/jornadaCapController.js` | `avanceContrato` |
| `argo-backend/src/routes/jornadas.js` | `GET /contratos/:id/avance` |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.*` | Pestaña Avance |
| `argo-frontend/src/app/core/services/jornada-hub-deeplink.service.ts` | Deep link `tab=avance` |

#### Verificación
- [ ] Contrato con clases finalizadas y asistencias muestra contadores correctos.
- [ ] Tabla lista solo alumnos con al menos una asistencia.
- [ ] Botón Actualizar refresca tras dictar clases o emitir certificados.

---

### JOR-019 — Copiar alumnos de la clase anterior de la misma jornada

- **Fecha:** 2026-07-09
- **Alcance:** backend + frontend

#### Problema
- En una jornada con varias clases (carpas/temas) el mismo grupo de alumnos suele repetirse en cada clase (p. ej. Alistamiento motocicleta → Normas de tránsito → Concéntrese…). El instructor/admin debía volver a buscar y matricular a cada alumno en cada clase, aunque ya estaba matriculado en la clase anterior de la misma jornada.

#### Qué se hizo
- **Backend:** nuevo endpoint `GET /clases/:id/inscritos-clase-anterior` (`jornadaCapController.alumnosClaseAnterior`).
  - Ubica la clase inmediatamente **anterior** dentro de la misma jornada usando `indiceClaseEnJornada` (orden de generación de carpas), con `createdAt` como respaldo si no hay índice.
  - Devuelve el resumen de esa clase (programa, carpa) y su lista de alumnos matriculados, marcando `puedeMatricular` según tipo certificado del contrato (`por_clase`: solo bloquea si ya tiene cert de esa clase; `global`: bloquea si ya tiene cert del contrato).
- **Frontend** (`jornadas-hub.component`, hub admin → pestaña Clases → «Abrir» una clase):
  - Al abrir una clase existente, se consulta automáticamente la clase anterior de la jornada.
  - Si tiene alumnos que aún no están en la clase actual, se muestra un panel **«↻ Alumnos de «‹programa›»»** con checkboxes (todo **voluntario**, nada se matricula solo): botones «Todos» / «Ninguno» y «Matricular seleccionados (N)».
  - Los alumnos con certificado vigente en el contrato aparecen deshabilitados con la etiqueta «Ya certificado» (no se pueden volver a matricular).
  - **Fix 2026-07-09:** checkboxes con `[checked]` + `(change)` (no `ngModel`); deshabilitar por `puedeMatricular` según tipo certificado (`por_clase` vs global), no solo por certificado de contrato. Botones Todos/Ninguno actualizan la vista correctamente.
  - Reutiliza el endpoint existente `POST /matricular` (uno por alumno seleccionado), igual que la matrícula manual; refresca la lista de inscritos al terminar.
- **Frontend instructor** (`jornada-clase-editor.component`, portal instructores → Mis clases → abrir clase): misma utilidad y panel que en el hub admin.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/controllers/jornadaCapController.js` | `alumnosClaseAnterior`, `puedeMatricular` |
| `argo-backend/src/routes/jornadas.js` | `GET /clases/:id/inscritos-clase-anterior` |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.*` | Panel copiar alumnos |
| `argo-frontend/src/app/features/jornadas/jornada-clase-editor.component.*` | Panel copiar alumnos instructor |

#### Verificación
- [ ] Jornada con 2+ clases autogeneradas en orden: abrir la 2ª clase → aparece el panel con los alumnos de la 1ª.
- [ ] Seleccionar algunos alumnos (no todos) y matricular → solo esos quedan inscritos en la clase actual.
- [ ] Alumno ya certificado en el contrato → aparece deshabilitado, no se puede seleccionar.
- [ ] Alumno ya matriculado en la clase actual → no aparece en la lista de «disponibles».
- [ ] Primera clase de la jornada (sin anterior) → el panel no aparece.
- [ ] Portal instructores (Mis clases): mismo panel y matrícula masiva desde clase anterior.

---

### JOR-015 — Certificados al cerrar clase en modo especial

- **Fecha:** 2026-07-08
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`

#### Problema
- En modo operación especial, al guardar hora inicio/fin la clase pasaba a **FINALIZADO** vía `actualizarClase`, pero **no** se ejecutaba la emisión de certificados (solo ocurría con el botón «Finalizar»).
- Clases ya cerradas sin certificados no tenían forma de reprocesar (409 al pulsar Finalizar de nuevo; sincronizar asistencias tampoco emitía).

#### Qué se hizo
- Función compartida `postCierreClaseJornada`: asistencias pendientes + `emitirCertificadosAsistentesClase`.
- Se invoca al pasar a FINALIZADO en `actualizarClase` y en `finalizarClase`.
- `finalizarClase` en clase ya finalizada: reprocesa certificados pendientes (idempotente).
- `sincronizarAsistenciasInscritos` en clase FINALIZADA: emite certificados faltantes.
- UI: al guardar horario/clase, muestra alerta si se emitieron certificados.
- `fechaEmision` del certificado automático = **fecha de la clase** (`fechaClase`), no la fecha del cierre en sistema.
- **Fix 2026-07-09:** el modal de clase (hub admin `jornadas-hub.component` y editor de instructor `jornada-clase-editor.component`) ocultaba **ambos** botones (Iniciar y Finalizar) en cuanto `estado === 'FINALIZADO'`. Eso bloqueaba el reproceso ya soportado en backend: al editar/reabrir una clase ya finalizada (típico en modo especial, donde guardar cambios con horaInicio+horaFin ya cargados la finaliza sola) no había forma de volver a pulsar «Finalizar» para emitir certificados de alumnos matriculados después del cierre.
  - Ahora el botón «Finalizar clase» permanece visible cuando la clase está FINALIZADO, cambia a **«↻ Reprocesar certificados»** y llama al mismo endpoint (`POST /clases/:id/finalizar`), que ya es idempotente.
  - Solo se oculta «Iniciar clase» (no aplica sobre una clase ya cerrada).
  - Se agregó aviso (`hint-ok`) explicando que puede seguir matriculando alumnos y reprocesar.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/services/certificadoJornadaAuto.js` | `postCierreClaseJornada`, fechaEmision = fecha clase |
| `argo-backend/src/controllers/jornadaCapController.js` | Cierre/reproceso certificados |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.*` | Botón Reprocesar certificados |
| `argo-frontend/src/app/features/jornadas/jornada-clase-editor.component.*` | Idem instructor |

#### Verificación
- [ ] Modo especial: guardar horario inicio+fin en clase PROGRAMADA → certificado por_clase emitido.
- [ ] Clase ya finalizada sin certificado: pulsar «Reprocesar certificados» → emite pendientes.
- [ ] Clase finalizada + matricular alumno nuevo + «Reprocesar certificados» → certificado del alumno nuevo emitido.
- [ ] Sincronizar asistencias en clase finalizada → emite certificados faltantes.
- [ ] Certificado impreso/PDF muestra la fecha de la clase dictada, no la de hoy.

---

### JOR-014 — Empresa del contrato al matricular alumno

- **Fecha:** 2026-07-08
- **Alcance:** backend (+ móvil/web vía API existente)
- **Commit ARGO:** `75f08b7`

#### Qué se hizo
- Al matricular/inscribir en una clase de jornada, el alumno recibe `empresaId` = cliente del contrato (`idClienteFacturacion`).
- Si el alumno ya existía sin empresa o con otra, se actualiza a la empresa del contrato activo.
- También al registrar asistencia (por si el flujo omite matrícula explícita).
- Función `asignarEmpresaContratoAlumno` en `jornadaCapacitacion.js`.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/services/jornadaCapacitacion.js` | `asignarEmpresaContratoAlumno` |
| `argo-backend/src/services/asistenciaJornadaCap.js` | Empresa en asistencia |

#### Verificación
- [ ] Matricular alumno existente sin empresa → queda con empresa del contrato.
- [ ] Matricular en clase de otro contrato → empresa se actualiza al nuevo cliente.
- [ ] Certificados/informes muestran empresa correcta.

---

### JOR-013 — Metas de contrato y programación por fechas

- **Fecha:** 2026-07-08
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`

#### Problema
- Tras «Generar faltantes», `numerojornadas`, `clasesPorJornada` y `jornadasPorDia` se reiniciaban a 0 (sync los pisaba con conteos reales).
- La generación arrancaba desde «hoy» en lugar de `fechaInicJornadas`, impidiendo programar con meses de antelación.

#### Qué se hizo
- `syncContadoresContrato` ya **no modifica** las metas de planificación; solo `numeObjeJornada`, `jornadasGeneradas` y `jornadasExistentes` (informativo).
- Nuevo campo **`fechaFinJornadas`**: marco final de programación (distinto de «Finalizar contrato»).
- `generarJornadasContrato`: programa desde **inicio** hasta **fin** de jornadas, respetando sáb/dom/festivos (modo normal y especial).
- UI: campo «Fin jornadas» junto a «Inicio jornadas»; mensajes de generación actualizados.
- UI Clases / programación contrato: filtro por **todas las jornadas** del contrato; encabezado reorganizado.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-backend/src/services/contratoJornadaSync.js` | Metas no se pisan al sync |
| `argo-backend/src/services/programacionJornadas.js` | Rango fechaInic–fechaFin |
| `argo-backend/src/models/Contratacion.js` | `fechaFinJornadas` |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.*` | UI fechas y metas |

#### Verificación
- [ ] Guardar Nº jornadas / clases por jornada → Generar faltantes → los números **no** vuelven a 0.
- [ ] Inicio en 2 meses + fin en 3 meses → jornadas creadas en ese rango (estado INACTIVO si son futuras).
- [ ] Sin cupo en el rango → error claro (ampliar fin o ajustar meta).

---

### JOR-012 — Programas del contrato y reparto en autogeneración de clases

- **Fecha:** 2026-07-08
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`
- **Replica en otro repo:** Sí

#### Qué pide el cliente / problema
- En el contrato, elegir qué programas aplican a las clases de capacitación.
- Al generar jornadas/clases faltantes, repartir esos programas de forma equitativa (A, B, C, A, B, C…).
- Las clases siguen siendo editables: instructor o administrador pueden cambiar el programa en cualquier momento.
- Aplica en **modo normal** y **modo especial** (la lógica de generación es la misma).

#### Qué se hizo
- Campo `idProgramas: string[]` en contrato (`contratacion`).
- Validación al guardar: solo programas de tipo «Jornadas de Capacitación».
- `generarClasesFaltantesJornada`: asigna programa y carpa (round-robin por índice global de clases del contrato).
- UI en **Contratación** (hub): checkboxes de programas con búsqueda y chips.
- Corrección: el catálogo de programas se carga al abrir Contratación (antes solo en pestaña Clases → lista vacía / «Cargando…» eterno).
- Sin programas configurados: comportamiento anterior (clases sin programa).

#### Archivos tocados (ARGO)
Ver también tabla en [Mapa archivos por commit](#mapa-archivos-por-commit-auditoría-2026-07-13) (JOR-012).

#### Archivos principales
| Área | Archivos |
|------|----------|
| Backend | `Contratacion.js`, `programasContratoJornada.js`, `programacionClasesJornada.js`, `jornadaCapController.js` |
| Frontend | `jornada-cap.service.ts`, `jornadas-hub.component.*` |

#### Verificación
- [ ] Contrato con 3 programas + 6 clases/jornada × 2 jornadas → reparto A,B,C,A,B,C en clases nuevas.
- [ ] Sin programas en contrato → clases autogeneradas sin `idPrograma`.
- [ ] Cambiar programa en clase manualmente sigue funcionando (instructor/admin).
- [ ] Modo especial: misma generación y edición de programa en clase.

---

### JOR-011 — Operación fuera del día programado (modo especial)

- **Fecha:** 2026-07-08
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** `75f08b7`
- **Replica en otro repo:** Sí

#### Qué pide el cliente / problema
- Operación habitual: solo jornadas/clases del **día programado = hoy**.
- Casos especiales (carga histórica, corrección, preparación de contratos): poder elegir **contrato → jornada → fecha** y manipular clases/alumnos aunque no sea hoy.
- Interruptor en **Configuración → Jornadas** (como migración).

#### Qué se hizo
- Config en BD (`jornadas-operacion`): `operacionFueraDeDiaHabilitada`, `idServCapacitacionContrato` (JOR-025).
- API: `GET/PUT /api/jornadas/config/operacion`, `GET /api/jornadas/config/operacion/estado`.
- Con modo **ON** + permiso `jornadas.gestionar`: backend omite bloqueo de fecha en iniciar, asistencia, matricular, finalizar y crear clase.
- Botones **Cerrar jornada** / **Reabrir jornada** en listado y edición (estado manual `estadoOperacionManual`).
- Finalizar clase en modo especial aunque esté `PROGRAMADA` (con horas o tras Iniciar).
- **Horario en modo especial:** elegir hora inicio y fin en el modal; la duración se calcula al vuelo; **Finalizar** envía esas horas y no reemplaza la hora de fin por la hora actual (no hace falta pulsar Guardar antes).
- Pantalla **Configuración → Jornadas** con interruptor y ayuda.
- Hub / editor de clase / instructor / clases-hoy: desbloquean UI cuando el modo está activo; banner de aviso en el hub.
- Modal **+ Crear clase** en modo especial: lista todas las jornadas del contrato seleccionado (no solo hoy/mañana).
- Modal de clase ampliado (`sheet` + `tall`): ~1480px, layout en dos columnas (datos | alumnos).
- Instructores (`jornadas.operar` sin gestionar) siguen limitados al día de hoy.
- Auditoría: acción `jornadas_operacion_config`.

#### Archivos tocados (ARGO)
Ver tabla en [Mapa archivos por commit](#mapa-archivos-por-commit-auditoría-2026-07-13) (JOR-011).

#### Archivos principales
| Área | Archivos |
|------|----------|
| Backend | `configJornadasOperacion.js`, `jornadasOperacionEspecial.js`, `jornadaCapController.js`, `asistenciaJornadaCap.js`, `jornadas.js` |
| Frontend | `config-jornadas.component.*`, `jornadas-operacion-config.service.ts`, `jornada-cap.service.ts`, `jornadas-hub.*`, `jornada-clase-editor.*`, `jornada-instructor.*`, `clases-hoy-lista.*`, `app.routes.ts`, `shell.component.ts` |

#### Verificación
- [ ] Modo OFF: no opera jornada de ayer ni mañana (API 400).
- [ ] Modo ON en Configuración → Jornadas: opera jornada pasada/futura desde hub (contrato + calendario).
- [ ] Modo ON: **+ Crear clase** muestra jornadas del contrato aunque no sean hoy.
- [ ] Instructor sin gestionar: sigue bloqueado fuera de hoy.
- [ ] Modo ON: clase PROGRAMADA con inicio/fin HH:mm → duración visible → Finalizar sin tocar fin otra vez.
- [ ] Desactivar modo: vuelve comportamiento normal.

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
- Versión inicial: pestañas por clase, por jornada, por contrato, certificados.
- Filtros: **contrato**, **jornada**, **clase**, desde/hasta.
- Export Excel (pestaña o completo, varias hojas).
- PDF / imprimir con encabezado de empresa (colores azul oscuro tipo media carta).
- Pantalla en **tema oscuro**; PDF en papel blanco.
- Destacados grandes: código contrato, ID jornada, ID clase según filtros.
- PDF usa las **mismas filas filtradas** que la pantalla (no mezcla todos los contratos).

> **Actualización 2026-07-09:** ver **JOR-022** (pestañas por entidad, filtros reactivos, sin bloque empresa en pantalla, encabezado en certificados).

#### Archivos principales
| Área | Archivos |
|------|----------|
| Backend | `informesJornadaCap.js`, `jornadaCapController.js`, `jornadas.js` |
| Frontend | `jornadas-informes.component.*`, `jornadas-informe-document.ts`, `jornada-cap.service.ts`, `shell.component.ts`, `app.routes.ts` |

#### Verificación
- [ ] Consultar con contrato filtrado → solo ese contrato en tabla y PDF
- [ ] Filtrar jornada/clase → PDF refleja el recorte
- [ ] Excel completo descarga hojas Contratos, Trazabilidad, Jornadas, Clases, Alumnos, Instructores, Certificados (JOR-022)

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
