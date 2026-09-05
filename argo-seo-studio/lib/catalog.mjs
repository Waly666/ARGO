/** Catálogo de páginas del portal aula virtual (alineado con portal-seo-pages.ts). */

export const PORTAL_PAGES = [
  { key: 'home', label: 'Inicio', ruta: '/', grupo: 'Principal' },
  { key: 'cursos', label: 'Cursos', ruta: '/cursos', grupo: 'Principal' },
  { key: 'tienda', label: 'Tienda', ruta: '/tienda', grupo: 'Principal' },
  { key: 'acerca', label: 'Acerca de', ruta: '/acerca', grupo: 'Institucional' },
  { key: 'fundacion', label: 'Institucional (CEA)', ruta: '/fundacion', grupo: 'Institucional' },
  { key: 'consultaCertificados', label: 'Consulta certificados', ruta: '/consulta-certificados', grupo: 'Servicios' },
  { key: 'cursosConduccion', label: 'Cursos de conducción', ruta: '/cursos-conduccion', grupo: 'Servicios' },
  { key: 'examenTeorico', label: 'Examen teórico', ruta: '/examen-teorico', grupo: 'Servicios' },
  { key: 'mercanciasPeligrosas', label: 'Mercancías peligrosas', ruta: '/mercancias-peligrosas', grupo: 'Servicios' },
  { key: 'trabajoEnAlturas', label: 'Trabajo en alturas', ruta: '/trabajo-en-alturas', grupo: 'Servicios' },
  {
    key: 'serviciosHub',
    label: 'Portafolio de servicios',
    labelServial: 'Nuestros servicios',
    ruta: '/servicios',
    grupo: 'Portafolio',
  },
  {
    key: 'servicio_aulaVirtual',
    label: 'Aula Virtual y Formación',
    labelServial: 'Aula Virtual',
    ruta: '/servicios/aula-virtual',
    grupo: 'Portafolio',
  },
  {
    key: 'servicio_peridata',
    label: 'PERIDATA',
    labelServial: 'Asesoría en tránsito',
    ruta: '/servicios/peridata',
    grupo: 'Portafolio',
  },
  {
    key: 'servicio_capacitacionSensibilizacion',
    label: 'Capacitación y Sensibilización',
    labelServial: 'Capacitación',
    ruta: '/servicios/capacitacion-sensibilizacion',
    grupo: 'Portafolio',
  },
  {
    key: 'servicio_estudiosDiagnosticosTecnicos',
    label: 'Estudios y Diagnósticos Técnicos',
    labelServial: 'Estudios de tránsito',
    ruta: '/servicios/estudios-diagnosticos-tecnicos',
    grupo: 'Portafolio',
  },
  {
    key: 'servicio_herramientasEducativasTecnologicas',
    label: 'Herramientas Educativas y Tecnológicas',
    labelServial: 'Soluciones informáticas',
    ruta: '/servicios/herramientas-educativas-tecnologicas',
    grupo: 'Portafolio',
  },
  {
    key: 'servicio_inventariosViales',
    label: 'Inventarios Viales',
    labelServial: 'Inventarios viales',
    ruta: '/servicios/inventarios-viales',
    grupo: 'Portafolio',
  },
  {
    key: 'servicio_planeacionGestionVial',
    label: 'Planeación y Gestión Vial',
    labelServial: 'Consultoría',
    ruta: '/servicios/planeacion-gestion-vial',
    grupo: 'Portafolio',
  },
  { key: 'blog', label: 'Blog', ruta: '/blog', grupo: 'Contenido' },
  { key: 'galeria', label: 'Galería', ruta: '/galeria', grupo: 'Contenido' },
  { key: 'pqr', label: 'PQR', ruta: '/pqr', grupo: 'Contenido' },
  { key: 'jornadasCapacitacion', label: 'Jornadas', ruta: '/jornadas-capacitacion', grupo: 'Contenido' },
  { key: 'evaluacionJornadas', label: 'Eval. jornadas', ruta: '/evaluacion-jornadas', grupo: 'Contenido' },
];

export function esPaginaPortafolio(page) {
  return page?.grupo === 'Portafolio' || page?.grupo === 'FINSTRUVIAL';
}

export const PORTAFOLIO_PAGE_KEYS = PORTAL_PAGES.filter(esPaginaPortafolio).map((p) => p.key);

/** Alias: mismas rutas /servicios (hub + 7 líneas). */
export const FINSTRUVIAL_PORTAL_PAGE_KEYS = PORTAFOLIO_PAGE_KEYS;
export const FINSTRUVIAL_PORTAL_PAGES = PORTAL_PAGES.filter(esPaginaPortafolio);

/** En Servial, inventarios viales está desactivado en el portafolio. */
export const SERVIAL_PORTAFOLIO_PAGE_KEYS = PORTAFOLIO_PAGE_KEYS.filter((k) => k !== 'servicio_inventariosViales');

