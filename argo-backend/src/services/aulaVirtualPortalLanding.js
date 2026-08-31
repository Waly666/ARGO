const { LANDING_DEFAULTS } = require('../constants/aulaVirtualLandingDefaults');
const { examenTeoricoContenidoAntiguo } = require('../constants/aulaVirtualExamenTeoricoDefaults');
const { mergeMercanciasPeligrosasLanding } = require('../constants/aulaVirtualMercanciasPeligrosasDefaults');
const { mergeTrabajoEnAlturasLanding } = require('../constants/aulaVirtualTrabajoEnAlturasDefaults');
const { CURSOS_CONDUCCION_DEFAULTS } = require('../constants/aulaVirtualCursosConduccionDefaults');
const { GALERIA_DEFAULTS } = require('../constants/aulaVirtualGaleriaDefaults');
const { FOTOS_INICIO_DEFAULTS, MAX_FOTOS_INICIO } = require('../constants/aulaVirtualHomeFotosDefaults');
const { publicUploadUrl } = require('../utils/uploadPublicUrl');
const { sanearGaleriaFotos } = require('./aulaVirtualGaleriaFotos');
const path = require('path');

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

function normalizarLicencias(raw, fallback) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const defaults = Array.isArray(fallback.items) ? fallback.items : [];
  const rawItems = Array.isArray(src.items) ? src.items : [];
  const items = (rawItems.length ? rawItems : defaults).map((item, i) => {
    const fb = defaults[i] || defaults[0] || {};
    const incluyeRaw = Array.isArray(item?.incluye) ? item.incluye : fb.incluye;
    const incluye = (incluyeRaw || [])
      .map((x) => str(x))
      .filter(Boolean);
    return {
      icon: str(item?.icon, fb.icon || '🚗'),
      codigo: str(item?.codigo, fb.codigo),
      titulo: str(item?.titulo, fb.titulo),
      incluye: incluye.length ? incluye : [...(fb.incluye || [])],
      licenciaLabel: str(item?.licenciaLabel, fb.licenciaLabel),
      valor: str(item?.valor, fb.valor),
      btnTexto: str(item?.btnTexto, fb.btnTexto || 'Solicitar ahora'),
      btnUrl: str(item?.btnUrl, fb.btnUrl || '/registro'),
      destacada: item?.destacada === true,
    };
  });
  return {
    kicker: str(src.kicker, fallback.kicker),
    titulo: str(src.titulo, fallback.titulo),
    lead: str(src.lead, fallback.lead),
    items: items.length ? items : defaults.map((x) => ({ ...x, incluye: [...(x.incluye || [])] })),
  };
}

