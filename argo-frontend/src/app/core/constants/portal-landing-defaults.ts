/** Espejo de argo-backend/src/constants/aulaVirtualLandingDefaults.js */
import {
  FUNDACION_LANDING_DEFAULTS,
  mergeFundacionLanding,
  PortalFundacionLanding,
} from './fundacion-landing-defaults';
import { PortalPaginaKey } from './portal-site-defaults';
import { mergePortalAsistente, type LegacyConsultaAsistente } from '../utils/portal-asistente.util';
import {
  CURSOS_CONDUCCION_LANDING_DEFAULTS,
  mergeCursosConduccionLanding,
  PortalCursosConduccionLanding,
} from './cursos-conduccion-landing-defaults';
import {
  ACERCA_LANDING_DEFAULTS,
  mergeAcercaLanding,
  PortalAcercaLanding,
} from './acerca-landing-defaults';
import {
  EXAMEN_TEORICO_LANDING_DEFAULTS,
  mergeExamenTeoricoLanding,
  PortalExamenTeoricoLanding,
} from './examen-teorico-landing-defaults';
import {
  MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS,
  mergeMercanciasPeligrosasLanding,
  PortalMercanciasPeligrosasLanding,
} from './mercancias-peligrosas-landing-defaults';
import {
  TRABAJO_EN_ALTURAS_LANDING,
  mergeTrabajoEnAlturasLanding,
  PortalTrabajoEnAlturasLanding,
} from './trabajo-en-alturas-landing-defaults';
import {
  EVALUACION_JORNADAS_LANDING_DEFAULTS,
  mergeEvaluacionJornadasLanding,
  PortalEvaluacionJornadasLanding,
} from './evaluacion-jornadas-landing-defaults';
import {
  JORNADAS_CAPACITACION_LANDING_DEFAULTS,
  mergeJornadasCapacitacionLanding,
  PortalJornadasCapacitacionLanding,
} from './jornadas-capacitacion-landing-defaults';
import { mergePqrLanding, PQR_LANDING_DEFAULTS, PortalPqrLanding } from './pqr-landing-defaults';
import { PortalPromoHeroTheme } from './portal-promo-hero-fields.util';

export type { PortalCursosConduccionLanding };
export type { PortalAcercaLanding };
export type { PortalExamenTeoricoLanding };
export type { PortalMercanciasPeligrosasLanding };
export type { PortalTrabajoEnAlturasLanding };
export type { PortalFundacionLanding };
export type { PortalPqrLanding };
export type { PortalJornadasCapacitacionLanding };
export type { PortalEvaluacionJornadasLanding };
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

export interface LandingLicenciaItem {
  icon: string;
  codigo: string;
  titulo: string;
  incluye: string[];
  licenciaLabel: string;
  valor: string;
  btnTexto: string;
  btnUrl: string;
  destacada: boolean;
}

export interface LandingInfoCard {
  icon: string;
  title: string;
  text: string;
  fuente: 'texto' | 'telefono' | 'direccion';
}

export type PortalPopupFrecuencia = 'primera_vez' | 'cada_recarga_sesion';

export interface PortalPopupConfig {
  activo: boolean;
  imagenUrl: string;
  imagenUrlAbsoluta?: string;
  imagenAlt: string;
  mostrarBotonContinuar: boolean;
  textoBotonContinuar: string;
  mostrarBotonCerrar: boolean;
  duracionSegundos: number;
  frecuencia: PortalPopupFrecuencia;
}

export interface PortalConsultaCertificadosConfig {
  mostrarBotonDescargar: boolean;
  marcaAguaCopia: boolean;
  textoBotonDescargar: string;
  kicker: string;
  tituloLinea: string;
  tituloAcento: string;
  lead: string;
  theme: PortalPromoHeroTheme;
  heroImagenUrl: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt: string;
}

export interface PortalAsistentePaginaConfig {
  activo: boolean;
  texto: string;
}

