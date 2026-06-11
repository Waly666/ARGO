const { LANDING_DEFAULTS } = require('../constants/aulaVirtualLandingDefaults');

function str(v, fallback = '') {
  return String(v ?? fallback).trim();
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizarItemsIcono(raw, fallbackItems, fields) {
  const lista = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const item of lista) {
    if (!item || typeof item !== 'object') continue;
    const row = {};
    for (const f of fields) {
      row[f] = str(item[f]);
    }
    if (fields.includes('title') && !row.title) continue;
    if (fields.includes('pregunta') && !row.pregunta) continue;
    out.push(row);
  }
  return out.length ? out : fallbackItems.map((x) => ({ ...x }));
}

function normalizarSeccionKicker(raw, fallback, itemFields, itemKey = 'items') {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    kicker: str(src.kicker, fallback.kicker),
    titulo: str(src.titulo, fallback.titulo),
    lead: str(src.lead, fallback.lead),
    [itemKey]: normalizarItemsIcono(src[itemKey], fallback[itemKey], itemFields),
  };
}

function normalizarLanding(input) {
  const d = LANDING_DEFAULTS;
  const src = input && typeof input === 'object' ? input : {};

  const ofertasSrc = src.ofertas && typeof src.ofertas === 'object' ? src.ofertas : {};
  const serviciosSrc = src.servicios && typeof src.servicios === 'object' ? src.servicios : {};
  const valoresSrc = src.valores && typeof src.valores === 'object' ? src.valores : {};
  const cursosSrc = src.cursos && typeof src.cursos === 'object' ? src.cursos : {};
  const carrerasSrc = src.carreras && typeof src.carreras === 'object' ? src.carreras : {};
  const pilaresSrc = src.pilares && typeof src.pilares === 'object' ? src.pilares : {};
  const faqSrc = src.faq && typeof src.faq === 'object' ? src.faq : {};

  const carrerasRaw = Array.isArray(carrerasSrc.items) ? carrerasSrc.items : [];
  const carrerasItems = carrerasRaw.length
    ? carrerasRaw
        .map((item, i) => {
          const fb = d.carreras.items[i] || d.carreras.items[0] || {};
          return {
            titulo: str(item?.titulo, fb.titulo),
            cno: str(item?.cno, fb.cno),
            horas: num(item?.horas, fb.horas),
            semestres: num(item?.semestres, fb.semestres),
            jornadas: str(item?.jornadas, fb.jornadas),
          };
        })
        .filter((x) => x.titulo)
    : d.carreras.items.map((x) => ({ ...x }));

  const pasosSrc = src.pasos && typeof src.pasos === 'object' ? src.pasos : {};
  const pasosItems = normalizarItemsIcono(pasosSrc.items, d.pasos.items, ['paso', 'title', 'text']);

  const testimoniosSrc = src.testimonios && typeof src.testimonios === 'object' ? src.testimonios : {};
  const testimoniosItems = normalizarItemsIcono(testimoniosSrc.items, d.testimonios.items, [
    'nombre',
    'rol',
    'texto',
  ]);

  const faqItems = normalizarItemsIcono(faqSrc.items, d.faq.items, ['pregunta', 'respuesta']);

  const cap = Array.isArray(pilaresSrc.capacitacion)
    ? pilaresSrc.capacitacion.map((l) => str(l)).filter(Boolean)
    : [];
  const camp = Array.isArray(pilaresSrc.campanas)
    ? pilaresSrc.campanas.map((l) => str(l)).filter(Boolean)
    : [];

  const footer = Array.isArray(src.footerServicios)
    ? src.footerServicios.map((l) => str(l)).filter(Boolean)
    : [];

  return {
    instBarTag: str(src.instBarTag, d.instBarTag),
    quoteText: str(src.quoteText, d.quoteText),
    metaDescription: str(src.metaDescription),
    metaKeywords: str(src.metaKeywords),
    ofertas: {
      titulo: str(ofertasSrc.titulo, d.ofertas.titulo),
      lead: str(ofertasSrc.lead, d.ofertas.lead),
      items: normalizarItemsIcono(ofertasSrc.items, d.ofertas.items, ['icon', 'title', 'text']),
    },
    beneficios: normalizarSeccionKicker(src.beneficios, d.beneficios, ['icon', 'title', 'text']),
    servicios: {
      titulo: str(serviciosSrc.titulo, d.servicios.titulo),
      items: normalizarItemsIcono(serviciosSrc.items, d.servicios.items, ['icon', 'title']),
    },
    valores: {
      titulo: str(valoresSrc.titulo, d.valores.titulo),
      lead: str(valoresSrc.lead, d.valores.lead),
      items: normalizarItemsIcono(valoresSrc.items, d.valores.items, ['title', 'text']),
    },
    testimonios: {
      kicker: str(testimoniosSrc.kicker, d.testimonios.kicker),
      titulo: str(testimoniosSrc.titulo, d.testimonios.titulo),
      lead: str(testimoniosSrc.lead, d.testimonios.lead),
      items: testimoniosItems,
    },
    pasos: {
      kicker: str(pasosSrc.kicker, d.pasos.kicker),
      titulo: str(pasosSrc.titulo, d.pasos.titulo),
      lead: str(pasosSrc.lead, d.pasos.lead),
      items: pasosItems,
    },
    faq: {
      kicker: str(faqSrc.kicker, d.faq.kicker),
      titulo: str(faqSrc.titulo, d.faq.titulo),
      lead: str(faqSrc.lead, d.faq.lead),
      contactoTexto: str(faqSrc.contactoTexto, d.faq.contactoTexto),
      items: faqItems,
    },
    cursos: {
      kicker: str(cursosSrc.kicker, d.cursos.kicker),
      titulo: str(cursosSrc.titulo, d.cursos.titulo),
      emptyTitulo: str(cursosSrc.emptyTitulo, d.cursos.emptyTitulo),
      emptyTexto: str(cursosSrc.emptyTexto, d.cursos.emptyTexto),
    },
    carreras: {
      kicker: str(carrerasSrc.kicker, d.carreras.kicker),
      titulo: str(carrerasSrc.titulo, d.carreras.titulo),
      lead: str(carrerasSrc.lead, d.carreras.lead),
      items: carrerasItems.length ? carrerasItems : d.carreras.items.map((x) => ({ ...x })),
    },
    pilares: {
      capacitacion: cap.length ? cap : [...d.pilares.capacitacion],
      campanas: camp.length ? camp : [...d.pilares.campanas],
    },
    footerServicios: footer.length ? footer : [...d.footerServicios],
  };
}

function mergeLanding(stored) {
  return normalizarLanding(stored);
}

module.exports = {
  LANDING_DEFAULTS,
  normalizarLanding,
  mergeLanding,
};