function normalizarExamenTeorico(raw, fallback) {
  const antiguo = examenTeoricoContenidoAntiguo(raw);
  const srcRaw = raw && typeof raw === 'object' ? raw : {};
  const src =
    antiguo
      ? { normograma: srcRaw.normograma, resoluciones: srcRaw.resoluciones }
      : srcRaw;
  const defaults = Array.isArray(fallback.items) ? fallback.items : [];
  const rawItems = Array.isArray(src.items) ? src.items : [];
  const acentos = new Set(['blue', 'teal', 'orange', 'green', 'purple']);
  const itemCount = Math.max(rawItems.length, defaults.length);
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    const fb = defaults[i];
    const item = rawItems[i];
    if (!fb) continue;
    const acentoRaw = str(item?.acento, fb.acento).toLowerCase();
    items.push({
      numero: Number.isFinite(Number(item?.numero)) ? Number(item.numero) : fb.numero || i + 1,
      icon: str(item?.icon, fb.icon || 'clipboard'),
      acento: acentos.has(acentoRaw) ? acentoRaw : fb.acento || 'blue',
      titulo: str(item?.titulo, fb.titulo),
      texto: str(item?.texto, fb.texto),
    });
  }
  const resolucionesSrc = Array.isArray(src.resoluciones) ? src.resoluciones : [];
  const resolucionesDefaults = Array.isArray(fallback.resoluciones) ? fallback.resoluciones : [];
  const resoluciones = resolucionesSrc.length
    ? resolucionesSrc.map((item, i) => {
        const fb = resolucionesDefaults[i] || { titulo: '', archivoUrl: '', nombreArchivo: '' };
        const archivoUrl = str(item?.archivoUrl, fb.archivoUrl);
        return {
          titulo: str(item?.titulo, fb.titulo),
          archivoUrl,
          archivoUrlAbsoluta: archivoUrl ? publicUploadUrl(archivoUrl) || archivoUrl : '',
          nombreArchivo: str(item?.nombreArchivo, fb.nombreArchivo),
        };
      })
    : resolucionesDefaults.map((r) => ({
        ...r,
        archivoUrlAbsoluta: r.archivoUrl ? publicUploadUrl(r.archivoUrl) || r.archivoUrl : '',
      }));

  const normDefaults = fallback.normograma || {};
  const normSrc = src.normograma && typeof src.normograma === 'object' ? src.normograma : {};
  const normItemsDefaults = Array.isArray(normDefaults.items) ? normDefaults.items : [];
  const normItemsRaw = Array.isArray(normSrc.items) ? normSrc.items : [];
  const normCount = Math.max(normItemsRaw.length, normItemsDefaults.length);
  const normItems = [];
  for (let i = 0; i < normCount; i++) {
    const fb = normItemsDefaults[i];
    const item = normItemsRaw[i];
    if (!fb) {
      if (item?.norma) {
        const acentoRaw = str(item?.acento, 'blue').toLowerCase();
        const archivoUrl = str(item?.archivoUrl);
        normItems.push({
          icon: str(item?.icon, 'document'),
          acento: acentos.has(acentoRaw) ? acentoRaw : 'blue',
          norma: str(item?.norma),
          fecha: str(item?.fecha),
          queEstablece: str(item?.queEstablece),
          detalle: str(item?.detalle),
          archivoUrl,
          archivoUrlAbsoluta: archivoUrl ? publicUploadUrl(archivoUrl) || archivoUrl : '',
          nombreArchivo: str(item?.nombreArchivo),
        });
      }
      continue;
    }
    const acentoRaw = str(item?.acento, fb.acento).toLowerCase();
    const archivoUrl = str(item?.archivoUrl, fb.archivoUrl);
    normItems.push({
      icon: str(item?.icon, fb.icon || 'document'),
      acento: acentos.has(acentoRaw) ? acentoRaw : fb.acento || 'blue',
      norma: str(item?.norma, fb.norma),
      fecha: str(item?.fecha, fb.fecha),
      queEstablece: str(item?.queEstablece, fb.queEstablece),
      detalle: str(item?.detalle, fb.detalle),
      archivoUrl,
      archivoUrlAbsoluta: archivoUrl ? publicUploadUrl(archivoUrl) || archivoUrl : '',
      nombreArchivo: str(item?.nombreArchivo, fb.nombreArchivo),
    });
  }

  return {
    kicker: str(src.kicker, fallback.kicker),
    titulo: str(src.titulo, fallback.titulo),
    tituloLinea2: str(src.tituloLinea2, fallback.tituloLinea2),
    fechaBannerPrefijo: str(src.fechaBannerPrefijo, fallback.fechaBannerPrefijo),
    fechaDestacada: str(src.fechaDestacada, fallback.fechaDestacada),
    fechaBannerSufijo: str(src.fechaBannerSufijo, fallback.fechaBannerSufijo),
    items: items.length ? items : defaults.map((x) => ({ ...x })),
    ctaTexto: (() => {
      const raw = str(src.ctaTexto, fallback.ctaTexto);
      if (/cursos de conducci/i.test(raw)) return fallback.ctaTexto || 'Ver información completa';
      return raw;
    })(),
    ctaUrl: (() => {
      const raw = str(src.ctaUrl, fallback.ctaUrl || '/examen-teorico');
      const path = raw.split('?')[0].replace(/\/+$/, '') || '/examen-teorico';
      if (path === '/cursos-conduccion') return '/examen-teorico';
      return raw || '/examen-teorico';
    })(),
    paginaIntro: str(src.paginaIntro, fallback.paginaIntro),
    enlaceOficialUrl: str(src.enlaceOficialUrl, fallback.enlaceOficialUrl),
    enlaceOficialEtiqueta: str(src.enlaceOficialEtiqueta, fallback.enlaceOficialEtiqueta),
    resolucionesKicker: str(src.resolucionesKicker, fallback.resolucionesKicker),
    resolucionesTitulo: str(src.resolucionesTitulo, fallback.resolucionesTitulo),
    resolucionesLead: str(src.resolucionesLead, fallback.resolucionesLead),
    resoluciones,
    normograma: {
      kicker: str(normSrc.kicker, normDefaults.kicker),
      titulo: str(normSrc.titulo, normDefaults.titulo),
      subtitulo: str(normSrc.subtitulo, normDefaults.subtitulo),
      lead: str(normSrc.lead, normDefaults.lead),
      items: normItems.length ? normItems : normItemsDefaults.map((x) => ({ ...x })),
    },
    ctaFinalTexto: str(src.ctaFinalTexto, fallback.ctaFinalTexto),
    ctaFinalUrl: str(src.ctaFinalUrl, fallback.ctaFinalUrl || '/cursos-conduccion'),
  };
}

