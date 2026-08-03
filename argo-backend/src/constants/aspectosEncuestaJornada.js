/** Aspectos fijos de la encuesta de satisfacción (por carpa asistida). */
const ASPECTOS_ENCUESTA_JORNADA = [
  { key: 'claridad', label: 'Claridad de la capacitación' },
  { key: 'utilidad', label: 'Utilidad de lo aprendido' },
  { key: 'instructor', label: 'Desempeño del instructor' },
  { key: 'organizacion', label: 'Organización de la jornada' },
  { key: 'recomendaria', label: 'Recomendaría esta capacitación' },
];

const ASPECTO_KEYS_ENCUESTA_JORNADA = ASPECTOS_ENCUESTA_JORNADA.map((a) => a.key);

module.exports = {
  ASPECTOS_ENCUESTA_JORNADA,
  ASPECTO_KEYS_ENCUESTA_JORNADA,
};
