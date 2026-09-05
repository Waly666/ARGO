import { PortalFinstruvialServicioLanding } from './finstruvial-servicio-landing.types';
import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';

/** Contenido portafolio Servial Colombia (PDF portafolio servicios). */
export const SERVIAL_SERVICIOS_WIREFRAME: Partial<
  Record<FinstruvialServicioSlug, Partial<PortalFinstruvialServicioLanding>>
> = {
  aulaVirtual: {
    estilo: 'academy',
    theme: 'gold',
    menuLabel: 'Aula Virtual',
    kicker: 'Plataforma educativa',
    tituloLinea: 'AULA VIRTUAL',
    tituloAcento: 'SERVIAL COLOMBIA',
    lead: 'Formación en línea desde cualquier lugar y a cualquier hora.',
    heroParrafos: [
      'Prestamos servicios de capacitación con horarios flexibles y la posibilidad de tomar clases en ambientes virtuales desde nuestra aula virtual por internet.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Aula Virtual Servial Colombia',
    introLead:
      'Capacitación acorde a las necesidades de su empresa, con acceso desde cualquier lugar.',
    introParrafos: [
      'El Aula Virtual de Servial Colombia integra conocimiento técnico, recursos multimedia, actividades de aprendizaje y evaluación para conductores, instructores, empresas del sector transportador y demás actores vinculados al tránsito, el transporte y la seguridad vial.',
      'Combinamos flexibilidad, contenidos aplicados y formación orientada al saber, saber hacer y ser, para transformar el conocimiento en decisiones responsables y comportamientos seguros en la vía.',
    ],
    ctaPrincipal: 'Ingresar al aula',
    ctaPrincipalUrl: '/aula',
    ctaSecundario: 'Ver cursos',
    ctaSecundarioUrl: '/cursos',
    pilaresEducativos: [
      { icon: '📖', titulo: 'SABER', texto: 'Normas, procedimientos y fundamentos técnicos de seguridad vial.' },
      { icon: '🛠️', titulo: 'SABER HACER', texto: 'Aplicación del conocimiento en situaciones reales de conducción y operación.' },
      { icon: '💚', titulo: 'SER', texto: 'Responsabilidad, prevención y compromiso con la vida en las vías.' },
    ],
    rutaAprendizaje: ['ESTUDIAR', 'COMPRENDER', 'PRACTICAR', 'APLICAR', 'EVALUAR', 'CERTIFICARSE'],
    bloquesKicker: 'Cursos',
    bloquesTitulo: 'Programas en línea',
    usarCatalogoCursos: true,
    bloques: [],
    experienciaSeccionKicker: 'Metodología',
    experienciaSeccionTitulo: 'Experiencia educativa',
    experienciaItems: [
      { icon: '🎥', titulo: 'Contenido multimedia', texto: 'Videos, lecturas y recursos interactivos.' },
      { icon: '📝', titulo: 'Actividades', texto: 'Ejercicios prácticos y casos del sector transportador.' },
      { icon: '✅', titulo: 'Evaluaciones', texto: 'Verificación de aprendizajes y competencias.' },
      { icon: '🏅', titulo: 'Certificación', texto: 'Cuando aplique conforme al programa ofrecido.' },
    ],
    cierreQuote: 'Únicos con calidad certificada en formación vial — Villavicencio, Meta.',
    ctaBtnPrincipal: 'Ingresar al aula',
    metaDescription:
      'Aula Virtual Servial Colombia: cursos en línea en seguridad vial, normas de tránsito y capacitación para conductores y empresas.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Aula Virtual Servial Colombia' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Campus virtual Servial' },
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
      'Categorías A2, B1, C1, C2 y C3 con instructores certificados y calidad TÜV Rheinland.',
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

export const SERVIAL_PORTAFOLIO_HUB = {
  kicker: 'Portafolio de servicios',
  tituloLinea: 'SERVICIOS',
  tituloAcento: 'SERVIAL COLOMBIA',
  lead:
    'Capacitación, asesoría, consultoría y soluciones informáticas en tránsito, transporte, movilidad y seguridad vial.',
  gridTitulo: 'Nuestros servicios',
  gridLead:
    'Especialistas en el sector transportador colombiano — Villavicencio, Meta.',
  heroImagenAlt: 'Portafolio de servicios Servial Colombia',
};

export const SERVIAL_PORTAFOLIO_MENU_LABEL = 'Nuestros servicios';
