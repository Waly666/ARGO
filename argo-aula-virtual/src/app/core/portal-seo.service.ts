import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import {
  finstruvialServicioPublicRoute,
  FinstruvialServicioSlug,
} from './constants/finstruvial-servicios.constants';
import { mergeFinstruvialServicios } from './constants/finstruvial-servicios-defaults';
import { mergePortafolioServicios, portafolioServiciosEsServial } from './portafolio-servicios.util';
import { mergeCursosConduccionLanding } from '../pages/cursos-conduccion/cursos-conduccion-content';
import {
  DEFAULT_CEA_CORTO,
  DEFAULT_CEA_NOMBRE,
} from './portal-brand-defaults';
import {
  ACERCA_SEO_DESCRIPTION,
  ACERCA_SEO_TITLE,
  AULA_SEO_TITLE,
  CONSULTA_CERT_SEO_DESCRIPTION,
  CONSULTA_CERT_SEO_KEYWORDS,
  CONSULTA_CERT_SEO_TITLE,
  BLOG_SEO_DESCRIPTION,
  BLOG_SEO_KEYWORDS,
  BLOG_SEO_TITLE,
  CURSOS_SEO_DESCRIPTION,
  CURSOS_SEO_TITLE,
  FUNDACION_SEO_DESCRIPTION,
  FUNDACION_SEO_KEYWORDS,
  FUNDACION_SEO_TITLE,
  LOGIN_SEO_TITLE,
  PORTAL_SEO_KEYWORDS,
  REGISTRO_SEO_TITLE,
  SEO_BRAND,
  SEO_LOCALITY,
  SEO_REGION,
  TIENDA_SEO_DESCRIPTION,
  TIENDA_SEO_TITLE,
} from './portal-seo-defaults';
import { CursoVirtual, PortalConfig } from './models';
import { resolvePortalSeoPage, PortalSeoPageKey, finstruvialServicioSeoKey } from './portal-seo-resolver.util';

type PageMetaOpts = {
  pageTitle: string;
  description: string;
  keywords?: string;
  url: string;
  image: string;
  siteName?: string;
  robots?: string;
  themeColor?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
};

