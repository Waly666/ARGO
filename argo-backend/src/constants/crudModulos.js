/**
 * Módulos operativos con permisos CRUD (ver, crear, editar, eliminar).
 * Las claves nuevas son `{prefijo}.{accion}`; los permisos legacy se mapean en legacyPorAccion.
 */
const ACCIONES_CRUD = ['ver', 'crear', 'editar', 'eliminar'];

const ETIQUETA_ACCION_CORTA = {
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
};

const MODULOS_CRUD = {
  alumnos: {
    label: 'Alumnos',
    prefijo: 'alumnos',
    entidad: 'alumno',
    categoria: 'academico',
    orden: 10,
    legacyPorAccion: {
      ver: ['alumnos.ver', 'alumnos.gestionar', 'alumnos.pagos'],
      crear: ['alumnos.gestionar', 'alumnos.crear'],
      editar: ['alumnos.gestionar', 'alumnos.editar'],
      eliminar: ['alumnos.gestionar', 'alumnos.eliminar'],
    },
  },
  programas: {
    label: 'Programas',
    prefijo: 'programas',
    entidad: 'programa',
    categoria: 'academico',
    orden: 20,
    legacyPorAccion: {
      ver: ['programas.ver', 'programas.gestionar', 'programas.agregar'],
      crear: ['programas.agregar', 'programas.gestionar', 'programas.crear'],
      editar: ['programas.gestionar', 'programas.editar'],
      eliminar: ['programas.gestionar', 'programas.eliminar'],
    },
  },
  servicios: {
    label: 'Servicios (catálogo)',
    prefijo: 'servicios',
    entidad: 'servicio',
    categoria: 'academico',
    orden: 30,
    legacyPorAccion: {
      ver: ['servicios.ver', 'servicios.gestionar'],
      crear: ['servicios.gestionar', 'servicios.crear'],
      editar: ['servicios.gestionar', 'servicios.editar'],
      eliminar: ['servicios.gestionar', 'servicios.eliminar'],
    },
  },
  certificados: {
    label: 'Certificados',
    prefijo: 'certificados',
    entidad: 'certificado',
    categoria: 'academico',
    orden: 40,
    legacyPorAccion: {
      ver: ['alumnos.certificados', 'certificados.vencidos'],
      crear: ['alumnos.certificados', 'certificados.crear'],
      editar: ['alumnos.certificados', 'certificados.editar'],
      eliminar: ['alumnos.certificados', 'certificados.eliminar'],
    },
  },
  liquidaciones: {
    label: 'Ítems de liquidación',
    prefijo: 'liquidaciones',
    entidad: 'liquidacion',
    categoria: 'academico',
    orden: 50,
    legacyPorAccion: {
      ver: ['alumnos.ver', 'alumnos.gestionar', 'alumnos.pagos'],
      crear: ['alumnos.gestionar', 'liquidaciones.crear'],
      editar: ['alumnos.gestionar', 'liquidaciones.editar'],
      eliminar: ['alumnos.gestionar', 'liquidaciones.eliminar'],
    },
  },
  combos: {
    label: 'Combos de cursos',
    prefijo: 'combos',
    entidad: 'combo',
    categoria: 'academico',
    orden: 55,
    legacyPorAccion: {
      ver: ['combos.gestionar', 'alumnos.pagos', 'alumnos.gestionar'],
      crear: ['combos.gestionar', 'combos.crear'],
      editar: ['combos.gestionar', 'combos.editar'],
      eliminar: ['combos.gestionar', 'combos.eliminar'],
    },
  },
  jornadas: {
    label: 'Contratos y jornadas',
    prefijo: 'jornadas',
    entidad: 'jornada',
    categoria: 'academico',
    orden: 60,
    legacyPorAccion: {
      ver: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar', 'jornadas.registrar_alumnos'],
      crear: ['jornadas.gestionar', 'jornadas.crear'],
      editar: ['jornadas.gestionar', 'jornadas.editar'],
      eliminar: ['jornadas.gestionar', 'jornadas.eliminar'],
    },
  },
  ingresos: {
    label: 'Pagos / ingresos',
    prefijo: 'ingresos',
    entidad: 'ingreso',
    categoria: 'caja',
    orden: 70,
    legacyPorAccion: {
      ver: ['alumnos.pagos', 'caja.turno', 'caja.cobros', 'caja.admin', 'contabilidad'],
      crear: ['alumnos.pagos', 'caja.turno', 'caja.cobros', 'contabilidad', 'ingresos.crear'],
      editar: ['alumnos.pagos', 'caja.admin', 'contabilidad', 'ingresos.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'ingresos.eliminar'],
    },
  },
  egresos: {
    label: 'Egresos / gastos',
    prefijo: 'egresos',
    entidad: 'egreso',
    categoria: 'caja',
    orden: 80,
    legacyPorAccion: {
      ver: ['caja.turno', 'caja.admin', 'contabilidad'],
      crear: ['caja.turno', 'caja.admin', 'contabilidad', 'egresos.crear'],
      editar: ['caja.admin', 'contabilidad', 'egresos.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'egresos.eliminar'],
    },
  },
  clientes: {
    label: 'Clientes / empresas',
    prefijo: 'clientes',
    entidad: 'cliente',
    categoria: 'caja',
    orden: 90,
    legacyPorAccion: {
      ver: ['facturacion', 'config.facturacion', 'alumnos.pagos', 'caja.turno', 'caja.admin', 'contabilidad', 'jornadas.gestionar'],
      crear: ['facturacion', 'config.facturacion', 'caja.admin', 'contabilidad', 'clientes.crear'],
      editar: ['facturacion', 'config.facturacion', 'caja.admin', 'contabilidad', 'clientes.editar'],
      eliminar: ['facturacion', 'config.facturacion', 'caja.admin', 'contabilidad', 'clientes.eliminar'],
    },
  },
  terceros: {
    label: 'Terceros (caja)',
    prefijo: 'terceros',
    entidad: 'tercero',
    categoria: 'caja',
    orden: 95,
    legacyPorAccion: {
      ver: ['caja.turno', 'caja.admin', 'contabilidad'],
      crear: ['caja.turno', 'caja.admin', 'contabilidad', 'terceros.crear'],
      editar: ['caja.admin', 'contabilidad', 'terceros.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'terceros.eliminar'],
    },
  },
  gestores: {
    label: 'Gestores comerciales',
    prefijo: 'gestores',
    entidad: 'gestor',
    categoria: 'caja',
    orden: 100,
    legacyPorAccion: {
      ver: ['caja.turno', 'caja.admin', 'contabilidad'],
      crear: ['caja.turno', 'caja.admin', 'contabilidad', 'gestores.crear'],
      editar: ['caja.admin', 'contabilidad', 'gestores.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'gestores.eliminar'],
    },
  },
  vehiculos: {
    label: 'Vehículos',
    prefijo: 'vehiculos',
    entidad: 'vehiculo',
    categoria: 'flota',
    orden: 110,
    legacyPorAccion: {
      ver: ['vehiculos', 'instructores.inspeccion'],
      crear: ['vehiculos', 'vehiculos.crear'],
      editar: ['vehiculos', 'vehiculos.editar'],
      eliminar: ['vehiculos', 'vehiculos.eliminar'],
    },
  },
  empleados: {
    label: 'Empleados (RRHH)',
    prefijo: 'empleados',
    entidad: 'empleado',
    categoria: 'rrhh',
    orden: 120,
    legacyPorAccion: {
      ver: ['rrhh'],
      crear: ['rrhh', 'empleados.crear'],
      editar: ['rrhh', 'empleados.editar'],
      eliminar: ['rrhh', 'empleados.eliminar'],
    },
  },
};

const CATEGORIAS_CRUD = [
  { id: 'academico', label: 'Académico y alumnos' },
  { id: 'caja', label: 'Caja y facturación' },
  { id: 'flota', label: 'Flota' },
  { id: 'rrhh', label: 'Recursos humanos' },
];

function claveAccionModulo(modulo, accion) {
  const m = MODULOS_CRUD[modulo];
  if (!m || !ACCIONES_CRUD.includes(accion)) return null;
  return `${m.prefijo}.${accion}`;
}

function modulosCrudList() {
  return Object.entries(MODULOS_CRUD)
    .map(([id, def]) => ({
      id,
      label: def.label,
      prefijo: def.prefijo,
      categoria: def.categoria || 'otros',
      orden: def.orden ?? 999,
      acciones: ACCIONES_CRUD.map((accion) => ({
        accion,
        key: claveAccionModulo(id, accion),
        label: etiquetaAccion(accion),
        labelCorta: ETIQUETA_ACCION_CORTA[accion] || accion,
      })),
    }))
    .sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label, 'es'));
}

function etiquetaAccion(accion) {
  const map = {
    ver: 'Consultar (solo lectura)',
    crear: 'Crear / agregar',
    editar: 'Editar',
    eliminar: 'Eliminar / anular',
  };
  return map[accion] || accion;
}

function accionesCrudCatalogo() {
  return ACCIONES_CRUD.map((accion) => ({
    id: accion,
    label: etiquetaAccion(accion),
    labelCorta: ETIQUETA_ACCION_CORTA[accion] || accion,
  }));
}

/** Claves nuevas de permisos CRUD para el catálogo de roles (lista plana legacy). */
function permisosCrudCatalogo() {
  const items = [];
  for (const [id, def] of Object.entries(MODULOS_CRUD)) {
    for (const accion of ACCIONES_CRUD) {
      const key = claveAccionModulo(id, accion);
      if (!key) continue;
      items.push({
        key,
        label: `${def.label}: ${etiquetaAccion(accion)}`,
        modulo: id,
        accion,
      });
    }
  }
  return items;
}

module.exports = {
  ACCIONES_CRUD,
  ETIQUETA_ACCION_CORTA,
  MODULOS_CRUD,
  CATEGORIAS_CRUD,
  claveAccionModulo,
  modulosCrudList,
  accionesCrudCatalogo,
  permisosCrudCatalogo,
  etiquetaAccion,
};