export function pageDisplayLabel(page, { servial = false } = {}) {
  if (servial && page?.labelServial) return page.labelServial;
  return page?.label ?? '';
}

export const SERVICIOS_CATEGORIAS = [
  { id: 'cea', label: 'CEA y licencias' },
  { id: 'cursos-libres', label: 'Cursos no formales' },
  { id: 'aula', label: 'Aula virtual' },
  { id: 'asesoria', label: 'Asesoría y trámites' },
  { id: 'empresas', label: 'Empresas y jornadas' },
  { id: 'portafolio', label: 'Portafolio institucional' },
];

export const SERVICIOS_CATALOGO = [
  {
    id: 'licencias',
    categoria: 'cea',
    label: 'Licencias de conducción (A2, B1, C1, C2, C3)',
    keywords: [
      'licencia de conducción Villavicencio',
      'CEA Villavicencio',
      'licencia A2 moto',
      'licencia B1 particular',
      'licencia C1 C2 C3',
      'cursos de conducción Meta',
      'sacar licencia de conducción',
    ],
    pages: ['home', 'cursos', 'cursosConduccion', 'fundacion', 'examenTeorico', 'tienda'],
  },
  {
    id: 'practica-vehiculos',
    categoria: 'cea',
    label: 'Clases prácticas en carro y moto',
    keywords: [
      'clases de conducción Villavicencio',
      'clases prácticas carro',
      'clases prácticas moto',
      'aprender a manejar Villavicencio',
      'instructores de conducción',
    ],
    pages: ['home', 'cursosConduccion', 'fundacion', 'galeria'],
  },
  {
    id: 'examen-teorico',
    categoria: 'cea',
    label: 'Examen teórico y trámite RUNT',
    keywords: ['examen teórico licencia', 'examen RUNT', 'trámite licencia de conducción', 'recategorización licencia'],
    pages: ['examenTeorico', 'cursosConduccion', 'home'],
  },
  {
    id: 'cea-habilitado',
    categoria: 'cea',
    label: 'CEA habilitado (confianza e institución seria)',
    keywords: [
      'CEA Servial Colombia',
      'centro de enseñanza automovilística Villavicencio',
      'CEA habilitado Mintransporte',
      'formación vial Villavicencio',
      'institución seria Villavicencio',
    ],
    pages: ['home', 'acerca', 'fundacion'],
  },
  {
    id: 'manejo-defensivo',
    categoria: 'cursos-libres',
    label: 'Manejo defensivo',
    keywords: [
      'curso manejo defensivo',
      'certificado de manejo defensivo',
      'manejo defensivo Villavicencio',
      'curso manejo defensivo empresas',
    ],
    pages: ['home', 'cursos', 'tienda', 'consultaCertificados'],
  },
  {
    id: 'primeros-auxilios',
    categoria: 'cursos-libres',
    label: 'Primeros auxilios para conductores',
    keywords: [
      'curso primeros auxilios conductores',
      'primeros auxilios vial',
      'atención de heridos en accidentes',
      'primeros auxilios Villavicencio',
    ],
    pages: ['home', 'cursos', 'tienda'],
  },
  {
    id: 'normas-transito',
    categoria: 'cursos-libres',
    label: 'Normas de tránsito y seguridad vial',
    keywords: [
      'curso normas de tránsito',
      'código nacional de tránsito',
      'educación vial Villavicencio',
      'curso seguridad vial',
    ],
    pages: ['home', 'cursos', 'blog'],
  },
  {
    id: 'mercancias-peligrosas',
    categoria: 'cursos-libres',
    label: 'Curso obligatorio de mercancías peligrosas',
    keywords: [
      'curso mercancías peligrosas',
      'curso obligatorio mercancías peligrosas',
      'Decreto 1609',
      'transporte sustancias peligrosas',
      'curso mercancías peligrosas Villavicencio',
    ],
    pages: ['home', 'cursos', 'mercanciasPeligrosas', 'tienda'],
  },
  {
    id: 'extintores-incendios',
    categoria: 'cursos-libres',
    label: 'Manejo de extintores y control de incendios',
    keywords: [
      'curso manejo de extintores',
      'curso control de incendios',
      'extinción de incendios conductores',
      'brigadas contra incendio',
    ],
    pages: ['home', 'cursos', 'tienda'],
  },
  {
    id: 'mecanica-basica',
    categoria: 'cursos-libres',
    label: 'Mecánica básica automotriz',
    keywords: ['curso mecánica básica', 'alistamiento vehicular', 'mantenimiento preventivo conductores'],
    pages: ['cursos', 'home'],
  },
  {
    id: 'cargas-especiales',
    categoria: 'cursos-libres',
    label: 'Cargas extra pesadas y extra dimensionadas',
    keywords: ['curso carga extra pesada', 'Resolución 1724', 'acompañamiento técnico vías'],
    pages: ['cursos'],
  },
  {
    id: 'seguridad-vial',
    categoria: 'cursos-libres',
    label: 'Seguridad vial y educación vial',
    keywords: ['curso seguridad vial', 'seguridad vial', 'educación vial', 'cultura vial'],
    pages: ['home', 'cursos', 'blog'],
  },
  {
    id: 'hse',
    categoria: 'cursos-libres',
    label: 'Seguridad industrial HSE',
    keywords: ['curso HSE transporte', 'salud ocupacional conductores', 'seguridad industrial transporte'],
    pages: ['cursos'],
  },
  {
    id: 'competencias-sena',
    categoria: 'cursos-libres',
    label: 'Normas de competencia laboral (SENA)',
    keywords: ['competencias laborales SENA', 'conducción vehículos articulados', 'atención al cliente transporte'],
    pages: ['cursos', 'fundacion'],
  },
  {
    id: 'cursos-virtuales',
    categoria: 'aula',
    label: 'Cursos virtuales / aula virtual',
    keywords: [
      'aula virtual Servial',
      'cursos virtuales Villavicencio',
      'cursos en línea seguridad vial',
      'capacitación virtual conductores',
    ],
    pages: ['home', 'cursos', 'tienda', 'servicio_aulaVirtual'],
  },
  {
    id: 'capacitacion-conductores',
    categoria: 'empresas',
    label: 'Capacitación para conductores y empresas',
    keywords: [
      'cursos de capacitacion para conductores',
      'capacitacion empresas de transporte',
      'cursos no formales conductores',
    ],
    pages: ['home', 'cursos', 'servicio_capacitacionSensibilizacion'],
  },
  {
    id: 'transporte',
    categoria: 'empresas',
    label: 'Capacitación sector transporte',
    keywords: ['curso transporte', 'empresas de transporte Meta', 'capacitación transporte'],
    pages: ['home', 'cursos', 'mercanciasPeligrosas'],
  },
  {
    id: 'jornadas',
    categoria: 'empresas',
    label: 'Jornadas de capacitación presencial',
    keywords: ['jornadas capacitación', 'capacitación presencial seguridad vial'],
    pages: ['jornadasCapacitacion', 'evaluacionJornadas'],
  },
  {
    id: 'trabajo-alturas',
    categoria: 'empresas',
    label: 'Trabajo en alturas',
    keywords: ['trabajo en alturas', 'Resolución 4272', 'seguridad sector transporte'],
    pages: ['trabajoEnAlturas'],
  },
  {
    id: 'certificados',
    categoria: 'aula',
    label: 'Consulta y verificación de certificados',
    keywords: ['consulta certificados Servial', 'verificar certificado', 'certificado manejo defensivo'],
    pages: ['consultaCertificados'],
  },
  {
    id: 'asesoria-tramites',
    categoria: 'asesoria',
    label: 'Asesoría en trámites de tránsito',
    keywords: [
      'asesoría trámites de tránsito',
      'trámites licencia Villavicencio',
      'asesoría tránsito y transporte',
      'consultas organismos de tránsito',
    ],
    pages: ['home', 'acerca', 'servicio_peridata', 'cursosConduccion'],
  },
  {
    id: 'consultoria-transito',
    categoria: 'asesoria',
    label: 'Consultoría en tránsito y transporte',
    keywords: ['consultoría tránsito', 'PESV Ley 1503', 'planes de manejo de tránsito', 'empresas de transporte'],
    pages: ['servicio_planeacionGestionVial', 'home'],
  },
  {
    id: 'servial-portafolio',
    categoria: 'portafolio',
    label: 'Portafolio SERVIAL (CEA, cursos, aula, trámites)',
    keywords: [
      'Servial Colombia',
      'CEA Villavicencio',
      'cursos no formales',
      'aula virtual',
      'licencia de conducción',
      'asesoría trámites tránsito',
    ],
    pages: [...SERVIAL_PORTAFOLIO_PAGE_KEYS],
  },
  {
    id: 'finstruvial-portafolio',
    categoria: 'portafolio',
    label: 'Portafolio FINSTRUVIAL (servicios institucionales)',
    keywords: [
      'FINSTRUVIAL',
      'consultoría vial',
      'seguridad vial',
      'planeación vial',
      'inventarios viales',
      'PERIDATA',
      'aula virtual',
    ],
    pages: [...PORTAFOLIO_PAGE_KEYS],
  },
  {
    id: 'cove',
    categoria: 'cursos-libres',
    label: 'Curso COVE',
    keywords: ['curso cove', 'COVE transporte'],
    pages: ['cursos', 'blog'],
  },
];

export const SERVIAL_SERVICIOS_DEFAULT = [
  'licencias',
  'practica-vehiculos',
  'examen-teorico',
  'cea-habilitado',
  'manejo-defensivo',
  'primeros-auxilios',
  'normas-transito',
  'mercancias-peligrosas',
  'extintores-incendios',
  'mecanica-basica',
  'cursos-virtuales',
  'capacitacion-conductores',
  'certificados',
  'asesoria-tramites',
  'consultoria-transito',
  'servial-portafolio',
];