export interface PortalAsistenteConfig {
  videoUrl: string;
  videoUrlAbsoluta?: string;
  paginas: Record<PortalPaginaKey, PortalAsistentePaginaConfig>;
}

export interface PortalAsistenteViewConfig {
  asistenteActivo: boolean;
  asistenteTexto: string;
  asistenteVideoUrl: string;
  asistenteVideoUrlAbsoluta?: string;
}

export const PORTAL_CONSULTA_ASISTENTE_TEXTO_DEFAULT = `🚘 FORMACIÓN QUE ABRE CAMINOS Y GENERA CONFIANZA

En nuestro Centro de Enseñanza Automovilística, trabajamos con el compromiso de brindar una formación integral, responsable y de alta calidad.

Contamos con los requisitos y reconocimientos correspondientes ante las entidades competentes, incluyendo el sector de Transporte y Educación, además de certificaciones de calidad que respaldan nuestros procesos de formación.

🎓 Ofrecemos cursos orientados a la formación y actualización de conductores, con programas que buscan responder a las necesidades del sector empresarial y laboral.

⛽ Formación con enfoque empresarial: contamos con cursos y procesos de capacitación válidos para los requisitos aplicables en procesos relacionados con ECOPETROL, de acuerdo con las condiciones y exigencias correspondientes.

Nuestro propósito es formar conductores responsables, competentes y preparados para asumir los retos de la movilidad y del sector productivo.

📚 Capacítate con una institución que trabaja por tu seguridad, tu formación y tu futuro.

Centro de Enseñanza Automovilística
✅ Formación
✅ Calidad
✅ Seguridad vial
✅ Capacitación para el sector empresarial
✅ Cursos y certificaciones conforme a la normativa aplicable`;

export interface PortalGaleriaFoto {
  id: string;
  url: string;
  urlAbsoluta?: string;
  leyenda: string;
  tipo: 'imagen' | 'video';
  orden: number;
}

export interface PortalGaleriaLanding {
  kicker: string;
  titulo: string;
  lead: string;
  emptyTitulo: string;
  emptyTexto: string;
  theme: PortalPromoHeroTheme;
  mostrarBadgeVirtual: boolean;
  heroImagenUrl?: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt?: string;
  fotos: PortalGaleriaFoto[];
}

export interface PortalHomeFoto {
  url: string;
  urlAbsoluta?: string;
  leyenda: string;
}

export interface PortalFotosInicioLanding {
  kicker: string;
  titulo: string;
  lead: string;
  fotos: PortalHomeFoto[];
}

export interface PortalPublicidadSlide {
  url: string;
  urlAbsoluta?: string;
  alt: string;
  enlace: string;
}

export interface PortalPublicidadLanding {
  activo: boolean;
  intervaloSegundos: number;
  slides: PortalPublicidadSlide[];
}

export const MAX_PUBLICIDAD_SLIDES = 8;

export const MAX_FOTOS_INICIO = 2;

