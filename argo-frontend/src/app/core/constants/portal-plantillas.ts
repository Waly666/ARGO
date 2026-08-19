import { PortalDisenoPack } from '../utils/portal-diseno.helpers';
import { PORTAL_HOME_SECCIONES_ORDEN, PortalSiteConfig } from './portal-site-defaults';
import { PORTAL_LANDING_DEFAULTS, PortalLandingConfig } from './portal-landing-defaults';
import { PORTAL_TEMA_FINSTRUVIAL } from '../utils/portal-theme-css-base.util';
import {
  PortalPlantilla,
  PortalPlantillaFamilia,
  PortalTemaPreset,
} from './portal-plantillas.types';

export type { PortalPlantilla, PortalPlantillaFamilia };
export { PORTAL_PLANTILLA_FAMILIAS } from './portal-plantillas.types';

function seccionesActivas(keys: string[]): Record<string, boolean> {
  const all = Object.fromEntries(PORTAL_HOME_SECCIONES_ORDEN.map((k) => [k, false]));
  for (const k of keys) all[k] = true;
  return all;
}

const SECCIONES_COMPLETAS = [...PORTAL_HOME_SECCIONES_ORDEN];
const SECCIONES_ESTANDAR = [
  'instBar',
  'hero',
  'infoCards',
  'ofertas',
  'beneficios',
  'cursosVirtuales',
  'pasos',
  'testimonios',
  'faq',
];
const SECCIONES_MINIMAL = ['hero', 'cursosVirtuales', 'pasos', 'faq'];

interface PlantillaOpts {
  heroTitulo: string;
  heroSubtitulo: string;
  tema: PortalTemaPreset;
  secciones?: readonly string[];
  sinTiendaBlog?: boolean;
  landing?: Partial<PortalLandingConfig>;
  acercaDeHtml?: string;
}

