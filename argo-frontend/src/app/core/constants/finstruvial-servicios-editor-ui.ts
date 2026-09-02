import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';
import {
  FINSTRUVIAL_EDITOR_SECCIONES,
  FinstruvialEditorSeccion,
  finstruvialEditorTieneSeccion,
} from './finstruvial-servicios-editor-sections';

/** Agrupación visual del formulario (varias secciones técnicas → un bloque en pantalla). */
export type FinstruvialEditorGrupo =
  | 'portafolio'
  | 'hero'
  | 'introduccion'
  | 'catalogoCursos'
  | 'pilares'
  | 'ruta'
  | 'tarjetas'
  | 'producto'
  | 'experienciaEducativa'
  | 'modulosPlataforma'
  | 'metodologia'
  | 'resultado'
  | 'publicos'
  | 'cierre'
  | 'listaServicios'
  | 'ecosistema'
  | 'gamificacion'
  | 'formula'
  | 'contacto'
  | 'imagenes';

export interface FinstruvialEditorGrupoMeta {
  grupo: FinstruvialEditorGrupo;
  icono: string;
  titulo: string;
  descripcion: string;
  /** Ancla en la página pública (sin #). */
  ancla?: string;
  secciones: FinstruvialEditorSeccion[];
}

export interface FinstruvialEditorIndiceItem extends FinstruvialEditorGrupoMeta {
  paso: number;
}

const GRUPO_DE_SECCION: Record<FinstruvialEditorSeccion, FinstruvialEditorGrupo> = {
  portafolio: 'portafolio',
  hero: 'hero',
  introduccion: 'introduccion',
  introMedios: 'introduccion',
  catalogoCursos: 'catalogoCursos',
  pilares: 'pilares',
  ruta: 'ruta',
  bloquesHeader: 'tarjetas',
  bloquesManual: 'tarjetas',
  metodologia: 'metodologia',
  producto: 'producto',
  productoMedios: 'producto',
  experienciaEducativa: 'experienciaEducativa',
  modulosPlataforma: 'modulosPlataforma',
  publicos: 'publicos',
  resultado: 'resultado',
  cierre: 'cierre',
  listaServicios: 'listaServicios',
  ecosistema: 'ecosistema',
  gamificacion: 'gamificacion',
  formula: 'formula',
  contacto: 'contacto',
  imagenes: 'imagenes',
};

const GRUPO_META_BASE: Record<
  FinstruvialEditorGrupo,
  Omit<FinstruvialEditorGrupoMeta, 'grupo' | 'secciones'>
