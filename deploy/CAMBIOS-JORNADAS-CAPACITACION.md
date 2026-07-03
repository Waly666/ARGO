# Cambios — Jornadas de capacitación (ARGO frontend + backend)

Documento **vivo** para registrar cada cambio que hagamos en el módulo de **jornadas de capacitación** en este repo (**Finstruvial / ARGO**) y poder **replicarlo** en otros despliegues (p. ej. Educarte, otro cliente con fork o copia del producto).

---

## Cómo usar este documento

1. **Antes de codificar:** anotar aquí el cambio pedido (sección «Pendientes»).
2. **Al terminar en ARGO:** completar la entrada en «Historial de cambios» (archivos, commits, pasos).
3. **En el otro repo:** seguir la misma entrada como checklist; marcar qué aplica y qué no (cada cliente puede pedir variantes).

| Campo | Descripción |
|-------|-------------|
| **ID** | `JOR-001`, `JOR-002`, … (incremental) |
| **Cliente origen** | Donde se implementó primero (ej. Finstruvial) |
| **Alcance** | `frontend` \| `backend` \| `ambos` |
| **Commit ARGO** | Hash en `main` cuando se suba |
| **¿Replica obligatoria?** | Sí / No / Parcial (explicar) |

---

## Repos y contexto

| Repo | Ruta local (ejemplo) | Notas |
|------|----------------------|-------|
| **ARGO (Finstruvial)** | `c:\proyectos-js\ARGO` | Repo producto; cambios base documentados aquí |
| **Otro cliente** | `c:\proyectos-js\ARGO-EDUCARTE` (u otro) | Replicar según historial; adaptar textos/branding si aplica |

**Rama habitual:** `main`  
**Despliegue:** ver [GUIA-GIT-DESPLIEGUE.md](./GUIA-GIT-DESPLIEGUE.md)

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
| `/app/jornadas/alumnos` | alumnos (modo jornadas) | `alumnos.*`, `jornadas.ver` |
| `/app/contratos` | `contratos-lista.component` | `jornadas.ver`, `jornadas.gestionar` |

Definición en: `argo-frontend/src/app/app.routes.ts`

### Frontend — carpetas y servicios clave

```
argo-frontend/src/app/features/jornadas/
  jornadas-hub.component.*          # Hub principal + calendario + programación
  jornada-instructor.component.*    # Vista instructor (operación en campo)
  jornada-clase-editor.component.*  # Editor de clase
  clases-hoy-lista.component.*      # Clases del día
  jornadas-en-proceso-lista.*       # Jornadas abiertas
  certificados-jornada-lista.*      # Certificados emitidos
  contratos-lista.component.*       # Contratos de capacitación
  jornada-mapa-picker.component.ts  # Georreferencia
  jornada-*-banner / alerta / toast # UX en vivo
  jornada-calendario.util.ts        # Calendario semanal/mensual
  jornada-cumplimiento.util.ts      # Cumplimiento normativo
  jornada-georefe.util.ts
  jornada-progreso.util.ts
  jornada-ui.util.ts
  jornadas-*.scss                   # Estilos compartidos

argo-frontend/src/app/core/services/
  jornada-cap.service.ts            # API principal jornadas
  jornada-live-sync.service.ts      # Sincronización en vivo
  jornada-hub-deeplink.service.ts
  jornada-en-proceso-alert.service.ts
  certificado-jornada-alert.service.ts
  certificado-jornada-bloqueo.service.ts
```

### Backend (cuando el cambio no sea solo UI)

```
argo-backend/src/routes/jornadas.js
argo-backend/src/controllers/jornadaCapController.js
argo-backend/src/services/jornadaCapacitacion.js
argo-backend/src/services/programacionJornadas.js
argo-backend/src/services/asistenciaJornadaCap.js
argo-backend/src/services/cumplimientoJornadaCap.js
argo-backend/src/services/certificadoJornadaAuto.js
argo-backend/src/services/estadoJornadaCap.js
argo-backend/src/services/instructorJornada.js
argo-backend/src/models/JornadaCap.js
argo-backend/src/models/ClaseJornadaCap.js
argo-backend/src/constants/jornadaCapacitacion.js
```