function landingServial(): Partial<PortalLandingConfig> {
  return {
    instBarTag: 'Tránsito, transporte, movilidad y seguridad vial — Villavicencio, Meta',
    quoteText:
      'Prestamos servicios especializados en tránsito, transporte, movilidad y seguridad vial con calidad, amabilidad y eficiencia.',
    quoteLabel: 'Contáctenos',
    metaDescription:
      'Servial Colombia: licencias de conducción, CEA, cursos libres y aula virtual con calidad certificada en Villavicencio, Meta.',
    metaKeywords:
      'Servial Colombia, licencia conducción, CEA, aula virtual, seguridad vial, Villavicencio, Meta',
    hero: {
      ctaPrincipal: 'Ingresar al aula virtual',
      ctaSecundario: 'Consultar certificado',
      mostrarBotonLlamar: true,
      imagenAlt: 'Aprenda a conducir con seguridad y confianza — Servial Colombia',
    },
    infoCards: [
      { icon: '📞', title: 'Llámenos', text: '321 303 9595', fuente: 'telefono' },
      { icon: '📍', title: 'Visítenos', text: 'Calle 37B # 19A-65 B. Jordan', fuente: 'direccion' },
      { icon: '🎓', title: 'CEA habilitado', text: 'Categorías A2, B1, C1, C2 y C3', fuente: 'texto' },
    ],
    ofertas: {
      titulo: 'Capacitación integral en conducción y seguridad vial',
      lead: 'Centro de Enseñanza Automovilística e Instituto de Educación para el Trabajo y el Desarrollo Humano.',
      items: [
        {
          icon: '🚗',
          title: 'Centro de Enseñanza Automovilística',
          text: 'Licencias A2, B1, C1, C2 y C3 con instructores certificados y calidad TÜV Rheinland.',
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
    testimonios: {
      kicker: 'Testimonios',
      titulo: 'Conductores que confían en nosotros',
      lead: 'Más de 2000 reseñas positivas de estudiantes y empresas del sector transportador.',
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
            'En nuestro CEA puede tramitar las categorías A2 (moto), B1 (particular), C1, C2 y C3 (servicio público), según los requisitos del RUNT.',
        },
        {
          pregunta: '¿Cómo accedo al aula virtual?',
          respuesta:
            'Regístrese en el portal, elija su curso y pulse «Matricularme». Con su usuario podrá ingresar al aula virtual desde cualquier dispositivo.',
        },
        {
          pregunta: '¿Ofrecen cursos para transporte de carga?',
          respuesta:
            'Sí. Contamos con manejo defensivo, primeros auxilios, mercancías peligrosas, normas de tránsito y más, orientados al sector transportador.',
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
    footer: {
      ...PORTAL_LANDING_DEFAULTS.footer,
      founded: 'Servial Colombia',
    },
    footerServicios: [
      'Licencias de conducción',
      'Cursos libres',
      'Capacitación en seguridad vial',
      'Consultoría en tránsito',
      'Aula virtual',
    ],
  };
}

function crearPlantilla(
  id: string,
  nombre: string,
  descripcion: string,
  familia: PortalPlantillaFamilia,
  opts: PlantillaOpts,
): PortalPlantilla {
  const secciones = opts.secciones ?? SECCIONES_ESTANDAR;
  const site: Partial<PortalSiteConfig> = {
    tema: { ...opts.tema, urlHero: '' },
    home: {
      orden: [...secciones],
      secciones: seccionesActivas([...secciones]),
    },
  };
  if (opts.sinTiendaBlog) {
    site.paginas = {
      tienda: { activa: false, etiquetaMenu: 'Tienda', ruta: '/tienda' },
      blog: { activa: false, etiquetaMenu: 'Blog', ruta: '/blog' },
    } as PortalSiteConfig['paginas'];
  }
  const diseno: PortalDisenoPack = {
    heroTitulo: opts.heroTitulo,
    heroSubtitulo: opts.heroSubtitulo,
    acercaDeHtml: opts.acercaDeHtml,
    landing: opts.landing,
    site,
  };
  return { id, nombre, descripcion, familia, diseno };
}

export const PORTAL_PLANTILLAS: PortalPlantilla[] = [
  // —— Clientes de referencia ——
  crearPlantilla(
    'finstruvial',
    'Plantilla azul profundo',
    'Tema oscuro con acento cian y home completo (plantilla legacy).',
    'cliente',
    {
      heroTitulo: 'Formación virtual en seguridad vial y conducción profesional.',
      heroSubtitulo: 'Cursos en línea, avance a su ritmo y certificación al finalizar.',
      secciones: SECCIONES_COMPLETAS,
      tema: { ...PORTAL_TEMA_FINSTRUVIAL },
    },
  ),
  crearPlantilla(
    'cotransvial',
    'Plantilla Cotransvial',
    'Colores de cotransvial.com.co: azul institucional, acento dorado y tipografía Poppins.',
    'cliente',
    {
      heroTitulo: 'Domina el poder de la maquinaria pesada y la conducción profesional.',
      heroSubtitulo:
        'Capacítate en COTRANSVIAL: líderes en formación de conductores de servicio público, carga y maquinaria amarilla.',
      secciones: SECCIONES_COMPLETAS,
      tema: {
        colorPrimario: '#0052F4',
        colorPrimarioOscuro: '#1051C4',
        colorAcento: '#F5B417',
        colorFondo: '#010815',
        colorSuperficie: '#0B1E3D',
        colorTexto: '#FFFFFF',
        colorTextoSecundario: '#269BD1',
        fuente: 'Poppins',
      },
    },
  ),
  crearPlantilla(
    'servial',
    'Plantilla Servial',
    'Inspirada en servial.com.co con paleta PICO: fondo azul noche, acento verde lima y CTAs naranja. Hero con malla geométrica interactiva.',
    'cliente',
    {
      heroTitulo: 'Obtenga su licencia de conducción',
      heroSubtitulo:
        'Únicos con calidad certificada. Aprenda a su ritmo con cursos interactivos, capacitación certificada y acompañamiento profesional.',
      secciones: SECCIONES_ESTANDAR,
      landing: landingServial(),
      acercaDeHtml:
        'Servial Colombia presta servicios especializados en tránsito, transporte, movilidad y seguridad vial.\n\n' +
        'Somos Centro de Enseñanza Automovilística e Instituto de Educación para el Trabajo y el Desarrollo Humano, ' +
        'con capacitación en licencias A2, B1, C1, C2 y C3, cursos libres y programas técnicos para el sector transportador.\n\n' +
        'Calle 37B # 19A-65 Barrio Jordan, Villavicencio, Meta — Colombia.',
      tema: {
        colorPrimario: '#2CE97A',
        colorPrimarioOscuro: '#0A0A0A',
        colorAcento: '#D9D314',
        colorFondo: '#0A0A0A',
        colorSuperficie: '#111218',
        colorTexto: '#FFFFFF',
        colorTextoSecundario: '#B0B0B0',
        fuente: 'Figtree',
        fuenteTitulos: 'Space Grotesk',
        heroEstilo: 'servial-mesh',
      },
    },
  ),

  // —— Azul oscuro ——
  crearPlantilla(
    'oceano-profundo',
    'Océano profundo',
    'Navy elegante con gradientes sutiles y tipografía Inter.',
    'azul',
    {
      heroTitulo: 'Capacite a su equipo con estándares de excelencia.',
      heroSubtitulo: 'Programas certificados, seguimiento en tiempo real y soporte dedicado.',
      tema: {
        colorPrimario: '#2563eb',
        colorPrimarioOscuro: '#1e40af',
        colorAcento: '#60a5fa',
        colorFondo: '#0a1628',
        colorSuperficie: '#132038',
        colorTexto: '#e8f0fe',
        colorTextoSecundario: '#8ba3c7',
        fuente: 'Inter',
      },
    },
  ),
  crearPlantilla(
    'zafiro-corporativo',
    'Zafiro corporativo',
    'Azul zafiro con contraste alto. Transmite confianza institucional.',
    'azul',
    {
      heroTitulo: 'Su aliado en capacitación técnica y certificación.',
      heroSubtitulo: 'Modalidad virtual flexible, contenidos actualizados y aval institucional.',
      tema: {
        colorPrimario: '#1d4ed8',
        colorPrimarioOscuro: '#1e3a8a',
        colorAcento: '#93c5fd',
        colorFondo: '#0c1222',
        colorSuperficie: '#151d32',
        colorTexto: '#f1f5f9',
        colorTextoSecundario: '#94a3b8',
        fuente: 'Roboto',
      },
    },
  ),

  // —— Azul claro ——
  crearPlantilla(
    'cielo-diurno',
    'Cielo diurno',
    'Fondo claro y azul cielo. Sensación fresca, moderna y accesible.',
    'azul-claro',
    {
      heroTitulo: 'Aprenda hoy, certifíquese mañana.',
      heroSubtitulo: 'Plataforma intuitiva pensada para estudiantes y empresas.',
      tema: {
        colorPrimario: '#0284c7',
        colorPrimarioOscuro: '#0369a1',
        colorAcento: '#38bdf8',
        colorFondo: '#f0f9ff',
        colorSuperficie: '#ffffff',
        colorTexto: '#0f172a',
        colorTextoSecundario: '#64748b',
        fuente: 'Plus Jakarta Sans',
      },
    },
  ),
  crearPlantilla(
    'glaciar-nordico',
    'Glaciar nórdico',
    'Azul hielo sobre gris perla. Limpio, luminoso y muy legible.',
    'azul-claro',
    {
      heroTitulo: 'Educación continua con calidad de diseño.',
      heroSubtitulo: 'Cursos estructurados, evaluaciones claras y certificados verificables.',
      tema: {
        colorPrimario: '#0ea5e9',
        colorPrimarioOscuro: '#0284c7',
        colorAcento: '#7dd3fc',
        colorFondo: '#f8fafc',
        colorSuperficie: '#ffffff',
        colorTexto: '#1e293b',
        colorTextoSecundario: '#64748b',
        fuente: 'Inter',
      },
    },
  ),
  crearPlantilla(
    'horizon-azure',
    'Horizon Azure',
    'Azul pastel con superficies blancas. Perfecto para marcas jóvenes.',
    'azul-claro',
    {
      heroTitulo: 'Formación que se adapta a su ritmo de vida.',
      heroSubtitulo: 'Estudie desde el celular o el computador, cuando quiera.',
      secciones: SECCIONES_MINIMAL,
      tema: {
        colorPrimario: '#0891b2',
        colorPrimarioOscuro: '#0e7490',
        colorAcento: '#67e8f9',
        colorFondo: '#ecfeff',
        colorSuperficie: '#ffffff',
        colorTexto: '#164e63',
        colorTextoSecundario: '#64748b',
        fuente: 'Source Sans 3',
      },
    },
  ),

  // —— Rojo ——
  crearPlantilla(
    'rubí-ejecutivo',
    'Rubí ejecutivo',
    'Rojo intenso sobre fondo oscuro. Impacto visual y autoridad.',
    'rojo',
    {
      heroTitulo: 'Liderazgo en capacitación y cumplimiento normativo.',
      heroSubtitulo: 'Programas exigentes para equipos que no aceptan menos que lo mejor.',
      tema: {
        colorPrimario: '#dc2626',
        colorPrimarioOscuro: '#991b1b',
        colorAcento: '#fca5a5',
        colorFondo: '#120808',
        colorSuperficie: '#1f1010',
        colorTexto: '#fef2f2',
        colorTextoSecundario: '#a8a29e',
        fuente: 'Roboto',
      },
    },
  ),
  crearPlantilla(
    'carmesi-academia',
    'Carmesí academia',
    'Granate elegante con acentos rosados. Clásico y distinguido.',
    'rojo',
    {
      heroTitulo: 'Tradición académica en formato digital.',
      heroSubtitulo: 'Más de una década formando profesionales certificados.',
      sinTiendaBlog: true,
      tema: {
        colorPrimario: '#be123c',
        colorPrimarioOscuro: '#881337',
        colorAcento: '#fda4af',
        colorFondo: '#0f0a0c',
        colorSuperficie: '#1a1215',
        colorTexto: '#fff1f2',
        colorTextoSecundario: '#9ca3af',
        fuente: 'Plus Jakarta Sans',
      },
    },
  ),
  crearPlantilla(
    'volcan-energia',
    'Volcán energía',
    'Rojo coral con fondo cálido oscuro. Dinámico y motivador.',
    'rojo',
    {
      heroTitulo: 'Encienda el potencial de su organización.',
      heroSubtitulo: 'Capacitación intensiva con resultados medibles desde el primer módulo.',
      tema: {
        colorPrimario: '#e11d48',
        colorPrimarioOscuro: '#be123c',
        colorAcento: '#fb7185',
        colorFondo: '#140c0e',
        colorSuperficie: '#221418',
        colorTexto: '#ffe4e6',
        colorTextoSecundario: '#a1a1aa',
        fuente: 'Inter',
      },
    },
  ),

  // —— Índigo / violeta (antes «ámbar dorado») ——
  crearPlantilla(
    'sol-dorado',
    'Bruma índigo',
    'Índigo y violeta sobre negro frío. Premium y memorable.',
    'ambar',
    {
      heroTitulo: 'Excelencia que brilla en cada certificado.',
      heroSubtitulo: 'Formación de alto nivel para quienes buscan destacar.',
      tema: {
        colorPrimario: '#6366f1',
        colorPrimarioOscuro: '#4338ca',
        colorAcento: '#a5b4fc',
        colorFondo: '#0a0f1f',
        colorSuperficie: '#12182e',
        colorTexto: '#eef2ff',
        colorTextoSecundario: '#a8a29e',
        fuente: 'Plus Jakarta Sans',
      },
    },
  ),
  crearPlantilla(
    'miel-calida',
    'Miel cálida',
    'Tono ámbar suave con fondo crema. Acogedor y profesional.',
    'ambar',
    {
      heroTitulo: 'Un espacio de aprendizaje hecho para usted.',
      heroSubtitulo: 'Contenidos claros, tutores disponibles y progreso visible.',
      tema: {
        colorPrimario: '#ca8a04',
        colorPrimarioOscuro: '#a16207',
        colorAcento: '#fde047',
        colorFondo: '#fffbeb',
        colorSuperficie: '#ffffff',
        colorTexto: '#422006',
        colorTextoSecundario: '#78716c',
        fuente: 'Source Sans 3',
      },
    },
  ),
  crearPlantilla(
    'citrico-vivo',
    'Cítrico vivo',
    'Amarillo limón con contraste oscuro. Fresco y llamativo.',
    'ambar',
    {
      heroTitulo: 'Aprendizaje que despierta curiosidad.',
      heroSubtitulo: 'Lecciones cortas, retos prácticos y recompensas al completar.',
      secciones: SECCIONES_MINIMAL,
      tema: {
        colorPrimario: '#eab308',
        colorPrimarioOscuro: '#ca8a04',
        colorAcento: '#fef08a',
        colorFondo: '#0c0a04',
        colorSuperficie: '#1a1608',
        colorTexto: '#fefce8',
        colorTextoSecundario: '#a3a3a3',
        fuente: 'Inter',
      },
    },
  ),

  // —— Verde ——
  crearPlantilla(
    'esmeralda-corporativo',
    'Esmeralda corporativo',
    'Verde esmeralda sobre fondo bosque. Natural y confiable.',
    'verde',
    {
      heroTitulo: 'Capacitación que transforma conductores y equipos.',
      heroSubtitulo: 'Programas certificados, modalidad virtual y acompañamiento experto.',
      sinTiendaBlog: true,
      tema: {
        colorPrimario: '#059669',
        colorPrimarioOscuro: '#047857',
        colorAcento: '#6ee7b7',
        colorFondo: '#061510',
        colorSuperficie: '#0f1f18',
        colorTexto: '#ecfdf5',
        colorTextoSecundario: '#94a3b8',
        fuente: 'Inter',
      },
    },
  ),
  crearPlantilla(
    'mint-tech',
    'Mint tech',
    'Verde menta claro. Startup educativa, moderna y ligera.',
    'verde',
    {
      heroTitulo: 'Tecnología al servicio de su formación.',
      heroSubtitulo: 'Plataforma ágil, diseño limpio y certificación digital.',
      tema: {
        colorPrimario: '#10b981',
        colorPrimarioOscuro: '#059669',
        colorAcento: '#a7f3d0',
        colorFondo: '#ecfdf5',
        colorSuperficie: '#ffffff',
        colorTexto: '#064e3b',
        colorTextoSecundario: '#6b7280',
        fuente: 'Plus Jakarta Sans',
      },
    },
  ),
  crearPlantilla(
    'selva-nocturna',
    'Selva nocturna',
    'Verde profundo con acentos lima. Sofisticado y diferente.',
    'verde',
    {
      heroTitulo: 'Formación sostenible para el futuro del transporte.',
      heroSubtitulo: 'Contenidos alineados con las mejores prácticas del sector.',
      tema: {
        colorPrimario: '#16a34a',
        colorPrimarioOscuro: '#14532d',
        colorAcento: '#bef264',
        colorFondo: '#050f08',
        colorSuperficie: '#0d1a10',
        colorTexto: '#f0fdf4',
        colorTextoSecundario: '#86efac',
        fuente: 'Roboto',
      },
    },
  ),

  // —— Violeta ——
  crearPlantilla(
    'violeta-luxe',
    'Violeta luxe',
    'Púrpura real con acentos lavanda. Creativo y premium.',
    'violeta',
    {
      heroTitulo: 'Inspire a su equipo con formación de clase mundial.',
      heroSubtitulo: 'Experiencia inmersiva, diseño cuidado y certificación reconocida.',
      tema: {
        colorPrimario: '#7c3aed',
        colorPrimarioOscuro: '#5b21b6',
        colorAcento: '#c4b5fd',
        colorFondo: '#0a0614',
        colorSuperficie: '#151022',
        colorTexto: '#f5f3ff',
        colorTextoSecundario: '#a78bfa',
        fuente: 'Plus Jakarta Sans',
      },
    },
  ),
  crearPlantilla(
    'aurora-digital',
    'Aurora digital',
    'Índigo con acento fucsia. Futurista y distintivo.',
    'violeta',
    {
      heroTitulo: 'El futuro de la educación ya está aquí.',
      heroSubtitulo: 'Cursos interactivos, analítica de progreso y certificados en línea.',
      tema: {
        colorPrimario: '#6366f1',
        colorPrimarioOscuro: '#4338ca',
        colorAcento: '#e879f9',
        colorFondo: '#0c0a18',
        colorSuperficie: '#16132a',
        colorTexto: '#eef2ff',
        colorTextoSecundario: '#94a3b8',
        fuente: 'Inter',
      },
    },
  ),
  crearPlantilla(
    'lavanda-suave',
    'Lavanda suave',
    'Lila claro sobre fondo blanco. Delicado y profesional.',
    'violeta',
    {
      heroTitulo: 'Aprendizaje con estilo y claridad.',
      heroSubtitulo: 'Un portal pensado para que encontrar su curso sea sencillo.',
      secciones: SECCIONES_MINIMAL,
      tema: {
        colorPrimario: '#8b5cf6',
        colorPrimarioOscuro: '#6d28d9',
        colorAcento: '#ddd6fe',
        colorFondo: '#faf5ff',
        colorSuperficie: '#ffffff',
        colorTexto: '#3b0764',
        colorTextoSecundario: '#7c3aed',
        fuente: 'Source Sans 3',
      },
    },
  ),

  // —— Neutro / minimal ——
  crearPlantilla(
    'carbon-pro',
    'Carbon Pro',
    'Gris carbón con acento azul eléctrico. Minimalista y serio.',
    'neutro',
    {
      heroTitulo: 'Formación profesional sin distracciones.',
      heroSubtitulo: 'Enfoque en contenido, resultados y certificación.',
      secciones: SECCIONES_MINIMAL,
      tema: {
        colorPrimario: '#475569',
        colorPrimarioOscuro: '#334155',
        colorAcento: '#38bdf8',
        colorFondo: '#0a0a0c',
        colorSuperficie: '#141416',
        colorTexto: '#f4f4f5',
        colorTextoSecundario: '#71717a',
        fuente: 'Inter',
      },
    },
  ),
  crearPlantilla(
    'papel-blanco',
    'Papel blanco',
    'Neutros cálidos, tipografía clara. Editorial y elegante.',
    'neutro',
    {
      heroTitulo: 'Su centro de formación en línea.',
      heroSubtitulo: 'Consulte cursos, regístrese y estudie desde cualquier dispositivo.',
      secciones: SECCIONES_MINIMAL,
      tema: {
        colorPrimario: '#525252',
        colorPrimarioOscuro: '#404040',
        colorAcento: '#a3a3a3',
        colorFondo: '#fafafa',
        colorSuperficie: '#ffffff',
        colorTexto: '#171717',
        colorTextoSecundario: '#737373',
        fuente: 'Source Sans 3',
      },
    },
  ),
  crearPlantilla(
    'slate-minimal',
    'Slate minimal',
    'Pizarra fría con acento índigo. Sobrio y contemporáneo.',
    'neutro',
    {
      heroTitulo: 'Cursos que impulsan su carrera.',
      heroSubtitulo: 'Inscríbase en minutos y comience hoy mismo.',
      secciones: ['hero', 'infoCards', 'cursosVirtuales', 'pasos'],
      tema: {
        colorPrimario: '#64748b',
        colorPrimarioOscuro: '#475569',
        colorAcento: '#818cf8',
        colorFondo: '#0f172a',
        colorSuperficie: '#1e293b',
        colorTexto: '#f8fafc',
        colorTextoSecundario: '#94a3b8',
        fuente: 'Roboto',
      },
    },
  ),
];

export function contarSeccionesPlantilla(p: PortalPlantilla): number {
  const sec = p.diseno.site?.home?.secciones;
  if (!sec) return 0;
  return Object.values(sec).filter(Boolean).length;
}

export function temaDePlantilla(p: PortalPlantilla) {
  return p.diseno.site?.tema;
}
