import {
  PortalFinstruvialServicioLanding,
  PortalServiciosHubFaq,
  PortalServiciosHubTarjeta,
} from './finstruvial-servicio-landing.types';
import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';

export const SERVIAL_AULA_VIRTUAL_GUION_VERSION = 2;

export const SERVIAL_AULA_VIRTUAL_FAQ: PortalServiciosHubFaq[] = [
  {
    pregunta: '¿Qué es el Aula Virtual de SERVIAL?',
    respuesta:
      'Es la plataforma de formación en línea de SERVIAL Colombia para acceder a los cursos y programas virtuales disponibles.',
  },
  {
    pregunta: '¿Puedo realizar los cursos desde cualquier lugar de Colombia?',
    respuesta:
      'Los cursos que estén habilitados en modalidad virtual pueden desarrollarse en línea de acuerdo con las condiciones específicas de cada programa.',
  },
  {
    pregunta: '¿Puedo estudiar desde celular o computador?',
    respuesta:
      'Sí. La plataforma está optimizada para acceder desde computador, tableta o dispositivo móvil, según las características de cada curso.',
  },
  {
    pregunta: '¿Cómo ingreso al Aula Virtual de SERVIAL?',
    respuesta:
      'Debe registrarse en el portal, inscribirse al curso de su interés y, una vez habilitado el acceso, ingresar con su usuario y contraseña desde la sección Aula Virtual.',
  },
];

export const SERVIAL_AULA_VIRTUAL_CATALOGO_OVERRIDES = [
  {
    patron: 'mercancías peligrosas',
    titulo: 'Curso de Mercancías Peligrosas',
    url: '/mercancias-peligrosas',
    cta: 'Ver Curso de Mercancías Peligrosas',
  },
  {
    patron: 'trabajo en alturas',
    titulo: 'Curso de Trabajo en Alturas',
    url: '/trabajo-en-alturas',
    cta: 'Ver Curso de Trabajo en Alturas',
  },
  {
    patron: 'primeros auxilios',
    titulo: 'Curso de Primeros Auxilios',
    url: '/curso-primeros-auxilios',
    cta: 'Ver Curso de Primeros Auxilios',
  },
  {
    patron: 'manejo defensivo',
    titulo: 'Curso Virtual de Manejo Defensivo',
    url: '/curso-manejo-defensivo',
    cta: 'Ver Curso de Manejo Defensivo',
  },
  {
    patron: 'seguridad vial',
    titulo: 'Curso Virtual de Seguridad Vial',
    url: '/cursos',
    cta: 'Conocer Curso de Seguridad Vial',
  },
];

/** Contenido portafolio Servial Colombia (PDF portafolio servicios). */
export const SERVIAL_SERVICIOS_WIREFRAME: Partial<
  Record<FinstruvialServicioSlug, Partial<PortalFinstruvialServicioLanding>>
