# Guía integral para implementar el PESV en ARGO

**Versión:** 1.0  
**Fecha:** 17 de noviembre de 2026  
**Estado:** propuesta de trabajo para revisar y ejecutar por entregas en Composer  
**Repositorio analizado:** C:\proyectos-js\ARGO  
**Propósito:** convertir el módulo PESV existente en ARGO en una solución trazable, segura, mantenible y alineada con las plantillas suministradas.

---

## 1. Recomendación ejecutiva

La recomendación es **evolucionar el módulo PESV dentro de ARGO** y refactorizarlo por dominios, conservando las capacidades y datos que ya sirven. No se recomienda iniciar otra aplicación PESV independiente ni reemplazar MongoDB como primer paso.

ARGO ya tiene API y modelos Mongoose para el PESV, pantallas Angular para autodiagnóstico, captura, fases, configuración y tablero, un catálogo de documentos, autenticación y permisos, y colecciones que el módulo puede reutilizar para vehículos, documentos e inspecciones.

Esto no significa seguir agregando formularios al diseño actual. Primero hay que corregir las reglas de nivel, el aislamiento por empresa, la generación documental y la trazabilidad. Luego se completa el flujo con un modelo de dominio claro y un catálogo de plantillas versionado.

La arquitectura recomendada es un **módulo PESV modular dentro del backend y frontend actuales**, con adaptadores para MongoDB, generación documental y reporte externo. Se conserva el monolito modular de ARGO; no hace falta convertir el sistema en microservicios para completar el PESV.

---

## 2. Alcance y criterios regulatorios

### 2.1 PESV de la organización

El PESV es el sistema de gestión de seguridad vial de la organización. ARGO debe ayudar a planear, ejecutar, medir, documentar, auditar y mejorar ese sistema. No debe reducirse a una carpeta de documentos ni a un formulario anual.

La metodología de la Resolución 40595 de 2022 organiza el PESV en cuatro fases y 24 pasos. La tabla oficial por nivel resume **18 pasos para Básico, 22 para Estándar y 24 para Avanzado**. El nivel es el más exigente que resulte al comparar vehículos y conductores.

| Misionalidad | Nivel Básico | Nivel Estándar | Nivel Avanzado |
|---|---|---|---|
| 1. Presta servicio de transporte terrestre automotor | 11–19 vehículos o 2–19 conductores | 20–50 vehículos o 20–50 conductores | Más de 50 vehículos o más de 50 conductores |
| 2. Actividad diferente al transporte | 11–49 vehículos o 2–49 conductores | 50–100 vehículos o 50–100 conductores | Más de 100 vehículos o más de 100 conductores |

Si el resultado por vehículos y por conductores queda en niveles diferentes, el plan toma el nivel más alto. La obligación de tener PESV se evalúa por separado de la clasificación del nivel. No se debe asignar automáticamente “Básico” a una organización con cero registros: primero se determina si está obligada y luego si la tabla permite clasificarla. Los casos fuera de los rangos explícitos deben quedar como **requieren revisión del responsable**, no como una decisión escondida en el código.

La actividad de un CEA no debe convertirse automáticamente a misionalidad 1 solo porque use vehículos en sus clases. La clasificación debe justificarse para la razón social concreta y confirmarse por la persona responsable del PESV.

### 2.2 Reporte de CEA ante SuperTransporte

La Resolución 5178 de 2023 incluye los Centros de Enseñanza Automovilística entre los organismos de apoyo al tránsito sujetos al proceso institucional de reporte y verificación del PESV. ARGO debe separar:

1. **Implementación interna:** gestión anual conforme a la metodología del PESV.
2. **Reporte ante la autoridad:** registro de datos, indicadores y evidencias en el sistema que la autoridad disponga.

La carpeta local incluye manuales SISI/PESV de 2023. SuperTransporte anunció la transición de sistemas hacia SINST–VIGIA 2 y publicó anexos técnicos posteriores. El nombre del portal, los periodos, campos y contratos de integración deben ser **configurables y versionados**, no constantes fijas en frontend/backend.

El cargue manual y la interoperabilidad automática son opciones distintas. La Resolución 5178 establece que interoperar por servicios web requiere autorización de SuperTransporte; los proveedores autorizados pueden estar sujetos a auditorías. ARGO puede preparar reportes localmente sin que eso signifique que está autorizado para enviar datos directamente.

> Esta guía orienta el desarrollo. El responsable PESV y el asesor jurídico del CEA deben validar clasificación, obligaciones concretas, fechas de reporte vigentes y tratamiento de datos.

### 2.3 Fuentes regulatorias principales

