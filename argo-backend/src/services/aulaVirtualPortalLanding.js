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
  const heroSrc = src.hero && typeof src.hero === 'object' ? src.hero : {};
  const navSrc = src.nav && typeof src.nav === 'object' ? src.nav : {};
  const footerSrc = src.footer && typeof src.footer === 'object' ? src.footer : {};
  const catalogoSrc = src.catalogo && typeof src.catalogo === 'object' ? src.catalogo : {};
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

  const infoCardsRaw = Array.isArray(src.infoCards) ? src.infoCards : [];
  const infoCards = infoCardsRaw.length
    ? infoCardsRaw.map((item, i) => {
        const fb = d.infoCards[i] || d.infoCards[0] || {};
        const fuente = ['texto', 'telefono', 'direccion'].includes(item?.fuente) ? item.fuente : fb.fuente;
        return {
          icon: str(item?.icon, fb.icon),
          title: str(item?.title, fb.title),
          text: str(item?.text, fb.text),
          fuente,
        };
      })
    : d.infoCards.map((x) => ({ ...x }));

  return {
    instBarTag: str(src.instBarTag, d.instBarTag),
    quoteText: str(src.quoteText, d.quoteText),
    quoteLabel: str(src.quoteLabel, d.quoteLabel),
    metaDescription: str(src.metaDescription),
    metaKeywords: str(src.metaKeywords),
    hero: {
      ctaPrincipal: str(heroSrc.ctaPrincipal, d.hero.ctaPrincipal),
      ctaSecundario: str(heroSrc.ctaSecundario, d.hero.ctaSecundario),
      mostrarBotonLlamar: heroSrc.mostrarBotonLlamar !== false && heroSrc.mostrarBotonLlamar !== 'false',
      imagenAlt: str(heroSrc.imagenAlt, d.hero.imagenAlt),
    },
    infoCards,
    nav: {
      home: str(navSrc.home, d.nav.home),
      tienda: str(navSrc.tienda, d.nav.tienda),
      cursos: str(navSrc.cursos, d.nav.cursos),
      aula: str(navSrc.aula, d.nav.aula),
      acerca: str(navSrc.acerca, d.nav.acerca),
      acceder: str(navSrc.acceder, d.nav.acceder),
      registrarse: str(navSrc.registrarse, d.nav.registrarse),
      salir: str(navSrc.salir, d.nav.salir),
    },
    footer: {
      founded: str(footerSrc.founded, d.footer.founded),
      copyright: str(footerSrc.copyright, d.footer.copyright),
      tituloEnlaces: str(footerSrc.tituloEnlaces, d.footer.tituloEnlaces),
      tituloServicios: str(footerSrc.tituloServicios, d.footer.tituloServicios),
      tituloContacto: str(footerSrc.tituloContacto, d.footer.tituloContacto),
    },
    catalogo: {
      tituloCursos: str(catalogoSrc.tituloCursos, d.catalogo.tituloCursos),
      tituloTienda: str(catalogoSrc.tituloTienda, d.catalogo.tituloTienda),
      leadCursos: str(catalogoSrc.leadCursos, d.catalogo.leadCursos),
      leadTienda: str(catalogoSrc.leadTienda, d.catalogo.leadTienda),
      placeholderBuscar: str(catalogoSrc.placeholderBuscar, d.catalogo.placeholderBuscar),
    },
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
      tabCapacitacion: str(pilaresSrc.tabCapacitacion, d.pilares.tabCapacitacion),
      tabCampanas: str(pilaresSrc.tabCampanas, d.pilares.tabCampanas),
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
