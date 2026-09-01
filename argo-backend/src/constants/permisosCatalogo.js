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
      { key: 'alumnos.certificados', label: 'Emitir y consultar certificados' },
      { key: 'certificados.vencidos', label: 'Listado de certificados vencidos' },
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
      { key: 'informes.ver', label: 'Informes académicos (listados parametrizables)' },
      { key: 'instructores', label: 'Módulo instructores (directorio / legacy)' },
      {
        key: 'instructores.mi_portal',
        label: 'Usar portal de instructores (mi perfil, clases y operación)',
      },
      {
        key: 'instructores.inspeccion',
        label: 'Inspección preoperacional (desde portal instructor; no abre el menú Vehículos)',
      },
    ],
  },
  {
    id: 'jornadas',
    label: 'Jornadas Cap.',
    permisos: [
      { key: 'jornadas.ver', label: 'Consultar hub, contratos y calendario' },
      {
        key: 'jornadas.gestionar',
        label: 'Crear/editar contratos, programar jornadas y clases (gestión completa)',
      },
      {
        key: 'jornadas.operar',
        label: 'Clase en carpa, clases y asistencia (campo; no basta solo para contratos)',
      },
      {
        key: 'jornadas.registrar_alumnos',
        label: 'Registrar alumnos de jornada (alta ficha; no instructor de campo)',
      },
      {
        key: 'jornadas.evaluaciones.ver',
        label: 'Consultar resultados de evaluaciones de satisfacción por contrato',
      },
      {
        key: 'jornadas.evaluaciones.gestionar',
        label: 'Publicar, cerrar y administrar evaluaciones de satisfacción por contrato',
      },
      {
        key: 'jornadas.app.hoy',
        label: 'App móvil Jornadas: Jornadas de hoy',
      },
      {
        key: 'jornadas.app.operar_clase',
        label: 'App móvil Jornadas: Operar clase (asistencia, evidencias, matrícula)',
      },
      {
        key: 'jornadas.app.registrar_alumno',
        label: 'App móvil Jornadas: Nuevo alumno jornada (alta ficha)',
      },
      {
        key: 'jornadas.app.certificados',
        label: 'App móvil Jornadas: Certificados emitidos',
      },
      {
        key: 'jornadas.app.gestionar',
        label: 'App móvil Jornadas: Gestionar jornadas (cualquier fecha)',
      },
      {
        key: 'jornadas.app.crear',
        label: 'App móvil Jornadas: Crear jornada',
      },
      {
        key: 'jornadas.app.editar',
        label: 'App móvil Jornadas: Editar jornada y GPS',
      },
      {
        key: 'jornadas.app.informes',
        label: 'App móvil Jornadas: Informes y dashboard del contrato',
      },
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
    id: 'cohortes_academicas',
    label: 'Cohortes académicas',
    permisos: [
      { key: 'cohortes_academicas.ver', label: 'Consultar cohortes, plan y clases' },
      { key: 'cohortes_academicas.gestionar', label: 'Plan, cohortes, inscripción y programación de clases' },
      { key: 'cohortes_academicas.operar', label: 'Registrar asistencia y notas (instructor)' },
    ],
  },
  {
    id: 'caja',
    label: 'Caja',
    permisos: [
      { key: 'caja.turno', label: 'Caja del turno (apertura, cuadre, movimientos del día)' },
      { key: 'caja.cobros', label: 'Cobros pendientes' },
      { key: 'caja.admin', label: 'Cierres, descuadres y movimientos globales (Flujo de caja; no abre Contabilidad)' },
      { key: 'combos.gestionar', label: 'Combos de cursos presenciales (configurar y aplicar)' },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    permisos: [
      {
        key: 'contabilidad',
        label: 'Menú Contabilidad (ingresos/egresos globales, cuadres, cierre general y descuadres)',
      },
    ],
  },
  {
    id: 'otros',
    label: 'Otros módulos',
    permisos: [
      { key: 'facturacion', label: 'Facturación' },
      { key: 'vehiculos', label: 'Vehículos (menú / listado y gestión de flota)' },
      { key: 'rrhh', label: 'Recursos humanos y nómina' },
      { key: 'rrhh.evaluaciones.ver', label: 'Ver evaluaciones de desempeño e informe' },
      {
        key: 'rrhh.evaluaciones.gestionar',
        label: 'Registrar y editar calificaciones de empleados (1–10)',
      },
      { key: 'rrhh.anotaciones.ver', label: 'Ver anotaciones / eventualidades del empleado' },
      {
        key: 'rrhh.anotaciones.gestionar',
        label: 'Registrar y editar anotaciones positivas o negativas',
      },
    ],
  },
  {
    id: 'aula_virtual',
    label: 'Aula virtual',
    permisos: [
      {
        key: 'aula_virtual.ver',
        label: 'Consultar cursos virtuales, progreso y usuarios del portal',
      },
      {
        key: 'aula_virtual.gestionar',
        label: 'Administrar cursos, matrículas, paquetes y usuarios del portal',
      },
      {
        key: 'aula_virtual.sitio',
        label: 'Editor del sitio portal (landing, menús, páginas y blog)',
      },
      {
        key: 'aula_virtual.foro',
        label: 'Foro de cursos (moderar preguntas y respuestas)',
      },
      {
        key: 'aula_virtual.informes',
        label: 'Informes de matrículas virtuales',
      },
    ],
  },
  {
    id: 'sedes',
    label: 'Sedes',
    permisos: [
      { key: 'sedes.ver', label: 'Consultar sedes' },
      { key: 'sedes.ver_todas', label: 'Ver y operar en todas las sedes' },
      { key: 'sedes.gestionar', label: 'Administrar catálogo de sedes' },
      { key: 'config.sedes', label: 'Configuración de sedes (alias gestionar)' },
    ],
  },
  {
    id: 'migracion',
    label: 'Migración de datos',
    permisos: [
      { key: 'sistema.migracion', label: 'Importación Excel (alumnos, certificados, lotes)' },
      {
        key: 'migracion.movimientos',
        label: 'Movimientos históricos (matrícula con fecha anterior y recibos de migración)',
      },
    ],
  },
  {
    id: 'config_usuarios',
    label: 'Usuarios del sistema',
    permisos: [
      {
        key: 'config.usuarios',
        label: 'Gestión completa (legado: consultar, crear, editar y eliminar)',
      },
      { key: 'config.usuarios.ver', label: 'Consultar usuarios (solo lectura)' },
      { key: 'config.usuarios.crear', label: 'Crear usuarios' },
      { key: 'config.usuarios.editar', label: 'Editar usuarios y resetear 2FA' },
      { key: 'config.usuarios.eliminar', label: 'Desactivar o eliminar usuarios' },
    ],
  },
  {
    id: 'config',
    label: 'Configuración',
    permisos: [
      { key: 'config.roles', label: 'Roles y permisos' },
      { key: 'config.autorizaciones', label: 'Autorizar eliminaciones solicitadas por otros usuarios' },
      { key: 'config.catalogos', label: 'Catálogos del sistema' },
      { key: 'config.recibos', label: 'Empresa y comprobantes' },
      { key: 'config.georef', label: 'Geocodificación (mapas)' },
      { key: 'config.facturacion', label: 'Facturación electrónica (Factus)' },
      { key: 'config.nomina', label: 'Parámetros de nómina' },
      { key: 'config.certificados', label: 'Diseño de certificados' },
      { key: 'config.alertas', label: 'Alertas y notificaciones' },
      { key: 'config.paginas_informes', label: 'Páginas de informes (márgenes y tamaño)' },
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
