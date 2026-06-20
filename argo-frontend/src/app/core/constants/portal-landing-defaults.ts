/** Espejo de argo-backend/src/constants/aulaVirtualLandingDefaults.js */
import {
  FUNDACION_LANDING_DEFAULTS,
  mergeFundacionLanding,
  PortalFundacionLanding,
} from './fundacion-landing-defaults';

export type { PortalFundacionLanding };
export interface LandingItemIcon {
  icon: string;
  title: string;
  text?: string;
}

export interface LandingItemBasico {
  title: string;
  text: string;
}

export interface LandingServicioItem {
  icon: string;
  title: string;
  url?: string;
}

export interface LandingTestimonio {
  nombre: string;
  rol: string;
  texto: string;
}

export interface LandingPaso {
  paso: string;
  title: string;
  text: string;
}

export interface LandingFaqItem {
  pregunta: string;
  respuesta: string;
}

export interface LandingCarrera {
  titulo: string;
  cno: string;
  horas: number;
  semestres: number;
  jornadas: string;
}

export interface LandingInfoCard {
  icon: string;
  title: string;
  text: string;
  fuente: 'texto' | 'telefono' | 'direccion';
}

export interface PortalLandingConfig {
  instBarTag: string;
  quoteText: string;
  quoteLabel: string;
  metaDescription: string;
  metaKeywords: string;
  hero: {
    ctaPrincipal: string;
    ctaSecundario: string;
    mostrarBotonLlamar: boolean;
    imagenAlt: string;
  };
  infoCards: LandingInfoCard[];
  nav: {
    home: string;
    tienda: string;
    cursos: string;
    aula: string;
    acerca: string;
    fundacion: string;
    consultaCertificados: string;
    blog: string;
    acceder: string;
    registrarse: string;
    salir: string;
  };
  footer: {
    founded: string;
    copyright: string;
    tituloEnlaces: string;
    tituloServicios: string;
    tituloContacto: string;
  };
  catalogo: {
    tituloCursos: string;
    tituloTienda: string;
    leadCursos: string;
    leadTienda: string;
    placeholderBuscar: string;
  };
  ofertas: { titulo: string; lead: string; items: LandingItemIcon[] };
  beneficios: { kicker: string; titulo: string; lead: string; items: LandingItemIcon[] };
  servicios: { titulo: string; items: LandingServicioItem[] };
  valores: { titulo: string; lead: string; items: LandingItemBasico[] };
  testimonios: { kicker: string; titulo: string; lead: string; items: LandingTestimonio[] };
  pasos: { kicker: string; titulo: string; lead: string; items: LandingPaso[] };
  faq: {
    kicker: string;
    titulo: string;
    lead: string;
    contactoTexto: string;
    items: LandingFaqItem[];
  };
  cursos: { kicker: string; titulo: string; emptyTitulo: string; emptyTexto: string };
  carreras: { kicker: string; titulo: string; lead: string; items: LandingCarrera[] };
  appMobile: {
    kicker: string;
    titulo: string;
    lead: string;
    features: LandingItemIcon[];
    btnDescargar: string;
    notaInstalacion: string;
    apkUrl: string;
    apkNombre: string;
  };
  blog: {
    kicker: string;
    titulo: string;
    lead: string;
    emptyTitulo: string;
    emptyTexto: string;
  };
  pilares: {
    tabCapacitacion: string;
    tabCampanas: string;
    capacitacion: string[];
    campanas: string[];
  };
  footerServicios: string[];
  fundacion: PortalFundacionLanding;
}

