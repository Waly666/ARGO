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
  { key: 'serviciosHub', label: 'Portafolio de servicios', ruta: '/servicios', grupo: 'FINSTRUVIAL' },
  { key: 'servicio_aulaVirtual', label: 'Aula Virtual y Formación', ruta: '/servicios/aula-virtual', grupo: 'FINSTRUVIAL' },
  { key: 'servicio_peridata', label: 'PERIDATA', ruta: '/servicios/peridata', grupo: 'FINSTRUVIAL' },
  {
    key: 'servicio_capacitacionSensibilizacion',
    label: 'Capacitación y Sensibilización',
    ruta: '/servicios/capacitacion-sensibilizacion',
    grupo: 'FINSTRUVIAL',
  },
  {
    key: 'servicio_estudiosDiagnosticosTecnicos',
    label: 'Estudios y Diagnósticos Técnicos',
    ruta: '/servicios/estudios-diagnosticos-tecnicos',
    grupo: 'FINSTRUVIAL',
  },
  {
    key: 'servicio_herramientasEducativasTecnologicas',
    label: 'Herramientas Educativas y Tecnológicas',
    ruta: '/servicios/herramientas-educativas-tecnologicas',
    grupo: 'FINSTRUVIAL',
  },
  { key: 'servicio_inventariosViales', label: 'Inventarios Viales', ruta: '/servicios/inventarios-viales', grupo: 'FINSTRUVIAL' },
  {
    key: 'servicio_planeacionGestionVial',
    label: 'Planeación y Gestión Vial',
    ruta: '/servicios/planeacion-gestion-vial',
    grupo: 'FINSTRUVIAL',
  },
  { key: 'blog', label: 'Blog', ruta: '/blog', grupo: 'Contenido' },
  { key: 'galeria', label: 'Galería', ruta: '/galeria', grupo: 'Contenido' },
  { key: 'pqr', label: 'PQR', ruta: '/pqr', grupo: 'Contenido' },
  { key: 'jornadasCapacitacion', label: 'Jornadas', ruta: '/jornadas-capacitacion', grupo: 'Contenido' },
  { key: 'evaluacionJornadas', label: 'Eval. jornadas', ruta: '/evaluacion-jornadas', grupo: 'Contenido' },
];

/** Claves SEO del portafolio /servicios (hub + 7 líneas). */
export const FINSTRUVIAL_PORTAL_PAGE_KEYS = PORTAL_PAGES.filter((p) => p.grupo === 'FINSTRUVIAL').map((p) => p.key);

export const FINSTRUVIAL_PORTAL_PAGES = PORTAL_PAGES.filter((p) => p.grupo === 'FINSTRUVIAL');

export const SERVICIOS_CATALOGO = [
  {
    id: 'seguridad-vial',
    label: 'Seguridad vial y educación vial',
    keywords: ['curso seguridad vial', 'seguridad vial', 'educación vial', 'curso vial'],
    pages: ['home', 'cursos', 'blog'],
  },
  {
    id: 'manejo-defensivo',
    label: 'Manejo defensivo',
    keywords: ['manejo defensivo', 'certificado de manejo defensivo', 'curso de manejo defensivo'],
    pages: ['home', 'cursos'],
  },
  {
    id: 'capacitacion-conductores',
    label: 'Capacitación para conductores y empresas',
    keywords: [
      'cursos de capacitacion para conductores',
      'cursos de capacitacion para choferes',
      'capacitacion seguridad vial',
    ],
    pages: ['home', 'cursos'],
  },
  {
    id: 'cursos-virtuales',
    label: 'Cursos virtuales / aula virtual',
    keywords: ['cursos virtuales', 'aula virtual', 'cursos en línea'],
    pages: ['home', 'cursos', 'tienda'],
  },
  {
    id: 'licencias',
    label: 'Licencias de conducción',
    keywords: ['licencia de conducción', 'cursos de conducción', 'categorías licencia'],
    pages: ['cursosConduccion', 'fundacion', 'examenTeorico'],
  },
  {
    id: 'examen-teorico',
    label: 'Examen teórico de licencia',
    keywords: ['examen teórico', 'licencia conducción', 'RUNT'],
    pages: ['examenTeorico'],
  },
  {
    id: 'transporte',
    label: 'Capacitación sector transporte',
    keywords: ['curso transporte', 'empresas de transporte', 'capacitación transporte'],
    pages: ['home', 'cursos', 'mercanciasPeligrosas'],
  },
  {
    id: 'mercancias-peligrosas',
    label: 'Mercancías peligrosas',
    keywords: ['mercancías peligrosas', 'curso transporte', 'MinTransporte'],
    pages: ['mercanciasPeligrosas'],
  },
  {
    id: 'trabajo-alturas',
    label: 'Trabajo en alturas',
    keywords: ['trabajo en alturas', 'Resolución 4272', 'seguridad sector transporte'],
    pages: ['trabajoEnAlturas'],
  },
  {
    id: 'jornadas',
    label: 'Jornadas de capacitación presencial',
    keywords: ['jornadas capacitación', 'actividades experienciales seguridad vial'],
    pages: ['jornadasCapacitacion', 'evaluacionJornadas'],
  },
  {
    id: 'certificados',
    label: 'Consulta y verificación de certificados',
    keywords: ['consulta certificados', 'verificar certificado', 'certificado seguridad vial'],
    pages: ['consultaCertificados'],
  },
  {
    id: 'finstruvial-portafolio',
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
    pages: [
      'serviciosHub',
      'servicio_aulaVirtual',
      'servicio_peridata',
      'servicio_capacitacionSensibilizacion',
      'servicio_estudiosDiagnosticosTecnicos',
      'servicio_herramientasEducativasTecnologicas',
      'servicio_inventariosViales',
      'servicio_planeacionGestionVial',
    ],
  },
  {
    id: 'cove',
    label: 'Curso COVE',
    keywords: ['curso cove', 'COVE transporte'],
    pages: ['cursos', 'blog'],
  },
];