export interface PortalLandingConfig {
  instBarTag: string;
  quoteText: string;
  quoteLabel: string;
  metaDescription: string;
  metaKeywords: string;
  hero: {
    ctaPrincipal: string;
    ctaPrincipalUrl: string;
    ctaSecundario: string;
    ctaSecundarioUrl: string;
    ctaLlamarUrl: string;
    mostrarBotonLlamar: boolean;
    imagenAlt: string;
    eyebrow: string;
    eyebrowServial: string;
    subEyebrow: string;
    ctaLlamarEtiqueta: string;
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
    cursosConduccion: string;
    galeria: string;
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
  licencias: { kicker: string; titulo: string; lead: string; items: LandingLicenciaItem[] };
  examenTeorico: PortalExamenTeoricoLanding;
  mercanciasPeligrosas: PortalMercanciasPeligrosasLanding;
  trabajoEnAlturas: PortalTrabajoEnAlturasLanding;
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
    theme: PortalPromoHeroTheme;
    mostrarBadgeVirtual: boolean;
    heroImagenUrl: string;
    heroImagenUrlAbsoluta?: string;
    heroImagenAlt: string;
  };
  galeria: PortalGaleriaLanding;
  fotosInicio: PortalFotosInicioLanding;
  publicidadInicio: PortalPublicidadLanding;
  pilares: {
    tabCapacitacion: string;
    tabCampanas: string;
    capacitacion: string[];
    campanas: string[];
  };
  footerServicios: string[];
  fundacion: PortalFundacionLanding;
  acerca: PortalAcercaLanding;
  cursosConduccion: PortalCursosConduccionLanding;
  popup: PortalPopupConfig;
  consultaCertificados: PortalConsultaCertificadosConfig;
  pqr: PortalPqrLanding;
  jornadasCapacitacion: PortalJornadasCapacitacionLanding;
  evaluacionJornadas: PortalEvaluacionJornadasLanding;
  asistente: PortalAsistenteConfig;
}