export const PORTAL_LANDING_DEFAULTS: PortalLandingConfig = {
  instBarTag: 'Cursos y programas de capacitación virtual en Colombia',
  quoteText:
    'Cursos y programas virtuales que transforman la seguridad vial: estudie hoy, certifique mañana.',
  quoteLabel: 'O llámanos',
  metaDescription:
    'Cursos y programas de capacitación virtual en seguridad vial para Colombia, el departamento del Meta y Villavicencio. Matricúlese en el aula virtual de Fundación Finstruvial: formación técnica, certificación y programas en línea.',
  metaKeywords:
    'cursos virtuales Colombia, programas de capacitación en línea Colombia, aula virtual seguridad vial, cursos seguridad vial Colombia, capacitación tránsito Villavicencio, cursos tránsito Meta, programas certificados Villavicencio, formación técnica Meta Colombia, PESV Villavicencio, PESV Meta, Fundación Finstruvial, instituto técnico Villavicencio, cursos en línea Villavicencio, capacitación conductores Meta, seguridad vial Villavicencio, consultoría seguridad vial Colombia, carreras técnicas tránsito Villavicencio, matrícula cursos virtuales Meta',
  hero: {
    ctaPrincipal: 'Ver cursos y programas',
    ctaSecundario: 'Crear cuenta gratis',
    mostrarBotonLlamar: true,
    imagenAlt: 'Estudiante en cursos y programas del aula virtual',
  },
  infoCards: [
    { icon: '🎓', title: 'Capacitación', text: 'Certificamos con calidad', fuente: 'texto' },
    { icon: '📞', title: 'Línea de atención', text: '', fuente: 'telefono' },
    { icon: '📍', title: 'Dirección', text: '', fuente: 'direccion' },
  ],
  nav: {
    home: 'Home',
    tienda: 'Tienda',
    cursos: 'Cursos',
    aula: 'Aula virtual',
    acerca: 'Acerca de',
    fundacion: 'Fundación',
    consultaCertificados: 'Certificados',
    blog: 'Blog',
    acceder: 'Acceder',
    registrarse: 'Registrarse',
    salir: 'Salir',
  },
  footer: {
    founded: 'Est. 1997',
    copyright:
      'Copyright © 2026 All Rights Reserved INSTITUTO TECNICO FINSTRUVIAL Designed by WALTER AGUILAR',
    tituloEnlaces: 'Enlaces rápidos',
    tituloServicios: 'Servicios',
    tituloContacto: 'Contáctanos',
  },
  catalogo: {
    tituloCursos: 'Catálogo de cursos y programas virtuales',
    tituloTienda: 'Tienda de cursos y programas',
    leadCursos: 'Explore cursos y programas de capacitación virtual en el aula virtual.',
    leadTienda: 'Inscríbase a cursos y programas de capacitación en línea.',
    placeholderBuscar: 'Buscar curso o programa…',
  },
  ofertas: {
    titulo: '¿Qué ofrecemos en el aula virtual?',
    lead: 'Cursos virtuales y programas de capacitación en seguridad vial para personas, empresas e instituciones.',
    items: [
      {
        icon: '💻',
        title: 'Cursos virtuales certificados',
        text: 'Programas en línea con certificación: estudie a su ritmo y valide sus competencias en seguridad vial.',
      },
      {
        icon: '🎓',
        title: 'Programas de formación técnica',
        text: 'Carreras y programas por competencias con titulación, acompañamiento y rutas claras de avance.',
      },
      {
        icon: '📊',
        title: 'Capacitación para empresas e instituciones',
        text: 'Cursos y programas a la medida para equipos, flotas y organismos que exigen resultados medibles.',
      },
    ],
  },
  beneficios: {
    kicker: 'Resultados',
    titulo: 'Lo que logra con nuestros cursos y programas',
    lead: 'Formación práctica, certificación y flexibilidad para avanzar sin frenar su día a día.',
    items: [
      {
        icon: '✅',
        title: 'Certificación al completar',
        text: 'Al terminar el programa y cumplir los requisitos, obtiene respaldo formal de su capacitación.',
      },
      {
        icon: '📱',
        title: 'Estudie desde cualquier lugar',
        text: 'Acceda a cursos y programas virtuales cuando lo necesite, sin desplazamientos ni horarios rígidos.',
      },
      {
        icon: '📈',
        title: 'Avance a su ritmo',
        text: 'Retome donde lo dejó, consulte el progreso y continúe el programa sin perder continuidad.',
      },
    ],
  },
  servicios: {
    titulo: 'Todo lo que necesita tu empresa en seguridad vial',
    items: [
      {
        icon: '🛣️',
        title: 'Planes de manejo de tránsito',
        url: 'https://finstruvial.com.co/planes-de-manejo-de-transito/',
      },
      {
        icon: '📋',
        title: 'Planes estratégicos de seguridad vial',
        url: 'https://finstruvial.com.co/planes-estrategicos-de-seguridad-vial/',
      },
      {
        icon: '🏙️',
        title: 'Planes locales de seguridad vial',
        url: 'https://finstruvial.com.co/plan-local-de-seguridad-vial/',
      },
      {
        icon: '🚲',
        title: 'Planes de movilidad sostenible y segura',
        url: 'https://finstruvial.com.co/planes-de-movilidad-sostenible-y-segura/',
      },
      {
        icon: '👷',
        title: 'Competencias laborales',
        url: 'https://finstruvial.com.co/competencias-laborales/',
      },
      {
        icon: '🚗',
        title: 'Sensibilización a conductores',
        url: 'https://finstruvial.com.co/sensibilizacion-a-conductores/',
      },
      {
        icon: '📖',
        title: 'Actualización normativa',
        url: 'https://finstruvial.com.co/actualizacion-normativa/',
      },
      {
        icon: '🎯',
        title: 'Actividades experienciales',
        url: 'https://finstruvial.com.co/actividades-experienciales/',
      },
      {
        icon: '📈',
        title: 'Análisis de accidentalidad vial — PERIDATA',
        url: 'https://finstruvial.com.co/nuestros-servicios/mapas/',
      },
      {
        icon: '📚',
        title: 'Publicaciones',
        url: 'https://finstruvial.com.co/publicaciones/',
      },
      {
        icon: '🧰',
        title: 'Herramientas educativas',
        url: 'https://finstruvial.com.co/herramientas-educativas-y-tecnologicas/',
      },
    ],
  },
  valores: {
    titulo: '¡Somos tu mejor opción!',
    lead: '',
    items: [
      {
        title: 'Más de 28 años de experiencia',
        text: 'Años de experiencia práctica y una amplia gama de habilidades que nos hacen la mejor opción en seguridad vial para empresas y el sector público.',
      },
      {
        title: 'Formando una cultura vial responsable',
        text: 'Educamos, capacitamos y acompañamos a las comunidades para salvar vidas en las vías.',
      },
      {
        title: 'Seguridad vial para todos',
        text: 'Promovemos la conciencia y la prevención vial a través de la educación, la investigación y la acción estratégica.',
      },
      {
        title: 'Caminos seguros, futuro en movimiento',
        text: 'Diseñamos y ejecutamos planes integrales de seguridad vial que transforman la movilidad y protegen a las personas.',
      },
      {
        title: 'Educamos para salvar vidas',
        text: 'Impulsamos la formación, la planificación y las campañas que construyen una movilidad más segura y sostenible.',
      },
      {
        title: 'Movilidad segura, compromiso de todos',
        text: 'Trabajamos junto a instituciones y ciudadanos para construir una cultura vial basada en el respeto, la prevención y la vida.',
      },
    ],
  },
  testimonios: {
    kicker: 'Confianza',
    titulo: 'Quienes ya cursan nuestros programas',
    lead: 'Experiencias reales de estudiantes y empresas que eligieron la capacitación virtual.',
    items: [
      {
        nombre: 'María Fernanda R.',
        rol: 'Conductora profesional',
        texto:
          'Los cursos virtuales me permitieron actualizar normativa sin dejar de trabajar. El programa fue claro y el certificado llegó al terminar.',
      },
      {
        nombre: 'Carlos Andrés M.',
        rol: 'Empresa de transporte',
        texto:
          'Matriculamos a nuestro equipo en varios programas. La plataforma es sencilla y el seguimiento del avance nos dio tranquilidad.',
      },
      {
        nombre: 'Laura Patricia G.',
        rol: 'Estudiante técnica',
        texto:
          'Encontré programas de capacitación alineados con mi carrera. Pude estudiar en las noches y retomar el curso cuando tenía tiempo.',
      },
    ],
  },
  pasos: {
    kicker: 'Empiece hoy',
    titulo: 'Cómo acceder a cursos y programas',
    lead: 'Tres pasos para matricularse en el aula virtual y comenzar su capacitación.',
    items: [
      {
        paso: '1',
        title: 'Elija su curso o programa',
        text: 'Explore el catálogo de cursos virtuales y programas de capacitación publicados en el portal.',
      },
      {
        paso: '2',
        title: 'Regístrese y matricúlese',
        text: 'Cree su cuenta, inscríbase al programa y reciba acceso al aula virtual de inmediato.',
      },
      {
        paso: '3',
        title: 'Estudie y certifíquese',
        text: 'Complete el contenido, cumpla evaluaciones y obtenga su certificado según las reglas del programa.',
      },
    ],
  },
  faq: {
    kicker: 'Ayuda',
    titulo: 'Preguntas frecuentes sobre cursos y programas',
    lead: 'Resolvemos las dudas más comunes antes de matricularse en el aula virtual.',
    contactoTexto: '¿Aún tiene dudas sobre un curso o programa?',
    items: [
      {
        pregunta: '¿Qué diferencia hay entre un curso y un programa en el aula virtual?',
        respuesta:
          'Un curso virtual suele ser una capacitación corta y focalizada. Un programa puede incluir más horas, evaluaciones y requisitos de certificación.',
      },
      {
        pregunta: '¿Necesito pagar antes de empezar a estudiar?',
        respuesta:
          'Depende del curso o programa. Algunos permiten cursar sin pagar y exigen el pago para el certificado; otros requieren pago previo.',
      },
      {
        pregunta: '¿Cómo obtengo el certificado?',
        respuesta:
          'Cada programa define si el certificado se entrega al pagar, al aprobar evaluaciones o al completar el contenido.',
      },
      {
        pregunta: '¿Puedo estudiar desde el celular?',
        respuesta:
          'Sí. El aula virtual está optimizada para computador, tableta y móvil.',
      },
      {
        pregunta: '¿Cómo me inscribo a un programa?',
        respuesta:
          'Regístrese en el portal, elija el curso o programa en el catálogo y pulse «Matricularme».',
      },
    ],
  },
  cursos: {
    kicker: 'Catálogo en línea',
    titulo: 'Cursos y programas virtuales disponibles',
    emptyTitulo: 'Próximamente nuevos cursos y programas',
    emptyTexto: 'Estamos publicando más programas de capacitación virtual. Vuelva pronto o contáctenos.',
  },
  carreras: {
    kicker: 'Titulación',
    titulo: 'Carreras técnicas en seguridad vial',
    lead: 'Técnico laboral por competencias — información de referencia.',
    items: [
      {
        titulo: 'Técnico laboral por competencias en control y seguridad vial',
        cno: '6362',
        horas: 1020,
        semestres: 3,
        jornadas: 'Diurna, nocturna, sábados',
      },
      {
        titulo: 'Técnico laboral por competencias en investigador criminalístico y judicial',
        cno: '6368',
        horas: 1020,
        semestres: 3,
        jornadas: 'Diurna, nocturna, sábados',
      },
      {
        titulo: 'Técnico laboral por competencias en saneamiento ambiental',
        cno: '3211',
        horas: 1020,
        semestres: 3,
        jornadas: 'Diurna, nocturna, sábados',
      },
      {
        titulo: 'Técnico laboral por competencias — técnicos operativos en tránsito',
        cno: '6382',
        horas: 1500,
        semestres: 4,
        jornadas: 'Diurna, nocturna, sábados',
      },
      {
        titulo: 'Técnico laboral por competencias — agentes de tránsito',
        cno: '6381',
        horas: 1120,
        semestres: 4,
        jornadas: 'Diurna, nocturna, sábados',
      },
    ],
  },
  appMobile: {
    kicker: 'App Mobile',
    titulo: 'Lleve el aula virtual en su bolsillo',
    lead:
      'Acceda a sus cursos, consulte certificados y manténgase al día desde su celular con la app oficial de la institución.',
    features: [
      {
        icon: '📚',
        title: 'Cursos y programas',
        text: 'Ingrese al aula virtual y retome su capacitación donde la dejó.',
      },
      {
        icon: '🎓',
        title: 'Certificados',
        text: 'Consulte y verifique sus certificados expedidos en línea.',
      },
      {
        icon: '🔔',
        title: 'Siempre conectado',
        text: 'Experiencia optimizada para Android, rápida y fácil de usar.',
      },
    ],
    btnDescargar: 'Descargar APK para Android',
    notaInstalacion: 'Android 8.0 o superior · Instalación manual del archivo APK',
    apkUrl: '/apk/aula-virtual-finstruvial.apk',
    apkNombre: 'aula-virtual-finstruvial.apk',
  },
  blog: {
    kicker: 'Blog',
    titulo: 'Noticias y artículos',
    lead: 'Novedades, consejos y contenido de interés sobre capacitación y seguridad vial.',
    emptyTitulo: 'Próximamente publicaremos artículos',
    emptyTexto: 'Vuelva pronto para leer las últimas noticias de la institución.',
  },
  pilares: {
    tabCapacitacion: 'Capacitación',
    tabCampanas: 'Campañas',
    capacitacion: [
      'Capacitamos para crear una cultura vial responsable y segura.',
      'Desarrollamos estudios técnicos y planes estratégicos de tránsito que respaldan decisiones seguras y sostenibles en la gestión vial.',
      'Asesoramos a empresas de transporte en la implementación de planes y estrategias de seguridad vial.',
    ],
    campanas: [
      'Trabajamos junto a instituciones y ciudadanos para construir una cultura vial basada en el respeto, la prevención y la vida.',
      'Promovemos campañas que inspiran respeto y conciencia en las vías.',
    ],
  },
  footerServicios: [
    'Capacitación',
    'PESV',
    'Campañas de seguridad vial',
    'Carreras técnicas',
    'Estudios de tránsito',
    'Planes de movilidad sostenible y segura',
  ],
  fundacion: JSON.parse(JSON.stringify(FUNDACION_LANDING_DEFAULTS)) as PortalFundacionLanding,
};

