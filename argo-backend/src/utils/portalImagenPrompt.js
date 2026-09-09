/** Prompts para generar imágenes del portal (solo ERP; no se publican). */

function promptFotoHorizontal(escena) {
  return [
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista.',
    String(escena || '').trim(),
    'Luz natural. Villavicencio, Meta, Llanos Orientales, Colombia.',
    'Personas adultas latinoamericanas auténticas.',
    'Sin texto sobre la imagen, sin logos, sin marcas comerciales, sin marca de agua.',
  ].join(' ');
}

module.exports = { promptFotoHorizontal };
