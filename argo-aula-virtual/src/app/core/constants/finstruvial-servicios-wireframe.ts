import { PortalFinstruvialServicioLanding } from './finstruvial-servicio-landing.types';
import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';

/** Contenido GUI / wireframe por línea de servicio (fusionado con defaults base). */
export const FINSTRUVIAL_SERVICIOS_WIREFRAME: Partial<
  Record<FinstruvialServicioSlug, Partial<PortalFinstruvialServicioLanding>>
> = {
  estudiosDiagnosticosTecnicos: {
    kicker: 'Consultoría técnica',
    tituloLinea: 'ESTUDIOS Y DIAGNÓSTICOS',
    tituloAcento: 'TÉCNICOS',
    lead: 'Información técnica para comprender la movilidad y tomar mejores decisiones.',
    heroParrafos: [
      'En la Fundación FINSTRUVIAL contamos con un equipo multidisciplinario especializado en la realización de estudios y diagnósticos técnicos orientados a mejorar la movilidad, la infraestructura vial y la seguridad en el tránsito.',
    ],
    introKicker: '25 años de experiencia',
    introTitulo: 'Diagnóstico riguroso y basado en evidencia',
    introParrafos: [
      'Analizamos de forma rigurosa aspectos como rutas, horarios, oferta y demanda de transporte público, taxis y tarifas, garantizando un enfoque equilibrado entre eficiencia operativa y sostenibilidad económica. Identificamos puntos críticos y zonas de alta siniestralidad, así como velocidades riesgosas, para proponer soluciones estratégicas y basadas en evidencia.',
      'Realizamos reconstrucciones de accidentes e informes IPAT con rigor técnico, útiles para procesos legales, administrativos y preventivos. Además, desarrollamos estudios de semaforización, señalización y perfiles viales de acuerdo con el Manual 2024, y brindamos asesoría en la creación de organismos de tránsito, habilitación de empresas del sector transporte y en la articulación con plataformas como el SINC. Cada diagnóstico es una herramienta para la toma de decisiones informadas que contribuyen a una movilidad más segura, eficiente y planificada.',
    ],
    heroVideoYoutubeUrl: '',
    ctaPrincipal: 'Solicitar estudio',
    bloquesKicker: 'Líneas de estudio',
    bloquesTitulo: '¿Qué estudios realizamos?',
    bloques: [
      {
        icon: '🚌',
        titulo: 'Estudios de movilidad',
        texto: 'Evaluamos la oferta y demanda del transporte para optimizar su funcionamiento.',
        imagenId: 'foto1',
      },
      {
        icon: '💰',
        titulo: 'Estudios tarifarios y económicos',
        texto:
          'Análisis técnicos para garantizar la equidad y sostenibilidad económica del servicio.',
        imagenId: 'foto2',
      },
      {
        icon: '⚠️',
        titulo: 'Estudios de puntos críticos',
        texto: 'Identificamos zonas de alto riesgo y proponemos intervenciones para su mitigación.',
        imagenId: 'foto3',
      },
      {
        icon: '🚘',
        titulo: 'Reconstrucción de siniestros viales',
        texto: 'Investigación técnica de siniestros viales para fines legales y preventivos.',
      },
      {
        icon: '🛣️',
        titulo: 'Estudios de infraestructura vial',
        texto: 'Evaluamos y diseñamos soluciones integrales en infraestructura vial.',
      },
      {
        icon: '📐',
        titulo: 'Estudios de perfiles viales',
        texto: 'Caracterización geométrica de vías para su adecuación y señalización.',
      },
      {
        icon: '🏛️',
        titulo: 'Estudios para organismos de tránsito',
        texto: 'Asesoría integral para establecer y fortalecer entidades locales de tránsito.',
      },
      {
        icon: '🌐',
        titulo: 'Articulación con el SINC',
        texto: 'Asistencia técnica en la articulación con sistemas nacionales de información.',
      },
      {
        icon: '📋',
        titulo: 'Formalización empresarial del transporte',
        texto: 'Apoyo completo en la formalización y reglamentación empresarial del transporte.',
      },
    ],
    productoKicker: 'Metodología',
    productoNombre: 'Del campo a la decisión',
    productoParrafos: [
      'Transformamos datos obtenidos en campo en información técnica útil para la toma de decisiones. Medimos, diagnosticamos, analizamos, proponemos y evaluamos cada intervención con rigor técnico y enfoque en resultados medibles para la movilidad y la seguridad vial.',
    ],
    productoVideoYoutubeUrl: '',
    metodologiaKicker: 'Proceso',
    metodologiaTitulo: 'Ruta metodológica',
    metodologiaPasos: ['MEDIR', 'DIAGNOSTICAR', 'ANALIZAR', 'PROPONER', 'EVALUAR'],
    metodologiaLead:
      'Cada estudio sigue una secuencia técnica que garantiza diagnósticos confiables y soluciones aplicables al territorio.',
    resultadoKicker: 'Entregables',
    resultadoTitulo: '¿Qué obtiene nuestro cliente?',
    resultadoIconos: [
      { icon: '📊', titulo: 'Diagnóstico técnico', texto: 'Evaluación integral de la situación de movilidad, tránsito o infraestructura.' },
      { icon: '🗺️', titulo: 'Información georreferenciada', texto: 'Mapas, capas y datos espaciales para apoyar la planificación.' },
      { icon: '📈', titulo: 'Indicadores', texto: 'Métricas de desempeño, riesgo y operación del sistema vial.' },
      { icon: '⚠️', titulo: 'Identificación de riesgos', texto: 'Puntos críticos, zonas de alta siniestralidad y velocidades riesgosas.' },
      { icon: '📑', titulo: 'Alternativas de solución', texto: 'Propuestas técnicas sustentadas en evidencia y normativa vigente.' },
      { icon: '🎯', titulo: 'Priorización de intervenciones', texto: 'Criterios para invertir recursos donde generan mayor impacto.' },
    ],
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Estudios y Diagnósticos Técnicos' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Estudios y Diagnósticos Técnicos' },
      { id: 'foto1', etiqueta: 'Foto 1 — Movilidad', url: '', alt: 'Estudio de movilidad' },
      { id: 'foto2', etiqueta: 'Foto 2 — Tarifas', url: '', alt: 'Estudio tarifario' },
      { id: 'foto3', etiqueta: 'Foto 3 — Puntos críticos', url: '', alt: 'Estudio de puntos críticos' },
    ],
    cierreQuote:
      'Finstruvial: donde la educación y la seguridad se encuentran con el progreso.',
    ctaBtnPrincipal: 'Solicitar asesoría',
    metaDescription:
      'Estudios y diagnósticos técnicos en movilidad, transporte, infraestructura vial, puntos críticos, IPAT, señalización y perfiles viales.',
    listaServicios: [],
  },
  planeacionGestionVial: {
    kicker: 'Instrumentos de planificación',
    tituloLinea: 'Planeación y Gestión',
    tituloAcento: 'Vial',
    lead: 'Del diagnóstico a la acción.',
    heroParrafos: [
      'Diseñamos instrumentos de planificación que permiten convertir los problemas de movilidad y seguridad vial en programas, proyectos, metas e indicadores medibles.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Planeación vial con base en datos',
    introLead:
      'Convertimos la información del territorio en instrumentos de planificación para tomar decisiones, gestionar la movilidad y mejorar la seguridad vial.',
    introParrafos: [
      'Diseñamos y acompañamos a las entidades territoriales en la formulación, actualización y seguimiento de instrumentos de planeación y gestión vial, integrando diagnóstico territorial, información georreferenciada, análisis de riesgos, infraestructura, movilidad y seguridad vial. Integramos información de campo, indicadores, mapas y herramientas de análisis para facilitar la priorización de proyectos, el seguimiento de acciones y la toma de decisiones institucionales.',
      'Del diagnóstico a la acción: planificación vial basada en datos para construir territorios más seguros, eficientes y sostenibles.',
    ],
    ctaPrincipal: 'Construir mi plan',
    bloquesKicker: 'Servicios principales',
    bloquesTitulo: 'Instrumentos de planificación vial',
    bloques: [
      {
        icon: '🏢',
        titulo: 'PESV',
        texto: 'Planes Estratégicos de Seguridad Vial: diagnóstico, gestión del riesgo, programas, indicadores, seguimiento y articulación con la gestión organizacional.',
      },
      {
        icon: '🏘️',
        titulo: 'PLSV',
        texto: 'Planes Locales de Seguridad Vial: diagnóstico territorial de siniestralidad, actores vulnerables, infraestructura, comportamiento y capacidad institucional.',
      },
      {
        icon: '🚧',
        titulo: 'PMT',
        texto: 'Planes de Manejo de Tránsito: soluciones temporales para proteger peatones, vehículos y trabajadores durante intervenciones sobre la vía.',
      },
      {
        icon: '🚲',
        titulo: 'PMSS',
        texto: 'Planes de Movilidad Sostenible y Segura: planeación integral de peatones, ciclistas, transporte público, infraestructura, seguridad vial y sostenibilidad.',
      },
    ],
    sistemaSeguroCentro: 'VIDA',
    sistemaSeguroItems: [
      'Personas seguras',
      'Velocidades seguras',
      'Vías seguras',
      'Vehículos seguros',
      'Gestión institucional',
    ],
    sistemaSeguroLead:
      'El error humano puede ocurrir. El sistema debe estar diseñado para evitar que ese error termine en muerte o lesiones graves.',
    metodologiaKicker: 'Enfoque',
    metodologiaTitulo: 'Ruta de implementación',
    metodologiaPasos: ['DIAGNÓSTICO', 'ESTRATEGIA', 'PROGRAMA', 'PROYECTO', 'INDICADOR', 'SEGUIMIENTO'],
    cierreQuote: 'Planes que transforman la movilidad con metas medibles y seguimiento real.',
    ctaBtnPrincipal: 'Solicitar asesoría',
    metaDescription:
      'Planeación y gestión vial: PESV, PLSV, PMT, PMSS y acompañamiento institucional con diagnóstico territorial, datos georreferenciados e indicadores.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen del banner', url: '', alt: 'Planeación y Gestión Vial' },
      { id: 'seccion', etiqueta: 'Imagen de presentación', url: '', alt: 'Planeación y gestión vial FINSTRUVIAL' },
    ],
    listaServicios: [],
  },
  inventariosViales: {
    estilo: 'tech',
    theme: 'green',
    kicker: 'Levantamiento técnico',
    tituloLinea: 'Inventarios Viales',
    tituloAcento: 'Georreferenciados',
    lead: 'Convertimos la infraestructura vial en información útil para su gestión.',
    heroParrafos: [
      'Identificamos, caracterizamos, georreferenciamos y evaluamos los elementos que conforman la infraestructura vial urbana y carretera.',
      'Con la plataforma INFRAVIAL, FINSTRUVIAL integra captura en campo, análisis, reportes y exportación SIG en un solo flujo institucional.',
    ],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Del levantamiento en campo a la decisión institucional',
    introLead:
      'Inventario vial con trazabilidad, cumplimiento normativo colombiano y datos listos para planear, priorizar y mantener.',
    introParrafos: [
      'Ejecutamos inventarios georreferenciados de señalización, semaforización, perfiles viales, categorización vial y metodología SINC, apoyados en INFRAVIAL: plataforma web y móvil diseñada para alcaldías, gobernaciones y secretarías de movilidad.',
      'Organizamos el trabajo por jornadas de campo con roles definidos, evidencia fotográfica y sincronización en zonas sin conectividad. Los datos se consolidan en mapas interactivos, estadísticas, reportes PDF con código QR y capas GeoJSON compatibles con QGIS y ArcGIS Pro.',
    ],
    ctaPrincipal: 'Solicitar inventario',
    bloquesKicker: 'Alcance',
    bloquesTitulo: '¿Qué inventariamos?',
    bloques: [
      { icon: '🛑', titulo: 'Señalización vertical', texto: 'Ubicación, catálogo, dimensiones, estado, visibilidad, reflectividad y cumplimiento técnico con reporte individual.' },
      { icon: '🛣️', titulo: 'Demarcación horizontal', texto: 'Líneas, pasos peatonales, símbolos, flechas y demás marcas viales georreferenciadas.' },
      { icon: '🚦', titulo: 'Semaforización', texto: 'Semáforos, caras, controladores, armarios de control semafórico y cajas de inspección.' },
      { icon: '📐', titulo: 'Perfiles y vía tramos', texto: 'Calzadas, carriles, separadores, andenes, bermas, clasificación V1–V9 y prelación vial.' },
      { icon: '📋', titulo: 'SINC v5 y carreteras', texto: 'Ejes de red, puentes, pontones, muros, túneles, sitios críticos, drenaje y estructura de pavimento.' },
      { icon: '📊', titulo: 'Categorización vial', texto: 'Clasificación PRIMARIA · SECUNDARIA · TERCIARIA según funcionalidad, TPD, diseño geométrico y población.' },
    ],
    productoKicker: 'Tecnología',
    productoNombre: 'INFRAVIAL',
    productoLead:
      'Gestiona, georreferencia y exporta tu inventario vial y de señalización — todo desde una sola plataforma.',
    productoImagenId: 'producto',
    productoEtiquetas: [
      '📍 Inventario georreferenciado',
      '📊 Categorización vial',
      '🛣️ SINC v5',
      '🗺️ Mapa + GeoJSON',
      '📱 App móvil offline',
      '🚗 Conteos en tiempo real',
      '📈 Dashboard y Excel',
      '🔒 Roles y auditoría',
    ],
    productoParrafos: [
      'INFRAVIAL es la plataforma con la que FINSTRUVIAL ejecuta inventarios viales para alcaldías, gobernaciones y secretarías de movilidad en Colombia. Menos hojas sueltas y más continuidad entre campo, oficina y reporte a ciudadanía o entes de control.',
      'Diseñada para gestión pública: interfaz profesional, modo claro/oscuro y experiencia alineada a estándares de software corporativo, con despliegue seguro y trazabilidad por jornada, supervisor y territorio.',
      'La categorización vial documenta cada vía con criterios estandarizados — funcionalidad, TPD, diseño geométrico y población del área de influencia — y calcula automáticamente la clasificación PRIMARIA · SECUNDARIA · TERCIARIA, con tramo georreferenciado y datos del funcionario responsable.',
      'El módulo SINC organiza la red en ejes y abre el detalle de cada tramo con inventario en capas: señales verticales y horizontales, semáforos, cajas de inspección y control semafórico, con lectura clara para supervisión, interventoría y auditoría.',
      'Cada elemento queda vinculado a coordenadas GPS precisas, visible en el mapa integrado y exportable en GeoJSON (WGS84 / EPSG:4326) para QGIS, ArcGIS Pro u otras herramientas SIG — con fotos de campo en atributos y campo popup_html para map tips.',
      'Incluye conteos vehiculares en tiempo real: estaciones, sentidos, categorías configurables y panel del supervisor vía SSE; respaldos cifrados, importación masiva desde Excel y roles admin, supervisor, encuestador e invitado.',
      'Los datos alimentan PESEV, PLSV y planes de movilidad: de la configuración del municipio al registro en campo y al análisis con dashboard, reportes PDF con código QR y exportación para dirección y contraloría.',
    ],
    metodologiaKicker: 'Implementación',
    metodologiaTitulo: 'Tres pasos para ordenar su red vial',
    metodologiaLead:
      'Sin instalaciones complejas. Su equipo comienza a registrar desde el primer día, con FINSTRUVIAL como operador del levantamiento y la plataforma.',
    metodologiaPasos: ['CONFIGURACIÓN', 'REGISTRO EN CAMPO', 'ANÁLISIS Y REPORTE'],
    flujoTecnologico: [
      '🏛️ Configuración',
      '📍 Captura GPS',
      '📷 Evidencia fotográfica',
      '☁️ Sincronización',
      '🗺️ Mapa inventario',
      '📈 Estadísticas',
      '📄 Reportes PDF',
      '🌐 Exportación SIG',
    ],
    flujoVertical: [
      { titulo: 'CONOCER', texto: 'Qué infraestructura existe y dónde está ubicada.' },
      { titulo: 'EVALUAR', texto: 'En qué estado se encuentra cada activo vial.' },
      { titulo: 'PRIORIZAR', texto: 'Qué debe intervenirse primero con base en evidencia.' },
      { titulo: 'PROGRAMAR', texto: 'Mantenimiento, reposición e inversión con datos confiables.' },
    ],
    modulosPlataformaKicker: 'Así se ve INFRAVIAL',
    modulosPlataformaTitulo: 'Interfaz, mapa y análisis listos para presentar',
    modulosPlataformaLead:
      'Interfaz de alto contraste, mapa integrado y módulos alineados con la operación real en campo — inspirados en la experiencia de la plataforma INFRAVIAL.',
    modulosPlataforma: [
      {
        icon: '📊',
        titulo: 'Dashboard e indicadores',
        texto:
          'Panel centralizado con métricas de tramos, señales verticales, señales horizontales y elementos registrados. Gráficos por estado, distribución territorial y vista ejecutiva para dirección y contraloría.',
        imagenId: 'captura-dashboard',
      },
      {
        icon: '🗺️',
        titulo: 'Mapa del inventario',
        texto:
          'Capas activables de tramos, señalización, semáforos y control semafórico. Filtros por departamento, municipio, ZAT, jornada y fecha; time-lapse por fecha de inventario y exportación GeoJSON desde la misma vista.',
        imagenId: 'captura-mapas',
      },
      {
        icon: '📈',
        titulo: 'Estadísticas y Excel',
        texto:
          'Agregados por categoría, filtros por jornada y geografía, gráficos exportables a PNG y descarga a hojas de cálculo para análisis técnico y rendición de cuentas.',
        imagenId: 'captura-estadisticas',
      },
      {
        icon: '📊',
        titulo: 'Categorización vial',
        texto:
          'Cuatro bloques de evaluación: funcionalidad de la vía, tráfico promedio diario (TPD), diseño geométrico y población del área de influencia. Resultado automático PRIMARIA · SECUNDARIA · TERCIARIA con georreferencia de inicio y fin del tramo.',
        imagenId: 'captura-categorizacion',
      },
      {
        icon: '🛣️',
        titulo: 'SINC — Ejes e inventario por tramo',
        texto:
          'Gestión de ejes de la red vial y ficha por tramo con tarjetas por tipo de elemento. Coherencia con lo capturado en campo, apoyo a supervisión e interventoría y cruces con mapa y reportes.',
        imagenId: 'captura-sinc',
      },
      {
        icon: '🛑',
        titulo: 'Señalización y semaforización',
        texto:
          'Catálogos con imágenes, estado, visibilidad, diagnóstico y reportes PDF individuales con código QR para señales verticales, demarcación horizontal, semáforos, cajas de inspección y controladores.',
        imagenId: 'captura-senales',
      },
      {
        icon: '📱',
        titulo: 'App móvil de campo',
        texto:
          'Encuestadores con jornada activa, GPS automático, formularios y evidencia fotográfica. Modo offline con cola local y sincronización auditada al reconectar — operación con una sola mano en zonas sin señal.',
        imagenId: 'captura-movil',
      },
      {
        icon: '🚗',
        titulo: 'Conteos vehiculares en tiempo real',
        texto:
          'Estaciones de conteo, sentidos de circulación y encuestador por sentido. Cada registro en campo se refleja al instante en el panel del supervisor; estadísticas por hora, sentido y categoría exportables para PESV y estudios de demanda.',
        imagenId: 'captura-conteos',
      },
      {
        icon: '📄',
        titulo: 'Reportes y hub de análisis',
        texto:
          'Reportes PDF institucionales, estadísticas agregadas por módulo, auditoría de acciones y transferencia de datos con progreso en tiempo real para migraciones y respaldos operativos.',
        imagenId: 'captura-reportes',
      },
    ],
    ecosistemaCentro: 'INFRAVIAL',
    ecosistemaKicker: 'Solución integral',
    ecosistemaTitulo: 'Diseñado para gestión pública',
    ecosistemaItems: [
      {
        icon: '📊',
        titulo: 'Categorización vial',
        texto: 'Funcionalidad, TPD, diseño geométrico y población: puntajes automáticos y clasificación primaria, secundaria o terciaria.',
      },
      {
        icon: '🛣️',
        titulo: 'SINC — Ejes e inventario',
        texto: 'Red organizada en ejes con detalle por tramo: señalización, semáforos, cajas y control semafórico en una sola ficha.',
      },
      {
        icon: '📍',
        titulo: 'Georreferenciación',
        texto: 'Cada registro vinculado a coordenadas GPS precisas, visible en mapa y trazable sobre el territorio.',
      },
      {
        icon: '📈',
        titulo: 'Estadísticas y Excel',
        texto: 'Agregados, filtros por jornada y geografía, gráficos exportables y descarga a hojas de cálculo.',
      },
      {
        icon: '👥',
        titulo: 'Roles y trazabilidad',
        texto: 'Admin, supervisor, encuestador e invitado: flujos claros para equipos grandes y auditoría completa.',
      },
      {
        icon: '☁️',
        titulo: 'Respaldos e importación',
        texto: 'Copias de seguridad cifradas del sistema y carga masiva desde Excel para operación real en campo.',
      },
      {
        icon: '📷',
        titulo: 'Evidencia de campo',
        texto: 'Fotos y metadatos por registro para inspección, mantenimiento, interventoría y auditoría.',
      },
      {
        icon: '🌐',
        titulo: 'Exportación QGIS / SIG',
        texto: 'GeoJSON por capa o mapa completo, campos configurables y fotos integradas en atributos.',
      },
      {
        icon: '🏛️',
        titulo: 'Listo para instituciones',
        texto: 'Interfaz profesional, modo claro/oscuro y experiencia alineada a software corporativo.',
      },
    ],
    listaTitulo: 'Compatibilidad con QGIS, ArcGIS y otros SIG',
    listaServicios: [
      {
        titulo: 'Exportación por capa o mapa completo',
        texto:
          'Genere archivos listos para importar: vías (tramos), señales verticales y horizontales, semáforos, control semafórico, cajas de inspección o todo en una sola capa con campo de tipo de elemento.',
      },
      {
        titulo: 'Respeta los filtros del mapa',
        texto:
          'La exportación usa los mismos filtros geográficos y de búsqueda activos (departamento, municipio, ZAT, códigos), de modo que el GeoJSON coincide con la vista de trabajo.',
      },
      {
        titulo: 'Fotos de campo en los atributos',
        texto:
          'Las fotos se incluyen como URLs y un campo popup_html con vista previa, pensado para map tips o formularios en QGIS.',
      },
      {
        titulo: 'Atributos a la medida',
        texto:
          'Configure con «Campos…» qué propiedades van al GeoJSON por tipo de capa; la selección se recuerda para exportaciones coherentes con su plantilla SIG.',
      },
      {
        titulo: 'Integración con su ecosistema GIS',
        texto:
          'Compatible con QGIS, ArcGIS Pro y herramientas que lean GeoJSON. Combine capas INFRAVIAL con catastro, uso del suelo u ortofotos para PESEV, PLSV o planes de movilidad.',
      },
    ],
    resultadoKicker: 'Valor',
    resultadoTitulo: '¿Qué obtiene la entidad?',
    resultadoIconos: [
      { icon: '🗺️', titulo: 'Inventario unificado', texto: 'Tramos, señalización, semáforos y activos asociados en una sola base georreferenciada.' },
      { icon: '📱', titulo: 'Campo sin conectividad', texto: 'App móvil offline con sincronización trazable para equipos de gran escala.' },
      { icon: '📋', titulo: 'Cumplimiento normativo', texto: 'SINC v5, categorización vial y encuesta vial según metodologías del MinTransporte.' },
      { icon: '🌐', titulo: 'Listo para SIG', texto: 'GeoJSON exportable a QGIS y ArcGIS Pro, con fotos en atributos y popups.' },
      { icon: '📊', titulo: 'Decisiones con datos', texto: 'Dashboard, estadísticas, conteos vehiculares y reportes para dirección y contraloría.' },
      { icon: '🏛️', titulo: 'Trazabilidad pública', texto: 'Jornadas, roles, metadatos de creación y respaldos verificables para rendición de cuentas.' },
    ],
    publicos: [
      '🏛️ Alcaldías',
      '🏢 Gobernaciones',
      '🚦 Secretarías de Tránsito y de Movilidad',
      '🔍 Interventorías y consultoría',
    ],
    mensajeTitulo: '¿Su entidad necesita ordenar el inventario vial?',
    mensajeSubtitulo:
      'FINSTRUVIAL opera el levantamiento con INFRAVIAL: demostración, propuesta adaptada a su municipio o departamento y acompañamiento de punta a punta.',
    cierreQuote: 'Lo que no se inventaría no puede administrarse adecuadamente.',
    ctaBtnPrincipal: 'Conocer INFRAVIAL',
    metaDescription:
      'Inventarios viales con INFRAVIAL: categorización vial, SINC, mapa, GeoJSON para QGIS, app móvil offline, conteos vehiculares y gestión pública del inventario vial en Colombia.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen del banner', url: '', alt: 'Inventarios Viales FINSTRUVIAL' },
      { id: 'seccion', etiqueta: 'Imagen de presentación', url: '', alt: 'Inventarios viales georreferenciados' },
      { id: 'producto', etiqueta: 'INFRAVIAL — vista principal', url: '', alt: 'Plataforma INFRAVIAL' },
      { id: 'captura-mapas', etiqueta: 'Mapa del inventario', url: '', alt: 'INFRAVIAL — mapa con capas' },
      { id: 'captura-senales', etiqueta: 'Señalización y semáforos', url: '', alt: 'INFRAVIAL — señalización' },
      { id: 'captura-sinc', etiqueta: 'SINC y categorización', url: '', alt: 'INFRAVIAL — SINC v5' },
      { id: 'captura-movil', etiqueta: 'App móvil de campo', url: '', alt: 'INFRAVIAL — app móvil' },
      { id: 'captura-dashboard', etiqueta: 'Dashboard e indicadores', url: '', alt: 'INFRAVIAL — dashboard' },
      { id: 'captura-estadisticas', etiqueta: 'Estadísticas y gráficos', url: '', alt: 'INFRAVIAL — estadísticas' },
      { id: 'captura-categorizacion', etiqueta: 'Categorización vial', url: '', alt: 'INFRAVIAL — categorización' },
      { id: 'captura-reportes', etiqueta: 'Reportes y análisis', url: '', alt: 'INFRAVIAL — reportes' },
      { id: 'captura-conteos', etiqueta: 'Conteos vehiculares', url: '', alt: 'INFRAVIAL — conteos' },
    ],
  },
  peridata: {
    estilo: 'tech',
    theme: 'blue',
    kicker: 'Inteligencia de datos',
    tituloLinea: 'PERIDATA',
    tituloAcento: '',
    lead: 'Inteligencia de datos para la seguridad vial',
    heroParrafos: [
      'Transformamos registros de siniestralidad en información para prevenir nuevas víctimas.',
    ],
    ctaPrincipal: 'Conocer PERIDATA',
    dashboardFiltros: [
      'Año',
      'Municipio',
      'Hora',
      'Edad',
      'Sexo',
      'Víctima',
      'Vehículo',
      'Clase de siniestro',
      'Tipo de vía',
    ],
    dashboardStats: [
      { valor: '154', etiqueta: 'Siniestros' },
      { valor: '47', etiqueta: 'Víctimas fatales' },
      { valor: '68 %', etiqueta: 'Motociclistas' },
      { valor: '18:00–21:00', etiqueta: 'Horario crítico' },
    ],
    preguntas: [
      '¿Dónde ocurren los siniestros?',
      '¿A qué hora?',
      '¿Qué actores están involucrados?',
      '¿Qué vehículos presentan mayor participación?',
      '¿Qué corredores concentran el riesgo?',
    ],
    metodologiaKicker: 'Metodología',
    metodologiaTitulo: 'Del dato a la prevención',
    metodologiaPasos: ['DATO', 'INFORMACIÓN', 'ANÁLISIS', 'CONOCIMIENTO', 'DECISIÓN', 'INTERVENCIÓN', 'EVALUACIÓN'],
    bloquesKicker: 'Capacidades',
    bloquesTitulo: 'Capacidades analíticas',
    bloques: [
      { icon: '🗺️', titulo: 'Análisis geográfico', texto: 'Mapas de calor y concentración territorial de eventos.' },
      { icon: '📊', titulo: 'Estadística avanzada', texto: 'Cruces por múltiples variables y perfiles de riesgo.' },
      { icon: '🎯', titulo: 'Puntos críticos', texto: 'Priorización de intervenciones con base en evidencia.' },
      { icon: '🏛️', titulo: 'Gestión pública', texto: 'Insumo técnico para PLSV, PESV y políticas de movilidad.' },
    ],
    cierreQuote: 'Cada punto en el mapa representa una historia que no debería repetirse.',
    ctaBtnPrincipal: 'Solicitar demostración',
    introKicker: 'Nuestro servicio',
    introTitulo: 'Decisiones ágiles y precisas en seguridad vial',
    introLead:
      'Con PERIDATA aplica tecnología avanzada para identificar riesgos antes de que ocurran y fundamentar intervenciones con datos confiables.',
    introParrafos: [
      'PERIDATA combina información geográfica con análisis estadístico para apoyar la prevención, la planeación y la formulación de PLSV y PESV.',
      'La herramienta permite filtrar y cruzar variables para comprender patrones de accidentalidad y priorizar intervenciones en el territorio.',
    ],
    heroVideoYoutubeUrl: '',
    productoNombre: '',
    listaServicios: [],
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'PERIDATA — análisis de siniestralidad' },
      { id: 'seccion', etiqueta: 'Imagen presentación', url: '', alt: 'PERIDATA — nuestro servicio' },
    ],
  },
  capacitacionSensibilizacion: {
    kicker: 'Formación vial',
    tituloLinea: 'CAPACITACIÓN Y',
    tituloAcento: 'SENSIBILIZACIÓN',
    lead: 'La transformación de la movilidad empieza por las personas.',
    heroParrafos: [],
    introKicker: 'Nuestro compromiso',
    introTitulo: 'Cultura vial sostenible y responsable',
    introLead:
      'Programas formativos con enfoque integral en seguridad vial para conductores profesionales, usuarios del servicio particular y autoridades de tránsito.',
    introParrafos: [
      'En la Fundación FINSTRUVIAL, nuestras acciones de capacitación y sensibilización están diseñadas para generar cambios reales en el comportamiento de todos los actores viales. Ofrecemos contenidos adaptados a cada perfil, con cobertura desde el sector transporte hasta la ciudadanía en general.',
      'A través de metodologías participativas, estudios de casos, simulaciones y actividades experienciales, promovemos conocimientos clave que salvan vidas: alistamiento vehicular, visibilidad en la vía, uso correcto del cinturón y el casco, y lectura del entorno vial.',
      'Nuestro compromiso no se limita a enseñar normas, sino a fomentar una cultura vial sostenible, consciente y responsable. Realizamos actividades que apelan a la razón y a la emoción, fortaleciendo la percepción del riesgo y la toma de decisiones seguras al conducir, caminar o movilizarse en bicicleta o motocicleta.',
      'Contamos con experiencias inmersivas —aulas interactivas, domos, juegos didácticos y ejercicios de campo— y trabajamos de la mano con autoridades de tránsito para actualizar conocimientos normativos y operativos, con el fin de construir una movilidad más humana, inclusiva y segura para todos.',
    ],
    heroVideoYoutubeUrl: '',
    ctaPrincipal: 'Solicitar capacitación',
    bloquesKicker: 'Servicios',
    bloquesTitulo: 'Líneas de formación',
    bloques: [
      {
        icon: '🚚',
        titulo: 'Capacitación en competencias laborales',
        texto: 'Formación técnica para conductores del sector transporte.',
        imagenId: 'foto1',
      },
      {
        icon: '🚗',
        titulo: 'Sensibilización a conductores particulares',
        texto: 'Conciencia vial y respeto por la vida en la vía.',
        imagenId: 'foto2',
      },
      {
        icon: '👮',
        titulo: 'Actualización normativa',
        texto: 'Formación en normatividad vigente para autoridades de tránsito.',
        imagenId: 'foto3',
      },
    ],
    productoKicker: 'Experiencias',
    productoNombre: 'Actividades experienciales en seguridad vial',
    productoLead:
      'Estaciones temáticas tipo carpa donde el aprendizaje se vive de forma lúdica y práctica.',
    productoParrafos: [
      'Nuestras actividades experienciales se desarrollan en espacios interactivos diseñados como estaciones temáticas. Cada carpa aborda un tema clave —alistamiento vehicular, visibilidad del conductor, concentración en la vía, uso del casco o del cinturón— mediante dinámicas participativas que conectan el conocimiento con la experiencia real.',
      'Están orientadas a crear conciencia, cambiar comportamientos de riesgo y promover una cultura vial más responsable, adaptándose a conductores, peatones, ciclistas y motociclistas.',
    ],
    productoVideoYoutubeUrl: '',
    experienciaSeccionKicker: 'Carpas interactivas',
    experienciaSeccionTitulo: 'Actividades en campo',
    experienciaItems: [
      {
        icon: '🚗',
        titulo: '¡Antes de Rodar, Revisa tu Vehículo!',
        texto:
          'Actividad: Alistamiento vehicular. Verificación preventiva del estado técnico del vehículo para evitar accidentes. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '🔒',
        titulo: 'El cinturón no es una opción, es tu seguro de vida.',
        texto:
          'Actividad: Cinturón de seguridad. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '👁️',
        titulo: 'Si te ven, te proteges. La visibilidad salva vidas.',
        texto:
          'Actividad: Hacerse visible. Acciones para garantizar que peatones, ciclistas y motociclistas sean percibidos por otros usuarios. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '🧠',
        titulo: 'Tu atención es tu mejor defensa al conducir',
        texto:
          'Actividad: Concéntrese. Técnicas para mantener la atención plena en la vía. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '⛑️',
        titulo: 'Uso correcto del casco: norma, hábito y protección',
        texto:
          'Actividad: Promoción del uso del casco. Campañas para fomentar su uso adecuado en conductores y acompañantes. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '🦺',
        titulo: 'Haz que te vean: la visibilidad reduce el riesgo',
        texto:
          'Actividad: Hágase visible en la vía. Estrategias para mejorar la visibilidad del usuario vulnerable. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '🪞',
        titulo: 'El peligro está donde no miras',
        texto:
          'Actividad: Identificación de puntos ciegos del vehículo. Actividades prácticas para comprender los riesgos invisibles alrededor del vehículo. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '🥽',
        titulo: 'Entrena tu mirada para anticipar el riesgo',
        texto:
          'Actividad: Gafas (carpa). Entrenamiento visual para la detección de riesgos en el entorno vial. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '🚲',
        titulo: 'Pedalea seguro, pedalea con conciencia',
        texto:
          'Actividad: Yo me muevo en bici. Fomento del uso responsable y seguro de la bicicleta como medio de transporte. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
      {
        icon: '🏍️',
        titulo: 'Chequeo previo: clave para conducir con seguridad',
        texto:
          'Actividad: Alistamiento para motocicletas. Revisión de condiciones esenciales antes de conducir una moto. En la Fundación FINSTRUVIAL · 2 instructores · Capacidad: 20 personas · Duración promedio: 40 minutos.',
      },
    ],
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Capacitación y Sensibilización' },
      { id: 'seccion', etiqueta: 'Imagen de sección', url: '', alt: 'Capacitación y Sensibilización' },
      { id: 'foto1', etiqueta: 'Línea 1 — transporte', url: '', alt: 'Capacitación en competencias laborales' },
      { id: 'foto2', etiqueta: 'Línea 2 — particulares', url: '', alt: 'Sensibilización a conductores particulares' },
      { id: 'foto3', etiqueta: 'Línea 3 — autoridades', url: '', alt: 'Actualización normativa' },
    ],
    publicos: [
      '🚚 Conductores profesionales',
      '🚗 Conductores de servicio particular',
      '👮 Autoridades de tránsito',
      '🚶 Peatones',
      '🚲 Ciclistas',
      '🏍️ Motociclistas',
      '🏢 Empresas del sector transporte',
      '👨‍👩‍👧 Comunidad en general',
    ],
    cierreQuote:
      'Finstruvial: donde la educación y la seguridad se encuentran con el progreso.',
    ctaBtnPrincipal: 'Solicitar capacitación',
    metaDescription:
      'Capacitación y sensibilización en seguridad vial: competencias laborales, actividades experienciales y formación para conductores y autoridades.',
    metodologiaPasos: [],
    experiencias: [],
    mensajeTitulo: '',
    mensajeSubtitulo: '',
    listaServicios: [],
  },
  herramientasEducativasTecnologicas: {
    estilo: 'tech',
    theme: 'blue',
    kicker: 'Innovación pedagógica',
    tituloLinea: 'Tecnología',
    tituloAcento: 'para aprender',
    lead: 'Experiencias para recordar.',
    heroParrafos: [
      'Integramos herramientas tecnológicas, gamificación, simulación y experiencias inmersivas para transformar la manera de enseñar seguridad vial.',
    ],
    introKicker: 'Innovación pedagógica',
    introTitulo: 'Experiencias que transforman el aprendizaje',
    introParrafos: [
      'Combinamos simuladores, aulas interactivas, domos, juegos didácticos y plataformas digitales para que la formación en seguridad vial sea memorable, participativa y aplicable a la vida real.',
    ],
    ecosistemaCentro: 'FINSTRUVIAL',
    ecosistemaKicker: 'Ecosistema',
    ecosistemaTitulo: 'Tecnología para aprender',
    ecosistemaItems: [
      { icon: '💻', titulo: 'Aulas virtuales', texto: 'Formación en línea con seguimiento, evaluación y certificación cuando aplique.' },
      { icon: '🚘', titulo: 'Simuladores', texto: 'Práctica segura antes del riesgo real.' },
      { icon: '🌐', titulo: 'Aulas interactivas', texto: 'Espacios inmersivos de formación.' },
      { icon: '🔵', titulo: 'Domos', texto: 'Experiencias envolventes de educación vial.' },
      { icon: '🎲', titulo: 'Juegos didácticos', texto: 'Dinámicas lúdicas de aprendizaje.' },
      { icon: '📖', titulo: 'Material pedagógico', texto: 'Cartillas, guías y recursos de apoyo.' },
    ],
    productoKicker: 'Plataforma',
    productoNombre: 'ENCIVIRTRANS',
    productoLead: 'La enciclopedia virtual de tránsito y transporte de FINSTRUVIAL',
    productoImagenId: 'producto',
    productoEtiquetas: ['🚦 Tránsito', '🚚 Transporte', '🛣️ Movilidad', '🛡️ Seguridad vial', '📜 Normatividad'],
    productoParrafos: [
      'ENCIVIRTRANS concentra en un solo recurso digital la información técnica que conductores, instructores, empresas y autoridades necesitan para comprender el tránsito, el transporte y la movilidad.',
      'Consulte normas, procedimientos, definiciones y buenas prácticas de seguridad vial con contenidos actualizados y de fácil navegación.',
      'Ideal para aulas, talleres, campañas de sensibilización y procesos de formación donde se requiere evidencia confiable al alcance de un clic.',
    ],
    bloquesKicker: 'Simuladores',
    bloquesTitulo: 'Aprender antes de enfrentar el riesgo real',
    bloques: [
      { icon: '👁️', titulo: 'Percepción del entorno', texto: 'Lectura anticipada de la vía y sus actores.' },
      { icon: '🤝', titulo: 'Coordinación', texto: 'Sincronización motriz y toma de decisiones.' },
      { icon: '⚠️', titulo: 'Identificación de peligros', texto: 'Reconocimiento de escenarios de riesgo.' },
      { icon: '🧠', titulo: 'Toma de decisiones', texto: 'Respuesta adecuada ante imprevistos.' },
      { icon: '⚡', titulo: 'Capacidad de reacción', texto: 'Tiempo y precisión en maniobras críticas.' },
    ],
    gamificacionKicker: 'Gamificación',
    gamificacionTitulo: 'Aprender jugando',
    gamificacionItems: ['🎯 Retos', '🎲 Juegos', '🎡 Ruletas', '🎭 Roles', '🏆 Competencias', '❓ Preguntas'],
    formulaAprendizaje: 'VER + ESCUCHAR + EXPERIMENTAR + PRACTICAR = APRENDER',
    cierreQuote: 'Aprender jugando aumenta la participación y facilita la apropiación de conocimientos.',
    ctaBtnPrincipal: 'Diseñar una experiencia',
    metaDescription:
      'Herramientas educativas y tecnológicas para seguridad vial: ENCIVIRTRANS, simuladores, gamificación y experiencias inmersivas.',
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen del banner', url: '', alt: 'Herramientas Educativas y Tecnológicas' },
      { id: 'seccion', etiqueta: 'Imagen de presentación', url: '', alt: 'Herramientas educativas FINSTRUVIAL' },
      { id: 'producto', etiqueta: 'ENCIVIRTRANS — captura o foto', url: '', alt: 'Plataforma ENCIVIRTRANS' },
    ],
    listaServicios: [],
  },
  aulaVirtual: {
    estilo: 'academy',
    kicker: 'Plataforma educativa',
    tituloLinea: 'Aula Virtual',
    tituloAcento: 'FINSTRUVIAL',
    lead: 'Formación especializada desde cualquier lugar.',
    heroParrafos: [],
    introKicker: 'Nuestro servicio',
    introTitulo: 'Aula Virtual FINSTRUVIAL',
    introLead: '',
    introParrafos: [
      'El Aula Virtual FINSTRUVIAL es un espacio de formación especializado que integra conocimiento técnico, recursos multimedia, actividades de aprendizaje y evaluación para fortalecer las competencias de conductores, instructores, autoridades, empresas y demás actores vinculados al tránsito, el transporte y la seguridad vial. Su enfoque permite acceder a procesos de actualización desde cualquier lugar, combinando flexibilidad, contenidos aplicados y formación orientada al saber, saber hacer y ser, con el propósito de transformar el conocimiento en decisiones responsables, comportamientos seguros y mejores prácticas para la protección de la vida en las vías.',
    ],
    ctaPrincipal: 'Ingresar al aula',
    ctaPrincipalUrl: '/aula',
    ctaSecundario: 'Ver cursos',
    ctaSecundarioUrl: '/cursos',
    pilaresEducativos: [
      { icon: '📖', titulo: 'SABER', texto: 'Conocimiento: comprender conceptos, normas, procedimientos y fundamentos técnicos.' },
      { icon: '🛠️', titulo: 'SABER HACER', texto: 'Habilidad: aplicar correctamente el conocimiento frente a situaciones reales.' },
      { icon: '💚', titulo: 'SER', texto: 'Actitud: actuar con responsabilidad, respeto, prevención y compromiso con la vida.' },
    ],
    rutaAprendizaje: ['ESTUDIAR', 'COMPRENDER', 'PRACTICAR', 'APLICAR', 'EVALUAR', 'DEMOSTRAR LA COMPETENCIA'],
    bloquesKicker: 'Cursos',
    bloquesTitulo: 'Programas destacados',
    usarCatalogoCursos: true,
    bloques: [],
    experienciaSeccionKicker: 'Metodología',
    experienciaSeccionTitulo: 'Experiencia educativa',
    experienciaItems: [
      { icon: '🎥', titulo: 'Contenido multimedia', texto: 'Videos, animaciones y recursos interactivos.' },
      { icon: '📚', titulo: 'Material técnico', texto: 'Lecturas y documentos de apoyo.' },
      { icon: '📝', titulo: 'Actividades', texto: 'Ejercicios prácticos y casos de estudio.' },
      { icon: '✅', titulo: 'Evaluaciones', texto: 'Verificación de aprendizajes.' },
      { icon: '📊', titulo: 'Seguimiento', texto: 'Monitoreo del progreso formativo.' },
      { icon: '🏅', titulo: 'Certificación', texto: 'Cuando aplique conforme al programa ofrecido.' },
    ],
    modulosPlataformaKicker: 'Plataforma',
    modulosPlataformaTitulo: 'Así funciona el aula virtual',
    modulosPlataformaLead:
      'Conozca las secciones del campus virtual: desde el tablero de inicio hasta sus certificados y foros de curso.',
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
        icon: '📈',
        titulo: 'Tus reportes',
        texto:
          'Indicadores de avance, calificaciones y resultados de evaluaciones para hacer seguimiento a su formación.',
        imagenId: 'modulo-reportes',
      },
      {
        icon: '🏅',
        titulo: 'Certificados',
        texto:
          'Descarga y consulta de certificados obtenidos al completar los requisitos de cada programa.',
        imagenId: 'modulo-certificados',
      },
      {
        icon: '💬',
        titulo: 'Foros del curso',
        texto:
          'Espacios de participación y consulta con instructores y compañeros dentro de cada curso.',
        imagenId: 'modulo-foros',
      },
      {
        icon: '👤',
        titulo: 'Perfil',
        texto: 'Datos personales, contraseña y preferencias de su cuenta en el aula virtual.',
        imagenId: 'modulo-perfil',
      },
    ],
    imagenes: [
      { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Aula Virtual FINSTRUVIAL' },
      { id: 'seccion', etiqueta: 'Imagen presentación', url: '', alt: 'Aula Virtual FINSTRUVIAL — formación en línea' },
      { id: 'modulo-tablero', etiqueta: 'Captura — Tablero', url: '', alt: 'Tablero del aula virtual' },
      { id: 'modulo-cursos', etiqueta: 'Captura — Tus cursos', url: '', alt: 'Listado de cursos' },
      { id: 'modulo-reportes', etiqueta: 'Captura — Reportes', url: '', alt: 'Reportes de avance' },
      { id: 'modulo-certificados', etiqueta: 'Captura — Certificados', url: '', alt: 'Certificados' },
      { id: 'modulo-foros', etiqueta: 'Captura — Foros', url: '', alt: 'Foros del curso' },
      { id: 'modulo-perfil', etiqueta: 'Captura — Perfil', url: '', alt: 'Perfil del estudiante' },
    ],
    cierreQuote: 'El conocimiento no tiene límites cuando el aprendizaje se adapta a su ritmo.',
    listaServicios: [],
    productoNombre: '',
  },
};