function normalizarMercanciasPeligrosas(raw, fallback) {
  const merged = mergeMercanciasPeligrosasLanding(raw || {});
  const fb = fallback && typeof fallback === 'object' ? fallback : {};
  const imagenes = (merged.imagenes || []).map((img, i) => {
    const url = str(img?.url, fb.imagenes?.[i]?.url);
    return {
      id: str(img?.id, fb.imagenes?.[i]?.id),
      etiqueta: str(img?.etiqueta, fb.imagenes?.[i]?.etiqueta),
      url,
      urlAbsoluta: url ? publicUploadUrl(url) || url : '',
      alt: str(img?.alt, fb.imagenes?.[i]?.alt),
    };
  });
  return { ...merged, imagenes };
}

function normalizarTrabajoEnAlturas(raw, fallback) {
  const merged = mergeTrabajoEnAlturasLanding(raw || {});
  const fb = fallback && typeof fallback === 'object' ? fallback : {};
  const imagenes = (merged.imagenes || []).map((img, i) => {
    const url = str(img?.url, fb.imagenes?.[i]?.url);
    return {
      id: str(img?.id, fb.imagenes?.[i]?.id),
      etiqueta: str(img?.etiqueta, fb.imagenes?.[i]?.etiqueta),
      url,
      urlAbsoluta: url ? publicUploadUrl(url) || url : '',
      alt: str(img?.alt, fb.imagenes?.[i]?.alt),
    };
  });
  return { ...merged, imagenes };
}

function normalizarPopup(raw) {
  const d = LANDING_DEFAULTS.popup;
  const src = raw && typeof raw === 'object' ? raw : {};
  const imagenUrl = str(src.imagenUrl, d.imagenUrl);
  const freq = str(src.frecuencia);
  return {
    activo: src.activo === true,
    imagenUrl,
    imagenUrlAbsoluta: imagenUrl ? publicUploadUrl(imagenUrl) || imagenUrl : '',
    imagenAlt: str(src.imagenAlt, d.imagenAlt),
    mostrarBotonContinuar: src.mostrarBotonContinuar !== false,
    textoBotonContinuar: str(src.textoBotonContinuar, d.textoBotonContinuar) || d.textoBotonContinuar,
    mostrarBotonCerrar: src.mostrarBotonCerrar !== false,
    duracionSegundos: Math.max(0, Math.min(120, Math.round(num(src.duracionSegundos, d.duracionSegundos)))),
    frecuencia: freq === 'cada_recarga_sesion' ? 'cada_recarga_sesion' : 'primera_vez',
  };
}

function normalizarConsultaCertificados(raw) {
  const d = LANDING_DEFAULTS.consultaCertificados;
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    mostrarBotonDescargar: src.mostrarBotonDescargar === true,
    marcaAguaCopia: src.marcaAguaCopia !== false,
    textoBotonDescargar: str(src.textoBotonDescargar, d.textoBotonDescargar) || d.textoBotonDescargar,
  };
}