> = {
  portafolio: {
    icono: '🗂️',
    titulo: 'Menú y tarjeta en /servicios',
    descripcion: 'Nombre en el menú, tarjeta del portafolio y texto para buscadores.',
  },
  hero: {
    icono: '🎯',
    titulo: 'Banner principal (arriba de todo)',
    descripcion: 'Título, frase de bienvenida, imagen de fondo y botones.',
    ancla: 'hero',
  },
  introduccion: {
    icono: '📝',
    titulo: 'Bloque de introducción',
    descripcion: 'Texto explicativo debajo del banner, con fotos o videos opcionales.',
    ancla: 'introduccion',
  },
  catalogoCursos: {
    icono: '🎓',
    titulo: 'Programas destacados',
    descripcion: 'Título de la grilla de cursos. Los cursos salen solos desde Aula virtual → Cursos.',
    ancla: 'cursos',
  },
  pilares: {
    icono: '📖',
    titulo: 'Saber, saber hacer y ser',
    descripcion: 'Las tres tarjetas de metodología educativa.',
    ancla: 'pilares',
  },
  ruta: {
    icono: '🛤️',
    titulo: 'Ruta de aprendizaje',
    descripcion: 'Pasos numerados en fila (Estudiar → Comprender → …).',
    ancla: 'ruta',
  },
  tarjetas: {
    icono: '🃏',
    titulo: 'Tarjetas de servicios',
    descripcion: 'Grilla con icono, título, texto e imagen por línea de servicio.',
    ancla: 'servicios',
  },
  producto: {
    icono: '✨',
    titulo: 'Sección destacada con texto largo',
    descripcion: 'Bloque editorial con título, párrafos y medios al lado.',
    ancla: 'producto',
  },
  experienciaEducativa: {
    icono: '🎪',
    titulo: 'Tarjetas de actividades',
    descripcion: 'Lista de actividades o componentes del programa.',
    ancla: 'experiencia-educativa',
  },
  modulosPlataforma: {
    icono: '💻',
    titulo: 'Así funciona el aula virtual',
    descripcion: 'Capturas y descripción de tablero, cursos, certificados, etc.',
    ancla: 'plataforma',
  },
  metodologia: {
    icono: '🔄',
    titulo: 'Metodología paso a paso',
    descripcion: 'Flujo horizontal con los pasos del proceso.',
    ancla: 'metodologia',
  },
  resultado: {
    icono: '📦',
    titulo: 'Entregables / resultados',
    descripcion: 'Iconos con el nombre de cada producto o resultado.',
    ancla: 'resultado',
  },
  publicos: {
    icono: '👥',
    titulo: 'Nuestros públicos',
    descripcion: 'Etiquetas de audiencias (conductores, empresas, comunidad…).',
    ancla: 'publicos',
  },
  cierre: {
    icono: '💬',
    titulo: 'Frase de cierre',
    descripcion: 'Cita inspiradora justo antes del bloque de contacto.',
  },
  listaServicios: {
    icono: '📋',
    titulo: 'Lista detallada de servicios',
    descripcion: 'Ítems con título y descripción en lista.',
    ancla: 'detalle',
  },
  ecosistema: {
    icono: '🌐',
    titulo: 'Ecosistema tecnológico',
    descripcion: 'Herramientas alrededor del centro (ENCIVIRTRANS, simuladores, domos…).',
    ancla: 'ecosistema',
  },
  gamificacion: {
    icono: '🎲',
    titulo: 'Gamificación',
    descripcion: 'Etiquetas de dinámicas lúdicas (retos, juegos, ruletas…).',
    ancla: 'gamificacion',
  },
  formula: {
    icono: '🧮',
    titulo: 'Fórmula de aprendizaje',
    descripcion: 'Frase destacada con la metodología (ej. VER + ESCUCHAR + …).',
    ancla: 'formula',
  },
  contacto: {
    icono: '📞',
    titulo: 'Llamado a la acción final',
    descripcion: 'Título, texto y textos de los botones de contacto.',
    ancla: 'contacto',
  },
  imagenes: {
    icono: '🖼️',
    titulo: 'Banco de imágenes de esta página',
    descripcion: 'Suba aquí las fotos que usan el banner y las tarjetas.',
  },
};

const GRUPO_TITULO_POR_SLUG: Partial<
  Record<FinstruvialServicioSlug, Partial<Record<FinstruvialEditorGrupo, Partial<FinstruvialEditorGrupoMeta>>>>
