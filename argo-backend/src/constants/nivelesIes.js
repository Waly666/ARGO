/**
 * Niveles que puede ofrecer una IES según su carácter académico SNIES (Ley 30 de 1992).
 *
 * El Excel SNIES trae un solo «carácter», pero una institución ofrece varios niveles:
 * una institución universitaria dicta pregrados profesionales y también tecnologías,
 * y una institución tecnológica dicta tecnologías y técnicas profesionales.
 * Guardar un único nivel dejaba fuera del listado, por ejemplo, a UNIMETA al buscar
 * «universidad».
 */

const NIVELES_SUPERIOR = ['tecnica', 'tecnologica', 'universidad'];

/** @returns {string[]} niveles ARGO ofrecidos, del más alto al más bajo. */
function nivelesIesDesdeCaracter(caracter) {
  const t = String(caracter || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!t) return ['universidad'];
  // "UNIVERSIDAD" (no confundir con "INSTITUCIÓN UNIVERSITARIA").
  if (t.includes('universidad') && !t.includes('universitaria')) {
    return ['universidad'];
  }
  // "INSTITUCIÓN UNIVERSITARIA/ESCUELA TECNOLÓGICA": pregrado profesional + tecnologías.
  if (t.includes('universitaria') || t.includes('escuela tecnolog')) {
    return ['universidad', 'tecnologica'];
  }
  // "INSTITUCIÓN TECNOLÓGICA"
  if (t.includes('tecnolog')) return ['tecnologica', 'tecnica'];
  // "INSTITUCIÓN TÉCNICA PROFESIONAL"
  if (t.includes('tecnic')) return ['tecnica'];
  return ['universidad'];
}

/** Nivel principal (el más alto) para compatibilidad con `nivelEducativo`. */
function nivelIesPrincipal(caracter) {
  return nivelesIesDesdeCaracter(caracter)[0] || 'universidad';
}

module.exports = {
  NIVELES_SUPERIOR,
  nivelesIesDesdeCaracter,
  nivelIesPrincipal,
};