function mergeServiciosItems(
  rawItems: LandingServicioItem[] | undefined,
  defaults: LandingServicioItem[],
): LandingServicioItem[] {
  const items = rawItems?.length ? rawItems : defaults;
  const urlByTitle = new Map(defaults.map((item) => [item.title.trim().toLowerCase(), item.url || '']));
  return items.map((item) => ({
    ...item,
    url: (item.url || urlByTitle.get(item.title.trim().toLowerCase()) || '').trim(),
  }));
}

export function mergePortalLanding(raw?: Partial<PortalLandingConfig> | null): PortalLandingConfig {
  const d = PORTAL_LANDING_DEFAULTS;
  if (!raw) return JSON.parse(JSON.stringify(d)) as PortalLandingConfig;
  return {
    ...d,
    ...raw,
    ofertas: { ...d.ofertas, ...raw.ofertas, items: raw.ofertas?.items?.length ? raw.ofertas.items : d.ofertas.items },
    beneficios: {
      ...d.beneficios,
      ...raw.beneficios,
      items: raw.beneficios?.items?.length ? raw.beneficios.items : d.beneficios.items,
    },
    servicios: {
      ...d.servicios,
      ...raw.servicios,
      items: mergeServiciosItems(raw.servicios?.items, d.servicios.items),
    },
    valores: {
      ...d.valores,
      ...raw.valores,
      items: raw.valores?.items?.length ? raw.valores.items : d.valores.items,
    },
    testimonios: {
      ...d.testimonios,
      ...raw.testimonios,
      items: raw.testimonios?.items?.length ? raw.testimonios.items : d.testimonios.items,
    },
    pasos: {
      ...d.pasos,
      ...raw.pasos,
      items: raw.pasos?.items?.length ? raw.pasos.items : d.pasos.items,
    },
    appMobile: {
      ...d.appMobile,
      ...raw.appMobile,
      features: raw.appMobile?.features?.length ? raw.appMobile.features : d.appMobile.features,
    },
    blog: { ...d.blog, ...raw.blog },
    faq: {
      ...d.faq,
      ...raw.faq,
      items: raw.faq?.items?.length ? raw.faq.items : d.faq.items,
    },
    hero: { ...d.hero, ...raw.hero },
    infoCards: raw.infoCards?.length ? raw.infoCards : d.infoCards,
    nav: { ...d.nav, ...raw.nav },
    footer: { ...d.footer, ...raw.footer },
    catalogo: { ...d.catalogo, ...raw.catalogo },
    quoteLabel: raw.quoteLabel ?? d.quoteLabel,
    metaDescription: raw.metaDescription?.trim() || d.metaDescription,
    metaKeywords: raw.metaKeywords?.trim() || d.metaKeywords,
    cursos: { ...d.cursos, ...raw.cursos },
    carreras: {
      ...d.carreras,
      ...raw.carreras,
      items: raw.carreras?.items?.length ? raw.carreras.items : d.carreras.items,
    },
    pilares: {
      tabCapacitacion: raw.pilares?.tabCapacitacion ?? d.pilares.tabCapacitacion,
      tabCampanas: raw.pilares?.tabCampanas ?? d.pilares.tabCampanas,
      capacitacion: raw.pilares?.capacitacion?.length ? raw.pilares.capacitacion : d.pilares.capacitacion,
      campanas: raw.pilares?.campanas?.length ? raw.pilares.campanas : d.pilares.campanas,
    },
    footerServicios: raw.footerServicios?.length ? raw.footerServicios : d.footerServicios,
    fundacion: mergeFundacionLanding(raw.fundacion),
  };
}