> = {
  peridata: {
    introduccion: {
      icono: '🖼️',
      titulo: 'Nuestro servicio',
      descripcion: 'Texto a la izquierda e imagen a la derecha, debajo del banner.',
      ancla: 'introduccion',
    },
    tarjetas: {
      titulo: 'Capacidades analíticas',
      descripcion: 'Cuatro tarjetas con icono y texto. Sin fotos en esta sección.',
    },
  },
  aulaVirtual: {
    experienciaEducativa: {
      icono: '🎥',
      titulo: 'Experiencia educativa en línea',
      descripcion: 'Multimedia, material, actividades, evaluaciones, seguimiento y certificación.',
    },
    catalogoCursos: {
      descripcion: 'Solo edita el título. Los cursos se publican en Aula virtual → Cursos → «Publicado en portal».',
    },
    introduccion: {
      icono: '🖼️',
      titulo: 'Presentación con imagen',
      descripcion: 'Texto principal al lado de la foto del servicio, justo debajo del banner.',
      ancla: 'introduccion',
    },
  },
  capacitacionSensibilizacion: {
    introduccion: {
      icono: '🖼️',
      titulo: 'Nuestro compromiso',
      descripcion: 'Texto a la izquierda e imagen a la derecha, debajo del banner.',
      ancla: 'introduccion',
    },
    experienciaEducativa: {
      icono: '⛺',
      titulo: 'Actividades en campo (carpas)',
      descripcion: 'Cada carpa o dinámica con su nombre, icono y descripción.',
    },
    tarjetas: {
      titulo: 'Líneas de formación',
      descripcion: 'Tres tarjetas con foto arriba, título corto y una línea de texto.',
    },
    producto: {
      titulo: 'Actividades experienciales',
      descripcion: 'Texto largo y, si lo desea, una galería de fotos o videos debajo.',
    },
    imagenes: {
      titulo: 'Banco de imágenes',
      descripcion: 'Banner (hero), imagen de presentación (seccion) y fotos de los 3 estudios destacados.',
    },
  },
  estudiosDiagnosticosTecnicos: {
    introduccion: {
      icono: '🖼️',
      titulo: 'Presentación del servicio',
      descripcion: 'Texto a la izquierda e imagen a la derecha, debajo del banner.',
      ancla: 'introduccion',
    },
    tarjetas: {
      titulo: '¿Qué estudios realizamos?',
      descripcion: '3 destacados con foto arriba + grilla de estudios adicionales (solo icono y texto).',
    },
    metodologia: {
      titulo: 'Ruta metodológica',
      descripcion: 'Pasos del proceso: MEDIR, DIAGNOSTICAR, ANALIZAR, PROPONER, EVALUAR.',
    },
    producto: {
      titulo: 'Del campo a la decisión',
      descripcion: 'Texto sobre cómo transforman los datos de campo en decisiones técnicas.',
    },
    resultado: {
      titulo: 'Entregables al cliente',
      descripcion: 'Iconos con el nombre de cada producto o resultado del estudio.',
    },
    imagenes: {
      titulo: 'Banco de imágenes',
      descripcion: 'Imagen de presentación (seccion) y otras fotos de la página. El banner se sube arriba.',
    },
  },
  planeacionGestionVial: {
    introduccion: {
      icono: '🖼️',
      titulo: 'Nuestro servicio',
      descripcion: 'Texto a la izquierda e imagen a la derecha, debajo del banner.',
      ancla: 'introduccion',
    },
    tarjetas: {
      titulo: 'Instrumentos de planificación vial',
      descripcion: 'Tarjetas PESV, PLSV, PMT y PMSS con icono y descripción.',
    },
    metodologia: {
      titulo: 'Ruta de implementación',
      descripcion: 'Pasos del proceso: DIAGNÓSTICO, ESTRATEGIA, PROGRAMA, PROYECTO, INDICADOR, SEGUIMIENTO.',
    },
    imagenes: {
      titulo: 'Banco de imágenes',
      descripcion: 'Banner (hero) e imagen de presentación (seccion).',
    },
  },
  inventariosViales: {
    introduccion: {
      icono: '🖼️',
      titulo: 'Nuestro servicio',
      descripcion: 'Texto a la izquierda e imagen a la derecha, debajo del banner.',
      ancla: 'introduccion',
    },
    tarjetas: {
      titulo: '¿Qué inventariamos?',
      descripcion: 'Tarjetas con icono y texto del alcance del inventario vial.',
    },
    producto: {
      titulo: 'INFRAVIAL',
      descripcion: 'Bloque destacado sobre la plataforma tecnológica de inventarios.',
    },
    modulosPlataforma: {
      titulo: 'Módulos de INFRAVIAL',
      descripcion: 'Capturas y descripción de mapa, señalización, SINC, app móvil, dashboard y conteos.',
    },
    ecosistema: {
      titulo: 'Capacidades del sistema',
      descripcion: 'Nodo central INFRAVIAL y módulos alrededor (tramos, señales, semáforos…).',
    },
    resultado: {
      titulo: 'Valor para la entidad',
      descripcion: 'Beneficios institucionales del inventario georreferenciado.',
    },
    metodologia: {
      titulo: 'Tres pasos para ordenar su red vial',
      descripcion: 'Configuración del municipio → registro en campo → análisis y reporte.',
    },
    listaServicios: {
      titulo: 'Compatibilidad con QGIS y SIG',
      descripcion: 'Detalle de exportación GeoJSON, filtros, fotos en atributos y campos configurables.',
    },
    imagenes: {
      titulo: 'Banco de imágenes',
      descripcion: 'Banner (hero), presentación (seccion), INFRAVIAL (producto) y capturas de pantalla por módulo.',
    },
  },
  herramientasEducativasTecnologicas: {
    introduccion: {
      icono: '🖼️',
      titulo: 'Nuestro servicio',
      descripcion: 'Texto a la izquierda e imagen a la derecha, debajo del banner.',
      ancla: 'introduccion',
    },
    tarjetas: {
      titulo: 'Simuladores',
      descripcion: 'Tarjetas con icono y texto sobre competencias del simulador.',
    },
    producto: {
      titulo: 'ENCIVIRTRANS',
      descripcion: 'Bloque editorial sobre la plataforma o producto estrella.',
    },
    ecosistema: {
      titulo: 'Ecosistema tecnológico',
      descripcion: 'Nodo central y herramientas alrededor (aulas, domos, juegos…).',
    },
    gamificacion: {
      titulo: 'Aprender jugando',
      descripcion: 'Etiquetas con emojis: retos, juegos, ruletas, roles…',
    },
    formula: {
      titulo: 'Fórmula de aprendizaje',
      descripcion: 'Una frase resumen de la metodología experiencial.',
    },
    imagenes: {
      titulo: 'Banco de imágenes',
      descripcion: 'Banner (hero), presentación (seccion) e imagen de ENCIVIRTRANS (producto).',
    },
  },
};