> = {
  aulaVirtual: {
    guionVersion: SERVIAL_AULA_VIRTUAL_GUION_VERSION,
    estilo: 'academy',
    theme: 'gold',
    menuLabel: 'Aula Virtual',
    kicker: 'Formación en línea',
    tituloLinea: 'Aula Virtual',
    tituloAcento: 'SERVIAL Colombia',
    lead:
      'Cursos virtuales de seguridad vial, tránsito, transporte y formación especializada, disponibles desde Villavicencio, Meta, para estudiantes y empresas en toda Colombia.',
    heroParrafos: [],
    introKicker: '',
    introTitulo: '',
    introLead: '',
    introParrafos: [],
    ctaPrincipal: 'Ingresar al aula',
    ctaPrincipalUrl: '/aula',
    ctaSecundario: 'Explorar Cursos Virtuales',
    ctaSecundarioUrl: '/cursos',
    seoTextoTitulo: 'Cursos Virtuales con SERVIAL Colombia',
    seoTextoImagenId: 'formacion',
    seoTextoParrafos: [
      'El Aula Virtual de SERVIAL Colombia permite acceder a cursos y programas de capacitación en seguridad vial, tránsito, transporte, prevención y formación especializada desde computador, tableta o dispositivo móvil.',
      'Nuestra plataforma facilita el aprendizaje virtual para personas, conductores, trabajadores y empresas que requieren fortalecer sus conocimientos y competencias mediante una modalidad flexible y accesible.',
      'Desde nuestra sede en Villavicencio, Meta, SERVIAL ofrece alternativas de formación virtual para participantes de diferentes regiones de Colombia, incluyendo el Meta y los Llanos Orientales. Los estudiantes pueden consultar la oferta académica disponible, acceder a los contenidos de sus cursos y desarrollar su proceso de formación de acuerdo con las condiciones establecidas para cada programa.',
    ],
    pilaresEducativos: [
      { icon: '📖', titulo: 'SABER', texto: 'Normas, procedimientos y fundamentos técnicos de seguridad vial.' },
      { icon: '🛠️', titulo: 'SABER HACER', texto: 'Aplicación del conocimiento en situaciones reales de conducción y operación.' },
      { icon: '💚', titulo: 'SER', texto: 'Responsabilidad, prevención y compromiso con la vida en las vías.' },
    ],
    rutaAprendizajeKicker: 'Proceso formativo',
    rutaAprendizajeTitulo: 'Ruta de aprendizaje',
    rutaAprendizajeLead:
      'Cada curso en el Aula Virtual de SERVIAL sigue un proceso estructurado que acompaña al estudiante desde el primer acceso hasta la certificación. A través de contenidos, actividades y evaluaciones, usted avanza paso a paso fortaleciendo sus competencias en seguridad vial, tránsito y transporte, a su propio ritmo y desde cualquier lugar.',
    rutaAprendizajeImagenId: 'ruta',
    rutaAprendizaje: ['ESTUDIAR', 'COMPRENDER', 'PRACTICAR', 'APLICAR', 'EVALUAR', 'CERTIFICARSE'],
    bloquesKicker: 'Catálogo',
    bloquesTitulo: 'Cursos Disponibles en el Aula Virtual',
    usarCatalogoCursos: true,
    bloques: [],
    catalogoOverrides: SERVIAL_AULA_VIRTUAL_CATALOGO_OVERRIDES,
    modulosPlataformaKicker: 'Plataforma',
    modulosPlataformaTitulo: '¿Cómo funciona el Aula Virtual de SERVIAL?',
    modulosPlataformaLead:
      'Primero vea los tutoriales en video para registrarse, matricularse y pagar. Después conozca las secciones del campus virtual.',
    guiasPlataformaKicker: 'Tutoriales en video',
    guiasPlataformaTitulo: 'Aprenda a usar el aula virtual paso a paso',
    guiasPlataformaLead:
      'Le mostramos en videos cortos cómo crear su cuenta, inscribirse a un curso y completar el pago de la matrícula.',
    guiasPlataforma: [
      {
        icon: '📝',
        titulo: 'Registro en el aula virtual',
        texto: 'Cómo crear su cuenta y acceder por primera vez al campus virtual de SERVIAL Colombia.',
        youtubeUrl: 'https://youtu.be/9BrUO6sA4Zk',
      },
      {
        icon: '📚',
        titulo: 'Matricularse en un curso',
        texto: 'Cómo elegir un programa del catálogo e inscribirse desde la tienda o el aula virtual.',
        youtubeUrl: 'https://youtu.be/8aZSw6DmZiw',
      },
      {
        icon: '💳',
        titulo: 'Pago de matrícula',
        texto: 'Cómo realizar el pago de su matrícula y confirmar su inscripción al curso.',
        youtubeUrl: 'https://youtu.be/fM7tlCk_wW8',
      },
    ],
    modulosPlataforma: [
      {
        icon: '📊',
        titulo: 'Tablero',
        texto:
          'Vista general de su progreso, avisos y accesos rápidos a los cursos activos desde el panel principal.',
        imagenId: 'modulo-tablero',
      },
      {
        icon: '📚',
        titulo: 'Tus cursos',
        texto:
          'Listado de programas matriculados con acceso directo a lecciones, materiales y evaluaciones pendientes.',
        imagenId: 'modulo-cursos',
      },
      {
        icon: '🏅',
        titulo: 'Certificados',
        texto:
          'Descarga y consulta de certificados obtenidos al completar los requisitos de cada programa.',
        imagenId: 'modulo-certificados',
      },
      {
        icon: '👤',
        titulo: 'Perfil',
        texto: 'Datos personales, contraseña y preferencias de su cuenta en el aula virtual.',
        imagenId: 'modulo-perfil',
      },
    ],
    experienciaSeccionKicker: 'Ventajas',
    experienciaSeccionTitulo: 'Beneficios de nuestros Cursos Virtuales',
    experienciaItems: [
      { icon: '🎥', titulo: 'Contenido multimedia', texto: 'Videos, lecturas y recursos interactivos.' },
      { icon: '📝', titulo: 'Actividades', texto: 'Ejercicios prácticos y casos del sector transportador.' },
      { icon: '✅', titulo: 'Evaluaciones', texto: 'Verificación de aprendizajes y competencias.' },
      { icon: '🏅', titulo: 'Certificación', texto: 'Cuando aplique conforme al programa ofrecido.' },
    ],
    listaTitulo: 'Capacitación Virtual para Empresas',
    listaServicios: [
      {
        titulo: 'Programas a la medida',
        texto: 'Formación virtual para flotas, conductores y personal del sector transportador.',
      },
      {
        titulo: 'Flexibilidad horaria',
        texto: 'Acceso a contenidos y actividades según la disponibilidad de su equipo.',
      },
      {
        titulo: 'Seguimiento formativo',
        texto: 'Herramientas para consultar avance y resultados de los participantes.',
      },
    ],
    localTitulo: 'Aula Virtual SERVIAL desde Villavicencio, Meta',
    localTexto:
      'SERVIAL Colombia tiene su sede en Villavicencio, Meta, y pone su plataforma de formación virtual a disposición de estudiantes, trabajadores y empresas del Meta, los Llanos Orientales y diferentes regiones de Colombia.',
    faqTitulo: 'Preguntas Frecuentes sobre el Aula Virtual',
    faq: SERVIAL_AULA_VIRTUAL_FAQ,
    enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
    enlacesRelacionados: [
      {
        texto: '¿Necesitas formación presencial para tu licencia?',
        etiqueta: 'Cursos de conducción en Villavicencio',
        url: '/cursos-conduccion',
      },
      {
        texto: '¿Buscas técnicas de conducción preventiva?',
        etiqueta: 'Curso de Manejo Defensivo',
        url: '/curso-manejo-defensivo',
      },
      {
        texto: '¿Quieres conocer el proceso para obtener tu licencia?',
        etiqueta: 'Requisitos para la licencia de conducción',
        url: 'https://servial.com.co/licencias-de-conduccion/',
      },
    ],
    cierreQuote: 'Únicos con calidad certificada en formación vial — Villavicencio, Meta.',
    ctaTitulo: 'Inscripción a los Cursos Virtuales de SERVIAL',
    ctaLead: 'Consulte la oferta disponible, regístrese en el portal e inicie su proceso de formación virtual.',
    ctaBtnPrincipal: 'Explorar Cursos Virtuales',
    ctaBtnSecundario: 'Ingresar al aula',
    metaDescription:
      'Aula Virtual y cursos online de SERVIAL Colombia: seguridad vial, tránsito, transporte y formación especializada desde Villavicencio para todo el país.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Aula Virtual de SERVIAL Colombia' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Cursos virtuales de seguridad vial en Colombia' },
      { id: 'formacion', etiqueta: 'Formación virtual', url: '', alt: 'Estudiantes en formación virtual SERVIAL' },
      { id: 'ruta', etiqueta: 'Ruta de aprendizaje', url: '', alt: 'Proceso de aprendizaje en el aula virtual' },
      { id: 'modulo-tablero', etiqueta: 'Captura — Tablero', url: '', alt: 'Capacitación virtual en tránsito y transporte' },
      { id: 'modulo-cursos', etiqueta: 'Captura — Tus cursos', url: '', alt: 'Cursos online SERVIAL Colombia' },
      { id: 'modulo-certificados', etiqueta: 'Captura — Certificados', url: '', alt: 'Formación virtual para conductores y empresas' },
      { id: 'modulo-perfil', etiqueta: 'Captura — Perfil', url: '', alt: 'Plataforma educativa virtual SERVIAL' },
    ],
  },
  capacitacionSensibilizacion: {
    menuLabel: 'Capacitación',
    kicker: 'Formación especializada',
    tituloLinea: 'CAPACITACIÓN',
    tituloAcento: 'EN SEGURIDAD VIAL',
    lead: 'Programas acordes a las necesidades de su empresa con horarios flexibles.',
    heroParrafos: [
      'Somos Centro de Enseñanza Automovilística e Instituto de Educación para el Trabajo y el Desarrollo Humano, con certificación ISO 9001:2008 y compromiso con la calidad, la seguridad industrial y la salud ocupacional.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Capacitación integral para el sector transportador',
    introLead:
      'Cursos técnicos, licencias de conducción y programas por competencias laborales.',
    introParrafos: [
      'Capacitamos aprendices para la conducción de vehículos automotores, automóviles y motocicletas en todas las categorías. Desarrollamos cursos técnicos por competencias en salud ocupacional, control y educación vial, y operación de vehículos articulados de carga para transporte de sustancias peligrosas.',
      'Contamos con instructores de conducción autorizados por el Ministerio de Transporte y docentes evaluadores certificados en normas de competencia laboral por el SENA.',
    ],
    ctaPrincipal: 'Solicitar capacitación',
    bloquesKicker: 'Programas',
    bloquesTitulo: 'Líneas de capacitación',
    bloques: [
      {
        icon: '☣️',
        titulo: 'Transporte de mercancías peligrosas',
        texto: 'Curso básico obligatorio según Decreto 1609 de 2002. Énfasis en medidas de seguridad y atención de emergencias.',
        imagenId: 'foto1',
      },
      {
        icon: '🚛',
        titulo: 'Cargas extra pesadas y extra dimensionadas',
        texto: 'Contenidos de la Resolución 1724 de 2007 para acompañamiento técnico en vías rurales y urbanas.',
        imagenId: 'foto2',
      },
      {
        icon: '🚦',
        titulo: 'Normas de tránsito y seguridad vial',
        texto: 'Código Nacional de Tránsito, estatuto del transporte y decretos de servicio público de pasajeros y carga.',
        imagenId: 'foto3',
      },
      {
        icon: '👮',
        titulo: 'Actualización para agentes de tránsito',
        texto: 'Cursos de actualización acordes al nuevo sistema oral de la justicia.',
      },
      {
        icon: '🛡️',
        titulo: 'Manejo defensivo',
        texto: 'Técnicas de conducción para prevenir accidentes y reducir siniestralidad.',
      },
      {
        icon: '🔧',
        titulo: 'Mecánica básica automotriz',
        texto: 'Motores diésel, alistamiento vehicular y mantenimiento preventivo.',
      },
      {
        icon: '🧯',
        titulo: 'Extinción de incendios',
        texto: 'Prevención, reacción ante emergencias y uso de extintores.',
      },
      {
        icon: '➕',
        titulo: 'Primeros auxilios para conductores',
        texto: 'Atención inmediata a heridos en accidentes y choques de tránsito.',
      },
      {
        icon: '🦺',
        titulo: 'Seguridad industrial HSE',
        texto: 'Salud, seguridad y medio ambiente para el sector transportador.',
      },
      {
        icon: '🎓',
        titulo: 'Normas de competencia laboral',
        texto: 'Programas basados en titulaciones del SENA: alistamiento vehicular, conducción y atención al cliente.',
      },
    ],
    productoKicker: 'Centro de enseñanza',
    productoNombre: 'CEA e Instituto Servial',
    productoLead: 'Licencias de conducción y formación técnica habilitados ante el Ministerio de Transporte.',
    productoParrafos: [
      'Centro de Enseñanza Automovilística habilitado — Resoluciones 2267 y 2294 de 2014 Mintransporte.',
      'Instituto de educación para el trabajo y el desarrollo humano — Resoluciones 999, 1000, 1192 y 1090 de las secretarías de educación.',
      'Categorías A2, B2, C1, C2 y C3 con instructores certificados y calidad TÜV Rheinland.',
    ],
    cierreQuote: 'Calidad, amabilidad y eficiencia en cada proceso formativo.',
    ctaBtnPrincipal: 'Solicitar información',
    metaDescription:
      'Capacitación Servial Colombia: mercancías peligrosas, manejo defensivo, normas de tránsito, primeros auxilios, HSE y competencias laborales SENA.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Capacitación Servial Colombia' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Capacitación en seguridad vial' },
      { id: 'foto1', etiqueta: 'Mercancías peligrosas', url: '', alt: 'Curso mercancías peligrosas' },
      { id: 'foto2', etiqueta: 'Carga especial', url: '', alt: 'Carga extra pesada' },
      { id: 'foto3', etiqueta: 'Normas de tránsito', url: '', alt: 'Normas de tránsito' },
    ],
  },
  peridata: {
    estilo: 'default',
    theme: 'gold',
    menuLabel: 'Asesoría en tránsito',
    kicker: 'Orientación especializada',
    tituloLinea: 'ASESORÍA EN',
    tituloAcento: 'TRÁNSITO Y TRANSPORTE',
    lead: 'Orientamos sobre normas, regulaciones y procedimientos del sector.',
    heroParrafos: [
      'Informamos sobre trámites, consultas y peticiones relacionadas con tránsito y transporte.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Acompañamiento en tránsito y transporte',
    introLead: 'Respuestas claras para conductores, empresas y usuarios del sistema.',
    introParrafos: [
      'Orientamos a nuestros usuarios sobre las normas, regulaciones y procedimientos de tránsito vigentes en Colombia.',
      'Brindamos información sobre trámites, consultas y peticiones relacionadas con tránsito y transporte, con atención seria, oportuna y ágil.',
    ],
    dashboardFiltros: [],
    dashboardStats: [],
    preguntas: [],
    bloquesKicker: 'Alcance',
    bloquesTitulo: '¿En qué le asesoramos?',
    bloques: [
      { icon: '📋', titulo: 'Normas y procedimientos', texto: 'Interpretación y aplicación de la normativa de tránsito y transporte.' },
      { icon: '🏛️', titulo: 'Trámites y consultas', texto: 'Orientación en procesos ante organismos de tránsito y entidades del sector.' },
      { icon: '🚚', titulo: 'Sector transportador', texto: 'Requisitos y obligaciones para empresas y conductores profesionales.' },
      { icon: '📞', titulo: 'Atención personalizada', texto: 'Respuesta ágil a sus inquietudes por teléfono, correo o en nuestras instalaciones.' },
    ],
    cierreQuote: 'Prestamos servicios con calidad, amabilidad y eficiencia.',
    ctaBtnPrincipal: 'Solicitar asesoría',
    metaDescription:
      'Asesoría en tránsito y transporte — Servial Colombia: normas, trámites, consultas y orientación para el sector transportador.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Asesoría en tránsito Servial' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Asesoría tránsito y transporte' },
    ],
  },
  planeacionGestionVial: {
    menuLabel: 'Consultoría',
    kicker: 'Asesoría técnica y legal',
    tituloLinea: 'CONSULTORÍA',
    tituloAcento: 'EN TRÁNSITO Y TRANSPORTE',
    lead: 'Asesoría técnica y legal acorde a las necesidades de su empresa.',
    heroParrafos: [
      'Brindamos consultoría especializada en tránsito, transporte, movilidad y seguridad vial para empresas e instituciones.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Soluciones técnicas y legales para su organización',
    introLead: 'Planes, estudios y acompañamiento conforme a la normativa colombiana.',
    introParrafos: [
      'Formulamos planes de manejo de tránsito para obras que intervienen la malla vial, estudios para la toma de decisiones en movilidad y seguridad, y asesoría en la creación de empresas de transporte en sus diferentes modalidades.',
      'Diseñamos el plan estratégico de seguridad vial conforme a la Ley 1503 de 2011 para entidades públicas y privadas con flotas superiores a diez unidades o personal de conductores.',
    ],
    bloquesKicker: 'Servicios',
    bloquesTitulo: 'Líneas de consultoría',
    bloques: [
      {
        icon: '🚧',
        titulo: 'Planes de manejo de tránsito',
        texto: 'Propuestas técnicas para minimizar el impacto de obras en la movilidad de usuarios de la vía.',
      },
      {
        icon: '🏢',
        titulo: 'Conformación de empresas de transporte',
        texto: 'Asesoría en la creación de empresas en las diferentes modalidades del transporte.',
      },
      {
        icon: '🛡️',
        titulo: 'Plan estratégico de seguridad vial',
        texto: 'Formulación conforme a la Ley 1503 de 2011 para flotas y conductores.',
      },
      {
        icon: '⚖️',
        titulo: 'Asesoría legal en accidentes de tránsito',
        texto: 'Acompañamiento con abogados y técnicos en criminalística; reclamaciones SOAT y pólizas.',
      },
    ],
    cierreQuote: 'Fomentamos la cultura vial con soluciones serias y oportunas.',
    ctaBtnPrincipal: 'Solicitar consultoría',
    metaDescription:
      'Consultoría Servial Colombia: planes de manejo de tránsito, seguridad vial Ley 1503, empresas de transporte y asesoría legal en accidentes.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Consultoría Servial Colombia' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Consultoría en tránsito' },
    ],
  },
  estudiosDiagnosticosTecnicos: {
    menuLabel: 'Estudios de tránsito',
    kicker: 'Análisis técnico',
    tituloLinea: 'ESTUDIOS DE TRÁNSITO',
    tituloAcento: 'Y MOVILIDAD',
    lead: 'Herramientas para la toma de decisiones en movilidad y seguridad vial.',
    heroParrafos: [
      'Estudios que brindan insumos para implementar medidas de seguridad, movilidad y señalización vial.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Diagnóstico para decisiones informadas',
    introLead: 'Análisis técnico del territorio y del sistema de transporte.',
    introParrafos: [
      'Realizamos estudios de tránsito y movilidad que buscan brindar herramientas para la toma de decisiones en materia de movilidad, implementación de medidas de seguridad y señalización vial.',
      'Nuestro equipo aplica criterios técnicos para identificar problemas de circulación, riesgos y oportunidades de mejora en corredores y zonas de influencia.',
    ],
    bloquesKicker: 'Alcance',
    bloquesTitulo: 'Tipos de estudio',
    bloques: [
      { icon: '🗺️', titulo: 'Movilidad y circulación', texto: 'Análisis de flujos, conflictos y capacidad de la infraestructura vial.', imagenId: 'foto1' },
      { icon: '🛑', titulo: 'Seguridad y señalización', texto: 'Propuestas de intervención en puntos críticos y señalización vial.', imagenId: 'foto2' },
      { icon: '📊', titulo: 'Soporte a la gestión', texto: 'Insumos para planes de manejo de tránsito y políticas locales de movilidad.', imagenId: 'foto3' },
    ],
    cierreQuote: 'Del análisis técnico a la acción en el territorio.',
    ctaBtnPrincipal: 'Solicitar estudio',
    metaDescription:
      'Estudios de tránsito y movilidad — Servial Colombia: diagnóstico vial, seguridad y señalización para entidades y empresas.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Estudios de tránsito Servial' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Estudios de movilidad' },
      { id: 'foto1', etiqueta: 'Movilidad', url: '', alt: 'Estudio de movilidad' },
      { id: 'foto2', etiqueta: 'Seguridad vial', url: '', alt: 'Seguridad vial' },
      { id: 'foto3', etiqueta: 'Gestión', url: '', alt: 'Gestión de tránsito' },
    ],
  },
  herramientasEducativasTecnologicas: {
    estilo: 'default',
    theme: 'gold',
    menuLabel: 'Soluciones informáticas',
    kicker: 'Tecnología aplicada',
    tituloLinea: 'SOLUCIONES',
    tituloAcento: 'INFORMÁTICAS',
    lead: 'Herramientas digitales para la gestión y la formación en el sector transportador.',
    heroParrafos: [
      'Desarrollamos soluciones informáticas que apoyan la capacitación, la gestión y la operación de empresas de tránsito y transporte.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Tecnología al servicio del sector vial',
    introLead: 'Plataformas y herramientas para formación y gestión.',
    introParrafos: [
      'Servial Colombia integra soluciones informáticas dentro de su portafolio para acompañar procesos de capacitación virtual, gestión documental y herramientas de apoyo a la toma de decisiones en tránsito y transporte.',
      'Consulte con nuestro equipo las opciones disponibles para su empresa o entidad.',
    ],
    ecosistemaItems: [],
    gamificacionItems: [],
    bloques: [],
    listaTitulo: 'Áreas de solución',
    listaServicios: [
      {
        titulo: 'Aula virtual y campus digital',
        texto: 'Plataforma de formación en línea para cursos y programas de capacitación.',
      },
      {
        titulo: 'Gestión documental',
        texto: 'Herramientas para organizar expedientes, certificados y registros de capacitación.',
      },
      {
        titulo: 'Soporte a la operación',
        texto: 'Soluciones a la medida para empresas del sector transportador.',
      },
    ],
    productoNombre: '',
    cierreQuote: 'Innovación al servicio de la seguridad vial y el transporte.',
    ctaBtnPrincipal: 'Consúltenos',
    metaDescription:
      'Soluciones informáticas Servial Colombia: aula virtual, gestión documental y herramientas para el sector transportador.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Soluciones informáticas Servial' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Tecnología Servial' },
    ],
  },
  inventariosViales: {
    activa: false,
    menuLabel: 'Inventarios viales',
    tituloLinea: 'INVENTARIOS VIALES',
    tituloAcento: '',
    lead: '',
    introParrafos: [],
    bloques: [],
    metaDescription: '',
  },
};

