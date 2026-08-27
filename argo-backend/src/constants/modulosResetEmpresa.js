/**
 * Módulos seleccionables para reset parcial de empresa.
 * Solo incluye colecciones que NO están en CONSERVAR_EN_RESET (catálogos base).
 * El reset completo (sin módulos o con "completo") conserva el comportamiento anterior.
 */

const MODULOS_RESET = [
  {
    id: 'academico',
    etiqueta: 'Académico',
    descripcion: 'Alumnos, matrículas, liquidaciones de matrícula, certificados emitidos y lotes de migración.',
    colecciones: [
      'datosAlumnos',
      'matriculas',
      'liquidacion',
      'certificados',
      'migracionLotes',
    ],
    advertencias: [
      'Si conserva Contable, pueden quedar pagos o recibos sin matrícula asociada.',
    ],
  },
  {
    id: 'contable',
    etiqueta: 'Contable y caja',
    descripcion: 'Ingresos, egresos, sesiones y cierres de caja, clientes/terceros de facturación, gestores comerciales, FE y pagos en línea.',
    colecciones: [
      'ingresos',
      'egresos',
      'cajaSesiones',
      'cajaCierresGenerales',
      'cajaDescuadres',
      'clientesFacturacion',
      'gestores',
      'tercerosCaja',
      'facturasElectronicas',
      'notasCreditoElectronicas',
      'pagosEnLineaIntents',
    ],
    advertencias: [
      'Si conserva Académico, las matrículas pueden mostrar saldos desactualizados hasta registrar pagos de nuevo.',
    ],
  },
  {
    id: 'programacion_cea',
    etiqueta: 'Programación CEA',
    descripcion:
      'Clases programadas CEA (práctica y grupo), inscripciones a esas clases y temarios por programa.',
    colecciones: ['clasesProgramadasCea', 'inscripcionesClaseCea', 'temasProgramaCea'],
    advertencias: [
      'No borra alumnos ni matrículas; si conserva Académico pueden quedar referencias a clases eliminadas.',
    ],
  },
  {
    id: 'jornadas_capacitacion',
    etiqueta: 'Jornadas de capacitación',
    descripcion:
      'Contratos con empresas, jornadas en campo, clases, asistencias, encuestas de satisfacción, supervisores y registros web pendientes.',
    colecciones: [
      'contratacion',
      'jornadasCap',
      'clasesJornadaCap',
      'asisClasJorCap',
      'encuestasJornadaCap',
      'respuestasEncuestaJornada',
      'supervisores',
      'registroJornadaPendiente',
    ],
    advertencias: [
      'No borra alumnos ni el catálogo de clientes/empresas; pueden quedar vínculos en fichas de alumno.',
      'Los certificados emitidos por jornadas están en el módulo Académico; bórrelos aparte si los necesita en cero.',
    ],
  },
  {
    id: 'cohortes_academicas',
    etiqueta: 'Cohortes académicas (técnicos / diplomados)',
    descripcion:
      'Plan por semestres, materias, grupos (cohortes), inscripciones, clases, asistencias, evaluaciones y materias aprobadas.',
    colecciones: [
      'semestresPrograma',
      'materiasCohorte',
      'catalogoMaterias',
      'esquemasNotasPrograma',
      'cohortes',
      'inscripcionesCohorte',
      'clasesCohorte',
      'asistenciasCohorte',
      'materiasAprobadasCohorte',
      'materialesCohorte',
      'evaluacionesCohorte',
      'intentosEvaluacionCohorte',
      'bancoPreguntasCohorte',
      'notasCriterioCohorte',
    ],
    advertencias: [
      'No borra programas ni alumnos; si conserva Académico pueden quedar referencias huérfanas.',
    ],
  },
  {
    id: 'catalogos_operacion',
    etiqueta: 'Programas, sedes e infraestructura',
    descripcion: 'Programas y servicios con tarifas, combos, sedes, aulas, talleres/patios y plantillas de certificado.',
    colecciones: ['programas', 'servicios', 'combosPrograma', 'sedes', 'aulas', 'talleres', 'plantillasCertificado'],
    advertencias: [
      'Al borrar sedes, el sistema intentará dejar una sede «Principal» solo si ejecuta reset completo o incluye Configuración del sistema.',
    ],
  },
  {
    id: 'rrhh',
    etiqueta: 'RRHH y nómina',
    descripcion: 'Empleados, contratos laborales, documentos del personal, liquidaciones de nómina y evaluaciones de desempeño.',
    colecciones: [
      'empleados',
      'contratos',
      'docsempleados',
      'periodosNomina',
      'novedadesNomina',
      'liquidacionesNomina',
      'competencias_desempeno',
      'empleado_anotaciones',
      'empleado_evaluaciones',
    ],
    advertencias: [
      'Los usuarios del ERP conservan su vínculo con empleados eliminados hasta que resetee Usuarios del personal.',
    ],
  },
  {
    id: 'vehiculos',
    etiqueta: 'Vehículos e inspecciones',
    descripcion: 'Flota, documentos del vehículo, inspecciones técnicas y preoperacionales.',
    colecciones: [
      'vehiculos',
      'docsvehiculos',
      'inspTecPreop',
      'inspeccionesvehiculos',
      'detInspeccion',
    ],
  },
  {
    id: 'aula_virtual',
    etiqueta: 'Aula virtual',
    descripcion: 'Configuración de cursos virtuales, progreso, portal, foro y chat.',
    colecciones: [
      'capacitacionVirtualConfig',
      'progresoVirtualCurso',
      'inscripcionClase',
      'usuariosPortal',
      'registroPortalPendiente',
      'mensajeforos',
      'mensajechats',
    ],
    advertencias: [
      'Las categorías del catálogo virtual (Configuración → Catálogos) se conservan.',
    ],
  },
  {
    id: 'sitio_web',
    etiqueta: 'Sitio web',
    descripcion: 'Entradas del blog del sitio público.',
    colecciones: ['blogPosts'],
  },
  {
    id: 'usuarios_personal',
    etiqueta: 'Usuarios del ERP',
    descripcion: 'Elimina a todo el personal excepto quien ejecuta esta operación.',
    especial: 'usuarios',
  },
  {
    id: 'consecutivos',
    etiqueta: 'Consecutivos de numeración',
    descripcion:
      'Reinicia a 0 los contadores de facturas, comprobantes de caja, cuentas de cobro, certificados e inspecciones de vehículos. No cambia prefijos, textos ni el resto de la configuración.',
    especial: 'consecutivos',
    advertencias: [
      'Los documentos ya emitidos conservan su número; solo cambia el siguiente consecutivo.',
      'Si necesita continuar desde un número distinto de 0, use Configuración → Comprobantes de caja o Formato inspección vehículos.',
    ],
  },
  {
    id: 'config_sistema',
    etiqueta: 'Configuración del sistema',
    descripcion:
      'Reinicia configuración de empresa, roles del sistema y ajustes de fábrica (incluye consecutivos en 0). No borra alumnos ni movimientos de caja.',
    especial: 'config',
  },
  {
    id: 'auditoria',
    etiqueta: 'Auditoría y trazas HTTP',
    descripcion: 'Registro de auditoría y actividad HTTP del servidor.',
    colecciones: ['auditoria', 'actividadHttp'],
  },
];