export function finstruvialEditorIndice(slug: FinstruvialServicioSlug): FinstruvialEditorIndiceItem[] {
  const items: FinstruvialEditorIndiceItem[] = [];
  let paso = 0;

  for (const seccion of FINSTRUVIAL_EDITOR_SECCIONES[slug]) {
    const grupo = GRUPO_DE_SECCION[seccion];
    const prev = items[items.length - 1];
    if (prev?.grupo === grupo) {
      prev.secciones.push(seccion);
      continue;
    }
    paso += 1;
    const base = GRUPO_META_BASE[grupo];
    const overrides = GRUPO_TITULO_POR_SLUG[slug]?.[grupo] ?? {};
    items.push({
      grupo,
      paso,
      secciones: [seccion],
      icono: overrides.icono ?? base.icono,
      titulo: overrides.titulo ?? base.titulo,
      descripcion: overrides.descripcion ?? base.descripcion,
      ancla: overrides.ancla ?? base.ancla,
    });
  }
  return items;
}

export function finstruvialEditorGrupoVisible(
  slug: FinstruvialServicioSlug,
  grupo: FinstruvialEditorGrupo,
): boolean {
  return finstruvialEditorIndice(slug).some((i) => i.grupo === grupo);
}

export function finstruvialEditorMetaGrupo(
  slug: FinstruvialServicioSlug,
  grupo: FinstruvialEditorGrupo,
): FinstruvialEditorIndiceItem | undefined {
  return finstruvialEditorIndice(slug).find((i) => i.grupo === grupo);
}

export function finstruvialEditorTieneGrupo(
  slug: FinstruvialServicioSlug,
  grupo: FinstruvialEditorGrupo,
): boolean {
  const item = finstruvialEditorMetaGrupo(slug, grupo);
  if (!item) return false;
  return item.secciones.some((s) => finstruvialEditorTieneSeccion(slug, s));
}