export const SERVIAL_SERVICIOS_HUB_GUION_VERSION = 1;

export const SERVIAL_HUB_TARJETAS: PortalServiciosHubTarjeta[] = [
  {
    icon: '☣️',
    titulo: 'Curso de Mercancías Peligrosas',
    lead: 'Capacitación en transporte de sustancias peligrosas para conductores y empresas del sector transportador.',
    url: '/mercancias-peligrosas',
    cta: 'Ver Curso de Mercancías Peligrosas',
  },
  {
    icon: '🦺',
    titulo: 'Curso de Trabajo Seguro en Alturas',
    lead: 'Formación en trabajo seguro en alturas conforme a la normativa vigente en Colombia.',
    url: '/trabajo-en-alturas',
    cta: 'Ver Curso de Trabajo en Alturas',
  },
  {
    icon: '➕',
    titulo: 'Curso de Primeros Auxilios',
    lead: 'Atención inicial de emergencias y primeros auxilios para conductores, trabajadores y empresas.',
    url: '/curso-primeros-auxilios',
    cta: 'Ver Curso de Primeros Auxilios',
  },
  {
    icon: '🛡️',
    titulo: 'Curso de Manejo Defensivo',
    lead: 'Técnicas de conducción preventiva para reducir riesgos y siniestralidad en la vía.',
    url: '/curso-manejo-defensivo',
    cta: 'Ver Curso de Manejo Defensivo',
  },
  {
    icon: '🚛',
    titulo: 'Cursos para Transporte de Carga',
    lead: 'Formación en normas y operación segura para el transporte de carga.',
    url: '/cursos-transporte-de-carga/',
    cta: 'Ver Cursos de Transporte de Carga',
    externo: true,
  },
  {
    icon: '🚗',
    titulo: 'Cursos para Licencias de Conducción',
    lead: 'Cursos A2, B2, C1, C2 y C3 con instructores certificados en Villavicencio.',
    url: '/licencias-de-conduccion/',
    cta: 'Ver Cursos de Conducción',
    externo: true,
  },
  {
    icon: '💻',
    titulo: 'Aula Virtual y Cursos Online',
    lead: 'Cursos y programas en línea en seguridad vial, tránsito y transporte.',
    url: '/servicios/aula-virtual',
    cta: 'Acceder al Aula Virtual',
  },
  {
    icon: '🎓',
    titulo: 'Capacitación Empresarial',
    lead: 'Programas de formación especializada para empresas del sector transportador.',
    url: '/servicios/capacitacion-sensibilizacion',
    cta: 'Conocer Capacitación',
  },
];