- [Resolución 40595 de 2022, metodología PESV](https://normograma.mintic.gov.co/mintic/compilacion/docs/resolucion_mintransporte_40595_2022.htm)
- [Título VI de la Circular Única, proceso PI/PESV y sujetos reportantes](https://www.supertransporte.gov.co/documentos/2024/Febrero/Juridica_29/TITULO-VI-PROCESO-INSTITUCIONAL-PARA-VERIFICACION.pdf)
- [Información SISI/PESV de SuperTransporte](https://www.supertransporte.gov.co/index.php/formulario-sis-pesv/)
- [Anexo técnico PESV de 2025](https://transformaciondigital.supertransporte.gov.co/documentos/2025/legal/PESV/Anexo-Tecnico-PESV.pdf)
- [Proveedores tecnológicos autorizados](https://www.supertransporte.gov.co/index.php/formulario-sis-pesv/proveedores-tecnologicos-autorizados/)
- [Referencias de datos en MongoDB](https://www.mongodb.com/docs/manual/data-modeling/referencing/)
- [Validación de esquemas en MongoDB](https://www.mongodb.com/docs/manual/core/schema-validation/)

---

## 3. Diagnóstico del PESV actual en ARGO

Revisión focalizada en rutas, servicios, modelos, catálogos y pantallas PESV. No equivale a una auditoría funcional de toda el aula virtual, las aplicaciones Android ni todos los módulos administrativos.

| Área | Lo que ya existe | Cambio necesario |
|---|---|---|
| Rutas API | Router PESV autenticado para configuración, autodiagnóstico, fases, captura, tablero, resumen y archivos. | Mantener contratos existentes durante la refactorización. Delegar casos de uso a servicios de aplicación y filtrar toda consulta por organización/sede. |
| Backend PESV | Servicios de autodiagnóstico, captura y fase 1; modelos para configuración, autodiagnóstico, capturas y registros de fases. | Separar reglas de negocio de Mongoose, rutas y generación. Definir DTO, validaciones y repositorios. |
| Frontend Angular | Hub, autodiagnóstico, fase 1, fase 2, capturas, configuración y tablero. | Reusar navegación y servicio Angular; representar estados desde un modelo único del backend. |
| Nivel PESV | Hay una función central, pero los umbrales no coinciden con la tabla oficial. El código usa para misionalidad 1 cortes 11/201 y para misionalidad 2 cortes 6/51. | Reemplazar umbrales mágicos por reglas versionadas; separar obligación, clasificación y pasos aplicables. |
| Catálogo de fase 1 | Lista de alrededor de 50 ítems con mínimo de nivel, datos, observaciones y evidencias. | Relacionar cada ítem con el paso normativo, versión metodológica, evidencia esperada y plantilla. Evitar catálogos paralelos en cada pantalla. |
| Documentos | Catálogo y configuración de portada/encabezado/PDF. | La generación PDF/Excel de fase 1 sigue pendiente y responde con error 501. Implementar plantillas versionadas y guardar cada emisión. |
| Captura genérica | Formularios dinámicos y tablas con estructura flexible. | Reservar flexibilidad para formularios versionados. Clasificación, indicadores, vencimientos y auditoría necesitan campos tipados. |
| Fase 2 e indicadores | Registros por vigencia/periodo y sugerencias desde flota/inspecciones. | Separar datos fuente de los valores reportables; versionar fórmula, unidad, periodicidad, periodo y fuente. |
| Vehículos | Colección ARGO de vehículos. | Reutilizarla como fuente única. Usar identificador estable del vehículo, no la placa como relación principal. |
| Documentos vehiculares | Registra tipo/número, expedición, vencimiento y archivo por placa. | Reutilizar `docsvehiculos`; mapearlo al PESV sin duplicar fechas de vigencia. |
| Inspecciones | Registra placa/fecha, listas, estado general y observaciones. | Reusar si cubre los campos PESV. Ampliar con migración compatible si faltan kilometraje, defectos, inmovilización o cierre. |
| Alcance por empresa | Algunos conteos de vehículos/inspecciones no filtran por organización/sede. La configuración PESV es singleton “default”. | Confirmar el tenant de ARGO. Aislar todos los casos de uso y convertir la configuración en registro por organización/vigencia. |
| Permisos | Existen permisos de ver/editar y autenticación de backend. | Autorizar por tenant, recurso y rol en backend. Ocultar botones Angular no es una barrera de seguridad. |

### 3.1 Archivos que Composer debe inspeccionar

Backend: `argo-backend/src/routes/pesv.js`, `controllers/pesvController.js`, `services/pesv/pesvService.js`, `services/pesv/pesvCapturaService.js`, `constants/pesv/nivelPesv.js`, `catalogoFase1.js`, `catalogoFase2.js`, `catalogoDocumentos.js` y los modelos `PesvAutodiagnostico.js`, `PesvCaptura.js`, `PesvConfig.js`, `PesvFase1Registro.js`, `PesvFase2Registro.js`.

Fuentes core: `argo-backend/src/models/Vehiculo.js`, `DocVehiculo.js`, `InspeccionVehiculo.js`; más los modelos de RRHH, instructores y mantenimiento que se identifiquen en A0.

Frontend: `argo-frontend/src/app/features/pesv/`, `argo-frontend/src/app/core/services/pesv.service.ts` y `argo-frontend/src/app/core/utils/auth-routes.util.ts`.

---

## 4. Principios de arquitectura para el desarrollo

### 4.1 Límites del módulo

Mantener el módulo PESV en ARGO con dependencias claras:

- **Presentación:** rutas, controladores, DTO, validadores y componentes Angular.
- **Aplicación:** casos de uso: crear plan, clasificar nivel, evaluar paso, registrar riesgo, generar documento y cerrar auditoría.
- **Dominio:** reglas PESV, entidades, invariantes y cálculo normativo versionado.
- **Infraestructura:** repositorios Mongoose, almacenamiento de archivos, motor PDF/Excel, notificaciones y adaptador de reporte externo.

Una ruta no debe implementar una regla normativa y una consulta Mongo de principio a fin. Un componente Angular no debe ser dueño de una fórmula de indicador que también utilice el backend.

### 4.2 SOLID y Clean Code

- **Responsabilidad única:** separar clasificación, aplicabilidad, generación y reporte externo.
- **Abierto/cerrado:** incorporar nuevas versiones de metodología/plantilla mediante catálogos versionados.
- **Sustitución:** repositorios y adaptadores implementan contratos consistentes; los casos de uso no dependen de una librería de PDF.
- **Interfaces pequeñas:** separar contratos de lectura de flota, gestión de planes, documentos, evidencias y reportes.
- **Inversión de dependencias:** los casos de uso dependen de puertos; Mongoose los implementa.
- **Nombres de dominio claros:** usar vocabulario español; evitar campos críticos llamados `datos`, `valor1` o `misc`.
- **Validar temprano:** validar formato en API, reglas en dominio e índices/esquemas en Mongo.
- **Errores explícitos:** diferenciar no aplica, falta dato, duplicado, conflicto de vigencia y fallo de generación.
- **Fuente única:** no duplicar placa, vencimiento o inspección en el registro PESV.
- **Trazabilidad:** cualquier decisión que cambie nivel, cumplimiento o indicador registra autor, fecha, origen y versión de regla.

### 4.3 Convención de nombres

Para las colecciones nuevas PESV:

- Colección explícita en minúscula/snake_case: `pesv_planes`, `pesv_riesgos_viales`.
- Campos en español/camelCase, sin tildes: `organizacionId`, `fechaEvaluacion`, `justificacionNoAplica`.
- Nombre físico configurado en Mongoose, sin depender de pluralización automática.
- No renombrar ahora las colecciones heredadas. Adaptar sus campos mediante una capa anticorrupción.

---

## 5. Modelo de datos propuesto en MongoDB

### 5.1 Decisiones de modelado

1. Reusar organización/tenant, sedes, usuarios, empleados, instructores, vehículos, documentos, inspecciones y mantenimiento de ARGO tras identificar sus modelos fuente.
2. No crear otra colección de personas o vehículos mientras haya una fuente maestra usable.
3. Agregar `organizacionId` a todo nuevo registro PESV y usarlo siempre en consultas y autorizaciones. Si cada CEA tiene una base separada, mantener esa clave cuando el modelo de ARGO lo permita como defensa adicional.
4. Usar referencias para eventos de alta cardinalidad que se consultan independientemente: actividades, siniestros, auditorías, archivos y mediciones.
5. Guardar un snapshot pequeño de los datos usados al emitir un documento o cerrar un reporte; el snapshot no reemplaza a la fuente maestra.
6. No usar arrays ilimitados para historial, evidencias o eventos.
7. Guardar archivos en almacenamiento privado; Mongo conserva metadatos, clave, hash y relación.
8. `Mixed` solo para extensiones no críticas o formularios versionados. Los datos de cumplimiento son tipados.
9. No borrar registros históricos de cumplimiento, auditoría, reportes, eventos o documentos aprobados; rectificar con una nueva versión/evento.
10. Minimizar datos personales, salud, alcohol/SPA, víctimas y geolocalización; aplicar acceso y retención limitados.

MongoDB permite modelos embebidos y referenciados. Elegir según cardinalidad, actualización y consultas; no copiar datos maestros que cambian dentro de cada plan. Usar validación de esquema cuando el modelo esté definido.

### 5.2 Campos comunes

| Campo | Tipo sugerido | Regla |
|---|---|---|
| `_id` | ObjectId | Identificador Mongo. |
| `organizacionId` | Tipo que use el tenant actual | Obligatorio en registro y filtros. |
| `sedeId` | ObjectId/String opcional | Cuando el registro corresponde a sede. |
| `creadoEn` | Date | UTC. |
| `creadoPorId` | ObjectId/String | Usuario autenticado. |
| `actualizadoEn` | Date opcional | Actualizar en cambios permitidos. |
| `actualizadoPorId` | ObjectId/String opcional | Usuario que modifica. |
| `versionRegistro` | Number | Control optimista para documentos editables. |
| `estado` | Enum de dominio | Evitar borrado físico para históricos. |

No aceptar `organizacionId` del cuerpo HTTP como autoridad. Derivarlo del contexto autenticado y comprobar que las referencias relacionadas pertenecen al mismo tenant.

### 5.3 Colecciones núcleo

#### A. Metodología y clasificación

| Colección | Campos recomendados | Restricciones |
|---|---|---|
| `pesv_versiones_metodologia` | `codigo`, `nombre`, `normaReferencia`, `anexoReferencia`, `vigenteDesde`, `vigenteHasta`, `estado`, `hashFuente` | `codigo` único. No alterar una versión usada en planes cerrados. |
| `pesv_catalogo_pasos` | `metodologiaVersionId`, `numeroPaso`, `fase`, `nombre`, `descripcion`, `aplicaBasico`, `aplicaEstandar`, `aplicaAvanzado`, `orden`, `evidenciasEsperadas`, `plantillasRelacionadas`, `activo` | Único por versión y número de paso; fases 1–4, pasos 1–24. |
| `pesv_reglas_clasificacion` | `metodologiaVersionId`, `misionalidad`, `criterio` (`vehiculos`/`conductores`), `nivel`, `desdeIncluyente`, `hastaIncluyente`, `sinLimiteSuperior`, `notaInterpretacion`, `vigenteDesde`, `vigenteHasta` | Reglas versionadas desde la tabla oficial revisada. |
| `pesv_planes` | `organizacionId`, `vigencia`, `numeroVersion`, `metodologiaVersionId`, `misionalidad`, `nivelActual`, `estado`, `responsablePesvId`, `fechaInicio`, `fechaAprobacion`, `porcentajeAvance`, `observaciones` | Índice por organización/vigencia; una versión activa según política definida. |
| `pesv_clasificaciones` | `organizacionId`, `planId`, `fechaCorte`, `totalVehiculos`, `totalConductores`, `nivelPorVehiculos`, `nivelPorConductores`, `nivelFinal`, `reglaAplicada`, `fuentesConteo`, `requiereRevisionHumana`, `justificacion`, `revisadoPorId`, `revisadoEn` | Inmutable; nueva evaluación crea registro nuevo. |
| `pesv_pasos_plan` | `organizacionId`, `planId`, `pasoCatalogoId`, `numeroPaso`, `aplica`, `justificacionNoAplica`, `estado`, `responsableId`, `fechaInicio`, `fechaLimite`, `fechaCierre`, `comentario`, `porcentaje` | Único por plan/paso; exigir justificación para `noAplica`. |

#### B. Gobierno y caracterización

| Colección | Campos recomendados | Notas |
|---|---|---|
| `pesv_comites` | `organizacionId`, `planId`, `nombre`, `fechaConformacion`, `estado`, `actaDocumentoId`, `vigenciaDesde`, `vigenciaHasta` | Condicional para Estándar/Avanzado. |
| `pesv_integrantes_comite` | `organizacionId`, `comiteId`, `personaId`, `cargoComite`, `representaArea`, `vigenciaDesde`, `vigenciaHasta` | Referenciar personas existentes. |
| `pesv_reuniones_comite` | `organizacionId`, `comiteId`, `fecha`, `tipo`, `temas`, `decisiones`, `compromisos`, `actaDocumentoId`, `asistentesPersonaIds` | Si crece, normalizar asistentes en registros relacionados. |
| `pesv_caracterizaciones` | `organizacionId`, `planId`, `fechaCorte`, `actividadEconomica`, `sedesIncluidas`, `procesosIncluidos`, `cantidadPersonas`, `cantidadConductores`, `cantidadVehiculos`, `desplazamientos`, `modosTransporte`, `exposiciones`, `fuenteDatos`, `aprobadoPorId` | Declarar el universo y contratistas incluidos. |
| `pesv_perfiles_exposicion` | `organizacionId`, `planId`, `personaId` o `grupoPoblacional`, `rolVial`, `modoTransporte`, `frecuencia`, `sedeId`, `procesoId`, `nivelExposicion`, `fechaCorte` | Crear solo si no existe equivalente RRHH; usar agregados en reportes. |

#### C. Riesgos, objetivos, programas y ejecución

| Colección | Campos recomendados | Notas |
|---|---|---|
| `pesv_evaluaciones_riesgo` | `organizacionId`, `planId`, `fechaEvaluacion`, `metodologiaValoracion`, `sedeId`, `procesoId`, `rutaId`, `elaboradoPorId`, `estado`, `aprobadoPorId` | Nueva versión al cambiar exposición/operación/controles. |
| `pesv_riesgos_viales` | `organizacionId`, `evaluacionRiesgoId`, `actividad`, `peligro`, `eventoNoDeseado`, `consecuencia`, `factorDesempeno`, `probabilidad`, `severidad`, `nivelRiesgo`, `clasificacion`, `riesgoResidual`, `responsableId`, `fechaRevision` | Escala de valoración versionada, no inferida del color del Excel. |
| `pesv_controles_riesgo` | `organizacionId`, `riesgoId`, `tipoControl`, `descripcion`, `responsableId`, `fechaImplementacion`, `fechaVerificacion`, `estado`, `eficacia`, `evidenciaIds` | Control vinculado a riesgos y evidencias. |
| `pesv_objetivos` | `organizacionId`, `planId`, `codigo`, `nombre`, `descripcion`, `lineaBase`, `meta`, `unidad`, `fechaInicio`, `fechaFin`, `responsableId`, `indicadorId`, `estado` | La fórmula no puede vivir solo como texto si se automatiza. |
| `pesv_programas` | `organizacionId`, `planId`, `tipoPrograma`, `nombre`, `objetivo`, `alcance`, `factorDesempeno`, `responsableId`, `meta`, `frecuenciaEvaluacion`, `mecanismoMedicion`, `version`, `estado`, `aprobadoEn` | Una estructura sirve para los programas 25–31. |
| `pesv_actividades` | `organizacionId`, `planId`, `pasoNumero`, `programaId`, `objetivoId`, `nombre`, `descripcion`, `responsableId`, `frecuencia`, `fechaInicio`, `fechaLimite`, `fechaEjecucion`, `recursos`, `estado`, `resultado`, `evidenciaIds`, `dependenciasIds` | Reusar para plan anual y programas, sin duplicar cronogramas. |
| `pesv_sesiones_formacion` | `organizacionId`, `planId`, `curso`, `tema`, `objetivo`, `modalidad`, `facilitadorId`, `fechaInicio`, `fechaFin`, `duracionMinutos`, `poblacionObjetivo`, `evaluacion`, `evidenciaIds` | Separar programa, sesión ejecutada y asistencia. |
| `pesv_asistencias_formacion` | `organizacionId`, `sesionId`, `personaId`, `estadoAsistencia`, `resultadoEvaluacion`, `fechaRegistro`, `evidenciaId` | Único por sesión/persona. |

#### D. Flota, personas y operación

| Fuente/colección | Decisión |
|---|---|
| ARGO `vehiculos` | Reusar `vehiculoId`; leer placa, sede, clase, modalidad y estado. Placa es dato visible, no llave principal de relaciones. |
| ARGO `docsvehiculos` | Reusar tipo, número, expedición, vencimiento y archivo. Migrar gradualmente para asociar `vehiculoId` estable si hoy solo existe placa. |
| ARGO `inspeccionesvehiculos` | Reusar listas/estados existentes. Revisar si faltan kilometraje, defectos, inmovilización y cierre. No reescribir históricos sin migración/rollback. |
| Mantenimiento ARGO | Buscar modelo fuente de órdenes y hojas de vida antes de crear mantenimiento PESV duplicado. |
| Personal/conductores | Inspeccionar RRHH, instructores, usuarios y documentos antes de crear colección de personas. Licencias/roles deben referenciar persona existente. |

Si falta control de credenciales, usar **`pesv_credenciales_conductor`** con estos campos: `organizacionId`, `personaId`, `tipoDocumento`, `numeroDocumento`, `categoriaLicencia`, `fechaExpedicion`, `fechaVencimiento`, `estadoVigencia`, `aptoParaConducir`, `documentoId`, `fechaVerificacion`, `verificadoPorId`.

El examen médico debe conservar solo el estado/vigencia necesarios. No almacenar historia clínica ni diagnóstico en el control PESV general.

Para horas/fatiga, si no existe un módulo operacional equivalente, usar **`pesv_jornadas_conduccion`** con: `organizacionId`, `personaId`, `vehiculoId`, `fecha`, `horaInicio`, `horaFin`, `minutosConduccion`, `minutosPausa`, `minutosDescanso`, `viajeId`, `estadoAlerta`, `observaciones`, `registradoPorId`.

#### E. Siniestros, indicadores, auditoría y archivos

| Colección | Campos recomendados |
|---|---|
| `pesv_eventos_viales` | `organizacionId`, `planId`, `fechaHora`, `tipoEvento`, `severidad`, `ubicacion`, `rutaId`, `kilometrajeExposicion`, `descripcion`, `estado`, `reportadoEn`, `fuente` |
| `pesv_involucrados_evento` | `organizacionId`, `eventoId`, `personaId`, `vehiculoId`, `rolVial`, `tipoAfectacion`, `gravedadLesion`, `tercero`, `datosMinimizados` |
| `pesv_investigaciones` | `organizacionId`, `eventoId`, `fechaApertura`, `fechaCierre`, `investigadorIds`, `causasInmediatas`, `causasBasicas`, `factoresContribuyentes`, `conclusiones`, `leccionesAprendidas`, `estado` |
| `pesv_indicadores` | `organizacionId`, `planId`, `codigo`, `nombre`, `tipo`, `descripcion`, `numeradorDefinicion`, `denominadorDefinicion`, `unidad`, `sentidoMejora`, `formulaVersion`, `periodicidad`, `fuentesDatos`, `meta`, `nivelAplicable`, `activo` |
| `pesv_mediciones_indicador` | `organizacionId`, `planId`, `indicadorId`, `periodoInicio`, `periodoFin`, `numerador`, `denominador`, `resultado`, `unidad`, `fechaCorte`, `fuentesRegistroIds`, `calculadoEn`, `validadoPorId`, `estado` |
| `pesv_auditorias` | `organizacionId`, `planId`, `fecha`, `objetivo`, `alcance`, `criterios`, `auditorIds`, `independienteDelLider`, `resultado`, `informeDocumentoId`, `estado` |
| `pesv_hallazgos` | `organizacionId`, `auditoriaId`, `pasoNumero`, `tipoHallazgo`, `descripcion`, `evidenciasIds`, `responsableId`, `fechaLimite`, `estado`, `verificacionEficacia` |
| `pesv_acciones_mejora` | `organizacionId`, `planId`, `hallazgoId`, `eventoId`, `riesgoId`, `causaRaiz`, `accion`, `responsableId`, `fechaLimite`, `estado`, `fechaCierre`, `eficacia`, `evidenciaIds` |
| `pesv_plantillas_documentales` | `codigo`, `nombre`, `version`, `formatoOrigen`, `formatoSalida`, `pasosRelacionados`, `nivelMinimo`, `camposRequeridos`, `vigenteDesde`, `vigenteHasta`, `hashPlantilla`, `estado` |
| `pesv_documentos_generados` | `organizacionId`, `planId`, `pasoNumero`, `plantillaId`, `versionPlantilla`, `nombreArchivo`, `archivoId`, `datosSnapshot`, `hashEntrada`, `hashArchivo`, `estadoAprobacion`, `generadoPorId`, `generadoEn`, `aprobadoPorId`, `aprobadoEn` |
| `pesv_archivos` | `organizacionId`, `claveAlmacenamiento`, `nombreOriginal`, `mimeType`, `tamanoBytes`, `hashSha256`, `clasificacion`, `subidoPorId`, `subidoEn`, `retencionHasta`, `estadoRevision` |
| `pesv_vinculos_archivo` | `organizacionId`, `archivoId`, `tipoEntidad`, `entidadId`, `rolArchivo`, `pasoNumero`, `fechaVinculo` |
| `pesv_envios_externos` | `organizacionId`, `planId`, `sistemaDestino`, `versionContrato`, `periodo`, `tipoReporte`, `estado`, `payloadHash`, `enviadoEn`, `respuestaResumen`, `identificadorExterno`, `archivoAcuseId`, `reintentoDeId` |
| `pesv_bitacora_auditoria` | `organizacionId`, `usuarioId`, `accion`, `entidad`, `entidadId`, `fecha`, `correlationId`, `resultado`, `cambiosPermitidos` |

### 5.4 Índices y consistencia

Revisar como mínimo: planes por organización/vigencia/versión; pasos únicos por organización/plan/paso; actividades por organización/plan/estado/fecha límite; eventos por organización/fecha; mediciones por organización/indicador/periodo; documentos por organización/plan/paso/fecha.

Cada consulta valida tenant y referencias del mismo tenant. No usar TTL para cumplimiento, reportes, siniestros, evidencias o auditoría sin política aprobada.

---

## 6. Matriz de plantillas a generar o soportar

La carpeta `plantillas` es el catálogo de salidas y formularios fuente; **no se crea una colección por archivo**. Muchas plantillas muestran los mismos datos desde perspectivas distintas.

| Artefacto | Tipo | Datos fuente | Decisión |
|---|---|---|---|
| `00_MAPA_PESV_Guia_de_Documentos_2026.xlsx` | Índice/ayuda | Catálogo de plantillas y pasos | Ayuda estática o generada del catálogo; no evidencia individual. |
| `00_Empieza_aqui_Bienvenida.docx` | Ayuda | Catálogo de módulos/enlaces | Guía inicial del producto. |
| `01_Documento_Maestro_PESV_2026.docx` | Generado | Organización, plan, nivel, líder, política, objetivos, programas y actividades | Documento compuesto con datos aprobados. |
| `02_Politica_Seguridad_Vial_2026.docx` | Generado | Política, alcance, compromisos, aprobación, vigencia y divulgación | Guardar aprobación, versión y evidencia de comunicación. |
| `03_Acta_Comite_Seguridad_Vial_2026.docx` | Generado condicional | Comité, integrantes, reunión, decisiones y firmas | Estándar/Avanzado; validar miembros. |
| `04_Objetivos_e_Indicadores_2026.xlsx` | Ficha/reporte | Objetivos, fórmulas, fuente, línea base, meta, periodo y responsable | Fórmulas auditables; resultados calculados. |
| `05_Autodiagnostico_Nivel_PESV_2026.xlsx` | Captura/salida | Misionalidad, conteos, regla y pasos aplicables | Corregir fórmula actual; guardar fundamento. |
| `06_Caracterizacion_2026.xlsx` | Captura/reporte | Organización, sedes, personas, flota, contratistas y exposición | Corte por vigencia y fuentes de datos. |
| `Matriz_Requisitos_Legales_PESV_2026.xlsx` | Matriz/reporte | Normas, requisitos, aplicabilidad, estado, evidencia, responsable | Catálogo normativo versionado. |
| `07_Matriz_Riesgos_Viales_2026.xlsx` | Captura/reporte | Peligros, probabilidad, severidad, controles, nivel y tratamiento | Escala versionada; mostrar riesgo inicial/residual. |
| `08_Plan_Anual_Trabajo_2026.xlsx` | Captura/reporte | Actividades, pasos, responsables, recursos, fechas, estado y evidencia | Ejecución alimenta indicadores. |
| `09_Control_Conductores_2026.xlsx` | Vista de control | Personas, licencias, documentos, formación y comparendos | Fuente RRHH/licencias; sin datos médicos innecesarios. |
| `10_Programa_Capacitacion_Vial_2026.docx` | Generado | Temas, competencias, población, frecuencia, responsable y asistencias | Separar programa, sesiones y asistencia. |
| `11_Control_Horas_Fatiga_2026.xlsx` | Captura/reporte | Jornada, conductor, viaje, horas, pausas, descansos y alertas | Umbrales desde política aprobada, no desde ejemplo de Excel. |
| `12_Politicas_Regulacion_Conduccion_2026.docx` | Generado | Velocidad, alcohol/SPA, cinturón, distracción, fatiga y protección | Guardar versión, aprobación y divulgación. |
| `13_Inspeccion_Preoperacional_2026.xlsx` | Captura/reporte | Vehículo, conductor, fecha, km, checklist, falla e inmovilización | Reusar inspecciones ARGO; hallazgo crítico abre acción. |
| `14_Plan_Mantenimiento_2026.xlsx` | Plan/reporte | Vehículo, actividad, frecuencia, fechas, orden y proveedor | Reutilizar módulo ARGO si existe. |
| `15_Control_Vehiculos_2026.xlsx` | Vista | Vehículo, SOAT, RTM, póliza, km y vencimientos | Generar desde `vehiculos`/`docsvehiculos`; no duplicar expiraciones. |
| `16_Analisis_Rutas_2026.xlsx` | Captura/reporte | Ruta, origen, destino, tramos, puntos críticos, riesgo y controles | Separar ruta, riesgo y viaje ejecutado. |
| `17_Protocolo_Atencion_Victimas_2026.docx` | Generado | Contactos, roles, secuencia de respuesta, recursos y aprobación | Protocolo separado del registro real de evento. |
| `18_Investigacion_Accidentes_2026.xlsx` | Captura/reporte | Evento, involucrados, relato, causas, evidencia y acciones | Soportar varias personas, vehículos y acciones. |
| `19_Tablero_Indicadores_PESV_2026.xlsx` | Calculado | Mediciones versionadas, periodos y fuentes | Calcular desde registros y congelar cortes. |
| `20_Checklist_Autoevaluacion_2026.xlsx` | Captura/reporte | Pasos, estado, evidencia y observaciones | Distinto del autodiagnóstico de nivel. |
| `21_Formato_Auditoria_Interna_2026.docx` | Generado | Auditoría, alcance, criterios, auditor, hallazgos y acciones | Evaluar eficacia e independencia del líder. |
| `22_Guia_Registro_y_Verificacion_PESV_2026.pdf` | Referencia | Contenido fijo | No se genera por CEA. |
| `23_Guia_Implementacion_PESV_2026.pdf` | Referencia | Contenido fijo | Ayuda; no reemplaza flujo del sistema. |
| `24_Guia_Diagnostico_Nivel_2026.pdf` | Referencia | Contenido fijo | Contrastar con regla versionada. |
| Programa 25: Velocidad segura | Generado | Objetivo, alcance, responsable, meta, controles, medición y evidencia | Vincular telemetría solo si existe. |
| Programa 26: Fatiga | Generado | Jornadas, pausas, descansos, viajes, medición y acciones | Vincular a jornadas reales; no asumir sensores. |
| Programa 27: Alcohol/SPA | Generado sensible | Política, responsable, protocolo, controles e indicadores | Definir privacidad, acceso, minimización y retención. |
| Programa 28: Distracción | Generado | Política, verificaciones, eventos, responsables e indicadores | Revisar privacidad antes de vigilancia/cámaras. |
| Programa 29: Cinturón/retención | Generado | Controles, inspección, hallazgos, formación y acciones | Vincular inspección/mantenimiento y cierre. |
| Programa 30: Actores vulnerables | Generado | Rutas, puntos críticos, eventos, actividades y formación | Conectar análisis de rutas y siniestros. |
| Programa 31: Selección/control de conductores | Generado | Requisitos por rol, documentos, selección, capacitación e indicadores | Referenciar hojas de vida ARGO. |
| `BONO_01_Checklist_Pre_Visita_Verificacion.pdf` | Ayuda opcional | Pasos/evidencias | Vista de preparación; no sustituye lista oficial de autoridad. |
| `BONO_02_Actualizacion_2026.pdf` | Referencia | Contenido fijo | No generar por CEA; revisar antes de distribuir. |

### 6.1 Proceso de generación documental

1. Seleccionar plantilla, versión y hash.
2. Consultar datos del tenant autenticado.
3. Validar campos obligatorios, aplicabilidad y vencimientos relevantes.
4. Mostrar errores accionables antes de generar.
5. Crear vista previa y permitir aprobación.
6. Guardar archivo, hash, plantilla, versión, fuentes, usuario, fecha y vínculos.
7. Una corrección crea nueva versión; no sobrescribe la emitida.
8. Mantener dato estructurado separado del archivo.
9. No prometer firma electrónica si no hay flujo real.
10. Archivos privados, nunca expuestos desde `public`.

El motor debe admitir DOCX/XLSX y PDF cuando aplique. Las guías PDF son referencia, no formularios para rellenar.

---

## 7. Ruta de implementación

### Etapa 0. Confirmar alcance

Definir tenant/base por CEA, relación con sedes, modelos fuente de RRHH/instructores/mantenimiento, roles, datos sensibles y si A1–A10 prepararán reporte manual o también iniciarán autorización como proveedor tecnológico.

**Salida:** mapa de fuentes y decisiones de tenant/permisos.

### Etapa 1. Línea base de brechas

Crear matriz de pasos 1–24 con requisito, nivel, pantalla, ruta, caso de uso, modelo, evidencia/plantilla, estado (reutilizar/corregir/ampliar/desarrollar), dueño y aceptación.

**Salida:** todos los pasos y plantillas quedan trazados; un botón o captura genérica no cuenta como “cubierto”.

### Etapa 2. Clasificación y reglas

- Corregir tabla de misionalidad/nivel.
- Separar obligación y nivel.
- Calcular nivel por vehículos y conductores y tomar el mayor.
- Guardar fuentes de conteo, fecha, regla y revisión.
- Versionar metodología; no recalcular planes cerrados por cambio de reglas.
- Aplicar pasos desde catálogo.

**Salida:** clasificación explicable y reproducible.

### Etapa 3. Tenant y permisos

- Resolver tenant desde autenticación.
- Filtrar consultas por organización.
- Validar propiedad de referencias.
- Convertir configuración singleton a organización/vigencia.
- Definir permisos de editar, aprobar, auditar, descargar y datos sensibles.
- Auditar accesos y cambios.

**Salida:** ningún CEA puede leer o modificar otro tenant.

### Etapa 4. Esquemas y migración

- Crear colecciones nuevas en español.
- Definir esquemas, enums, índices y validaciones.
- Implementar repositorios.
- Reconciliar conteos con fuentes actuales.
- Migrar primero en copia con rollback.
- Evitar cambios destructivos históricos.

**Salida:** datos nuevos tipados, aislados y sin duplicar maestros.

### Etapa 5. Catálogo de pasos y captura

Crear ficha por paso con aplicabilidad, responsable, fechas, estado, evidencia y aprobación. Formularios dinámicos con código/versión/esquema definidos. No sustituir datos estructurados por texto libre.

**Salida:** estado consistente para los 24 pasos y niveles.

### Etapa 6. Integración operacional

Reusar vehículos/documentos/inspecciones y buscar fuentes RRHH/mantenimiento. Añadir solo lo que falta para conductor, licencia, viaje, ruta, jornada, pausas, defectos y mantenimiento. Declarar fuente/propietario/cadencia de cada dato y evitar dobles conteos.

### Etapa 7. Riesgo, programas y eventos

Implementar caracterización, riesgo, controles, programas, objetivos, plan anual, formación, siniestros, investigación, acciones y lecciones. Revisar privacidad antes de formularios médicos y alcohol/SPA.

**Salida:** trazabilidad riesgo → control → actividad → evidencia → indicador.

### Etapa 8. Plantillas

Cargar archivo/versión/hash; mapear campos; identificar fórmulas, tablas y firmas; validar aplicabilidad; generar preview; aprobar y guardar salida inmutable. Estado por plantilla: lista, incompleta, no aplica o emitida.

### Etapa 9. Indicadores y reporte externo

Versionar numerador, denominador, unidad, periodicidad, fuente y regla para cero/no disponible. Calcular desde fuentes; aceptar captura manual trazable si corresponde; guardar cortes. Preparar exportación manual antes de API. Interoperabilidad solo con contrato vigente y autorización requerida.

**Salida:** generar no equivale a enviar; enviar no equivale a aceptación; guardar respuesta y acuse.

### Etapa 10. Auditoría, mejora y piloto

Registrar auditoría, independencia, alcance, criterios, muestras, hallazgos, acciones y eficacia. Gestionar comunicación/participación. Ejecutar un ciclo con un CEA piloto, conciliar fuentes y resolver hallazgos antes de ampliar.

**Salida:** un CEA completa una vigencia con documentos, datos, indicadores y reportes rastreables.

---

## 8. Cobertura por fase y nivel

| Fase | Pasos | Capacidades |
|---|---|---|
| 1. Planificación | 1–8 | Líder, comité, política, liderazgo, diagnóstico, caracterización/riesgos, objetivos y programas. |
| 2. Implementación y ejecución | 9–19 | Plan anual, formación, comportamiento avanzado, emergencias, investigación, vías, viajes, inspección, mantenimiento, cambio/contratistas y archivo. |
| 3. Seguimiento | 20–22 | Indicadores/reporte, estadística en Avanzado y auditoría anual. |
| 4. Mejora | 23–24 | Acciones, eficacia, comunicación, participación y lecciones aprendidas. |

Condicionales según nivel: comité (2), comportamiento seguro (11), investigación interna (13), cambio/contratistas (18), archivo/retención (19) y análisis estadístico avanzado (21). Cualquier no aplicabilidad por naturaleza de organización requiere justificación. Usar catálogo vigente, no condicionales duplicados en Angular.

---

## 9. Seguridad y privacidad

- Autorizar por usuario, rol, tenant y sensibilidad.
- Proteger licencias, comparendos, víctimas y ubicaciones.
- Para salud y alcohol/SPA definir finalidad, base jurídica, acceso y retención antes de implementar.
- No mostrar detalle clínico en reportes generales.
- Archivos privados, escaneados, con tamaño/MIME permitidos y nombre aleatorio; evitar `public`.
- En descargas, comprobar permiso y usar URL temporal.
- Cifrar tráfico y secretos; no guardar contraseñas de portales.
- Auditar consulta/descarga de evidencias sensibles.
- Excluir PII, tokens y salud de logs.
- Definir retención, bloqueo legal y eliminación autorizada.
- Respaldar y probar recuperación de base, archivos y plantillas.

---

## 10. Negociación de entregas con Composer

Solicitar entregas pequeñas. No pedir “implementar todo el PESV” en un solo prompt.

### Reglas por entrega

1. Composer inspecciona flujo y presenta plan de archivos antes de editar.
2. Declara rutas, modelos fuente, tenant, permisos, compatibilidad y criterios.
3. Limita cambios al alcance acordado.
4. Nuevos campos/colecciones en español.
5. No cambiar colecciones existentes sin migración/rollback.
6. Ninguna consulta omite organización.
7. Ninguna regla legal queda como número mágico.
8. Contradicciones entre norma/guía/plantilla/código se presentan antes de automatizar.
9. Cada documento guarda plantilla, versión, hash, origen, autor y fecha.
10. Al cierre informa archivos, cambio funcional, migración, verificación y pendientes.
11. No despliegues ni envíos externos forman parte de una entrega de código.

### Entregas sugeridas

| Entrega | Alcance | Criterio de aceptación |
|---|---|---|
| A0. Inventario | Rutas, pantallas, modelos, tenant, permisos y fuentes | Decisiones confirmadas; sin cambios de código. |
| A1. Clasificación | Obligación, misionalidad, nivel y reglas | Coincide con tabla aprobada y explica resultado. |
| A2. Tenant | Configuración por organización/vigencia y filtros | Acceso cruzado rechazado. |
| A3. Catálogo normativo | Versiones, fases, pasos y reglas | 24 pasos; totales 18/22/24 por nivel. |
| A4. Cumplimiento | Responsable, estado, fechas, evidencia y no aplicabilidad | Sin catálogos duplicados ni estados contradictorios. |
| A5. Reutilización ARGO | Flota, documentos, inspecciones, RRHH y mantenimiento | No se duplican fuentes; conteos concilian. |
| A6. Ejecución | Riesgo, objetivos, programas, plan anual y formación | Actividad conecta responsable, periodo, evidencia y resultado. |
| A7. Siniestros/indicadores | Eventos, investigación, fuentes y cortes | Resultado reproducible desde datos fuente. |
| A8. Plantillas | Mapeo, validación, generación, aprobación y versiones | Cada salida usa datos del tenant y queda trazada. |
| A9. Reporte | Exportación manual y después adaptador autorizado | Distingue listo, enviado, aceptado y rechazado. |
| A10. Piloto | Auditoría, acciones, privacidad y ciclo anual | Un CEA termina vigencia conciliada. |

### Prompt base para Composer

> Inspecciona el módulo PESV existente en ARGO antes de proponer cambios. Sigue las instrucciones del repositorio y esta guía. Esta entrega se limita a **[A0–A10 y alcance concreto]**.
>
> Antes de editar, presenta flujo actual, archivos implicados, modelos fuente reutilizables, alcance tenant, riesgos de compatibilidad, diseño por capas y criterios de aceptación.
>
> Respeta Clean Architecture y SOLID. Mantén rutas/controladores delgados; coloca reglas PESV en dominio/casos de uso; usa repositorios/adaptadores para Mongoose, archivos y sistemas externos. Para cambios de esquema, declara migración compatible y rollback. Nombra colecciones/campos nuevos en español, sin tildes. No dupliques personas, vehículos, documentos, inspecciones ni mantenimiento.
>
> No hardcodees niveles, periodicidades, fórmulas, requisitos ni nombres de portales. Usa metodología/contrato versionados. Cada consulta debe autorizar organización en servidor. No expongas archivos sensibles. Cada documento emitido registra plantilla/versión, hash, fuentes, autor y fecha.
>
> No amplíes alcance a módulos no relacionados. Si hay contradicción entre norma, guía, plantilla y código, presenta evidencia y propone una decisión antes de automatizar.
>
> Al terminar, informa archivos, comportamiento, migración/rollback, riesgos, verificación y pendientes. No despliegues ni transmitas datos a la autoridad.

---

## 11. Criterios para considerar el PESV listo

- Obligación, misionalidad, nivel y versión de regla documentados.
- Pasos aplicables con responsable, estado, fechas, evidencias y justificaciones.
- Plantillas clasificadas como salida, captura o referencia.
- Personas, vehículos, documentos, inspecciones y mantenimiento usan fuentes únicas.
- Evidencias vinculadas al requisito y al dato que prueban.
- Indicadores rastreables a numerador/denominador y fuentes.
- Documentos históricos identificables por plantilla y versión.
- Auditoría, acciones, eficacia y comunicación implementadas.
- Aislamiento por CEA en backend, consultas y archivos.
- Sistema distingue manual, importado, calculado, incompleto y vencido.
- Reporte externo alineado con portal/contrato/periodos vigentes.
- Un piloto termina la vigencia y concilia documentos, datos e indicadores.

---

## 12. Decisiones pendientes antes de A1

1. Confirmar si ARGO separa CEA por base o usa base compartida, y cuál es el identificador tenant.
2. Confirmar modelos fuente de RRHH, instructores, licencias y mantenimiento.
3. Definir si la primera versión prepara reportes manuales o inicia autorización como proveedor tecnológico.
4. Aprobar roles para salud, pruebas alcohol/SPA, víctimas y documentos personales.
5. Confirmar qué versión de las plantillas 2026 será salida oficial.
6. Definir revisión legal de clasificaciones fuera de rangos.
7. Consultar manual/calendario externo vigente al lanzar cada versión.

---

## 13. Insumos revisados

- `Guia_PESV_Colombia_ISO39001_2026.md`
- `esquema_datos_PESV_v1.md`
- `diccionario_datos_PESV_v1.md`
- Plantillas 00–31, matriz legal, guías y bonos de la carpeta `plantillas`.
- Resolución 5178 de 2023, anexos PI/PESV y acreditación de proveedor tecnológico.
- Manual SISI/PESV 2023 y manual de indicadores PI/PESV.
- ARGO: backend/frontend PESV y modelos fuente de vehículos, documentos e inspecciones.

Se omitieron `public` y el ZIP según instrucción del usuario. No se modificó el código de ARGO ni las plantillas originales.
