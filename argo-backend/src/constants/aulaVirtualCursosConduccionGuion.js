/** Guion SEO v1 — /cursos-conduccion SERVIAL Colombia */

const CC_LICENCIAS_URL = 'https://servial.com.co/licencias-de-conduccion/';
const CC_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Calle+37B+%2319A-65,+Villavicencio,+Meta,+Colombia';

const CURSOS_CONDUCCION_GUION = {
  guionVersion: 1,
  hero: {
    kicker: 'CEA SERVIAL Colombia',
    imagenUrl: '',
    imagenAlt: 'Cursos de conducción en Villavicencio Meta',
    pillarsLabel: 'Formación de conductores',
    mostrarBadgeVirtual: true,
    virtualBadgeLabel: 'VIRTUAL',
  },
  tituloPrincipal: 'Cursos de Conducción A2, B2, C1, C2 y C3 en Villavicencio',
  textoInstitucional:
    'CEA SERVIAL Colombia ofrece cursos de conducción en Villavicencio, Meta, con formación teórica, práctica y de taller para las categorías A2, B2, C1, C2 y C3, orientados al desarrollo de conductores seguros, responsables y competentes.',
  invitacion: {
    kicker: 'Formación integral',
    titulo: '¿Qué aprenderás en nuestros Cursos de Conducción?',
    lead:
      'Desarrollarás conocimientos, habilidades y comportamientos para una conducción segura y responsable en la vía.',
    institucion:
      'CEA SERVIAL Colombia es un Centro de Enseñanza Automovilística con sede en Villavicencio, Meta.',
    beneficios: [
      {
        icon: 'shield-check',
        titulo: 'Seguridad vial',
        texto: 'Normas de tránsito, prevención del riesgo y conducción responsable.',
      },
      {
        icon: 'academic-cap',
        titulo: 'Competencias al volante',
        texto: 'Técnicas de conducción segura adaptadas a cada categoría de licencia.',
      },
      {
        icon: 'wrench',
        titulo: 'Conocimiento del vehículo',
        texto: 'Actividades de taller para verificar elementos de seguridad y mantenimiento básico.',
      },
    ],
    destacado: 'La formación combina teoría, práctica y taller según la categoría de licencia que elijas.',
    cierre: 'Avanza con instructores certificados y un plan de capacitación alineado con la normativa vigente.',
    firma: '',
    btnCursos: '',
    btnRegistro: 'Inscribirme al curso',
  },
  licencias: {
    kicker: 'Categorías de Licencia de Conducción',
    titulo: 'Cursos de Conducción Disponibles',
    lead:
      'Formación para motocicletas, vehículos de servicio particular y servicio público, conforme a la clasificación oficial del Ministerio de Transporte.',
    items: [
      {
        icon: 'bicycle',
        codigo: 'A2',
        titulo: 'Curso de Conducción A2 – Motocicletas',
        incluye: [
          'Formación para conducción de motocicletas, motociclos y mototriciclos de más de 125 c.c., mediante preparación teórica, práctica y técnicas de conducción segura.',
        ],
        licenciaLabel: 'Categoría A2',
        valor: 'Consulte valor en sede',
        btnTexto: 'Consultar Curso A2',
        btnUrl: '/registro',
        destacada: false,
      },
      {
        icon: 'truck',
        codigo: 'B2',
        titulo: 'Curso de Conducción B2 – Camiones, Busetas y Buses Particulares',
        subtitulo: 'Curso B2 en Villavicencio',
        incluye: [
          'Capacitación para conducción de camiones rígidos, busetas y buses de servicio particular, desarrollando competencias para una conducción segura y responsable.',
        ],
        licenciaLabel: 'Categoría B2',
        valor: 'Consulte valor en sede',
        btnTexto: 'Consultar Curso B2',
        btnUrl: '/registro',
        destacada: true,
      },
      {
        icon: 'bus',
        codigo: 'C1',
        titulo: 'Curso de Conducción C1 – Servicio Público',
        incluye: [
          'Formación para conducción de automóviles, camperos, camionetas y microbuses destinados al servicio público.',
        ],
        licenciaLabel: 'Categoría C1',
        valor: 'Consulte valor en sede',
        btnTexto: 'Consultar Curso C1',
        btnUrl: '/registro',
        destacada: false,
      },
      {
        icon: 'truck',
        codigo: 'C2',
        titulo: 'Curso de Conducción C2 – Camiones y Buses de Servicio Público',
        incluye: [
          'Capacitación para la conducción de camiones rígidos, busetas y buses de servicio público.',
        ],
        licenciaLabel: 'Categoría C2',
        valor: 'Consulte valor en sede',
        btnTexto: 'Consultar Curso C2',
        btnUrl: '/registro',
        destacada: false,
      },
      {
        icon: 'truck',
        codigo: 'C3',
        titulo: 'Curso de Conducción C3 – Vehículos Articulados',
        incluye: [
          'Formación especializada para la conducción de vehículos articulados de servicio público.',
        ],
        licenciaLabel: 'Categoría C3',
        valor: 'Consulte valor en sede',
        btnTexto: 'Consultar Curso C3',
        btnUrl: '/registro',
        destacada: false,
      },
    ],
  },
  metodologiaTitulo: 'Formación Teórica, Práctica y de Taller',
  metodologiaLead:
    'El proceso de aprendizaje integra actividades teóricas, prácticas y de taller para cada categoría de licencia.',
  metodologiaItems: [
    {
      titulo: 'Formación teórica',
      texto:
        'Normas de tránsito, seguridad vial, señalización, prevención del riesgo y comportamiento responsable en la vía.',
    },
    {
      titulo: 'Práctica en conducción',
      texto:
        'Desarrollo de habilidades de manejo en condiciones reales, con acompañamiento de instructores certificados.',
    },
    {
      titulo: 'Práctica en taller',
      texto:
        'Conocimiento básico del vehículo, verificación de elementos de seguridad y mantenimiento preventivo.',
    },
  ],
  requisitosTitulo: 'Requisitos para realizar un Curso de Conducción',
  requisitosLead:
    'Para inscribirse al curso debe cumplir los requisitos de ingreso al CEA. Para la licencia de conducción, el proceso oficial se tramita ante el RUNT.',
  requisitosTexto:
    'Para obtener por primera vez una licencia en Colombia se requiere, entre otros aspectos, estar inscrito en RUNT, aprobar la formación y los exámenes correspondientes y contar con certificado de capacitación expedido por un CEA registrado.',
  requisitosLicenciaTexto: '¿Quieres conocer el proceso para obtener tu licencia?',
  requisitosLicenciaEnlaceTexto: 'Consulta los requisitos para la licencia de conducción',
  requisitosBtnTexto: 'Ver requisitos para la licencia de conducción',
  requisitosBtnUrl: CC_LICENCIAS_URL,
  seoTextoTitulo: 'Escuela de Conducción en Villavicencio, Meta',
  seoTextoParrafos: [
    'CEA SERVIAL Colombia brinda cursos de conducción en Villavicencio, Meta, para las categorías A2, B2, C1, C2 y C3. Nuestra formación está orientada al desarrollo de conocimientos, habilidades y comportamientos necesarios para una conducción segura y responsable.',
    'El proceso de aprendizaje integra formación teórica, práctica y actividades de taller relacionadas con normas de tránsito, seguridad vial, técnicas de conducción, prevención del riesgo y conocimiento básico del vehículo, de acuerdo con la categoría seleccionada.',
    'Como Centro de Enseñanza Automovilística, SERVIAL acompaña a sus estudiantes durante su proceso de capacitación para que desarrollen las competencias necesarias antes de presentar los requisitos correspondientes para la obtención de la licencia de conducción en Colombia.',
    'Nuestra sede se encuentra en Villavicencio, Meta, y atendemos personas interesadas en formación para motocicletas, vehículos particulares, servicio público y vehículos de mayor capacidad.',
  ],
  faqTitulo: 'Preguntas Frecuentes sobre Cursos de Conducción',
  faq: [
    {
      pregunta: '¿Qué categorías de conducción ofrece SERVIAL en Villavicencio?',
      respuesta:
        'CEA SERVIAL Colombia ofrece formación para las categorías A2, B2, C1, C2 y C3, de acuerdo con la habilitación y disponibilidad correspondiente.',
    },
    {
      pregunta: '¿Dónde puedo realizar un curso de conducción en Villavicencio?',
      respuesta:
        'SERVIAL cuenta con sede en Villavicencio, Meta, en la Calle 37B #19A-65, barrio Jordán.',
    },
    {
      pregunta: '¿Qué vehículos puedo conducir con categoría A2?',
      respuesta:
        'La categoría A2 corresponde a motocicletas, motociclos y mototriciclos con cilindrada superior a 125 c.c.',
    },
    {
      pregunta: '¿Para qué vehículos sirve la categoría B2?',
      respuesta:
        'La categoría B2 corresponde a camiones rígidos, busetas y buses destinados al servicio particular.',
    },
    {
      pregunta: '¿Cuál es la diferencia entre C1, C2 y C3?',
      respuesta:
        'C1 corresponde principalmente a vehículos livianos de servicio público; C2 a camiones rígidos, buses y busetas de servicio público; y C3 a vehículos articulados de servicio público.',
    },
  ],
  inscripcionesTitulo: 'Inscripciones a Cursos de Conducción en Villavicencio',
  inscripcionesLead: 'Realice su formación como conductor con CEA SERVIAL Colombia en Villavicencio.',
  localTitulo: 'Cursos de Conducción en Villavicencio, Meta',
  localLead:
    'Consulte disponibilidad, requisitos y horarios para las categorías A2, B2, C1, C2 y C3.',
  localDireccion: 'Calle 37B #19A-65, barrio Jordán, Villavicencio, Meta.',
  localWhatsApp: '321 303 9595',
  localWhatsAppUrl: 'https://wa.me/573213039595',
  localTelefono: '316 406 3074',
  localBtnMapsTexto: 'Cómo llegar a SERVIAL',
  localBtnMapsUrl: CC_MAPS_URL,
  localBtnWhatsappTexto: 'Consultar curso por WhatsApp',
  enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
  enlacesRelacionados: [
    {
      texto: '¿Necesitas capacitación complementaria para conductores?',
      etiqueta: 'Ver Curso de Manejo Defensivo',
      url: '/curso-manejo-defensivo',
    },
    {
      texto: '¿Prefieres formación virtual?',
      etiqueta: 'Acceder al Aula Virtual de SERVIAL',
      url: '/servicios/aula-virtual',
    },
    {
      texto: 'Consulta el estado de la normativa del examen teórico.',
      etiqueta: 'Ver información del examen teórico',
      url: '/examen-teorico',
    },
  ],
  resoluciones: [
    { titulo: 'Resolución 2267 de 06/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
    { titulo: 'Resolución 2294 del 11/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
  ],
  publicidad: { activo: true, intervaloSegundos: 5, slides: [] },
};

module.exports = { CURSOS_CONDUCCION_GUION };
