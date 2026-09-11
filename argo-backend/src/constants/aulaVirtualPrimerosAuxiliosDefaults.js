const landingJson = require('./primeros-auxilios-landing.json');

const PRIMEROS_AUXILIOS_GUION_VERSION = Number(landingJson.guionVersion) || 2;
const PRIMEROS_AUXILIOS_DEFAULTS = JSON.parse(JSON.stringify(landingJson));

function str(v, fb) {
  const t = String(v ?? '').trim();
  return t || fb;
}

function arr(v, fb) {
  return Array.isArray(v) && v.length ? v : fb;
}

function arrAllowEmpty(v, fb) {
  return Array.isArray(v) ? v : fb;
}

function mergeImagenes(raw, fb) {
  const src = Array.isArray(raw) ? raw : [];
  return fb.map((item, i) => {
    const r = src.find((x) => x && x.id === item.id) || src[i] || {};
    return {
      id: item.id,
      etiqueta: str(r.etiqueta, item.etiqueta),
      url: String(r.url ?? item.url ?? '').trim(),
      urlAbsoluta: String(r.urlAbsoluta ?? item.urlAbsoluta ?? '').trim(),
      alt: str(r.alt, item.alt),
      promptImagen: str(r.promptImagen, item.promptImagen),
    };
  });
}

function mergeModalidad(raw, fb) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    kicker: str(src.kicker, fb.kicker),
    titulo: str(src.titulo, fb.titulo),
    lead: str(src.lead, fb.lead),
    idealPara: arr(src.idealPara, fb.idealPara),
    incluye: arr(src.incluye, fb.incluye),
    ctaTexto: str(src.ctaTexto, fb.ctaTexto),
    ctaUrl: str(src.ctaUrl, fb.ctaUrl),
    imagenId: str(src.imagenId, fb.imagenId),
  };
}

function mergeCertificacion(raw, fb) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    duracion: str(src.duracion, fb.duracion),
    modalidad: str(src.modalidad, fb.modalidad),
    evaluacion: str(src.evaluacion, fb.evaluacion),
    certificado: str(src.certificado, fb.certificado),
    vigencia: str(src.vigencia, fb.vigencia),
    entidad: str(src.entidad, fb.entidad),
  };
}

function primerosAuxiliosNecesitaActualizarGuion(src) {
  if (!src || typeof src !== 'object') return false;
  const v = Number(src.guionVersion) || 0;
  return v < PRIMEROS_AUXILIOS_GUION_VERSION;
}

function mergePrimerosAuxiliosPreservandoUsuario(src, d) {
  const idProgramaVinculado = String(src.idProgramaVinculado ?? '').trim();
  const out = {
    ...JSON.parse(JSON.stringify(d)),
    guionVersion: PRIMEROS_AUXILIOS_GUION_VERSION,
    idProgramaVinculado,
    nombreProgramaVinculado: String(src.nombreProgramaVinculado ?? '').trim(),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
  };
  if (idProgramaVinculado) {
    out.ctaInscribirseUrl = `/cursos/${idProgramaVinculado}`;
  } else if (String(src.ctaInscribirseUrl || '').trim()) {
    out.ctaInscribirseUrl = str(src.ctaInscribirseUrl, d.ctaInscribirseUrl);
  }
  return out;
}

const HERO_THEMES = ['gold', 'green', 'violet', 'blue'];

function mergePromoHeroTheme(v, fb) {
  const t = String(v ?? '').trim();
  return HERO_THEMES.includes(t) ? t : fb;
}

