import { FINSTRUVIAL_SERVICIO_SLUGS } from '../constants/finstruvial-servicios.constants';
import {
  PortalFinstruvialServicioLanding,
  PortalFinstruvialServiciosConfig,
  PortalFinstruvialServiciosHub,
} from '../constants/finstruvial-servicio-landing.types';

function trimStr(v: unknown): string {
  return String(v ?? '').trim();
}

/** Conserva un texto editado si el merge posterior lo dejó vacío. */
function keepText(prev: unknown, next: unknown): string {
  const p = trimStr(prev);
  const n = trimStr(next);
  return p && !n ? p : n;
}

const HUB_TEXT_KEYS: (keyof PortalFinstruvialServiciosHub)[] = [
  'kicker',
  'tituloLinea',
  'tituloAcento',
  'lead',
  'gridTitulo',
  'gridLead',
  'formacionKicker',
  'gridKicker',
  'ctaPrincipal',
  'ctaPrincipalUrl',
  'ctaSecundario',
  'ctaSecundarioUrl',
  'statsLabel',
  'seoTextoTitulo',
  'localTitulo',
  'localTexto',
  'localDireccion',
  'localTelefono',
  'localEmail',
  'faqTitulo',
  'pillarsLabel',
  'highlightIcon',
  'highlightTitle',
  'highlightSubtitle',
  'ribbonLabel',
  'heroImagenAlt',
  'formacionImagenAlt',
  'formacionImagen2Alt',
];

const PAGINA_TEXT_KEYS: (keyof PortalFinstruvialServicioLanding)[] = [
  'menuLabel',
  'kicker',
  'tituloLinea',
  'tituloAcento',
  'lead',
  'listaTitulo',
  'productoKicker',
  'productoNombre',
  'cierreQuote',
  'ctaTitulo',
  'ctaLead',
  'ctaBtnPrincipal',
  'ctaBtnSecundario',
  'tarjetaCta',
  'metaDescription',
  'seoTextoTitulo',
  'localTitulo',
  'localTexto',
  'faqTitulo',
  'enlacesRelacionadosTitulo',
];

function preservePaginaTexts(
  prev: PortalFinstruvialServicioLanding | undefined,
  next: PortalFinstruvialServicioLanding,
): void {
  if (!prev) return;
  for (const key of PAGINA_TEXT_KEYS) {
    const prevVal = prev[key];
    const nextVal = next[key];
    if (typeof prevVal !== 'string' || typeof nextVal !== 'string') continue;
    const kept = keepText(prevVal, nextVal);
    if (kept !== trimStr(nextVal)) {
      (next as unknown as Record<string, string>)[key] = kept;
    }
  }
  if (prev.seoTextoParrafos?.length && !next.seoTextoParrafos?.length) {
    next.seoTextoParrafos = [...prev.seoTextoParrafos];
  }
  if (prev.faq?.length && !next.faq?.length) {
    next.faq = prev.faq.map((item) => ({ ...item }));
  }
  if (prev.heroVideoYoutubeUrl?.trim() && !next.heroVideoYoutubeUrl?.trim()) {
    next.heroVideoYoutubeUrl = prev.heroVideoYoutubeUrl.trim();
  }
}

/**
 * Tras recargar config del servidor (subir imagen, guardar otra sección, etc.),
 * evita que textos ya editados del portafolio queden vacíos en el formulario ERP.
 */
export function preservePortafolioServiciosEdits(
  prev: PortalFinstruvialServiciosConfig | undefined | null,
  next: PortalFinstruvialServiciosConfig | undefined | null,
): void {
  if (!prev || !next) return;

  if (trimStr(prev.menuLabel) && !trimStr(next.menuLabel)) {
    next.menuLabel = prev.menuLabel.trim();
  }

  if (prev.hub && next.hub) {
    for (const key of HUB_TEXT_KEYS) {
      const prevVal = prev.hub[key];
      const nextVal = next.hub[key];
      if (typeof prevVal !== 'string' || typeof nextVal !== 'string') continue;
      const kept = keepText(prevVal, nextVal);
      if (kept !== trimStr(nextVal)) {
        (next.hub as unknown as Record<string, string>)[key] = kept;
      }
    }
    if (prev.hub.seoTextoParrafos?.length && !next.hub.seoTextoParrafos?.length) {
      next.hub.seoTextoParrafos = [...prev.hub.seoTextoParrafos];
    }
    if (prev.hub.faq?.length && !next.hub.faq?.length) {
      next.hub.faq = prev.hub.faq.map((item) => ({ ...item }));
    }
    if (prev.hub.tarjetas?.length && !next.hub.tarjetas?.length) {
      next.hub.tarjetas = prev.hub.tarjetas.map((item) => ({ ...item }));
    }
  }

  if (prev.paginas && next.paginas) {
    for (const slug of FINSTRUVIAL_SERVICIO_SLUGS) {
      preservePaginaTexts(prev.paginas[slug], next.paginas[slug]);
    }
  }
}
