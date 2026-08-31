const { TRABAJO_EN_ALTURAS_DOCUMENTOS_GRUPOS } = require('./aulaVirtualTrabajoEnAlturasDocumentos');

const landingJson = require('./trabajo-en-alturas-landing.json');

const TRABAJO_EN_ALTURAS_DEFAULTS = {
  ...landingJson,
  documentosGrupos: JSON.parse(JSON.stringify(TRABAJO_EN_ALTURAS_DOCUMENTOS_GRUPOS)),
};

function mergeImagenes(raw, fb) {
  const src = Array.isArray(raw) ? raw : [];
  return fb.map((item, i) => {
    const r = src.find((x) => x.id === item.id) || src[i];
    return {
      id: item.id,
      etiqueta: r?.etiqueta?.trim() || item.etiqueta,
      url: r?.url?.trim() || item.url,
      urlAbsoluta: r?.urlAbsoluta?.trim() || item.urlAbsoluta,
      alt: r?.alt?.trim() || item.alt,
    };
  });
}

function mergeTrabajoEnAlturasLanding(raw) {
  const d = TRABAJO_EN_ALTURAS_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  const str = (v, fb) => String(v ?? fb).trim() || fb;
  const arr = (v, fb) => (Array.isArray(v) && v.length ? v : fb);

  return {
    ...d,
    kicker: str(src.kicker, d.kicker),
    titulo: str(src.titulo, d.titulo),
    tituloLinea2: str(src.tituloLinea2, d.tituloLinea2),
    subtitulo: str(src.subtitulo, d.subtitulo),
    heroLead: str(src.heroLead, d.heroLead),
    heroParrafos: arr(src.heroParrafos, d.heroParrafos),
    enlaceCursoUrl: str(src.enlaceCursoUrl, d.enlaceCursoUrl),
    enlaceCursoEtiqueta: str(src.enlaceCursoEtiqueta, d.enlaceCursoEtiqueta),
    ctaNormativaTexto: str(src.ctaNormativaTexto, d.ctaNormativaTexto),
    ctaDocumentosTexto: str(src.ctaDocumentosTexto, d.ctaDocumentosTexto),
    ctaFaqTexto: str(src.ctaFaqTexto, d.ctaFaqTexto),
    ctaInicioTexto: str(src.ctaInicioTexto, d.ctaInicioTexto),
    ctaUrl: str(src.ctaUrl, d.ctaUrl) || d.ctaUrl,
    homeItems: arr(src.homeItems, d.homeItems),
    fechaActualizacion: str(src.fechaActualizacion, d.fechaActualizacion),
    fraseFinal: str(src.fraseFinal, d.fraseFinal),
    disclaimer: str(src.disclaimer, d.disclaimer),
    nav: arr(src.nav, d.nav),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
    introTitulo: str(src.introTitulo, d.introTitulo),
    introTexto: str(src.introTexto, d.introTexto),
    introRiesgos: arr(src.introRiesgos, d.introRiesgos),
    introAudiencia: arr(src.introAudiencia, d.introAudiencia),
    objetivosTitulo: str(src.objetivosTitulo, d.objetivosTitulo),
    objetivoGeneral: str(src.objetivoGeneral, d.objetivoGeneral),
    objetivosEspecificos: arr(src.objetivosEspecificos, d.objetivosEspecificos),
    normativaTitulo: str(src.normativaTitulo, d.normativaTitulo),
    normativaLead: str(src.normativaLead, d.normativaLead),
    normativaDestacados: arr(src.normativaDestacados, d.normativaDestacados),
    normativaAspectos: arr(src.normativaAspectos, d.normativaAspectos),
    normativaResolucionTitulo: str(src.normativaResolucionTitulo, d.normativaResolucionTitulo),
    normativaResolucionTexto: str(src.normativaResolucionTexto, d.normativaResolucionTexto),
    normativaArticulos: arr(src.normativaArticulos, d.normativaArticulos),
    responsabilidadesEmpleador: arr(src.responsabilidadesEmpleador, d.responsabilidadesEmpleador),
    responsabilidadesTrabajador: arr(src.responsabilidadesTrabajador, d.responsabilidadesTrabajador),
    sectorTitulo: str(src.sectorTitulo, d.sectorTitulo),
    sectorLead: str(src.sectorLead, d.sectorLead),
    sectorOperaciones: arr(src.sectorOperaciones, d.sectorOperaciones),
    modulosTitulo: str(src.modulosTitulo, d.modulosTitulo),
    modulosLead: str(src.modulosLead, d.modulosLead),
    modulos: arr(src.modulos, d.modulos),
    tresCTitulo: str(src.tresCTitulo, d.tresCTitulo),
    tresCLead: str(src.tresCLead, d.tresCLead),
    tresCItems: arr(src.tresCItems, d.tresCItems),
    metodologiaTitulo: str(src.metodologiaTitulo, d.metodologiaTitulo),
    metodologiaLead: str(src.metodologiaLead, d.metodologiaLead),
    metodologiaItems: arr(src.metodologiaItems, d.metodologiaItems),
    evaluacionTitulo: str(src.evaluacionTitulo, d.evaluacionTitulo),
    evaluacionLead: str(src.evaluacionLead, d.evaluacionLead),
    evaluacionDetalles: arr(src.evaluacionDetalles, d.evaluacionDetalles),
    documentosTitulo: str(src.documentosTitulo, d.documentosTitulo),
    documentosLead: str(src.documentosLead, d.documentosLead),
    documentosGrupos: arr(src.documentosGrupos, d.documentosGrupos),
    faq: arr(src.faq, d.faq),
  };
}

module.exports = {
  TRABAJO_EN_ALTURAS_DEFAULTS,
  mergeTrabajoEnAlturasLanding,
};
