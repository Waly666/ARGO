/** Catálogo de permisos disponibles en la aplicación (clave → etiqueta). */
const GRUPOS = [
  {
    id: 'general',
    label: 'General',
    permisos: [{ key: 'dashboard', label: 'Panel principal (dashboard)' }],
  },
  {
    id: 'alumnos',
    label: 'Alumnos',
    permisos: [
      { key: 'alumnos.ver', label: 'Consultar alumnos' },
      { key: 'alumnos.gestionar', label: 'Crear, editar y eliminar alumnos' },
      { key: 'alumnos.pagos', label: 'Pagos, liquidaciones e ingresos' },
      { key: 'alumnos.certificados', label: 'Emitir certificados' },
    ],
  },
  {
    id: 'academico',
    label: 'Académico',
    permisos: [
      { key: 'programas.ver', label: 'Consultar programas' },
      { key: 'programas.agregar', label: 'Crear programas (sin editar ni eliminar)' },
      { key: 'programas.gestionar', label: 'Administrar programas (editar y eliminar)' },
      { key: 'servicios.ver', label: 'Consultar servicios' },
      { key: 'servicios.gestionar', label: 'Administrar servicios' },
      { key: 'instructores', label: 'Módulo instructores (legacy)' },
    ],
  },
  {
    id: 'jornadas',
    label: 'Jornadas Cap.',
    permisos: [
      { key: 'jornadas.ver', label: 'Consultar hub, contratos y calendario' },
      { key: 'jornadas.gestionar', label: 'Contratación, programación y edición de jornadas' },
      { key: 'jornadas.operar', label: 'Clase en carpa, clases y asistencia (instructor)' },
    ],
  },
  {
    id: 'programacion_cea',
    label: 'Programación CEA',
    permisos: [
      { key: 'programacion_cea.ver', label: 'Consultar programación, rastreo y calendario CEA' },
      { key: 'programacion_cea.gestionar', label: 'Configurar, temas y programar clases CEA' },
      { key: 'programacion_cea.operar', label: 'Operar clases CEA (inscribir, iniciar/finalizar)' },
    ],
  },
  {
    id: 'caja',
    label: 'Caja',
    permisos: [
      { key: 'caja.turno', label: 'Caja del turno (apertura, cuadre, movimientos del día)' },
      { key: 'caja.cobros', label: 'Cobros pendientes' },
      { key: 'caja.admin', label: 'Cierres, descuadres y movimientos globales' },
    ],
  },
  {
    id: 'otros',
    label: 'Otros módulos',
    permisos: [
      { key: 'facturacion', label: 'Facturación' },
      { key: 'vehiculos', label: 'Vehículos' },
      { key: 'rrhh', label: 'Recursos humanos y nómina' },
    ],
  },
  {
    id: 'config',
    label: 'Configuración',
    permisos: [
      { key: 'config.usuarios', label: 'Gestión de usuarios' },
      { key: 'config.roles', label: 'Roles y permisos' },
      { key: 'config.catalogos', label: 'Catálogos del sistema' },
      { key: 'config.recibos', label: 'Empresa y comprobantes' },
      { key: 'config.nomina', label: 'Parámetros de nómina' },
      { key: 'config.certificados', label: 'Diseño de certificados' },
      { key: 'config.requisitos', label: 'Requisitos de documentos (alumnos y vehículos)' },
      { key: 'config.auditoria', label: 'Auditoría y monitoreo' },
      { key: 'config.monitor', label: 'Monitor de recursos (incluido en auditoría)' },
    ],
  },
];

function todasLasClaves() {
  const keys = new Set();
  for (const g of GRUPOS) {
    for (const p of g.permisos) keys.add(p.key);
  }
  return [...keys];
}

function clavesValidas(claves) {
  const valid = todasLasClaves();
  return (claves || []).filter((k) => k === '*' || valid.includes(k));
}

module.exports = { GRUPOS, todasLasClaves, clavesValidas };
