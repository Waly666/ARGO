/** Catálogo inicial de competencias de desempeño (1–10). */
const COMPETENCIAS_DEFAULT = [
  // Transversales
  {
    codigo: 'PUNT',
    nombre: 'Puntualidad y asistencia',
    descripcion: 'Cumplimiento de horarios, turnos y jornadas asignadas.',
    ambito: 'todos',
    orden: 10,
  },
  {
    codigo: 'PRES',
    nombre: 'Presentación personal',
    descripcion: 'Imagen institucional, uniforme y porte profesional.',
    ambito: 'todos',
    orden: 20,
  },
  {
    codigo: 'EQUI',
    nombre: 'Trabajo en equipo',
    descripcion: 'Colaboración con compañeros y apoyo a otros roles.',
    ambito: 'todos',
    orden: 30,
  },
  {
    codigo: 'COMU',
    nombre: 'Comunicación',
    descripcion: 'Claridad oral/escrita con alumnos, compañeros y jefatura.',
    ambito: 'todos',
    orden: 40,
  },
  {
    codigo: 'NORM',
    nombre: 'Cumplimiento de normas y procedimientos',
    descripcion: 'Apego a reglamentos, protocolos internos y legales.',
    ambito: 'todos',
    orden: 50,
  },
  {
    codigo: 'SERV',
    nombre: 'Actitud de servicio',
    descripcion: 'Disposición, amabilidad y orientación al usuario.',
    ambito: 'todos',
    orden: 60,
  },
  {
    codigo: 'RESP',
    nombre: 'Responsabilidad y compromiso',
    descripcion: 'Cumplimiento de tareas, plazos y promesas laborales.',
    ambito: 'todos',
    orden: 70,
  },
  {
    codigo: 'ADAP',
    nombre: 'Adaptabilidad',
    descripcion: 'Flexibilidad ante cambios de turno, sede o prioridad.',
    ambito: 'todos',
    orden: 80,
  },
  // Instructor / pedagógico
  {
    codigo: 'PEDA',
    nombre: 'Pedagogía y didáctica',
    descripcion: 'Capacidad de enseñar, explicar y facilitar el aprendizaje.',
    ambito: 'instructor',
    orden: 110,
  },
  {
    codigo: 'DOMT',
    nombre: 'Dominio técnico del programa',
    descripcion: 'Conocimiento del contenido curricular y normativa aplicable.',
    ambito: 'instructor',
    orden: 120,
  },
  {
    codigo: 'GRUP',
    nombre: 'Manejo de grupo',
    descripcion: 'Control del aula/carpa, dinamización y clima de aprendizaje.',
    ambito: 'instructor',
    orden: 130,
  },
  {
    codigo: 'EVAL',
    nombre: 'Evaluación del aprendizaje',
    descripcion: 'Seguimiento, retroalimentación y registro de avances.',
    ambito: 'instructor',
    orden: 140,
  },
  {
    codigo: 'RECU',
    nombre: 'Uso de recursos didácticos',
    descripcion: 'Materiales, ayudas audiovisuales y herramientas pedagógicas.',
    ambito: 'instructor',
    orden: 150,
  },
  {
    codigo: 'SEGU',
    nombre: 'Seguridad en práctica / pista',
    descripcion: 'Prevención de riesgos y cuidado del alumno en práctica.',
    ambito: 'instructor',
    orden: 160,
  },
  // Cajero / atención
  {
    codigo: 'ATEN',
    nombre: 'Atención al usuario',
    descripcion: 'Orientación clara en ventanilla y resolución de consultas.',
    ambito: 'cajero',
    orden: 210,
  },
  {
    codigo: 'CAJA',
    nombre: 'Exactitud en cobros y caja',
    descripcion: 'Precisión en recibos, cuadres y manejo de dinero.',
    ambito: 'cajero',
    orden: 220,
  },
  {
    codigo: 'SIST',
    nombre: 'Manejo de sistemas (ARGO)',
    descripcion: 'Uso correcto del software de caja, alumnos y certificados.',
    ambito: 'cajero',
    orden: 230,
  },
  {
    codigo: 'INCI',
    nombre: 'Resolución de incidencias',
    descripcion: 'Gestión de novedades, quejas o errores de proceso.',
    ambito: 'cajero',
    orden: 240,
  },
];

module.exports = { COMPETENCIAS_DEFAULT };