---

## Plantilla por cambio (copiar y rellenar)

```markdown
### JOR-XXX — Título corto del cambio

- **Fecha:** YYYY-MM-DD
- **Cliente origen:** Finstruvial
- **Alcance:** frontend | backend | ambos
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
- [ ] Build frontend OK (`pnpm exec ng build`)
- [ ] Flujo probado: …
- [ ] Backend (si aplica): …
```

---

## Pendientes (próximos cambios)

_Lista de lo que vamos a implementar. Mover a «Historial» al cerrar cada ítem._

| ID | Descripción | Prioridad | Notas |
|----|-------------|-----------|-------|
| — | _(Sin pendientes — ver historial JOR-001 / JOR-002 / JOR-003)_ | — | — |

---

## Historial de cambios

_Cambios ya implementados y documentados para replicación._

| ID | Fecha | Resumen | Commit | Alcance |
|----|-------|---------|--------|---------|
| JOR-003 | 2026-07-02 | Jornadas/clases extra con sync automático en contrato | _(pendiente commit)_ | backend + frontend |
| JOR-002 | 2026-07-02 | Contrato: clases/jornada, horas/clase, cert global/por_clase; autogenerar clases; calendario en contrato | _(pendiente commit)_ | backend + frontend |
| JOR-001 | 2026-07-02 | UX simplificada: pestaña Clases + modal «Nueva clase» | _(pendiente commit)_ | frontend |

### JOR-003 — Jornadas y clases extra (sync contrato)

- **Fecha:** 2026-07-02
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** _(pendiente)_
- **Replica en otro repo:** Sí

#### Qué pide el cliente / problema
Tras completar jornadas con «Generar faltantes», aún puede faltar certificar alumnos. Se necesita agregar **jornadas extra** y **clases extra**, y que el contrato refleje los contadores reales (`numerojornadas`, `clasesPorJornada`, meta alumnos/jornada).

#### Qué se hizo
- Servicio `contratoJornadaSync.js`: recalcula `numerojornadas` (conteo real), `numeObjeJornada`, `clasesPorJornada` (máximo de clases en cualquier jornada).
- `POST /contratos/:id/jornadas` — jornada extra manual (+ opción autogenerar clases).
- Sync al **eliminar jornada**, **crear clase** y **eliminar clase**.
- UI: botón **«+ Agregar jornada extra»** en pestaña Jornadas; formulario reutiliza panel de edición.
- El formulario de contrato se actualiza al vuelo (`aplicarContratoSync`).

#### Archivos tocados (ARGO)
| Área | Archivos principales |
|------|---------------------|
| Backend | `contratoJornadaSync.js`, `jornadaCapController.js`, `jornadas.js` (ruta) |
| Frontend | `jornada-cap.service.ts`, `jornadas-hub.component.*`, `jornadas-calendario.scss` |

#### Verificación
- [ ] Build frontend OK
- [ ] Agregar jornada extra → `numerojornadas` sube en contrato
- [ ] Eliminar jornada → `numerojornadas` baja
- [ ] Crear clase manual extra → `clasesPorJornada` sube si supera el máximo anterior
- [ ] Eliminar clase extra → `clasesPorJornada` baja al nuevo máximo

### JOR-002 — Contrato ampliado + autogeneración + calendario

- **Fecha:** 2026-07-02
- **Cliente origen:** Finstruvial
- **Alcance:** backend + frontend
- **Commit ARGO:** _(pendiente)_
- **Replica en otro repo:** Sí

