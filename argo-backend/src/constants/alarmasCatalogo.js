/** Catálogo de alarmas / avisos visibles en la aplicación (clave → etiqueta). */
const GRUPOS = [
  {
    id: 'caja',
    label: 'Caja',
    alarmas: [
      { key: 'alarmas.caja.cerrada', label: 'Caja personal cerrada (banner superior)' },
      { key: 'alarmas.caja.sin_abrir', label: 'Aviso modal al cobrar o egresar sin caja abierta' },
      { key: 'alarmas.caja.descuadres', label: 'Descuadres de caja pendientes' },
    ],
  },
  {
    id: 'jornadas',
    label: 'Jornadas Cap.',
    alarmas: [
      { key: 'alarmas.jornadas.en_proceso', label: 'Jornada(s) EN PROCESO hoy (banner superior)' },
      { key: 'alarmas.jornadas.certificado_nuevo', label: 'Certificado recién emitido (banner superior)' },
      { key: 'alarmas.jornadas.live_toast', label: 'Toast al crear clases o jornadas' },
    ],
  },
  {
    id: 'programacion_cea',
    label: 'Programación CEA',
    alarmas: [
      {
        key: 'alarmas.programacion_cea.pendiente',
        label: 'Alumnos/servicios CEA con horas sin programar (banner superior)',
      },
    ],
  },
  {
    id: 'vehiculos',
    label: 'Vehículos',
    alarmas: [
      { key: 'alarmas.vehiculos.docs_vencidos', label: 'Documentos vencidos o por vencer (banner superior)' },
      { key: 'alarmas.vehiculos.docs_faltantes', label: 'Documentos requeridos sin registrar (banner superior)' },
      { key: 'alarmas.vehiculos.inspeccion_pendiente', label: 'Vehículos sin inspección preoperacional del día (banner superior)' },
    ],
  },
  {
    id: 'empleados',
    label: 'Empleados / RRHH',
    alarmas: [
      { key: 'alarmas.empleados.docs_vencidos', label: 'Documentos vencidos o por vencer (banner superior)' },
      { key: 'alarmas.empleados.docs_faltantes', label: 'Documentos requeridos sin registrar (banner superior)' },
    ],
  },
  {
    id: 'alumnos',
    label: 'Alumnos',
    alarmas: [
      { key: 'alarmas.alumnos.saldos', label: 'Saldos pendientes en ficha de alumno' },
      { key: 'alarmas.alumnos.documentos', label: 'Documentos pendientes en ficha de alumno' },
    ],
  },
];

const ALARMAS_POR_ROL_SISTEMA = {
  admin: ['*'],
  cajero: [
    'alarmas.caja.cerrada',
    'alarmas.caja.sin_abrir',
    'alarmas.caja.descuadres',
    'alarmas.jornadas.certificado_nuevo',
    'alarmas.alumnos.saldos',
    'alarmas.alumnos.documentos',
    'alarmas.vehiculos.docs_vencidos',
    'alarmas.vehiculos.docs_faltantes',
    'alarmas.vehiculos.inspeccion_pendiente',
    'alarmas.empleados.docs_vencidos',
    'alarmas.empleados.docs_faltantes',
  ],
  instructor: [
    'alarmas.jornadas.certificado_nuevo',
    'alarmas.programacion_cea.pendiente',
    'alarmas.vehiculos.docs_vencidos',
    'alarmas.vehiculos.docs_faltantes',
    'alarmas.vehiculos.inspeccion_pendiente',
    'alarmas.empleados.docs_vencidos',
    'alarmas.empleados.docs_faltantes',
  ],
  recepcion: [
    'alarmas.alumnos.saldos',
    'alarmas.alumnos.documentos',
    'alarmas.vehiculos.docs_vencidos',
    'alarmas.vehiculos.docs_faltantes',
    'alarmas.vehiculos.inspeccion_pendiente',
    'alarmas.empleados.docs_vencidos',
    'alarmas.empleados.docs_faltantes',
    'alarmas.programacion_cea.pendiente',
  ],
  usuario: [
    'alarmas.vehiculos.docs_vencidos',
    'alarmas.vehiculos.docs_faltantes',
    'alarmas.vehiculos.inspeccion_pendiente',
    'alarmas.empleados.docs_vencidos',
    'alarmas.empleados.docs_faltantes',
  ],
};

function todasLasClaves() {
  const keys = new Set();
  for (const g of GRUPOS) {
    for (const a of g.alarmas) keys.add(a.key);
  }
  return [...keys];
}

function clavesValidas(claves) {
  const valid = todasLasClaves();
  return (claves || []).filter((k) => k === '*' || valid.includes(k));
}

function alarmasDefaultRol(codigo) {
  return ALARMAS_POR_ROL_SISTEMA[codigo] ? [...ALARMAS_POR_ROL_SISTEMA[codigo]] : [];
}

module.exports = {
  GRUPOS,
  ALARMAS_POR_ROL_SISTEMA,
  todasLasClaves,
  clavesValidas,
  alarmasDefaultRol,
};
