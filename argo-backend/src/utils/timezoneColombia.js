/** Zona horaria de negocio ARGO (Colombia, UTC−5). */
const TZ_COLOMBIA = 'America/Bogota';

function fmtFecha(d, { dateStyle = 'short', timeStyle = 'short' } = {}) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('es-CO', { dateStyle, timeStyle, timeZone: TZ_COLOMBIA });
}

function fmtFechaSolo(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ_COLOMBIA,
  });
}

module.exports = {
  TZ_COLOMBIA,
  fmtFecha,
  fmtFechaSolo,
};
