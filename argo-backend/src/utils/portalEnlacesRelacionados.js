function mergeEnlacesRelacionados(raw, fb = []) {
  const fallback = Array.isArray(fb) ? fb : [];
  const src = Array.isArray(raw) ? raw : [];
  if (!src.length) return fallback.map((e) => ({ ...e }));
  return src
    .map((item, i) => ({
      texto: String(item?.texto ?? fallback[i]?.texto ?? '').trim(),
      etiqueta: String(item?.etiqueta ?? fallback[i]?.etiqueta ?? '').trim(),
      url: String(item?.url ?? fallback[i]?.url ?? '').trim(),
    }))
    .filter((e) => e.etiqueta && e.url);
}

module.exports = { mergeEnlacesRelacionados };