const ASISTENTE_PAGINA_KEYS = [
  'home',
  'tienda',
  'cursos',
  'aula',
  'fundacion',
  'consultaCertificados',
  'cursosConduccion',
  'blog',
  'acerca',
];

function buildDefaultAsistentePaginas() {
  const d = LANDING_DEFAULTS.asistente.paginas;
  const paginas = {};
  for (const key of ASISTENTE_PAGINA_KEYS) {
    paginas[key] = {
      activo: false,
      texto: d[key]?.texto || '',
    };
  }
  return paginas;
}

function normalizarAsistente(raw, legacyConsulta) {
  const d = LANDING_DEFAULTS.asistente;
  const src = raw && typeof raw === 'object' ? raw : {};
  const legacy = legacyConsulta && typeof legacyConsulta === 'object' ? legacyConsulta : {};
  const paginas = buildDefaultAsistentePaginas();
  const srcPaginas = src.paginas && typeof src.paginas === 'object' ? src.paginas : {};

  for (const key of ASISTENTE_PAGINA_KEYS) {
    const pageSrc = srcPaginas[key] && typeof srcPaginas[key] === 'object' ? srcPaginas[key] : {};
    paginas[key] = {
      activo: pageSrc.activo === true,
      texto: str(pageSrc.texto, paginas[key].texto) || paginas[key].texto,
    };
  }

  if (!srcPaginas.consultaCertificados && legacy.asistenteActivo === true) {
    paginas.consultaCertificados = {
      activo: true,
      texto: str(legacy.asistenteTexto, paginas.consultaCertificados.texto) || paginas.consultaCertificados.texto,
    };
  }

  const videoUrl =
    str(src.videoUrl, legacy.asistenteVideoUrl, d.videoUrl) || d.videoUrl;
  const esSubida =
    videoUrl.includes('aula-virtual-consulta-asistente/') ||
    videoUrl.startsWith('aula-virtual-consulta-asistente/');

  return {
    videoUrl,
    videoUrlAbsoluta: esSubida ? publicUploadUrl(videoUrl) || videoUrl : '',
    paginas,
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
  const licenciasSrc = src.licencias && typeof src.licencias === 'object' ? src.licencias : {};
  const heroSrc = src.hero && typeof src.hero === 'object' ? src.hero : {};
  const navSrc = src.nav && typeof src.nav === 'object' ? src.nav : {};
  const footerSrc = src.footer && typeof src.footer === 'object' ? src.footer : {};
  const catalogoSrc = src.catalogo && typeof src.catalogo === 'object' ? src.catalogo : {};
  const pilaresSrc = src.pilares && typeof src.pilares === 'object' ? src.pilares : {};
  const faqSrc = src.faq && typeof src.faq === 'object' ? src.faq : {};
  const appMobileSrc = src.appMobile && typeof src.appMobile === 'object' ? src.appMobile : {};
  const blogSrc = src.blog && typeof src.blog === 'object' ? src.blog : {};
  const galeriaSrc = src.galeria && typeof src.galeria === 'object' ? src.galeria : {};
  const fotosInicioSrc = src.fotosInicio && typeof src.fotosInicio === 'object' ? src.fotosInicio : {};
  const publicidadInicioSrc =
    src.publicidadInicio && typeof src.publicidadInicio === 'object' ? src.publicidadInicio : {};
  const fundSrc = src.fundacion && typeof src.fundacion === 'object' ? src.fundacion : {};
  const fundD = d.fundacion || {};
  const acercaSrc = src.acerca && typeof src.acerca === 'object' ? src.acerca : {};
  const acercaD = d.acerca || {};
  const popupSrc = src.popup && typeof src.popup === 'object' ? src.popup : {};
  const consultaCertSrc =
    src.consultaCertificados && typeof src.consultaCertificados === 'object'
      ? src.consultaCertificados
      : {};

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
    metaDescription: str(src.metaDescription, d.metaDescription),
    metaKeywords: str(src.metaKeywords, d.metaKeywords),
    hero: {
      ctaPrincipal: str(heroSrc.ctaPrincipal, d.hero.ctaPrincipal),
      ctaPrincipalUrl: str(heroSrc.ctaPrincipalUrl, d.hero.ctaPrincipalUrl),
      ctaSecundario: str(heroSrc.ctaSecundario, d.hero.ctaSecundario),
      ctaSecundarioUrl: str(heroSrc.ctaSecundarioUrl, d.hero.ctaSecundarioUrl),
      ctaLlamarUrl: str(heroSrc.ctaLlamarUrl, d.hero.ctaLlamarUrl),
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
      fundacion: str(navSrc.fundacion, d.nav.fundacion),
      consultaCertificados: str(navSrc.consultaCertificados, d.nav.consultaCertificados),
      cursosConduccion: str(navSrc.cursosConduccion, d.nav.cursosConduccion),
      galeria: str(navSrc.galeria, d.nav.galeria),
      blog: str(navSrc.blog, d.nav.blog),
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
    licencias: normalizarLicencias(licenciasSrc, d.licencias),
    examenTeorico: normalizarExamenTeorico(src.examenTeorico, d.examenTeorico),
    mercanciasPeligrosas: normalizarMercanciasPeligrosas(src.mercanciasPeligrosas, d.mercanciasPeligrosas),
    trabajoEnAlturas: normalizarTrabajoEnAlturas(src.trabajoEnAlturas, d.trabajoEnAlturas),
    servicios: {
      titulo: str(serviciosSrc.titulo, d.servicios.titulo),
      items: normalizarItemsIcono(serviciosSrc.items, d.servicios.items, ['icon', 'title', 'url']),
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
    appMobile: {
      kicker: str(appMobileSrc.kicker, d.appMobile.kicker),
      titulo: str(appMobileSrc.titulo, d.appMobile.titulo),
      lead: str(appMobileSrc.lead, d.appMobile.lead),
      features: normalizarItemsIcono(appMobileSrc.features, d.appMobile.features, [
        'icon',
        'title',
        'text',
      ]),
      btnDescargar: str(appMobileSrc.btnDescargar, d.appMobile.btnDescargar),
      notaInstalacion: str(appMobileSrc.notaInstalacion, d.appMobile.notaInstalacion),
      apkUrl: str(appMobileSrc.apkUrl, d.appMobile.apkUrl),
      apkNombre: str(appMobileSrc.apkNombre, d.appMobile.apkNombre),
    },
    blog: {
      kicker: str(blogSrc.kicker, d.blog.kicker),
      titulo: str(blogSrc.titulo, d.blog.titulo),
      lead: str(blogSrc.lead, d.blog.lead),
      emptyTitulo: str(blogSrc.emptyTitulo, d.blog.emptyTitulo),
      emptyTexto: str(blogSrc.emptyTexto, d.blog.emptyTexto),
    },
    galeria: normalizarGaleria(galeriaSrc),
    fotosInicio: normalizarFotosInicio(fotosInicioSrc),
    publicidadInicio: normalizarPublicidad(publicidadInicioSrc),
    pilares: {
      tabCapacitacion: str(pilaresSrc.tabCapacitacion, d.pilares.tabCapacitacion),
      tabCampanas: str(pilaresSrc.tabCampanas, d.pilares.tabCampanas),
      capacitacion: cap.length ? cap : [...d.pilares.capacitacion],
      campanas: camp.length ? camp : [...d.pilares.campanas],
    },
    footerServicios: footer.length ? footer : [...d.footerServicios],
    fundacion: normalizarFundacion(fundSrc, fundD),
    acerca: normalizarAcerca(acercaSrc, acercaD),
    cursosConduccion: normalizarCursosConduccion(src.cursosConduccion),
    popup: normalizarPopup(popupSrc),
    consultaCertificados: normalizarConsultaCertificados(consultaCertSrc),
    asistente: normalizarAsistente(src.asistente, consultaCertSrc),
  };
}

function normalizarGaleria(src) {
  const d = GALERIA_DEFAULTS;
  const raw = src && typeof src === 'object' ? src : {};
  const fotosRaw = Array.isArray(raw.fotos) ? raw.fotos : [];
  const fotos = fotosRaw
    .map((item, i) => {
      if (!item || typeof item !== 'object') return null;
      const url = str(item.url);
      if (!url) return null;
      const ext = path.extname(url).toLowerCase();
      const tipo =
        item.tipo === 'video' || ext === '.mp4' || ext === '.webm' ? 'video' : 'imagen';
      return {
        id: str(item.id, `galeria_${i}_${Date.now()}`),
        url,
        urlAbsoluta: publicUploadUrl(url) || url,
        leyenda: str(item.leyenda),
        tipo,
        orden: Number.isFinite(Number(item.orden)) ? Number(item.orden) : i,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.orden - b.orden);

  const fotosSanas = sanearGaleriaFotos(fotos, { soloExistentes: true });

  return {
    kicker: str(raw.kicker, d.kicker),
    titulo: str(raw.titulo, d.titulo),
    lead: str(raw.lead, d.lead),
    emptyTitulo: str(raw.emptyTitulo, d.emptyTitulo),
    emptyTexto: str(raw.emptyTexto, d.emptyTexto),
    fotos: fotosSanas,
  };
}

function normalizarFotosInicio(src) {
  const d = FOTOS_INICIO_DEFAULTS;
  const raw = src && typeof src === 'object' ? src : {};
  const fotosRaw = Array.isArray(raw.fotos) ? raw.fotos : [];
  const fotos = fotosRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const url = str(item.url);
      if (!url) return null;
      return {
        url,
        urlAbsoluta: publicUploadUrl(url) || url,
        leyenda: str(item.leyenda),
      };
    })
    .filter(Boolean)
    .slice(0, MAX_FOTOS_INICIO);

  return {
    kicker: str(raw.kicker, d.kicker),
    titulo: str(raw.titulo, d.titulo),
    lead: str(raw.lead, d.lead),
    fotos,
  };
}

function normalizarInvitacion(src) {
  const d = CURSOS_CONDUCCION_DEFAULTS.invitacion;
  const raw = src && typeof src === 'object' ? src : {};
  const beneficiosSrc = Array.isArray(raw.beneficios) ? raw.beneficios : [];
  const beneficios = beneficiosSrc.length
    ? beneficiosSrc.map((item, i) => {
        const fb = d.beneficios[i] || { icon: '✦', titulo: '', texto: '' };
        return {
          icon: str(item?.icon, fb.icon),
          titulo: str(item?.titulo, fb.titulo),
          texto: str(item?.texto, fb.texto),
        };
      })
    : d.beneficios.map((b) => ({ ...b }));
  return {
    kicker: str(raw.kicker, d.kicker),
    titulo: str(raw.titulo, d.titulo),
    lead: str(raw.lead, d.lead),
    institucion: str(raw.institucion, d.institucion),
    beneficios,
    destacado: str(raw.destacado, d.destacado),
    cierre: str(raw.cierre, d.cierre),
    firma: str(raw.firma, d.firma),
    btnCursos: str(raw.btnCursos, d.btnCursos),
    btnRegistro: str(raw.btnRegistro, d.btnRegistro),
  };
}

function normalizarPublicidad(raw) {
  const d = { activo: true, intervaloSegundos: 5, slides: [] };
  const src = raw && typeof raw === 'object' ? raw : {};
  const slidesSrc = Array.isArray(src.slides) ? src.slides : [];
  const slides = slidesSrc
    .map((item) => {
      const url = str(item?.url);
      if (!url) return null;
      return {
        url,
        urlAbsoluta: publicUploadUrl(url) || url,
        alt: str(item?.alt, 'Publicidad'),
        enlace: str(item?.enlace),
      };
    })
    .filter(Boolean);
  return {
    activo: src.activo !== false,
    intervaloSegundos: Math.max(3, Number(src.intervaloSegundos) || d.intervaloSegundos),
    slides,
  };
}

function normalizarCursosConduccion(src) {
  const d = CURSOS_CONDUCCION_DEFAULTS;
  const raw = src && typeof src === 'object' ? src : {};
  const resolucionesSrc = Array.isArray(raw.resoluciones) ? raw.resoluciones : [];
  const resoluciones = resolucionesSrc.length
    ? resolucionesSrc.map((item, i) => {
        const fb = d.resoluciones[i] || { titulo: '', archivoUrl: '', nombreArchivo: '' };
        const archivoUrl = str(item?.archivoUrl, fb.archivoUrl);
        return {
          titulo: str(item?.titulo, fb.titulo),
          archivoUrl,
          archivoUrlAbsoluta: archivoUrl ? publicUploadUrl(archivoUrl) || archivoUrl : '',
          nombreArchivo: str(item?.nombreArchivo, fb.nombreArchivo),
        };
      })
    : d.resoluciones.map((r) => ({
        ...r,
        archivoUrlAbsoluta: r.archivoUrl ? publicUploadUrl(r.archivoUrl) || r.archivoUrl : '',
      }));

  let licenciasSrc = raw.licencias && typeof raw.licencias === 'object' ? raw.licencias : null;
  if (!licenciasSrc?.items?.length) {
    const categoriasSrc = Array.isArray(raw.categorias) ? raw.categorias : [];
    if (categoriasSrc.length) {
      const iconMap = { a2: '🏍️', b1: '🚗', c1: '🚌', c2: '🚛', c3: '🚛' };
      licenciasSrc = {
        kicker: str(raw.etiquetaCategorias, d.licencias.kicker),
        titulo: 'Categorías de licencia',
        lead: str(raw.textoIntroCategorias, d.licencias.lead),
        items: categoriasSrc.map((item, i) => {
          const fb = d.licencias.items[i] || d.licencias.items[0] || {};
          const cod = str(item?.codigo, fb.codigo).toUpperCase();
          const desc = str(item?.descripcion);
          const incluye = desc ? [desc, ...(fb.incluye || []).slice(1)] : fb.incluye;
          return {
            icon: iconMap[str(item?.codigo).toLowerCase()] || fb.icon,
            codigo: cod,
            titulo: str(item?.titulo, fb.titulo),
            incluye: incluye.length ? incluye : [...(fb.incluye || [])],
            licenciaLabel: fb.licenciaLabel || `Licencia ${cod}`,
            valor: fb.valor,
            btnTexto: fb.btnTexto,
            btnUrl: fb.btnUrl,
            destacada: fb.destacada === true,
          };
        }),
      };
    }
  }

  return {
    hero: (() => {
      const heroSrc = raw.hero && typeof raw.hero === 'object' ? raw.hero : {};
      const imagenUrl = str(heroSrc.imagenUrl, d.hero.imagenUrl);
      return {
        kicker: str(heroSrc.kicker, d.hero.kicker),
        imagenUrl,
        imagenUrlAbsoluta: (() => {
          if (!imagenUrl || imagenUrl.startsWith('/images/')) return '';
          return publicUploadUrl(imagenUrl) || imagenUrl;
        })(),
        imagenAlt: str(heroSrc.imagenAlt, d.hero.imagenAlt),
      };
    })(),
    tituloPrincipal: str(raw.tituloPrincipal, d.tituloPrincipal),
    textoInstitucional: str(raw.textoInstitucional, d.textoInstitucional),
    invitacion: normalizarInvitacion(raw.invitacion),
    resoluciones,
    licencias: normalizarLicencias(licenciasSrc || {}, d.licencias),
    publicidad: normalizarPublicidad(raw.publicidad),
  };
}

function normalizarAcerca(src, d) {
  const heroSrc = src.hero && typeof src.hero === 'object' ? src.hero : {};
  const imagenUrl = str(heroSrc.imagenUrl, d.hero?.imagenUrl);
  return {
    hero: {
      kicker: str(heroSrc.kicker, d.hero?.kicker),
      lead: str(heroSrc.lead, d.hero?.lead),
      imagenUrl,
      imagenUrlAbsoluta: (() => {
        if (!imagenUrl || imagenUrl.startsWith('/images/')) return '';
        return publicUploadUrl(imagenUrl) || imagenUrl;
      })(),
      imagenAlt: str(heroSrc.imagenAlt, d.hero?.imagenAlt),
      imagenCaption: str(heroSrc.imagenCaption, d.hero?.imagenCaption),
    },
  };
}

function normalizarFundacion(src, d) {
  const heroSrc = src.hero && typeof src.hero === 'object' ? src.hero : {};
  const quienesSrc = src.quienes && typeof src.quienes === 'object' ? src.quienes : {};
  const compromisoSrc = src.compromiso && typeof src.compromiso === 'object' ? src.compromiso : {};
  const lineasSrc = src.lineas && typeof src.lineas === 'object' ? src.lineas : {};
  const ctaSrc = src.cta && typeof src.cta === 'object' ? src.cta : {};
  const contactoSrc = src.contacto && typeof src.contacto === 'object' ? src.contacto : {};

  return {
    hero: {
      kicker: str(heroSrc.kicker, d.hero?.kicker),
      titulo: str(heroSrc.titulo, d.hero?.titulo),
      lead: str(heroSrc.lead, d.hero?.lead),
      imagenUrl: str(heroSrc.imagenUrl, d.hero?.imagenUrl),
      imagenUrlAbsoluta: (() => {
        const rel = str(heroSrc.imagenUrl, d.hero?.imagenUrl);
        if (!rel || rel.startsWith('/images/')) return '';
        return publicUploadUrl(rel) || rel;
      })(),
      imagenAlt: str(heroSrc.imagenAlt, d.hero?.imagenAlt),
      imagenCaption: str(heroSrc.imagenCaption, d.hero?.imagenCaption),
      btnSitioUrl: str(heroSrc.btnSitioUrl, d.hero?.btnSitioUrl),
      btnSitioLabel: str(heroSrc.btnSitioLabel, d.hero?.btnSitioLabel),
      btnCursosLabel: str(heroSrc.btnCursosLabel, d.hero?.btnCursosLabel),
    },
    quienes: {
      kicker: str(quienesSrc.kicker, d.quienes?.kicker),
      titulo: str(quienesSrc.titulo, d.quienes?.titulo),
      lead: str(quienesSrc.lead, d.quienes?.lead),
      destacados: normalizarItemsIcono(quienesSrc.destacados, d.quienes?.destacados || [], [
        'icon',
        'label',
        'text',
      ]),
      bloques: normalizarItemsIcono(quienesSrc.bloques, d.quienes?.bloques || [], [
        'icon',
        'titulo',
        'texto',
      ]),
      enlaceUrl: str(quienesSrc.enlaceUrl, d.quienes?.enlaceUrl),
      enlaceLabel: str(quienesSrc.enlaceLabel, d.quienes?.enlaceLabel),
    },
    mision: str(src.mision, d.mision),
    vision: str(src.vision, d.vision),
    compromiso: {
      kicker: str(compromisoSrc.kicker, d.compromiso?.kicker),
      titulo: str(compromisoSrc.titulo, d.compromiso?.titulo),
      texto: str(compromisoSrc.texto, d.compromiso?.texto),
    },
    lineas: {
      kicker: str(lineasSrc.kicker, d.lineas?.kicker),
      titulo: str(lineasSrc.titulo, d.lineas?.titulo),
      lead: str(lineasSrc.lead, d.lineas?.lead),
      items: normalizarItemsIcono(lineasSrc.items, d.lineas?.items || [], ['icon', 'title', 'text']),
    },
    cta: {
      kicker: str(ctaSrc.kicker, d.cta?.kicker),
      titulo: str(ctaSrc.titulo, d.cta?.titulo),
      texto: str(ctaSrc.texto, d.cta?.texto),
      btnRegistro: str(ctaSrc.btnRegistro, d.cta?.btnRegistro),
      btnServicios: str(ctaSrc.btnServicios, d.cta?.btnServicios),
    },
    contacto: {
      kicker: str(contactoSrc.kicker, d.contacto?.kicker),
      titulo: str(contactoSrc.titulo, d.contacto?.titulo),
      lead: str(contactoSrc.lead, d.contacto?.lead),
      sedeNota: str(contactoSrc.sedeNota, d.contacto?.sedeNota),
    },
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