export const SERVIAL_HUB_FAQ: PortalServiciosHubFaq[] = [
  {
    pregunta: '¿Qué cursos ofrece SERVIAL Colombia?',
    respuesta:
      'SERVIAL Colombia ofrece diferentes programas de formación relacionados con conducción, transporte, seguridad vial, prevención de riesgos y capacitación especializada para personas y empresas.',
  },
  {
    pregunta: '¿Dónde está ubicado SERVIAL Colombia?',
    respuesta:
      'SERVIAL Colombia se encuentra en Villavicencio, Meta, y atiende participantes y organizaciones de Villavicencio, el Meta y los Llanos Orientales.',
  },
  {
    pregunta: '¿SERVIAL ofrece capacitación para empresas?',
    respuesta:
      'Sí. SERVIAL desarrolla programas de capacitación dirigidos a empresas y organizaciones, de acuerdo con sus necesidades de formación y los cursos disponibles.',
  },
];

export const SERVIAL_PORTAFOLIO_HUB = {
  guionVersion: SERVIAL_SERVICIOS_HUB_GUION_VERSION,
  kicker: 'SERVIAL Colombia',
  tituloLinea: 'Servicios de Formación y Capacitación en Villavicencio',
  tituloAcento: '',
  lead:
    'SERVIAL Colombia ofrece cursos, capacitación y formación especializada para conductores, trabajadores, empresas e instituciones en Villavicencio, Meta y los Llanos Orientales.',
  gridTitulo: 'Nuestros Cursos y Servicios',
  gridLead: '',
  seoTextoTitulo: 'Formación y capacitación con SERVIAL Colombia',
  seoTextoParrafos: [
    'SERVIAL Colombia brinda servicios de formación y capacitación en Villavicencio, Meta, dirigidos a conductores, trabajadores, empresas e instituciones que requieren fortalecer sus conocimientos y competencias en seguridad vial, transporte, conducción segura y prevención de riesgos.',
    'Nuestra oferta incluye cursos de conducción, transporte de carga, mercancías peligrosas, trabajo seguro en alturas, primeros auxilios y diferentes programas de capacitación especializada, disponibles de acuerdo con los requisitos y características de cada formación.',
    'Desde Villavicencio atendemos participantes y organizaciones del Meta y los Llanos Orientales, combinando formación presencial y herramientas educativas virtuales para facilitar el acceso a programas de actualización y capacitación.',
    'En SERVIAL promovemos una formación orientada al desarrollo de competencias, la prevención de riesgos y el cumplimiento de la normativa aplicable en Colombia.',
  ],
  localTitulo: 'Servicios de Capacitación en Villavicencio, Meta',
  localTexto:
    'SERVIAL Colombia está ubicado en Villavicencio y ofrece programas de formación para personas y empresas de la ciudad, el departamento del Meta y los Llanos Orientales.',
  localDireccion: 'Calle 37B #19A-65, barrio Jordán, Villavicencio, Meta.',
  localTelefono: '321 303 9595',
  localEmail: 'info@servial.com.co',
  faqTitulo: 'Preguntas frecuentes',
  faq: SERVIAL_HUB_FAQ,
  tarjetas: SERVIAL_HUB_TARJETAS,
  heroImagenAlt: 'Cursos y servicios de capacitación SERVIAL Colombia',
  heroImagenPrompt:
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Grupo diverso de conductores y trabajadores en capacitación de seguridad vial y transporte, ambiente profesional y moderno. Luz natural. Villavicencio, Meta, Llanos Orientales, Colombia. Personas adultas latinoamericanas auténticas. Sin texto sobre la imagen, sin logos, sin marcas comerciales, sin marca de agua.',
  heroStats: ['Villavicencio, Meta', 'Llanos Orientales', 'Personas y empresas'],
  highlightIcon: 'shield-check',
  highlightTitle: 'Únicos con calidad certificada',
  highlightSubtitle: 'Formación presencial y virtual en Villavicencio y el Meta',
  heroHighlightRadar: true,
  formacionImagenUrl: '',
  formacionImagenAlt: 'Capacitación en seguridad vial en Villavicencio',
  formacionImagen2Url: '',
  formacionImagen2Alt: 'Cursos para conductores y empresas en Villavicencio Meta',
};

export const SERVIAL_PORTAFOLIO_MENU_LABEL = 'Nuestros servicios';
