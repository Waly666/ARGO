/** Prompts para generar imágenes del portal (solo ERP; no se publican). */

export function promptFotoHorizontal(escena: string): string {
  return [
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista.',
    escena.trim(),
    'Luz natural. Villavicencio, Meta, Llanos Orientales, Colombia.',
    'Personas adultas latinoamericanas auténticas.',
    'Sin texto sobre la imagen, sin logos, sin marcas comerciales, sin marca de agua.',
  ].join(' ');
}

export function promptGraficoHorizontal(escena: string): string {
  return [
    'Infografía horizontal 16:9 (1920×1080), diseño limpio y profesional.',
    escena.trim(),
    'Paleta azul marino profundo, acento dorado y un toque de rojo.',
    'Sin marcas, sin logos, sin marca de agua, sin texto ilegible de relleno.',
  ].join(' ');
}

export function promptImagenEfectivo(img: {
  promptImagen?: string;
  alt?: string;
  etiqueta?: string;
}): string {
  const custom = (img.promptImagen || '').trim();
  if (custom) return custom;
  return promptFotoHorizontal(img.alt || img.etiqueta || '');
}

export async function copiarTextoPortapapeles(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