@Injectable({ providedIn: 'root' })
export class PortalSeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  applyHome(config: PortalConfig | null, cursos: CursoVirtual[] = []) {
    const nombre = this.orgName(config);
    const landing = config?.landing;
    const fallbackTitle = `Cursos virtuales en seguridad vial | ${SEO_BRAND} — ${SEO_LOCALITY}, ${SEO_REGION}`;
    const fallbackDescription = this.truncate(
      landing?.metaDescription?.trim() || this.buildDescription(config, cursos),
    );
    const fallbackKeywords = landing?.metaKeywords?.trim() || this.buildKeywords(cursos);
    const seo = this.resolvedSeo(config, 'home', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: fallbackKeywords,
    });
    const url = this.pageUrl('/');
    const image = this.defaultImage(config);

    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image,
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.buildHomeJsonLd(config, cursos, url, nombre, seo.description),
    });
  }

  applyCursos(config: PortalConfig | null, modo: 'cursos' | 'tienda' = 'cursos') {
    const isTienda = modo === 'tienda';
    const key: PortalSeoPageKey = isTienda ? 'tienda' : 'cursos';
    const url = this.pageUrl(isTienda ? '/tienda' : '/cursos');
    const seo = this.resolvedSeo(config, key, {
      pageTitle: isTienda ? TIENDA_SEO_TITLE : CURSOS_SEO_TITLE,
      description: this.truncate(isTienda ? TIENDA_SEO_DESCRIPTION : CURSOS_SEO_DESCRIPTION),
      keywords: PORTAL_SEO_KEYWORDS,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: isTienda ? 'Tienda' : 'Cursos', path: isTienda ? '/tienda' : '/cursos' },
      ]),
    });
  }

  applyCursoDetalle(config: PortalConfig | null, curso: CursoVirtual) {
    const nombre = curso.nombreProg?.trim() || 'Curso virtual';
    const pageTitle = `${nombre} | ${SEO_BRAND} — ${SEO_LOCALITY}`;
    const rawDesc =
      curso.descripcionVirtual?.trim() ||
      curso.descripcion?.trim() ||
      `Programa virtual de ${nombre} en seguridad vial. Matricúlese en ${DEFAULT_CEA_CORTO}, Villavicencio, Meta.`;
    const url = this.pageUrl(`/cursos/${curso.idPrograma}`);
    const image = curso.urlPortadaAbsoluta || curso.urlPortadaVirtual || this.defaultImage(config);
    const keywords = [nombre, SEO_BRAND, `curso virtual ${SEO_LOCALITY}`, PORTAL_SEO_KEYWORDS]
      .filter(Boolean)
      .join(', ');

    this.applyPageMeta({
      pageTitle: this.truncateTitle(pageTitle),
      description: this.truncate(rawDesc),
      keywords,
      url,
      image,
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: 'Cursos', path: '/cursos' },
          { name: nombre, path: `/cursos/${curso.idPrograma}` },
        ]),
        {
          '@type': 'Course',
          name: nombre,
          description: this.truncate(rawDesc, 300),
          provider: { '@type': 'EducationalOrganization', name: this.orgName(config) },
          url,
          image,
          inLanguage: 'es-CO',
          offers:
            curso.tarifaVirtual > 0
              ? {
                  '@type': 'Offer',
                  price: curso.tarifaVirtual,
                  priceCurrency: 'COP',
                  availability: 'https://schema.org/InStock',
                }
              : undefined,
        },
      ],
    });
  }

  applyAcerca(config: PortalConfig | null) {
    const url = this.pageUrl('/acerca');
    const seo = this.resolvedSeo(config, 'acerca', {
      pageTitle: ACERCA_SEO_TITLE,
      description: this.truncate(ACERCA_SEO_DESCRIPTION),
      keywords: PORTAL_SEO_KEYWORDS,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: 'Acerca de', path: '/acerca' },
      ]),
    });
  }

  applyConsultaCertificados(config: PortalConfig | null) {
    const url = this.pageUrl('/consulta-certificados');
    const seo = this.resolvedSeo(config, 'consultaCertificados', {
      pageTitle: CONSULTA_CERT_SEO_TITLE,
      description: this.truncate(CONSULTA_CERT_SEO_DESCRIPTION),
      keywords: CONSULTA_CERT_SEO_KEYWORDS,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: 'Consulta certificados', path: '/consulta-certificados' },
        ]),
        {
          '@type': 'WebPage',
          name: seo.pageTitle,
          description: this.truncate(seo.description),
          url,
          isPartOf: { '@type': 'WebSite', name: `${SEO_BRAND} — Aula virtual`, url: this.pageUrl('/') },
        },
      ],
    });
  }

  applyBlog(config: PortalConfig | null) {
    const landing = config?.landing;
    const fallbackTitle = landing?.blog?.titulo
      ? `${landing.blog.titulo} | ${SEO_BRAND}`
      : BLOG_SEO_TITLE;
    const fallbackDescription = this.truncate(landing?.blog?.lead?.trim() || BLOG_SEO_DESCRIPTION);
    const url = this.pageUrl('/blog');
    const seo = this.resolvedSeo(config, 'blog', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: BLOG_SEO_KEYWORDS,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: landing?.blog?.titulo || 'Blog', path: '/blog' },
      ]),
    });
  }

  applyGaleria(config: PortalConfig | null) {
    const landing = config?.landing;
    const titulo = landing?.galeria?.titulo?.trim() || 'Galería de fotos';
    const fallbackTitle = `${titulo} | ${SEO_BRAND}`;
    const fallbackDescription = this.truncate(
      landing?.galeria?.lead?.trim() || 'Fotos y videos de nuestras actividades de formación y eventos.',
    );
    const url = this.pageUrl('/galeria');
    const seo = this.resolvedSeo(config, 'galeria', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: PORTAL_SEO_KEYWORDS,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: titulo, path: '/galeria' },
      ]),
    });
  }

  applyCursosConduccion(config: PortalConfig | null) {
    const cc = mergeCursosConduccionLanding(config?.landing?.cursosConduccion);
    const esServial = portafolioServiciosEsServial(config?.site?.tema);
    const h1 = cc.tituloPrincipal?.trim() || 'Cursos de Conducción en Villavicencio';
    const fallbackTitle = esServial
      ? 'Cursos de Conducción en Villavicencio | SERVIAL Colombia'
      : `${h1} | ${SEO_BRAND}`;
    const fallbackDescription = this.truncate(
      cc.textoInstitucional?.trim() ||
        'Categorías de licencia de conducción y formación teórica, práctica y de taller en el Centro de Enseñanza Automovilística.',
    );
    const fallbackKeywords = esServial
      ? 'curso de conducción Villavicencio, cursos de conducción Villavicencio, escuela de conducción Villavicencio, CEA Villavicencio, curso A2 Villavicencio, curso B2 Villavicencio, curso C1 Villavicencio, curso C2 Villavicencio, curso C3 Villavicencio, licencia de conducción Villavicencio, SERVIAL Colombia'
      : `${BLOG_SEO_KEYWORDS}, cursos conducción, licencia conducción, categorías licencia`;
    const url = this.pageUrl('/cursos-conduccion');
    const heroUrl = cc.hero.imagenUrlAbsoluta?.trim() || cc.hero.imagenUrl?.trim() || '';
    const image = heroUrl || this.defaultImage(config);
    const seo = this.resolvedSeo(config, 'cursosConduccion', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: fallbackKeywords,
    });
    const faqs = Array.isArray(cc.faq) ? cc.faq.filter((f) => f.pregunta?.trim() && f.respuesta?.trim()) : [];
    const categorias = cc.licencias?.items?.filter((i) => i.titulo?.trim()) || [];
    const org = this.orgName(config);
    const jsonLd: Record<string, unknown>[] = [
      ...this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: 'Cursos de conducción', path: '/cursos-conduccion' },
      ]),
    ];
    if (esServial) {
      jsonLd.push(
        {
          '@type': 'EducationalOrganization',
          name: org,
          url: this.pageUrl('/'),
          telephone: cc.localTelefono?.trim() || config?.telefono?.trim() || undefined,
          address: this.postalAddress(config),
        },
        {
          '@type': 'LocalBusiness',
          name: org,
          url,
          telephone: cc.localTelefono?.trim() || config?.telefono?.trim() || undefined,
          address: this.postalAddress(config),
          areaServed: [
            { '@type': 'City', name: SEO_LOCALITY },
            { '@type': 'AdministrativeArea', name: SEO_REGION },
            { '@type': 'Country', name: 'Colombia' },
          ],
        },
      );
      if (categorias.length) {
        jsonLd.push({
          '@type': 'ItemList',
          name: cc.licencias.titulo || 'Cursos de Conducción Disponibles',
          itemListElement: categorias.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.titulo,
            url: this.pageUrl('/cursos-conduccion'),
          })),
        });
      }
      if (faqs.length) {
        jsonLd.push({
          '@type': 'FAQPage',
          mainEntity: faqs.map((item) => ({
            '@type': 'Question',
            name: item.pregunta,
            acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
          })),
        });
      }
    }
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image,
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd,
    });
  }

  applyExamenTeorico(config: PortalConfig | null) {
    const et = config?.landing?.examenTeorico;
    const titulo = [et?.titulo, et?.tituloLinea2].filter(Boolean).join(' — ') || 'Examen teórico';
    const fallbackTitle = `${titulo} | ${SEO_BRAND}`;
    const fallbackDescription = this.truncate(
      et?.paginaIntro?.trim() ||
        et?.fechaDestacada?.trim() ||
        'Información sobre el examen teórico obligatorio para obtener o recategorizar la licencia de conducción.',
    );
    const url = this.pageUrl('/examen-teorico');
    const seo = this.resolvedSeo(config, 'examenTeorico', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: `${BLOG_SEO_KEYWORDS}, examen teórico, licencia conducción, normatividad tránsito, RUNT, CALE`,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: 'Examen teórico', path: '/examen-teorico' },
      ]),
    });
  }

  applyMercanciasPeligrosas(config: PortalConfig | null) {
    const mp = config?.landing?.mercanciasPeligrosas;
    const h1 =
      [mp?.titulo, mp?.tituloLinea2].filter(Boolean).join(' ').trim() ||
      'Curso de Mercancías Peligrosas en Villavicencio, Meta';
    const fallbackTitle = 'Curso Mercancías Peligrosas Villavicencio | SERVIAL';
    const fallbackDescription =
      mp?.heroLead?.trim() ||
      'Curso de mercancías peligrosas en Villavicencio, Meta. Capacitación para conductores y empresas con SERVIAL Colombia. Atención en los Llanos Orientales.';
    const url = this.pageUrl('/mercancias-peligrosas');
    const hero = mp?.imagenes?.find((img) => img.id === 'hero');
    const heroUrl = hero?.urlAbsoluta?.trim() || hero?.url?.trim() || '';
    const image = heroUrl || this.defaultImage(config);
    const seo = this.resolvedSeo(config, 'mercanciasPeligrosas', {
      pageTitle: fallbackTitle,
      description: this.truncate(fallbackDescription),
      keywords: '',
    });
    const faqs = Array.isArray(mp?.faq) ? mp.faq.filter((f) => f.pregunta?.trim() && f.respuesta?.trim()) : [];
    const org = this.orgName(config);
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image,
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: 'Cursos', path: '/cursos' },
          { name: h1, path: '/mercancias-peligrosas' },
        ]),
        {
          '@type': 'Course',
          name: h1,
          description: this.truncate(seo.description, 300),
          provider: { '@type': 'EducationalOrganization', name: org },
          url,
          image,
          inLanguage: 'es-CO',
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: ['online', 'onsite'],
            location: {
              '@type': 'Place',
              name: 'Villavicencio, Meta, Colombia',
              address: this.postalAddress(config),
            },
          },
        },
        {
          '@type': 'LocalBusiness',
          name: org,
          url,
          telephone: config?.telefono?.trim() || mp?.localTelefono?.trim() || undefined,
          address: this.postalAddress(config),
          areaServed: [
            { '@type': 'City', name: SEO_LOCALITY },
            { '@type': 'AdministrativeArea', name: SEO_REGION },
            { '@type': 'Country', name: 'Colombia' },
          ],
        },
        ...(faqs.length
          ? [
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((item) => ({
                  '@type': 'Question',
                  name: item.pregunta,
                  acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
                })),
              },
            ]
          : []),
      ],
    });
  }

  applyTrabajoEnAlturas(config: PortalConfig | null) {
    const ta = config?.landing?.trabajoEnAlturas;
    const h1 =
      [ta?.titulo, ta?.tituloLinea2].filter(Boolean).join(' ').trim() ||
      'Curso de Trabajo Seguro en Alturas en Villavicencio, Meta';
    const fallbackTitle = 'Curso de Trabajo en Alturas en Villavicencio | SERVIAL Colombia';
    const fallbackDescription =
      ta?.heroLead?.trim() ||
      'Curso de trabajo seguro en alturas en Villavicencio, Meta. Capacitación para trabajadores y empresas con SERVIAL Colombia, conforme a la normativa vigente. Atención en los Llanos Orientales.';
    const fallbackKeywords =
      'curso trabajo en alturas Villavicencio, trabajo seguro en alturas Villavicencio, curso de alturas Meta, capacitación trabajo en alturas Colombia, curso trabajador autorizado alturas, reentrenamiento trabajo en alturas, curso coordinador trabajo en alturas, Resolución 4272 de 2021, capacitación alturas Llanos Orientales, SERVIAL Colombia';
    const url = this.pageUrl('/trabajo-en-alturas');
    const hero = ta?.imagenes?.find((img) => img.id === 'hero');
    const heroUrl = hero?.urlAbsoluta?.trim() || hero?.url?.trim() || '';
    const image = heroUrl || this.defaultImage(config);
    const seo = this.resolvedSeo(config, 'trabajoEnAlturas', {
      pageTitle: fallbackTitle,
      description: this.truncate(fallbackDescription),
      keywords: fallbackKeywords,
    });
    const faqs = Array.isArray(ta?.faq) ? ta.faq.filter((f) => f.pregunta?.trim() && f.respuesta?.trim()) : [];
    const org = this.orgName(config);
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image,
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: 'Cursos', path: '/cursos' },
          { name: h1, path: '/trabajo-en-alturas' },
        ]),
        {
          '@type': 'Course',
          name: h1,
          description: this.truncate(seo.description, 300),
          provider: { '@type': 'EducationalOrganization', name: org },
          url,
          image,
          inLanguage: 'es-CO',
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: ['online', 'onsite'],
            location: {
              '@type': 'Place',
              name: 'Villavicencio, Meta, Colombia',
              address: this.postalAddress(config),
            },
          },
        },
        {
          '@type': 'LocalBusiness',
          name: org,
          url,
          telephone: config?.telefono?.trim() || undefined,
          address: this.postalAddress(config),
          areaServed: [
            { '@type': 'City', name: SEO_LOCALITY },
            { '@type': 'AdministrativeArea', name: SEO_REGION },
            { '@type': 'Country', name: 'Colombia' },
          ],
        },
        ...(faqs.length
          ? [
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((item) => ({
                  '@type': 'Question',
                  name: item.pregunta,
                  acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
                })),
              },
            ]
          : []),
      ],
    });
  }

  applyManejoDefensivo(config: PortalConfig | null) {
    const md = config?.landing?.manejoDefensivo;
    const fallbackTitle =
      'Curso de Manejo Defensivo Virtual y Presencial | Meta y Colombia';
    const fallbackDescription =
      md?.heroLead?.trim() ||
      'Curso de Manejo Defensivo virtual y presencial para conductores y empresas. Formación práctica en seguridad vial en Villavicencio, Meta, Llanos Orientales y Colombia.';
    const url = this.pageUrl('/curso-manejo-defensivo');
    const hero = md?.imagenes?.find((img) => img.id === 'hero');
    const heroUrl = hero?.urlAbsoluta?.trim() || hero?.url?.trim() || '';
    const image = heroUrl || this.defaultImage(config);
    const seo = this.resolvedSeo(config, 'manejoDefensivo', {
      pageTitle: fallbackTitle,
      description: this.truncate(fallbackDescription),
      keywords: '',
    });
    const faqs = Array.isArray(md?.faq) ? md.faq.filter((f) => f.pregunta?.trim() && f.respuesta?.trim()) : [];
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image,
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: 'Cursos', path: '/cursos' },
          { name: md?.h1?.trim() || 'Curso de Manejo Defensivo', path: '/curso-manejo-defensivo' },
        ]),
        {
          '@type': 'Course',
          name: md?.h1?.trim() || 'Curso de Manejo Defensivo Virtual y Presencial',
          description: this.truncate(seo.description, 300),
          provider: { '@type': 'EducationalOrganization', name: this.orgName(config) },
          url,
          image,
          inLanguage: 'es-CO',
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: ['online', 'onsite'],
            location: {
              '@type': 'Place',
              name: 'Villavicencio, Meta, Colombia',
              address: this.postalAddress(config),
            },
          },
        },
        ...(faqs.length
          ? [
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((item) => ({
                  '@type': 'Question',
                  name: item.pregunta,
                  acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
                })),
              },
            ]
          : []),
      ],
    });
  }

  applyPrimerosAuxilios(config: PortalConfig | null) {
    const pa = config?.landing?.primerosAuxilios;
    const fallbackTitle = 'Curso de Primeros Auxilios en Villavicencio | Virtual y Presencial';
    const fallbackDescription =
      pa?.heroLead?.trim() ||
      'Curso de Primeros Auxilios virtual y presencial en Villavicencio, Meta y Colombia. Formación en RCP, trauma y atención inicial de emergencias para personas y empresas.';
    const url = this.pageUrl('/curso-primeros-auxilios');
    const hero = pa?.imagenes?.find((img) => img.id === 'hero');
    const heroUrl = hero?.urlAbsoluta?.trim() || hero?.url?.trim() || '';
    const image = heroUrl || this.defaultImage(config);
    const seo = this.resolvedSeo(config, 'primerosAuxilios', {
      pageTitle: fallbackTitle,
      description: this.truncate(fallbackDescription),
      keywords: '',
    });
    const faqs = Array.isArray(pa?.faq) ? pa.faq.filter((f) => f.pregunta?.trim() && f.respuesta?.trim()) : [];
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image,
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: 'Cursos', path: '/cursos' },
          { name: pa?.h1?.trim() || 'Curso de Primeros Auxilios', path: '/curso-primeros-auxilios' },
        ]),
        {
          '@type': 'Course',
          name: pa?.h1?.trim() || 'Curso de Primeros Auxilios Virtual y Presencial',
          description: this.truncate(seo.description, 300),
          provider: { '@type': 'EducationalOrganization', name: this.orgName(config) },
          url,
          image,
          inLanguage: 'es-CO',
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: ['online', 'onsite'],
            location: {
              '@type': 'Place',
              name: 'Villavicencio, Meta, Colombia',
              address: this.postalAddress(config),
            },
          },
        },
        ...(faqs.length
          ? [
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((item) => ({
                  '@type': 'Question',
                  name: item.pregunta,
                  acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
                })),
              },
            ]
          : []),
      ],
    });
  }

  applyServiciosHub(config: PortalConfig | null) {
    const esServial = portafolioServiciosEsServial(config?.site?.tema);
    const servicios = mergePortafolioServicios(config?.landing?.finstruvialServicios, config?.site?.tema);
    const hub = servicios.hub;
    const h1 = [hub.tituloLinea, hub.tituloAcento].filter(Boolean).join(' ').trim() || 'Servicios';
    const fallbackTitle = esServial
      ? 'Servicios de Capacitación en Villavicencio | SERVIAL Colombia'
      : `${h1} | ${SEO_BRAND}`;
    const fallbackDescription = esServial
      ? 'Conoce los servicios y cursos de SERVIAL Colombia en Villavicencio, Meta: conducción, seguridad vial, transporte y formación especializada para personas y empresas.'
      : this.truncate(
          hub.lead?.trim() ||
            'Consultoría, estudios técnicos, planeación vial, tecnología y formación en tránsito, transporte y seguridad vial.',
        );
    const fallbackKeywords = esServial
      ? 'servicios SERVIAL Villavicencio, cursos en Villavicencio, capacitaciones en Villavicencio, capacitación empresarial Villavicencio, cursos de seguridad vial Villavicencio, formación para conductores Villavicencio, SERVIAL Colombia'
      : `${BLOG_SEO_KEYWORDS}, servicios, consultoría vial, seguridad vial, FINSTRUVIAL`;
    const url = this.pageUrl('/servicios');
    const seo = this.resolvedSeo(config, 'serviciosHub', {
      pageTitle: fallbackTitle,
      description: this.truncate(fallbackDescription),
      keywords: fallbackKeywords,
    });
    const org = this.orgName(config);
    const tarjetas =
      hub.tarjetas?.filter((t) => t.titulo?.trim() && t.url?.trim()) ||
      [];
    const faqs = hub.faq?.filter((f) => f.pregunta?.trim() && f.respuesta?.trim()) || [];
    const jsonLd: Record<string, unknown>[] = [
      ...this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: servicios.menuLabel || 'Servicios', path: '/servicios' },
      ]),
    ];
    if (esServial) {
      jsonLd.push(
        {
          '@type': 'EducationalOrganization',
          name: org,
          url: this.pageUrl('/'),
          telephone: hub.localTelefono?.trim() || config?.telefono?.trim() || undefined,
          email: hub.localEmail?.trim() || undefined,
          address: this.postalAddress(config),
        },
        {
          '@type': 'LocalBusiness',
          name: org,
          url,
          telephone: hub.localTelefono?.trim() || config?.telefono?.trim() || undefined,
          email: hub.localEmail?.trim() || undefined,
          address: this.postalAddress(config),
          areaServed: [
            { '@type': 'City', name: SEO_LOCALITY },
            { '@type': 'AdministrativeArea', name: SEO_REGION },
            { '@type': 'Country', name: 'Colombia' },
          ],
        },
      );
      if (tarjetas.length) {
        jsonLd.push({
          '@type': 'ItemList',
          name: hub.gridTitulo || 'Cursos y servicios SERVIAL Colombia',
          itemListElement: tarjetas.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.titulo,
            url: item.url.startsWith('http') ? item.url : this.pageUrl(item.url),
          })),
        });
      }
      if (faqs.length) {
        jsonLd.push({
          '@type': 'FAQPage',
          mainEntity: faqs.map((item) => ({
            '@type': 'Question',
            name: item.pregunta,
            acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
          })),
        });
      }
    }
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd,
    });
  }

  applyServicioLinea(config: PortalConfig | null, slug: FinstruvialServicioSlug | null) {
    if (!slug) {
      this.applyServiciosHub(config);
      return;
    }
    const esServial = portafolioServiciosEsServial(config?.site?.tema);
    const servicios = mergePortafolioServicios(config?.landing?.finstruvialServicios, config?.site?.tema);
    const p = servicios.paginas[slug];
    const titulo = [p.tituloLinea, p.tituloAcento].filter(Boolean).join(' ') || p.menuLabel;
    const esAulaVirtualServial = esServial && slug === 'aulaVirtual' && Number(p.guionVersion) >= 1;
    const fallbackTitle = esAulaVirtualServial
      ? 'Aula Virtual y Cursos Online | SERVIAL Colombia'
      : `${titulo} | ${SEO_BRAND}`;
    const fallbackDescription = esAulaVirtualServial
      ? 'Acceda al Aula Virtual de SERVIAL Colombia: cursos online en seguridad vial, tránsito, transporte y formación especializada para estudiantes y empresas en todo el país.'
      : this.truncate(p.metaDescription?.trim() || p.lead?.trim() || p.introLead?.trim() || p.menuLabel);
    const fallbackKeywords = esAulaVirtualServial
      ? 'aula virtual SERVIAL, cursos virtuales SERVIAL, cursos virtuales Villavicencio, capacitación virtual Villavicencio, cursos online Colombia, cursos seguridad vial virtuales, capacitación virtual seguridad vial, cursos virtuales Meta, SERVIAL Colombia'
      : `${BLOG_SEO_KEYWORDS}, ${p.menuLabel}, seguridad vial, FINSTRUVIAL`;
    const route = finstruvialServicioPublicRoute(slug, p.routeSegment);
    const url = this.pageUrl(route);
    const seo = this.resolvedSeo(config, finstruvialServicioSeoKey(slug), {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: fallbackKeywords,
    });
    const jsonLd: Record<string, unknown>[] = [
      ...this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: servicios.menuLabel || 'Servicios', path: '/servicios' },
        { name: p.menuLabel, path: route },
      ]),
    ];
    if (esAulaVirtualServial) {
      const org = this.orgName(config);
      const catalogoItems =
        p.catalogoOverrides?.filter((item) => item.titulo?.trim() && item.url?.trim()) || [];
      jsonLd.push({
        '@type': 'EducationalOrganization',
        name: org,
        url: this.pageUrl('/'),
        telephone: config?.telefono?.trim() || undefined,
        address: this.postalAddress(config),
      });
      if (catalogoItems.length) {
        jsonLd.push({
          '@type': 'ItemList',
          name: p.bloquesTitulo || 'Cursos disponibles en el Aula Virtual',
          itemListElement: catalogoItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.titulo,
            url: item.url.startsWith('http') ? item.url : this.pageUrl(item.url),
          })),
        });
      }
      const faqs = p.faq?.filter((f) => f.pregunta?.trim() && f.respuesta?.trim()) || [];
      if (faqs.length) {
        jsonLd.push({
          '@type': 'FAQPage',
          mainEntity: faqs.map((item) => ({
            '@type': 'Question',
            name: item.pregunta,
            acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
          })),
        });
      }
    }
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd,
    });
  }

  applyPqr(config: PortalConfig | null) {
    const pqr = config?.landing?.pqr;
    const titulo =
      [pqr?.hero?.tituloLinea, pqr?.hero?.tituloAcento].filter(Boolean).join(' ') || 'PQR';
    const fallbackTitle = `${titulo} | ${SEO_BRAND}`;
    const fallbackDescription = this.truncate(
      pqr?.hero?.lead?.trim() ||
        `Canal oficial de peticiones, quejas, reclamos y sugerencias de ${this.orgName(config)}.`,
    );
    const url = this.pageUrl('/pqr');
    const seo = this.resolvedSeo(config, 'pqr', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: `${SEO_BRAND}, PQR, peticiones quejas reclamos`,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: 'PQR', path: '/pqr' },
      ]),
    });
  }

  applyJornadasCapacitacion(config: PortalConfig | null) {
    const jor = config?.landing?.jornadasCapacitacion;
    const titulo =
      [jor?.hero?.tituloLinea, jor?.hero?.tituloAcento].filter(Boolean).join(' ') ||
      'Jornadas de capacitación';
    const fallbackTitle = `${titulo} | ${SEO_BRAND}`;
    const fallbackDescription = this.truncate(
      jor?.hero?.lead?.trim() ||
        'Inscríbase a jornadas de capacitación presencial en seguridad vial con actividades experienciales.',
    );
    const url = this.pageUrl('/jornadas-capacitacion');
    const seo = this.resolvedSeo(config, 'jornadasCapacitacion', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: `${PORTAL_SEO_KEYWORDS}, jornadas capacitación, seguridad vial`,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: 'Jornadas', path: '/jornadas-capacitacion' },
      ]),
    });
  }

  applyEvaluacionJornadas(config: PortalConfig | null) {
    const ev = config?.landing?.evaluacionJornadas;
    const titulo =
      [ev?.hero?.tituloLinea, ev?.hero?.tituloAcento].filter(Boolean).join(' ') ||
      'Evaluación de jornadas';
    const fallbackTitle = `${titulo} | ${SEO_BRAND}`;
    const fallbackDescription = this.truncate(
      ev?.hero?.lead?.trim() || 'Encuesta de satisfacción y evaluación de jornadas de capacitación.',
    );
    const url = this.pageUrl('/evaluacion-jornadas');
    const seo = this.resolvedSeo(config, 'evaluacionJornadas', {
      pageTitle: fallbackTitle,
      description: fallbackDescription,
      keywords: `${PORTAL_SEO_KEYWORDS}, evaluación jornadas`,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: this.breadcrumbJsonLd(url, [
        { name: 'Inicio', path: '/' },
        { name: 'Evaluación jornadas', path: '/evaluacion-jornadas' },
      ]),
    });
  }

  applyBlogPost(
    config: PortalConfig | null,
    post: { titulo: string; slug: string; contenido?: string; autorNombre?: string; publicadoAt?: string | null },
  ) {
    const url = this.pageUrl(`/blog/${post.slug}`);
    const description = this.truncate(
      (post.contenido || '').replace(/\s+/g, ' ').trim().slice(0, 160) ||
        config?.landing?.blog?.lead ||
        BLOG_SEO_DESCRIPTION,
    );
    this.applyPageMeta({
      pageTitle: `${post.titulo} | ${SEO_BRAND}`,
      description,
      keywords: BLOG_SEO_KEYWORDS,
      url,
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: config?.landing?.blog?.titulo || 'Blog', path: '/blog' },
          { name: post.titulo, path: `/blog/${post.slug}` },
        ]),
        {
          '@type': 'BlogPosting',
          headline: post.titulo,
          description,
          url,
          datePublished: post.publicadoAt || undefined,
          author: post.autorNombre
            ? { '@type': 'Person', name: post.autorNombre }
            : { '@type': 'Organization', name: SEO_BRAND },
          publisher: { '@type': 'Organization', name: SEO_BRAND },
          isPartOf: { '@type': 'WebSite', name: `${SEO_BRAND} — Aula virtual`, url: this.pageUrl('/') },
        },
      ],
    });
  }

  applyFundacion(config: PortalConfig | null) {
    const url = this.pageUrl('/fundacion');
    const seo = this.resolvedSeo(config, 'fundacion', {
      pageTitle: FUNDACION_SEO_TITLE,
      description: this.truncate(FUNDACION_SEO_DESCRIPTION),
      keywords: FUNDACION_SEO_KEYWORDS,
    });
    this.applyPageMeta({
      pageTitle: seo.pageTitle,
      description: this.truncate(seo.description),
      keywords: seo.keywords,
      url,
      image: this.defaultImage(config, '/images/fundacion-equipo.png'),
      siteName: SEO_BRAND,
      themeColor: this.themeColor(config),
      jsonLd: [
        ...this.breadcrumbJsonLd(url, [
          { name: 'Inicio', path: '/' },
          { name: DEFAULT_CEA_CORTO, path: '/fundacion' },
        ]),
        {
          '@type': 'NGO',
          name: this.orgName(config),
          url,
          description: this.truncate(seo.description, 220),
          address: this.postalAddress(config),
          areaServed: [
            { '@type': 'City', name: SEO_LOCALITY },
            { '@type': 'AdministrativeArea', name: SEO_REGION },
            { '@type': 'Country', name: 'Colombia' },
          ],
        },
      ],
    });
  }

  applyLogin(config: PortalConfig | null) {
    this.applyPrivatePage(LOGIN_SEO_TITLE, 'Acceda a su aula virtual con correo y contraseña.', '/login', config);
  }

  applyRegistro(config: PortalConfig | null) {
    this.applyPrivatePage(
      REGISTRO_SEO_TITLE,
      `Cree su cuenta en el portal estudiantil de su ${DEFAULT_CEA_NOMBRE} para cursar programas virtuales.`,
      '/registro',
      config,
    );
  }

  applyAula(config: PortalConfig | null) {
    this.applyPrivatePage(
      AULA_SEO_TITLE,
      `Panel del estudiante: cursos, progreso y certificados del aula virtual ${DEFAULT_CEA_CORTO}.`,
      '/aula',
      config,
    );
  }

  private applyPrivatePage(
    pageTitle: string,
    description: string,
    path: string,
    config: PortalConfig | null,
  ) {
    this.applyPageMeta({
      pageTitle,
      description: this.truncate(description),
      keywords: SEO_BRAND,
      url: this.pageUrl(path),
      image: this.defaultImage(config),
      siteName: SEO_BRAND,
      robots: 'noindex, follow',
      themeColor: this.themeColor(config),
      jsonLd: null,
    });
  }

  private applyPageMeta(opts: PageMetaOpts) {
    const siteName = opts.siteName || SEO_BRAND;
    const robots = opts.robots || 'index, follow';

    this.title.setTitle(this.truncateTitle(opts.pageTitle));
    this.setMeta('description', opts.description);
    if (opts.keywords?.trim()) {
      this.setMeta('keywords', opts.keywords);
    } else {
      this.meta.removeTag('name="keywords"');
    }
    this.setMeta('robots', robots);
    this.setMeta('author', siteName);
    this.setMeta('application-name', siteName);
    this.setMeta('geo.region', 'CO-MET');
    this.setMeta('geo.placename', SEO_LOCALITY);
    this.setMeta('geo.position', '4.142;-73.626');
    this.setMeta('ICBM', '4.142, -73.626');
    this.setMeta('theme-color', opts.themeColor?.trim() || '#0b1224');

    this.setOg('og:title', this.truncateTitle(opts.pageTitle));
    this.setOg('og:description', opts.description);
    this.setOg('og:type', 'website');
    this.setOg('og:locale', 'es_CO');
    this.setOg('og:site_name', siteName);
    if (opts.url) this.setOg('og:url', opts.url);
    if (opts.image) {
      this.setOg('og:image', opts.image);
      this.setOg('og:image:alt', `${siteName} — ${SEO_LOCALITY}, ${SEO_REGION}`);
    }

    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', this.truncateTitle(opts.pageTitle));
    this.setName('twitter:description', opts.description);
    if (opts.image) this.setName('twitter:image', opts.image);

    if (opts.url) this.setCanonical(opts.url);
    this.setJsonLd(opts.jsonLd);
  }

  private resolvedSeo(
    config: PortalConfig | null,
    key: PortalSeoPageKey,
    fallback: { pageTitle: string; description: string; keywords: string },
  ) {
    const resolved = resolvePortalSeoPage(config?.site ?? null, key, {
      pageTitle: this.truncateTitle(fallback.pageTitle),
      description: fallback.description,
      keywords: fallback.keywords,
    }, config?.landing ?? null);
    return {
      pageTitle: this.truncateTitle(resolved.pageTitle),
      description: resolved.description,
      keywords: resolved.keywords,
    };
  }

  private orgName(config: PortalConfig | null): string {
    return config?.nombreCea?.trim() || DEFAULT_CEA_NOMBRE;
  }

  private themeColor(config: PortalConfig | null): string {
    return config?.site?.tema?.colorFondo?.trim() || '#0b1224';
  }

  private pageUrl(path: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin) return '';
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${clean}`;
  }

  private defaultImage(config: PortalConfig | null, fallback = '/images/hero-estudiante.png'): string {
    const logo = config?.urlLogoAbsoluta?.trim();
    if (logo) return logo;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return origin ? `${origin}${fallback}` : '';
  }

  private postalAddress(config: PortalConfig | null) {
    return {
      '@type': 'PostalAddress',
      streetAddress: config?.direccion || 'Carrera 19c #38-22',
      addressLocality: config?.ciudad?.trim() || SEO_LOCALITY,
      addressRegion: SEO_REGION,
      addressCountry: 'CO',
    };
  }

  private truncate(text: string, max = 158): string {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1).trimEnd()}…`;
  }

  private truncateTitle(text: string, max = 62): string {
    const t = String(text || '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1).trimEnd()}…`;
  }

  private buildDescription(config: PortalConfig | null, cursos: CursoVirtual[]): string {
    const nombre = this.orgName(config);
    const custom = config?.heroSubtitulo?.trim();
    const ciudad = config?.ciudad?.trim() || SEO_LOCALITY;
    const nombresCursos = cursos
      .slice(0, 2)
      .map((c) => c.nombreProg)
      .filter(Boolean);
    const ejemplos =
      nombresCursos.length > 0 ? ` Programas: ${nombresCursos.join(', ')}.` : '';
    if (custom && custom.length > 40) {
      return `${custom} Cursos virtuales de ${nombre} en ${ciudad}, ${SEO_REGION}, Colombia.${ejemplos}`;
    }
    return `Cursos y programas virtuales en seguridad vial en ${ciudad}, ${SEO_REGION} y Colombia. Estudie con ${SEO_BRAND}, certifique su formación y consulte certificados en línea.${ejemplos}`;
  }

  private buildKeywords(cursos: CursoVirtual[]): string {
    const dinamicos = cursos
      .slice(0, 5)
      .map((c) => c.nombreProg?.trim())
      .filter(Boolean)
      .join(', ');
    return dinamicos ? `${PORTAL_SEO_KEYWORDS}, ${dinamicos}` : PORTAL_SEO_KEYWORDS;
  }

  private breadcrumbJsonLd(
    pageUrl: string,
    items: { name: string; path: string }[],
  ): Record<string, unknown>[] {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return [
      {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: origin ? `${origin}${item.path}` : undefined,
        })),
      },
      {
        '@type': 'WebPage',
        name: items[items.length - 1]?.name,
        url: pageUrl || undefined,
        inLanguage: 'es-CO',
      },
    ];
  }

  private buildHomeJsonLd(
    config: PortalConfig | null,
    cursos: CursoVirtual[],
    url: string,
    nombre: string,
    siteDescription: string,
  ): Record<string, unknown>[] {
    const graph: Record<string, unknown>[] = [
      {
        '@type': 'EducationalOrganization',
        name: nombre,
        alternateName: SEO_BRAND,
        url: url || undefined,
        logo: config?.urlLogoAbsoluta || undefined,
        description: this.truncate(FUNDACION_SEO_DESCRIPTION, 220),
        address: this.postalAddress(config),
        areaServed: [
          { '@type': 'City', name: SEO_LOCALITY },
          { '@type': 'AdministrativeArea', name: SEO_REGION },
          { '@type': 'Country', name: 'Colombia' },
        ],
        telephone: config?.telefono || undefined,
        email: config?.email || undefined,
      },
      {
        '@type': 'WebSite',
        name: `${SEO_BRAND} — Aula virtual`,
        alternateName: nombre,
        url: url || undefined,
        description: this.truncate(siteDescription || FUNDACION_SEO_DESCRIPTION, 200),
        inLanguage: 'es-CO',
        potentialAction: {
          '@type': 'SearchAction',
          target: url ? `${url}cursos?q={search_term_string}` : undefined,
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    for (const c of cursos.slice(0, 10)) {
      graph.push({
        '@type': 'Course',
        name: c.nombreProg,
        description: this.truncate(
          c.descripcionVirtual || c.descripcion || `Programa virtual: ${c.nombreProg}`,
          220,
        ),
        provider: { '@type': 'EducationalOrganization', name: nombre },
        url: url ? `${url}cursos/${c.idPrograma}` : undefined,
        offers:
          c.tarifaVirtual > 0
            ? {
                '@type': 'Offer',
                price: c.tarifaVirtual,
                priceCurrency: 'COP',
                availability: 'https://schema.org/InStock',
              }
            : undefined,
      });
    }

    return graph;
  }

  private setJsonLd(data: PageMetaOpts['jsonLd']) {
    this.doc.getElementById('argo-portal-jsonld')?.remove();
    if (!data) return;

    const graph = Array.isArray(data) ? data : [data];
    const script = this.doc.createElement('script');
    script.id = 'argo-portal-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    });
    this.doc.head.appendChild(script);
  }

  private upsertTag(tag: { name?: string; property?: string; content: string }) {
    if (!tag.content) return;
    if (tag.name) {
      this.meta.updateTag({ name: tag.name, content: tag.content }, `name="${tag.name}"`);
      return;
    }
    if (tag.property) {
      this.meta.updateTag({ property: tag.property, content: tag.content }, `property="${tag.property}"`);
    }
  }

  private setMeta(name: string, content: string) {
    this.upsertTag({ name, content });
  }

  private setName(name: string, content: string) {
    this.upsertTag({ name, content });
  }

  private setOg(property: string, content: string) {
    this.upsertTag({ property, content });
  }

  private setCanonical(href: string) {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = href;
  }
}
