import type { PortalLandingConfig } from './portal-landing-defaults';
import { SERVIAL_SERVICIOS_DEFAULTS } from './servial-servicios-defaults';

/** Textos base del home y landing para plantilla Servial Colombia (sin marcas Finstruvial). */
export const SERVIAL_LANDING_DEFAULTS: Partial<PortalLandingConfig> = {
  instBarTag: 'Tránsito, transporte, movilidad y seguridad vial — Villavicencio, Meta',
  quoteText:
    'Prestamos servicios especializados en tránsito, transporte, movilidad y seguridad vial con calidad, amabilidad y eficiencia.',
  quoteLabel: 'Contáctenos',
  metaDescription:
    'Servial Colombia: licencias de conducción, CEA, cursos libres, consultoría y aula virtual con calidad certificada en Villavicencio, Meta.',
  metaKeywords:
    'Servial Colombia, licencia conducción, CEA, aula virtual, seguridad vial, consultoría tránsito, Villavicencio, Meta',
  hero: {
    ctaPrincipal: 'Ingresar al aula virtual',
    ctaPrincipalUrl: '/aula',
    ctaSecundario: 'Consultar certificado',
    ctaSecundarioUrl: '/consulta-certificados',
    ctaLlamarUrl: 'tel:+573213039595',
    mostrarBotonLlamar: true,
    imagenAlt: 'Aprenda a conducir con seguridad y confianza — Servial Colombia',
    eyebrow: '',
    eyebrowServial: '— Bienvenid@ a {nombreCea} —',
    subEyebrow: 'Centro de Enseñanza Automovilística',
    ctaLlamarEtiqueta: '',
    highlightIcon: '',
    highlightTitle: '',
    highlightSubtitle: '',
    highlightRadar: true,
  },
  infoCards: [
    { icon: '📞', title: 'Llámenos', text: '321 303 9595', fuente: 'telefono' },
    { icon: '📍', title: 'Visítenos', text: 'Calle 37B # 19A-65 B. Jordan', fuente: 'direccion' },
    { icon: '🎓', title: 'CEA habilitado', text: 'Categorías A2, B2, C1, C2 y C3', fuente: 'texto' },
  ],
  ofertas: {
    titulo: 'Capacitación integral en conducción y seguridad vial',
    lead: 'Centro de Enseñanza Automovilística e Instituto de Educación para el Trabajo y el Desarrollo Humano.',
    items: [
      {
        icon: '🚗',
        title: 'Centro de Enseñanza Automovilística',
        text: 'Cursos A2, B2, C1, C2 y C3 con instructores certificados y calidad TÜV Rheinland.',
      },
      {
        icon: '🛣️',
        title: 'Cursos libres',
        text: 'Manejo defensivo, primeros auxilios, mercancías peligrosas y normas de tránsito.',
      },
      {
        icon: '💼',
        title: 'Consultoría y asesoría',
        text: 'Tránsito, transporte, planes de seguridad vial y campañas educativas para empresas.',
      },
    ],
  },
  beneficios: {
    kicker: 'Tu formación vial, más cerca',
    titulo: 'Aprende a conducir con seguridad y confianza',
    lead: 'Clases personalizadas, ruta paso a paso y acompañamiento hasta su licencia o certificación.',
    items: [
      { icon: '✓', title: 'Calidad certificada', text: 'Únicos con calidad certificada en formación vial.' },
      { icon: '⏱', title: 'A tu ritmo', text: 'Cursos virtuales interactivos y horarios flexibles.' },
      { icon: '👨‍🏫', title: 'Instructores expertos', text: 'Acompañamiento profesional en teoría y práctica.' },
    ],
  },
  pasos: {
    kicker: 'Cómo enseñamos',
    titulo: 'Su ruta hacia la licencia y la certificación',
    lead: 'Programas que combinan teoría, práctica y evaluación con enfoque en seguridad vial.',
    items: [
      {
        paso: '1',
        title: 'Elija su capacitación',
        text: 'Explore licencias, cursos libres o programas técnicos para conductores profesionales.',
      },
      {
        paso: '2',
        title: 'Aprenda a su ritmo',
        text: 'Videolecciones, documentación y acompañamiento en aula virtual o presencial.',
      },
      {
        paso: '3',
        title: 'Certifíquese',
        text: 'Evalúe sus conocimientos y obtenga su certificado o avance en el trámite de licencia.',
      },
    ],
  },
  servicios: {
    titulo: 'Servicios Servial Colombia',
    items: [
      { icon: '💻', title: 'Aula Virtual', url: '/servicios/aula-virtual' },
      { icon: '🎓', title: 'Capacitación', url: '/servicios/capacitacion-sensibilizacion' },
      { icon: '📋', title: 'Asesoría en tránsito', url: '/servicios/peridata' },
      { icon: '🏛️', title: 'Consultoría', url: '/servicios/planeacion-gestion-vial' },
      { icon: '📊', title: 'Estudios de tránsito', url: '/servicios/estudios-diagnosticos-tecnicos' },
      { icon: '🖥️', title: 'Soluciones informáticas', url: '/servicios/herramientas-educativas-tecnologicas' },
      { icon: '🏍️', title: 'Licencia A2 (moto)', url: '/cursos' },
      { icon: '🚛', title: 'Curso B2 (servicio particular)', url: '/cursos-conduccion' },
      { icon: '🚌', title: 'Licencias C1, C2 y C3', url: '/cursos' },
      { icon: '🛡️', title: 'Manejo defensivo', url: '/cursos' },
      { icon: '☣️', title: 'Mercancías peligrosas', url: '/cursos' },
      { icon: '📜', title: 'Consulta de certificados', url: '/consulta-certificados' },
    ],
  },
  valores: {
    titulo: 'Por qué elegir Servial Colombia',
    lead: 'Calidad, amabilidad y eficiencia en Villavicencio, Meta.',
    items: [
      {
        title: 'Calidad certificada en formación vial',
        text: 'Únicos con calidad certificada TÜV Rheinland en la región.',
      },
      {
        title: 'CEA e Instituto habilitados',
        text: 'Centro de Enseñanza Automovilística e Instituto de Educación para el Trabajo y el Desarrollo Humano.',
      },
      {
        title: 'Instructores certificados',
        text: 'Autorizados por el Ministerio de Transporte y evaluadores de competencias SENA.',
      },
      {
        title: 'Portafolio integral',
        text: 'Capacitación, asesoría, consultoría, estudios de tránsito y soluciones informáticas.',
      },
      {
        title: 'Aula virtual flexible',
        text: 'Formación en línea para conductores, empresas y entidades del sector transportador.',
      },
      {
        title: 'Compromiso con la seguridad vial',
        text: 'Fomentamos la cultura vial responsable en la vía y en las empresas.',
      },
    ],
  },
  pilares: {
    tabCapacitacion: 'Capacitación',
    tabCampanas: 'Servicios',
    capacitacion: [
      'Cursos de conducción A2, B2, C1, C2 y C3 en nuestro CEA habilitado.',
      'Cursos libres: manejo defensivo, primeros auxilios, mercancías peligrosas y normas de tránsito.',
      'Programas técnicos por competencias laborales para el sector transportador.',
    ],
    campanas: [
      'Consultoría y asesoría en tránsito, transporte y seguridad vial para empresas.',
      'Estudios de tránsito y movilidad, planes de seguridad vial y campañas educativas.',
    ],
  },
  licencias: {
    kicker: 'Centro de Enseñanza Automovilística',
    titulo: 'Licencias de conducción',
    lead: 'Formación para conductores con instructores certificados — categorías A2, B2, C1, C2 y C3.',
    items: [
      {
        icon: '🏍️',
        codigo: 'A2',
        titulo: 'Motocicleta',
        incluye: ['Teoría y práctica', 'Simulador', 'Exámenes RUNT'],
        licenciaLabel: 'Licencia A2',
        valor: 'Consultar',
        btnTexto: 'Más información',
        btnUrl: '/acerca#contacto',
        destacada: false,
      },
      {
        icon: '🚗',
        codigo: 'B2',
        titulo: 'Camiones, busetas y buses particulares',
        incluye: ['Teoría y práctica', 'Taller', 'Exámenes RUNT'],
        licenciaLabel: 'Categoría B2',
        valor: 'Consultar',
        btnTexto: 'Más información',
        btnUrl: '/acerca#contacto',
        destacada: true,
      },
      {
        icon: '🚌',
        codigo: 'C1-C3',
        titulo: 'Servicio público y carga',
        incluye: ['Teoría y práctica', 'Formación profesional', 'Exámenes RUNT'],
        licenciaLabel: 'Licencias C1, C2 y C3',
        valor: 'Consultar',
        btnTexto: 'Más información',
        btnUrl: '/acerca#contacto',
        destacada: false,
      },
    ],
  },
  testimonios: {
    kicker: 'Testimonios',
    titulo: 'Conductores que confían en nosotros',
    lead: 'Experiencias de estudiantes y empresas del sector transportador en Villavicencio.',
    items: [
      {
        nombre: 'Sarah López',
        rol: 'Conductora',
        texto:
          'El aula virtual me permitió aprender normas de tránsito y seguridad vial de forma clara. Hoy conduzco con más responsabilidad.',
      },
      {
        nombre: 'José Parrado',
        rol: 'Conductor de carga',
        texto:
          'La capacitación en manejo defensivo y mercancías peligrosas superó mis expectativas. Contenidos prácticos y muy profesionales.',
      },
    ],
  },
  faq: {
    kicker: 'Preguntas frecuentes',
    titulo: 'Resolvemos sus dudas',
    lead: 'Información sobre licencias, cursos y el aula virtual.',
    contactoTexto: '¿Necesita más información? Escríbanos o llámenos.',
    items: [
      {
        pregunta: '¿Qué categorías de licencia puedo obtener?',
        respuesta:
          'En nuestro CEA ofrecemos formación para las categorías A2 (moto), B2 (servicio particular), C1, C2 y C3 (servicio público), según la habilitación vigente.',
      },
      {
        pregunta: '¿Cómo accedo al aula virtual?',
        respuesta:
          'Regístrese en el portal, elija su curso y pulse «Matricularme». Con su usuario podrá ingresar al aula virtual desde cualquier dispositivo.',
      },
      {
        pregunta: '¿Qué servicios ofrece Servial además del CEA?',
        respuesta:
          'Capacitación empresarial, asesoría y consultoría en tránsito, estudios de movilidad, soluciones informáticas y más. Vea nuestro portafolio en «Nuestros servicios».',
      },
    ],
  },
  cursos: {
    kicker: 'Catálogo en línea',
    titulo: 'Explore nuestros cursos y programas virtuales',
    emptyTitulo: 'Próximamente más cursos',
    emptyTexto: 'Estamos publicando nuevos programas de capacitación. Vuelva pronto.',
  },
  catalogo: {
    tituloCursos: 'Cursos y programas — Servial Colombia',
    tituloTienda: 'Inscripción a cursos',
    leadCursos: 'Licencias, cursos libres y capacitación en seguridad vial para conductores y empresas.',
    leadTienda: 'Matricúlese en línea y comience su formación hoy.',
    placeholderBuscar: 'Buscar curso o programa…',
  },
  appMobile: {
    kicker: 'App móvil',
    titulo: 'Lleve el aula virtual de Servial en su celular',
    lead: 'Acceda a sus cursos y certificados desde Android con la app oficial de Servial Colombia.',
    features: [
      {
        icon: '📚',
        title: 'Cursos y programas',
        text: 'Ingrese al aula virtual y retome su capacitación donde la dejó.',
      },
      {
        icon: '🎓',
        title: 'Certificados',
        text: 'Consulte sus certificados expedidos por Servial Colombia.',
      },
      {
        icon: '🔔',
        title: 'Siempre conectado',
        text: 'Experiencia optimizada para Android, rápida y fácil de usar.',
      },
    ],
    btnDescargar: 'Descargar APK para Android',
    notaInstalacion: 'Android 8.0 o superior · Instalación manual del archivo APK',
    apkUrl: '',
    apkNombre: 'Servial Colombia — Aula Virtual',
  },
  footer: {
    founded: 'Servial Colombia',
    copyright: '',
    tituloEnlaces: 'Enlaces',
    tituloServicios: 'Servicios',
    tituloContacto: 'Contacto',
  },
  footerServicios: [
    'Aula Virtual',
    'Capacitación',
    'Asesoría en tránsito',
    'Consultoría',
    'Estudios de tránsito',
    'Soluciones informáticas',
  ],
  finstruvialServicios: JSON.parse(JSON.stringify(SERVIAL_SERVICIOS_DEFAULTS)),
};