const MODULOS_POR_ID = Object.fromEntries(MODULOS_RESET.map((m) => [m.id, m]));

const IDS_MODULOS = new Set(MODULOS_RESET.map((m) => m.id));

function listarModulosReset() {
  return MODULOS_RESET.map(({ id, etiqueta, descripcion, advertencias }) => ({
    id,
    etiqueta,
    descripcion,
    advertencias: advertencias || [],
  }));
}

/**
 * @param {string[]|undefined|null} modulos - ids de módulo; vacío o con "completo" = reset total.
 */
function planReset(modulos) {
  const entrada = Array.isArray(modulos) ? modulos.map(String) : [];
  const completo =
    entrada.length === 0 || entrada.includes('completo') || entrada.includes('*');

  if (completo) {
    return {
      completo: true,
      modulos: ['completo'],
      colecciones: null,
      flags: { usuarios: true, config: true, consecutivos: true, uploads: true, sedePrincipal: true },
    };
  }

  const ids = [...new Set(entrada.filter((id) => IDS_MODULOS.has(id)))];
  if (ids.length === 0) {
    const err = new Error('Seleccione al menos un módulo para el reset parcial');
    err.status = 400;
    throw err;
  }

  const colecciones = new Set();
  for (const id of ids) {
    const mod = MODULOS_POR_ID[id];
    for (const c of mod.colecciones || []) colecciones.add(c);
  }

  return {
    completo: false,
    modulos: ids,
    colecciones,
    flags: {
      usuarios: ids.includes('usuarios_personal'),
      config: ids.includes('config_sistema'),
      consecutivos: ids.includes('consecutivos'),
      uploads: false,
      sedePrincipal: ids.includes('config_sistema') || ids.includes('catalogos_operacion'),
    },
  };
}

function debeLimpiarColeccion(nombre, plan) {
  if (plan.completo) return true;
  return plan.colecciones.has(nombre);
}

module.exports = {
  MODULOS_RESET,
  listarModulosReset,
  planReset,
  debeLimpiarColeccion,
};
