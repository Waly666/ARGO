import { PORTAL_PAGES, SERVICIOS_CATALOGO, FINSTRUVIAL_PORTAL_PAGE_KEYS } from './catalog.mjs';

export function emptyProfile() {
  return {
    marca: '',
    nombreCea: '',
    ciudad: 'Villavicencio',
    region: 'Meta',
    pais: 'Colombia',
    dominio: '',
    serviciosSeleccionados: ['seguridad-vial', 'manejo-defensivo', 'cursos-virtuales', 'licencias'],
    serviciosCustom: [],
    /** Si true, genera SEO para /servicios y líneas FINSTRUVIAL. undefined = auto (Finstruvial en marca/dominio). */
    paginasPortafolio: [],
    notas: '',
  };
}

function str(v) {
  return String(v ?? '').trim();
}

function truncate(text, max = 158) {
  const t = str(text).replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function truncateTitle(text, max = 62) {
  const t = str(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function siteSuffix(p) {
  const ciudad = str(p.ciudad) || 'Colombia';
  const region = str(p.region);
  return region ? `${ciudad}, ${region}` : ciudad;
}

function marcaCorta(p) {
  return str(p.marca) || str(p.nombreCea) || 'Su institución';
}

function nombreCea(p) {
  return str(p.nombreCea) || marcaCorta(p);
}

function resolveServicios(profile) {
  const ids = new Set(profile.serviciosSeleccionados ?? []);
  const fromCatalog = SERVICIOS_CATALOGO.filter((s) => ids.has(s.id));
  const custom = (profile.serviciosCustom ?? [])
    .filter((s) => str(s.nombre))
    .map((s, i) => ({
      id: `custom-${i}`,
      label: str(s.nombre),
      keywords: String(s.keywords ?? '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      pages: ['home', 'cursos', 'blog'],
      custom: true,
    }));
  return [...fromCatalog, ...custom];
}

function allKeywords(servicios, profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const set = new Set([
    marca,
    nombreCea(profile),
    `${marca} ${str(profile.ciudad)}`,
    `cursos ${str(profile.ciudad)}`,
    `${marca} ${loc}`,
  ]);
  for (const s of servicios) {
    for (const k of s.keywords ?? []) set.add(k);
  }
  return [...set].filter(Boolean);
}

function serviciosParaPagina(servicios, pageKey) {
  return servicios.filter((s) => (s.pages ?? []).includes(pageKey));
}

function nombresServicios(servicios, max = 3) {
  return servicios
    .slice(0, max)
    .map((s) => s.label)
    .join(', ');
}

function tituloConMarca(tituloBase, profile) {
  const marca = marcaCorta(profile);
  const suf = siteSuffix(profile);
  if (tituloBase.includes('|')) return truncateTitle(tituloBase);
  return truncateTitle(`${tituloBase} | ${marca} — ${suf}`);
}

function buildHome(profile, servicios) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const topPhrase = servicios[0]?.keywords?.[0] ?? servicios[0]?.label ?? 'seguridad vial';
  const titulo = tituloConMarca(`Cursos de ${topPhrase}`, profile);
  const serviciosTxt = nombresServicios(servicios, 4);
  const descripcion = truncate(
    `${serviciosTxt} en ${loc} y ${str(profile.pais) || 'Colombia'}. Matricúlese en línea con ${marca}: formación certificada para conductores, empresas e instituciones.`,
  );
  return { titulo, descripcion, keywords: allKeywords(servicios, profile).join(', ') };
}

function buildCursos(profile, servicios) {
  const rel = serviciosParaPagina(servicios, 'cursos');
  const tema = rel[0]?.label ?? 'seguridad vial';
  const titulo = tituloConMarca(`Catálogo de cursos de ${tema.toLowerCase()}`, profile);
  const descripcion = truncate(
    `Explore cursos y programas de ${nombresServicios(rel, 5) || tema}. Conozca tarifas, modalidad virtual o presencial y matricúlese en línea en ${siteSuffix(profile)}.`,
  );
  return { titulo, descripcion, keywords: allKeywords(rel.length ? rel : servicios, profile).join(', ') };
}

function buildTienda(profile, servicios) {
  const titulo = tituloConMarca('Tienda de cursos virtuales certificados', profile);
  const descripcion = truncate(
    `Inscríbase a cursos virtuales de ${nombreCea(profile)}. Programas en línea en ${nombresServicios(servicios, 3) || 'seguridad vial'} para conductores y empresas en ${siteSuffix(profile)}.`,
  );
  return { titulo, descripcion, keywords: allKeywords(servicios, profile).join(', ') };
}

function buildAcerca(profile) {
  const titulo = tituloConMarca('Institución, contacto y sede', profile);
  const descripcion = truncate(
    `Conozca ${nombreCea(profile)} en ${siteSuffix(profile)}: misión, valores, cursos de conducción, licencias y capacitación en seguridad vial. Teléfono, correo y ubicación.`,
  );
  return {
    titulo,
    descripcion,
    keywords: [marcaCorta(profile), `contacto ${str(profile.ciudad)}`, 'centro de enseñanza automovilística'].join(', '),
  };
}

function buildFundacion(profile, servicios) {
  const titulo = tituloConMarca(nombreCea(profile), profile);
  const descripcion = truncate(
    `${nombreCea(profile)} en ${siteSuffix(profile)}: ${nombresServicios(servicios, 4) || 'cursos de conducción y seguridad vial'}. Centro habilitado con aula virtual certificada.`,
  );
  return { titulo, descripcion, keywords: allKeywords(servicios, profile).join(', ') };
}

function buildConsultaCertificados(profile, servicios) {
  const rel = serviciosParaPagina(servicios, 'consultaCertificados');
  const kw = rel.flatMap((s) => s.keywords).join(', ') || 'consulta certificados, verificar certificado';
  const titulo = tituloConMarca('Consulta de certificados en línea', profile);
  const descripcion = truncate(
    `Verifique certificados expedidos por ${nombreCea(profile)}. Consulta por documento: manejo defensivo, seguridad vial y cursos virtuales en ${siteSuffix(profile)}.`,
  );
  return { titulo, descripcion, keywords: `${kw}, ${marcaCorta(profile)}` };
}

function buildCursosConduccion(profile) {
  const titulo = tituloConMarca('Cursos de conducción y licencias', profile);
  const descripcion = truncate(
    `Licencias de conducción categorías A2, B1, C1, C2 y C3. Cursos de conducción y educación vial en ${siteSuffix(profile)} con ${nombreCea(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: `licencia de conducción ${str(profile.ciudad)}, cursos conducción, ${marcaCorta(profile)}`,
  };
}

function buildExamenTeorico(profile) {
  const titulo = tituloConMarca('Examen teórico licencia de conducción', profile);
  const descripcion = truncate(
    `Información sobre el examen teórico para obtener o recategorizar la licencia de conducción en Colombia. ${nombreCea(profile)}, ${siteSuffix(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: `examen teórico, licencia conducción, ${marcaCorta(profile)}, RUNT`,
  };
}

function buildMercanciasPeligrosas(profile) {
  const titulo = tituloConMarca('Curso mercancías peligrosas y transporte', profile);
  const descripcion = truncate(
    `Capacitación en transporte de mercancías peligrosas: normativa colombiana, documentación y seguridad vial para empresas de transporte. ${nombreCea(profile)}, ${siteSuffix(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: `mercancías peligrosas, curso transporte, ${marcaCorta(profile)}, ${str(profile.ciudad)}`,
  };
}

function buildTrabajoEnAlturas(profile) {
  const titulo = tituloConMarca('Curso trabajo en alturas sector transporte', profile);
  const descripcion = truncate(
    `Formación en trabajo seguro en alturas para el sector transportador. Normativa, EPI y buenas prácticas con ${nombreCea(profile)} en ${siteSuffix(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: `trabajo en alturas, Resolución 4272, ${marcaCorta(profile)}`,
  };
}

function buildBlog(profile, servicios) {
  const titulo = tituloConMarca('Blog y noticias de capacitación', profile);
  const descripcion = truncate(
    `Artículos sobre ${nombresServicios(servicios, 3) || 'seguridad vial'} y novedades del aula virtual de ${nombreCea(profile)} en ${siteSuffix(profile)}.`,
  );
  return { titulo, descripcion, keywords: `blog ${marcaCorta(profile)}, noticias seguridad vial, ${str(profile.ciudad)}` };
}

function buildGaleria(profile) {
  const titulo = tituloConMarca('Galería de fotos y eventos', profile);
  const descripcion = truncate(
    `Fotos y videos de actividades de formación, jornadas y sede de ${nombreCea(profile)} en ${siteSuffix(profile)}.`,
  );
  return { titulo, descripcion, keywords: `${marcaCorta(profile)}, galería, eventos capacitación` };
}

function buildPqr(profile) {
  const titulo = tituloConMarca('PQR — Peticiones y reclamos', profile);
  const descripcion = truncate(
    `Canal oficial de peticiones, quejas, reclamos y sugerencias de ${nombreCea(profile)}. Atención oportuna en ${siteSuffix(profile)}.`,
  );
  return { titulo, descripcion, keywords: `PQR, ${marcaCorta(profile)}, peticiones quejas reclamos` };
}

function buildJornadas(profile) {
  const titulo = tituloConMarca('Jornadas de capacitación en seguridad vial', profile);
  const descripcion = truncate(
    `Inscríbase a jornadas presenciales de capacitación en seguridad vial. Actividades experienciales con ${nombreCea(profile)} en ${siteSuffix(profile)}.`,
  );
  return { titulo, descripcion, keywords: `jornadas capacitación, seguridad vial, ${marcaCorta(profile)}` };
}

function buildEvaluacionJornadas(profile) {
  const titulo = tituloConMarca('Evaluación de jornadas de capacitación', profile);
  const descripcion = truncate(
    `Encuesta de satisfacción y evaluación de jornadas de capacitación en seguridad vial de ${nombreCea(profile)}.`,
  );
  return { titulo, descripcion, keywords: `evaluación jornadas, ${marcaCorta(profile)}` };
}

function kwFinstruvial(profile, extra = []) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  return [...extra, marca, 'FINSTRUVIAL', 'seguridad vial', 'consultoría vial', loc].filter(Boolean).join(', ');
}

function buildServiciosHub(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('Servicios de consultoría y seguridad vial', profile);
  const descripcion = truncate(
    `Portafolio institucional de ${marca}: consultoría, estudios técnicos, planeación vial, tecnología, inventarios viales y formación en tránsito, transporte y movilidad en ${loc} y Colombia.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, [
      'servicios FINSTRUVIAL',
      'portafolio servicios',
      'estudios técnicos vial',
      'planeación vial',
    ]),
  };
}

function buildServicioAulaVirtual(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('Aula Virtual y formación en seguridad vial', profile);
  const descripcion = truncate(
    `Aula virtual de ${marca}: cursos y programas en línea en tránsito, transporte y seguridad vial. Formación certificada para conductores, empresas e instituciones en ${loc}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, ['aula virtual', 'cursos en línea', 'capacitación conductores', 'formación vial']),
  };
}

function buildServicioPeridata(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('PERIDATA — análisis de siniestralidad vial', profile);
  const descripcion = truncate(
    `PERIDATA: inteligencia de datos para la seguridad vial. Análisis geográfico, estadística avanzada y puntos críticos para PLSV, PESV y decisiones basadas en evidencia. ${marca}, ${loc}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, [
      'PERIDATA',
      'análisis siniestralidad',
      'mapas de calor accidentes',
      'puntos críticos vial',
      'PLSV',
    ]),
  };
}

function buildServicioCapacitacionSensibilizacion(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('Capacitación y sensibilización en seguridad vial', profile);
  const descripcion = truncate(
    `Programas de capacitación y sensibilización en seguridad vial para conductores, empresas de transporte y autoridades. Formación experiencial y competencias laborales con ${marca} en ${loc}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, [
      'capacitación seguridad vial',
      'sensibilización vial',
      'formación conductores',
      'cultura vial',
    ]),
  };
}

function buildServicioEstudiosDiagnosticosTecnicos(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('Estudios y diagnósticos técnicos en movilidad', profile);
  const descripcion = truncate(
    `Estudios y diagnósticos técnicos en movilidad, transporte e infraestructura vial: puntos críticos, IPAT, señalización, perfiles viales y reconstrucción de siniestros. ${marca}, ${loc}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, [
      'estudios técnicos vial',
      'diagnóstico movilidad',
      'IPAT',
      'puntos críticos',
      'estudios tarifarios',
    ]),
  };
}

function buildServicioHerramientasEducativasTecnologicas(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('Herramientas educativas y tecnológicas', profile);
  const descripcion = truncate(
    `Herramientas educativas y tecnológicas para seguridad vial: plataformas digitales, simuladores, gamificación y experiencias inmersivas como ENCIVIRTRANS. Innovación formativa con ${marca} en ${loc}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, [
      'herramientas educativas',
      'tecnología seguridad vial',
      'ENCIVIRTRANS',
      'simuladores conducción',
      'gamificación vial',
    ]),
  };
}

function buildServicioInventariosViales(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('Inventarios viales con INFRAVIAL', profile);
  const descripcion = truncate(
    `Inventarios viales con INFRAVIAL: categorización vial, integración SINC, mapas, GeoJSON para QGIS, app móvil offline y conteos vehiculares. Gestión pública del inventario vial en Colombia. ${marca}, ${loc}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, [
      'inventarios viales',
      'INFRAVIAL',
      'SINC',
      'QGIS',
      'conteos vehiculares',
      'infraestructura vial',
    ]),
  };
}

function buildServicioPlaneacionGestionVial(profile) {
  const marca = marcaCorta(profile);
  const loc = siteSuffix(profile);
  const titulo = tituloConMarca('Planeación y gestión vial', profile);
  const descripcion = truncate(
    `Planeación y gestión vial con base en datos: PESV, PLSV, PMT, PMSS y acompañamiento institucional. Diagnóstico territorial, indicadores e intervenciones medibles. ${marca}, ${loc}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kwFinstruvial(profile, [
      'planeación vial',
      'gestión vial',
      'PESV',
      'PLSV',
      'PMT',
      'política movilidad',
    ]),
  };
}

const BUILDERS = {
  home: (p, s) => buildHome(p, s),
  cursos: (p, s) => buildCursos(p, s),
  tienda: (p, s) => buildTienda(p, s),
  acerca: (p) => buildAcerca(p),
  fundacion: (p, s) => buildFundacion(p, s),
  consultaCertificados: (p, s) => buildConsultaCertificados(p, s),
  cursosConduccion: (p) => buildCursosConduccion(p),
  examenTeorico: (p) => buildExamenTeorico(p),
  mercanciasPeligrosas: (p) => buildMercanciasPeligrosas(p),
  trabajoEnAlturas: (p) => buildTrabajoEnAlturas(p),
  serviciosHub: (p) => buildServiciosHub(p),
  servicio_aulaVirtual: (p) => buildServicioAulaVirtual(p),
  servicio_peridata: (p) => buildServicioPeridata(p),
  servicio_capacitacionSensibilizacion: (p) => buildServicioCapacitacionSensibilizacion(p),
  servicio_estudiosDiagnosticosTecnicos: (p) => buildServicioEstudiosDiagnosticosTecnicos(p),
  servicio_herramientasEducativasTecnologicas: (p) => buildServicioHerramientasEducativasTecnologicas(p),
  servicio_inventariosViales: (p) => buildServicioInventariosViales(p),
  servicio_planeacionGestionVial: (p) => buildServicioPlaneacionGestionVial(p),
  blog: (p, s) => buildBlog(p, s),
  galeria: (p) => buildGaleria(p),
  pqr: (p) => buildPqr(p),
  jornadasCapacitacion: (p) => buildJornadas(p),
  evaluacionJornadas: (p) => buildEvaluacionJornadas(p),
};

/** Páginas relevantes según servicios elegidos (sin duplicar todo el catálogo). */
export function profileEsFinstruvial(profile) {
  const txt = `${profile.marca} ${profile.nombreCea} ${profile.dominio}`.toLowerCase();
  return txt.includes('finstruvial');
}

export function resolveFinstruvialPageKeys(profile) {
  if (profile.incluirPortafolioFinstruvial === true) {
    const explicit = (profile.paginasPortafolio ?? []).filter((k) => FINSTRUVIAL_PORTAL_PAGE_KEYS.includes(k));
    if (explicit.length) return explicit;
    return [...FINSTRUVIAL_PORTAL_PAGE_KEYS];
  }

  if (profile.incluirPortafolioFinstruvial === false) return [];

  const servicios = profile.serviciosSeleccionados ?? [];
  if (servicios.includes('finstruvial-portafolio')) return [...FINSTRUVIAL_PORTAL_PAGE_KEYS];
  if (profileEsFinstruvial(profile)) return [...FINSTRUVIAL_PORTAL_PAGE_KEYS];

  return [];
}

export function paginasRelevantes(profile) {
  const servicios = resolveServicios(profile);
  const keys = new Set(['home', 'acerca', 'blog', 'galeria', 'pqr']);
  for (const s of servicios) {
    for (const k of s.pages ?? []) keys.add(k);
  }
  for (const k of resolveFinstruvialPageKeys(profile)) keys.add(k);
  return PORTAL_PAGES.filter((p) => keys.has(p.key));
}

export function generateSeoPack(profile) {
  const servicios = resolveServicios(profile);
  const seo = {};
  const relevant = paginasRelevantes(profile);

  for (const page of relevant) {
    const fn = BUILDERS[page.key];
    if (fn) seo[page.key] = fn(profile, servicios);
  }

  const home = seo.home ?? buildHome(profile, servicios);

  return {
    generatedAt: new Date().toISOString(),
    cliente: {
      marca: marcaCorta(profile),
      nombreCea: nombreCea(profile),
      dominio: str(profile.dominio),
      ubicacion: siteSuffix(profile),
    },
    serviciosUsados: servicios.map((s) => s.label),
    paginas: relevant.map((p) => ({ ...p, seo: seo[p.key] })),
    exportErp: {
      site: { seo },
      landing: {
        metaDescription: home.descripcion,
        metaKeywords: home.keywords,
      },
    },
    ideasBlog: servicios.slice(0, 6).map((s) => ({
      titulo: `Guía de ${s.label.toLowerCase()} en ${str(profile.ciudad) || 'Colombia'}`,
      keywords: (s.keywords ?? []).slice(0, 4).join(', '),
    })),
  };
}