export const PORTAL_LANDING_DEFAULTS: PortalLandingConfig = {
  instBarTag: 'Cursos y programas de capacitación virtual en Colombia',
  quoteText:
    'Cursos y programas virtuales que transforman la seguridad vial: estudie hoy, certifique mañana.',
  quoteLabel: 'O llámanos',
  metaDescription:
    'Cursos de conducción, licencias y programas virtuales en seguridad vial para Colombia, el Meta y Villavicencio. Matricúlese en el aula virtual de su Centro de Enseñanza Automovilística: formación técnica, certificación y programas en línea.',
  metaKeywords:
    'CEA, centro de enseñanza automovilística, cursos de conducción Villavicencio, licencia de conducción Meta, cursos virtuales Colombia, aula virtual seguridad vial, cursos seguridad vial Colombia, capacitación tránsito Villavicencio, cursos tránsito Meta, programas certificados Villavicencio, formación técnica Meta Colombia, cursos en línea Villavicencio, capacitación conductores Meta, seguridad vial Villavicencio, matrícula cursos virtuales Meta',
  hero: {
    ctaPrincipal: 'Ver cursos y programas',
    ctaPrincipalUrl: '/cursos',
    ctaSecundario: 'Crear cuenta gratis',
    ctaSecundarioUrl: '/registro',
    ctaLlamarUrl: '',
    mostrarBotonLlamar: true,
    imagenAlt: 'Estudiante en cursos y programas del aula virtual',
    eyebrow: '',
    eyebrowServial: '— Bienvenid@ a {nombreCea} —',
    subEyebrow: 'Centro de Enseñanza Automovilística',
    ctaLlamarEtiqueta: '',
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
    fundacion: 'CEA',
    consultaCertificados: 'Certificados',
    cursosConduccion: 'Cursos conducción',
    galeria: 'Galería',
    blog: 'Blog',
    acceder: 'Acceder',
    registrarse: 'Registrarse',
    salir: 'Salir',
  },
  footer: {
    founded: 'Est. 1997',
    copyright: `Copyright © ${new Date().getFullYear()} Centro de Enseñanza Automovilística. Todos los derechos reservados.`,
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
  licencias: {
    kicker: 'Trámites y certificaciones',
    titulo: 'Elige tu licencia',
    lead: 'A continuación las licencias que puedes solicitar con nosotros',
    items: [
      {
        icon: '🏍️',
        codigo: 'A2',
        titulo: 'Categoría A2',
        incluye: [
          '25 Horas Teoría',
          '3 Horas Práctica en Taller',
          '15 Horas Práctica en Conducción',
          'Certificado escuela de conducción',
          'Examen médico',
          'Trámites y costos RUNT',
        ],
        licenciaLabel: 'Licencia A2',
        valor: 'Consulte valor en sede',
        btnTexto: 'Solicitar ahora',
        btnUrl: '/registro',
        destacada: false,
      },
      {
        icon: '🚗',
        codigo: 'B1',
        titulo: 'Categoría B1',
        incluye: [
          '25 Horas Teoría',
          '5 Horas Práctica en Taller',
          '20 Horas Práctica en Conducción',
          'Certificado escuela de conducción',
          'Examen médico',
          'Trámites y costos RUNT',
        ],
        licenciaLabel: 'Licencia B1',
        valor: 'Consulte valor en sede',
        btnTexto: 'Solicitar ahora',
        btnUrl: '/registro',
        destacada: false,
      },
      {
        icon: '🚌',
        codigo: 'C1',
        titulo: 'Categoría C1',
        incluye: [
          '30 Horas Teoría',
          '5 Horas Práctica en Taller',
          '30 Horas Práctica en Conducción',
          'Certificado escuela de conducción',
          'Examen médico',
          'Trámites y costos RUNT',
        ],
        licenciaLabel: 'Licencia C1',
        valor: 'Consulte valor en sede',
        btnTexto: 'Solicitar ahora',
        btnUrl: '/registro',
        destacada: false,
      },
      {
        icon: '🚛',
        codigo: 'C2',
        titulo: 'Categoría C2',
        incluye: [
          '20 Horas Teoría',
          '10 Horas Práctica en Taller',
          '14 Horas Práctica en Conducción',
          'Certificado escuela de conducción',
          'Examen médico',
          'Trámites y costos RUNT',
        ],
        licenciaLabel: 'Licencia C2',
        valor: 'Consulte valor en sede',
        btnTexto: 'Solicitar ahora',
        btnUrl: '/registro',
        destacada: true,
      },
    ],
  },
  examenTeorico: JSON.parse(JSON.stringify(EXAMEN_TEORICO_LANDING_DEFAULTS)) as PortalExamenTeoricoLanding,
  mercanciasPeligrosas: JSON.parse(
    JSON.stringify(MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS),
  ) as PortalMercanciasPeligrosasLanding,
  trabajoEnAlturas: JSON.parse(
    JSON.stringify(TRABAJO_EN_ALTURAS_LANDING),
  ) as PortalTrabajoEnAlturasLanding,
  servicios: {
    titulo: 'Todo lo que necesita tu empresa en seguridad vial',
    items: [
      {
        icon: '🛣️',
        title: 'Planes de manejo de tránsito',
        url: '/cursos',
      },
      {
        icon: '📋',
        title: 'Planes estratégicos de seguridad vial',
        url: '/cursos',
      },
      {
        icon: '🏙️',
        title: 'Planes locales de seguridad vial',
        url: '/cursos',
      },
      {
        icon: '🚲',
        title: 'Planes de movilidad sostenible y segura',
        url: '/cursos',
      },
      {
        icon: '👷',
        title: 'Competencias laborales',
        url: '/cursos',
      },
      {
        icon: '🚗',
        title: 'Sensibilización a conductores',
        url: '/cursos',
      },
      {
        icon: '📖',
        title: 'Actualización normativa',
        url: '/cursos',
      },
      {
        icon: '🎯',
        title: 'Actividades experienciales',
        url: '/cursos',
      },
      {
        icon: '📈',
        title: 'Análisis de accidentalidad vial — PERIDATA',
        url: '/cursos',
      },
      {
        icon: '📚',
        title: 'Publicaciones',
        url: '/cursos',
      },
      {
        icon: '🧰',
        title: 'Herramientas educativas',
        url: '/cursos',
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
    apkUrl: '/apk/aula-virtual.apk',
    apkNombre: 'aula-virtual.apk',
  },
  blog: {
    kicker: 'Blog',
    titulo: 'Noticias y artículos',
    lead: 'Novedades, consejos y contenido de interés sobre capacitación y seguridad vial.',
    emptyTitulo: 'Próximamente publicaremos artículos',
    emptyTexto: 'Vuelva pronto para leer las últimas noticias de la institución.',
    theme: 'blue',
    mostrarBadgeVirtual: false,
    heroImagenUrl: '',
    heroImagenAlt: '',
  },
  galeria: {
    kicker: 'Nuestra institución',
    titulo: 'Galería de fotos',
    lead: 'Momentos de formación, eventos e instalaciones de nuestro centro de enseñanza.',
    emptyTitulo: 'Galería en preparación',
    emptyTexto: 'Pronto publicaremos fotografías de nuestras actividades.',
    theme: 'blue',
    mostrarBadgeVirtual: false,
    heroImagenUrl: '',
    heroImagenAlt: '',
    fotos: [],
  },
  fotosInicio: {
    kicker: 'En imágenes',
    titulo: 'Vida en nuestro centro',
    lead: 'Formación, eventos y el día a día de quienes confían en nosotros.',
    fotos: [],
  },
  publicidadInicio: {
    activo: true,
    intervaloSegundos: 5,
    slides: [],
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
  acerca: JSON.parse(JSON.stringify(ACERCA_LANDING_DEFAULTS)) as PortalAcercaLanding,
  cursosConduccion: mergeCursosConduccionLanding(CURSOS_CONDUCCION_LANDING_DEFAULTS),
  popup: {
    activo: false,
    imagenUrl: '',
    imagenAlt: 'Aviso del portal',
    mostrarBotonContinuar: true,
    textoBotonContinuar: 'Continuar',
    mostrarBotonCerrar: true,
    duracionSegundos: 0,
    frecuencia: 'primera_vez',
  },
  consultaCertificados: {
    mostrarBotonDescargar: false,
    marcaAguaCopia: true,
    textoBotonDescargar: 'Descargar PDF',
    kicker: 'Verificación pública',
    tituloLinea: 'Consulta de',
    tituloAcento: 'certificados',
    lead: 'Ingrese su número de documento para verificar los certificados expedidos por la institución.',
    theme: 'blue',
    heroImagenUrl: '',
    heroImagenAlt: '',
  },
  pqr: JSON.parse(JSON.stringify(PQR_LANDING_DEFAULTS)) as PortalPqrLanding,
  jornadasCapacitacion: JSON.parse(
    JSON.stringify(JORNADAS_CAPACITACION_LANDING_DEFAULTS),
  ) as PortalJornadasCapacitacionLanding,
  evaluacionJornadas: JSON.parse(
    JSON.stringify(EVALUACION_JORNADAS_LANDING_DEFAULTS),
  ) as PortalEvaluacionJornadasLanding,
  asistente: {
    videoUrl: 'videos/asistente-educarte.mp4',
    paginas: {
      home: { activo: false, texto: '' },
      tienda: { activo: false, texto: '' },
      cursos: { activo: false, texto: '' },
      aula: { activo: false, texto: '' },
      fundacion: { activo: false, texto: '' },
      consultaCertificados: { activo: false, texto: PORTAL_CONSULTA_ASISTENTE_TEXTO_DEFAULT },
      cursosConduccion: { activo: false, texto: '' },
      galeria: { activo: false, texto: '' },
      blog: { activo: false, texto: '' },
      acerca: { activo: false, texto: '' },
    },
  },
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

function mergePublicidad(
  raw?: Partial<PortalPublicidadLanding> | null,
  fallback?: PortalPublicidadLanding,
): PortalPublicidadLanding {
  const d = fallback || { activo: true, intervaloSegundos: 5, slides: [] };
  if (!raw) return { ...d, slides: [...d.slides] };
  const slidesSrc = Array.isArray(raw.slides) ? raw.slides : d.slides;
  return {
    activo: raw.activo !== false,
    intervaloSegundos: Math.max(3, Number(raw.intervaloSegundos) || d.intervaloSegundos),
    slides: slidesSrc
      .map((s) => ({
        url: s.url?.trim() || '',
        urlAbsoluta: s.urlAbsoluta?.trim() || undefined,
        alt: s.alt?.trim() || 'Publicidad',
        enlace: s.enlace?.trim() || '',
      }))
      .filter((s) => s.url),
  };
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
    licencias: {
      ...d.licencias,
      ...raw.licencias,
      items: raw.licencias?.items?.length
        ? raw.licencias.items.map((item, i) => ({
            ...d.licencias.items[i],
            ...item,
            incluye: item.incluye?.length ? item.incluye : d.licencias.items[i]?.incluye || [],
          }))
        : d.licencias.items.map((item) => ({ ...item, incluye: [...item.incluye] })),
    },
    examenTeorico: mergeExamenTeoricoLanding(raw.examenTeorico),
    mercanciasPeligrosas: mergeMercanciasPeligrosasLanding(raw.mercanciasPeligrosas),
    trabajoEnAlturas: mergeTrabajoEnAlturasLanding(raw.trabajoEnAlturas),
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
    blog: {
      ...d.blog,
      ...raw.blog,
      theme: raw.blog?.theme || d.blog.theme,
      mostrarBadgeVirtual: raw.blog?.mostrarBadgeVirtual === true,
      heroImagenUrl: raw.blog?.heroImagenUrl?.trim() || d.blog.heroImagenUrl,
      heroImagenAlt: raw.blog?.heroImagenAlt?.trim() || d.blog.heroImagenAlt,
    },
    galeria: {
      ...d.galeria,
      ...raw.galeria,
      theme: raw.galeria?.theme || d.galeria.theme,
      mostrarBadgeVirtual: raw.galeria?.mostrarBadgeVirtual === true,
      fotos: raw.galeria?.fotos?.length ? raw.galeria.fotos : d.galeria.fotos,
    },
    fotosInicio: {
      ...d.fotosInicio,
      ...raw.fotosInicio,
      fotos: raw.fotosInicio?.fotos?.length ? raw.fotosInicio.fotos : d.fotosInicio.fotos,
    },
    publicidadInicio: mergePublicidad(raw.publicidadInicio, d.publicidadInicio),
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
    acerca: mergeAcercaLanding(raw.acerca),
    cursosConduccion: mergeCursosConduccionLanding(raw.cursosConduccion),
    popup: { ...d.popup, ...raw.popup },
    consultaCertificados: {
      mostrarBotonDescargar: raw.consultaCertificados?.mostrarBotonDescargar === true,
      marcaAguaCopia: raw.consultaCertificados?.marcaAguaCopia !== false,
      textoBotonDescargar:
        raw.consultaCertificados?.textoBotonDescargar?.trim() ||
        d.consultaCertificados.textoBotonDescargar,
      kicker: raw.consultaCertificados?.kicker?.trim() || d.consultaCertificados.kicker,
      tituloLinea:
        raw.consultaCertificados?.tituloLinea?.trim() || d.consultaCertificados.tituloLinea,
      tituloAcento:
        raw.consultaCertificados?.tituloAcento?.trim() || d.consultaCertificados.tituloAcento,
      lead: raw.consultaCertificados?.lead?.trim() || d.consultaCertificados.lead,
      theme: raw.consultaCertificados?.theme || d.consultaCertificados.theme,
      heroImagenUrl:
        raw.consultaCertificados?.heroImagenUrl?.trim() || d.consultaCertificados.heroImagenUrl,
      heroImagenAlt:
        raw.consultaCertificados?.heroImagenAlt?.trim() || d.consultaCertificados.heroImagenAlt,
    },
    pqr: mergePqrLanding(raw.pqr),
    jornadasCapacitacion: mergeJornadasCapacitacionLanding(raw.jornadasCapacitacion),
    evaluacionJornadas: mergeEvaluacionJornadasLanding(raw.evaluacionJornadas),
    asistente: mergePortalAsistente(
      raw.asistente,
      raw.consultaCertificados as LegacyConsultaAsistente | undefined,
    ),
  };
}