function mergePrimerosAuxiliosLanding(raw, defaults = PRIMEROS_AUXILIOS_DEFAULTS) {
  const d = defaults;
  const src = raw && typeof raw === 'object' ? raw : {};
  if (primerosAuxiliosNecesitaActualizarGuion(src)) {
    return mergePrimerosAuxiliosPreservandoUsuario(src, d);
  }
  return {
    ...d,
    guionVersion: PRIMEROS_AUXILIOS_GUION_VERSION,
    theme: mergePromoHeroTheme(src.theme, d.theme || 'blue'),
    kicker: str(src.kicker, d.kicker),
    titulo: str(src.titulo, d.titulo),
    tituloLinea2: str(src.tituloLinea2, d.tituloLinea2),
    subtitulo: str(src.subtitulo, d.subtitulo),
    h1: str(src.h1, d.h1),
    idProgramaVinculado: String(src.idProgramaVinculado ?? '').trim(),
    nombreProgramaVinculado: String(src.nombreProgramaVinculado ?? '').trim(),
    heroLead: str(src.heroLead, d.heroLead),
    ctaInscribirseTexto: str(src.ctaInscribirseTexto, d.ctaInscribirseTexto),
    ctaInscribirseUrl: str(src.ctaInscribirseUrl, d.ctaInscribirseUrl),
    ctaEmpresaTexto: str(src.ctaEmpresaTexto, d.ctaEmpresaTexto),
    ctaEmpresaUrl: str(src.ctaEmpresaUrl, d.ctaEmpresaUrl),
    ctaWhatsappTexto: str(src.ctaWhatsappTexto, d.ctaWhatsappTexto),
    ctaInicioTexto: str(src.ctaInicioTexto, d.ctaInicioTexto),
    ctaUrl: str(src.ctaUrl, d.ctaUrl),
    homeItems: arr(src.homeItems, d.homeItems),
    confianzaTitulo: str(src.confianzaTitulo, d.confianzaTitulo),
    confianzaTexto: str(src.confianzaTexto, d.confianzaTexto),
    pilares: arr(src.pilares, d.pilares),
    queEsTitulo: str(src.queEsTitulo, d.queEsTitulo),
    queEsTexto: str(src.queEsTexto, d.queEsTexto),
    cicloPasos: arr(src.cicloPasos, d.cicloPasos),
    cicloFrase: str(src.cicloFrase, d.cicloFrase),
    aprenderasTitulo: str(src.aprenderasTitulo, d.aprenderasTitulo),
    aprendizajes: arr(src.aprendizajes, d.aprendizajes),
    fraseAprendizaje: str(src.fraseAprendizaje, d.fraseAprendizaje),
    modalidadesTitulo: str(src.modalidadesTitulo, d.modalidadesTitulo),
    virtual: mergeModalidad(src.virtual, d.virtual),
    presencial: mergeModalidad(src.presencial, d.presencial),
    regionalTitulo: str(src.regionalTitulo, d.regionalTitulo),
    regionalTexto: str(src.regionalTexto, d.regionalTexto),
    municipios: arr(src.municipios, d.municipios),
    empresasTitulo: str(src.empresasTitulo, d.empresasTitulo),
    empresasTexto: str(src.empresasTexto, d.empresasTexto),
    empresasTipos: arr(src.empresasTipos, d.empresasTipos),
    empresasCtaTitulo: str(src.empresasCtaTitulo, d.empresasCtaTitulo),
    empresasCtaTexto: str(src.empresasCtaTexto, d.empresasCtaTexto),
    empresasCtaBoton: str(src.empresasCtaBoton, d.empresasCtaBoton),
    empresasCtaUrl: str(src.empresasCtaUrl, d.empresasCtaUrl),
    pesvTitulo: str(src.pesvTitulo, d.pesvTitulo),
    pesvLead: str(src.pesvLead, d.pesvLead),
    pesvItems: arr(src.pesvItems, d.pesvItems),
    pesvEnlaceTexto: str(src.pesvEnlaceTexto, d.pesvEnlaceTexto),
    pesvEnlaceUrl: str(src.pesvEnlaceUrl, d.pesvEnlaceUrl),
    metodologiaTitulo: str(src.metodologiaTitulo, d.metodologiaTitulo),
    metodologiaPasos: arr(src.metodologiaPasos, d.metodologiaPasos),
    audienciaTitulo: str(src.audienciaTitulo, d.audienciaTitulo),
    audiencias: arr(src.audiencias, d.audiencias),
    beneficiosTitulo: str(src.beneficiosTitulo, d.beneficiosTitulo),
    beneficios: arr(src.beneficios, d.beneficios),
    certificacionTitulo: str(src.certificacionTitulo, d.certificacionTitulo),
    certificacionTexto: str(src.certificacionTexto, d.certificacionTexto),
    certificacion: mergeCertificacion(src.certificacion, d.certificacion),
    instructoresTitulo: str(src.instructoresTitulo, d.instructoresTitulo),
    instructoresTexto: str(src.instructoresTexto, d.instructoresTexto),
    instructoresItems: arr(src.instructoresItems, d.instructoresItems),
    testimoniosTitulo: str(src.testimoniosTitulo, d.testimoniosTitulo),
    testimonios: arrAllowEmpty(src.testimonios, d.testimonios),
    faqTitulo: str(src.faqTitulo, d.faqTitulo),
    faq: arr(src.faq, d.faq),
    ctaFinalTitulo: str(src.ctaFinalTitulo, d.ctaFinalTitulo),
    ctaFinalLead: str(src.ctaFinalLead, d.ctaFinalLead),
    ctaFinalTexto: str(src.ctaFinalTexto, d.ctaFinalTexto),
    ctaFinalUbicacion: str(src.ctaFinalUbicacion, d.ctaFinalUbicacion),
    ctaFinalFrase: str(src.ctaFinalFrase, d.ctaFinalFrase),
    footerSeoLine: str(src.footerSeoLine, d.footerSeoLine),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
  };
}

module.exports = {
  PRIMEROS_AUXILIOS_GUION_VERSION,
  PRIMEROS_AUXILIOS_DEFAULTS,
  mergePrimerosAuxiliosLanding,
  primerosAuxiliosNecesitaActualizarGuion,
};
