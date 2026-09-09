export interface PortalEnlaceRelacionado {
  texto?: string;
  etiqueta: string;
  url: string;
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
