/** Fuentes disponibles en el constructor del sitio (ERP) y portal público. */
export const PORTAL_FUENTES = [
  'Exo 2',
  'Exo',
  'Plus Jakarta Sans',
  'Figtree',
  'Space Grotesk',
  'Sora',
  'Outfit',
  'DM Sans',
  'Poppins',
  'Inter',
  'Roboto',
  'Open Sans',
  'Source Sans 3',
] as const;

export type PortalFuente = (typeof PORTAL_FUENTES)[number];

const FONT_GOOGLE_SPECS: Record<string, string> = {
  Exo: 'wght@100;200;300;400;500;600;700;800;900',
  'Exo 2': 'wght@100..900',
  'Plus Jakarta Sans': 'wght@0,400;0,500;0,600;0,700;0,800',
  Figtree: 'wght@0,300..900',
  'Space Grotesk': 'wght@400;500;600;700',
  Sora: 'wght@400;500;600;700;800',
  Outfit: 'wght@400;500;600;700;800',
  'DM Sans': 'wght@400;500;600;700',
  Poppins: 'wght@0,400;0,500;0,600;0,700;0,800',
  Inter: 'wght@400;500;600;700;800',
  Roboto: 'wght@400;500;700',
  'Open Sans': 'wght@400;600;700',
  'Source Sans 3': 'wght@400;600;700',
};

export interface PortalTemaFuentesLike {
  fuente?: string | null;
  fuenteTitulos?: string | null;
}

export function portalFontBody(tema: PortalTemaFuentesLike | null | undefined): string {
  const body = String(tema?.fuente || 'Plus Jakarta Sans').trim() || 'Plus Jakarta Sans';
  return body;
}

export function portalFontDisplay(tema: PortalTemaFuentesLike | null | undefined): string {
  const display = String(tema?.fuenteTitulos || '').trim();
  return display || portalFontBody(tema);
}

export function portalFontsToLoad(tema: PortalTemaFuentesLike | null | undefined): string[] {
  const body = portalFontBody(tema);
  const display = portalFontDisplay(tema);
  return [...new Set([body, display].filter(Boolean))];
}

export function googleFontsCssUrl(fonts: string[]): string {
  const families = [...new Set(fonts.filter(Boolean))].map((name) => {
    const spec = FONT_GOOGLE_SPECS[name] || 'wght@400;500;600;700;800';
    return `family=${encodeURIComponent(name).replace(/%20/g, '+')}:${spec}`;
  });
  if (!families.length) return '';
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/** Carga (o actualiza) el enlace a Google Fonts según las fuentes del tema. */
export function loadPortalGoogleFonts(doc: Document, tema: PortalTemaFuentesLike | null | undefined): void {
  const url = googleFontsCssUrl(portalFontsToLoad(tema));
  const id = 'av-portal-google-fonts';
  let link = doc.getElementById(id) as HTMLLinkElement | null;
  if (!url) {
    link?.remove();
    return;
  }
  if (!link) {
    link = doc.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    doc.head.appendChild(link);
  }
  if (link.href !== url) link.href = url;
}
