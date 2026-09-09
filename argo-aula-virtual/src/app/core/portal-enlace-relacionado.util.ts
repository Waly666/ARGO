export interface PortalEnlaceRelacionado {
  texto?: string;
  etiqueta: string;
  url: string;
}

export function portalEnlaceEsExterno(url: string | null | undefined): boolean {
  return /^https?:\/\//i.test(String(url || '').trim());
}

export function portalEnlaceRuta(url: string | null | undefined): string {
  const u = String(url || '').trim();
  if (!u || u === '/') return '/';
  return u.startsWith('/') ? u : `/${u}`;
}

export function mergeEnlacesRelacionados(
  raw?: PortalEnlaceRelacionado[] | null,
  fb: PortalEnlaceRelacionado[] = [],
): PortalEnlaceRelacionado[] {
  const src = Array.isArray(raw) ? raw : [];
  if (!src.length) return fb.map((e) => ({ ...e }));
  return src
    .map((item, i) => ({
      texto: String(item.texto ?? fb[i]?.texto ?? '').trim(),
      etiqueta: String(item.etiqueta ?? fb[i]?.etiqueta ?? '').trim(),
      url: String(item.url ?? fb[i]?.url ?? '').trim(),
    }))
    .filter((e) => e.etiqueta && e.url);
}