#### Qué se hizo
- Campos en contrato: `clasesPorJornada`, `horasPorClase` (intensidad horaria del certificado/clase, **no** duración de sesión), `tipoCertificado` (`global` | `por_clase`).
- «Generar faltantes» crea jornadas pendientes y autogenera clases (8:00–17:00, sin instructor/programa).
- Si las jornadas ya están completas, igual genera solo clases faltantes.
- Certificado **por_clase** al marcar asistencia; **global** mantiene `numSesCert`.
- Formulario contrato + calendario semanal «Ver programación».

#### Archivos tocados (ARGO)
| Área | Archivos principales |
|------|---------------------|
| Backend | `Contratacion.js`, `ClaseJornadaCap.js`, `Certificado.js`, `programacionClasesJornada.js`, `programacionJornadas.js`, `certificadoJornadaAuto.js`, `asistenciaJornadaCap.js`, `jornadaCapController.js` |
| Frontend | `jornada-cap.service.ts`, `jornadas-hub.component.*` |

#### Verificación
- [ ] Build frontend OK
- [ ] Generar faltantes con jornadas completas → crea clases
- [ ] Certificado por_clase por asistencia
- [ ] Certificado global con numSesCert

### JOR-001 — UX simplificada en carga de clases

- **Fecha:** 2026-07-02
- **Cliente origen:** Finstruvial
- **Alcance:** frontend
- **Commit ARGO:** _(pendiente)_
- **Replica en otro repo:** Sí

#### Qué pide el cliente / problema
La pestaña **Clases** y el modal de crear clase eran confusos para usuarios poco lectores: mucho texto, combobox técnicos, botones duplicados (Operar/Editar).

#### Qué se hizo
- Guía visual de 3 pasos en pestaña Clases.
- Modal **Nueva clase** reorganizado en pasos ① Día → ② Ubicación (chips) → ③ Programa.
- Tarjetas clicables para elegir jornada (si hay ≤ 6).
- Alumnos en sección colapsable opcional.
- Botón principal dice qué falta («Elija el día», «Elija el programa»).
- Estados en lenguaje simple: «En curso», «Terminada», etc.
- Un solo botón **Abrir →** en la lista.

#### Archivos tocados (ARGO)
| Archivo | Tipo de cambio |
|---------|----------------|
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.html` | UI clases + modal |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.ts` | helpers UX |
| `argo-frontend/src/app/features/jornadas/jornadas-hub.component.scss` | estilos guía/chips |
| `argo-frontend/src/app/features/jornadas/jornada-ui.util.ts` | labels amigables |

#### Pasos para replicar en otro repo
1. Copiar cambios en los 4 archivos anteriores.
2. `pnpm exec ng build` en `argo-frontend`.
3. Probar: Jornadas → pestaña Clases → Crear clase.

#### Verificación
- [ ] Build frontend OK
- [ ] Crear clase con tarjetas y chips
- [ ] Abrir clase existente y marcar asistencia

---

## Checklist rápido al replicar en otro repo

```powershell
# 1. En ARGO: ubicar commit
git log --oneline -- argo-frontend/src/app/features/jornadas/

# 2. En el otro repo: cherry-pick o copia manual según el diff
git diff COMMIT_ANTERIOR..COMMIT_NUEVO -- argo-frontend/src/app/features/jornadas/

# 3. Build
cd argo-frontend
pnpm exec ng build --configuration=development

# 4. Si hay backend
cd ../argo-backend
# probar endpoints afectados
```

En servidor (Docker), si hubo backend + frontend:

```bash
cd /opt/argo
git pull origin main
docker compose build argo-backend argo-frontend
docker compose up -d --force-recreate argo-backend argo-frontend
```

---

## Notas

- Preferir **commits pequeños y temáticos** por cambio de jornadas (`feat(jornadas): …` o `fix(jornadas): …`).
- Si un cambio es **solo Finstruvial**, marcar «Replica: No» y explicar por qué.
- Si un cambio toca permisos o menú, revisar también `app.routes.ts` y `auth-routes.util.ts`.
