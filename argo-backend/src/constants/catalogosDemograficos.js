/** Valores de fábrica (alineados con seedCatalogosBase.js). */
const GENERO_DEF = [
  { idGenero: 'M', descripcion: 'Masculino' },
  { idGenero: 'F', descripcion: 'Femenino' },
];

const IDENTIDAD_GENERO_DEF = [
  { idIdentidadGenero: 'CISGENERO', descripcion: 'CISGÉNERO' },
  { idIdentidadGenero: 'TRANSGENERO', descripcion: 'TRANSGÉNERO' },
  { idIdentidadGenero: 'NO_BINARIO', descripcion: 'NO BINARIO' },
];

const ORIENTACION_SEXUAL_DEF = [
  { idOrientacionSexual: 'HETEROSEXUAL', descripcion: 'HETEROSEXUAL' },
  { idOrientacionSexual: 'HOMOSEXUAL', descripcion: 'HOMOSEXUAL' },
  { idOrientacionSexual: 'BISEXUAL', descripcion: 'BISEXUAL' },
  { idOrientacionSexual: 'OTRO', descripcion: 'OTRO' },
];

module.exports = {
  GENERO_DEF,
  IDENTIDAD_GENERO_DEF,
  ORIENTACION_SEXUAL_DEF,
};
