/**
 * Código jornada = {codContrato}-{últimas 6 hex del _id Mongo}.
 * Ejemplo: JOR-2026-059-A1B2C3
 */

function sufijoIdMongo(id) {
  const raw = String(id || '').trim();
  if (!raw) return '';
  // ObjectId hex (24) o string con posibles no-hex: tomar últimos 6 hex.
  const hex = raw.replace(/[^a-fA-F0-9]/g, '');
  if (hex.length >= 6) return hex.slice(-6).toUpperCase();
  return raw.slice(-6).toUpperCase();
}

function buildCodigoJornada(codContrato, jornadaId) {
  const cod = String(codContrato || '').trim() || 'SIN-COD';
  const suf = sufijoIdMongo(jornadaId);
  if (!suf) return '';
  return `${cod}-${suf}`;
}

module.exports = {
  sufijoIdMongo,
  buildCodigoJornada,
};
