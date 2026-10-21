/**
 * Datos institucionales centralizados (Config → Empresa).
 * Usado por PESV, encabezados de documentos, etc.
 */

const Config = require('../models/Config');
const { resolverUbicacionDesdeMunicipioDian } = require('./configRecibo');

function nitEmpresaMostrar(recibo, facturacion) {
  const nitRecibo = String(recibo?.nit || '').trim();
  if (nitRecibo) return nitRecibo;
  const base = String(facturacion?.emisorNit || '').trim();
  if (!base) return '';
  const dv = String(facturacion?.emisorDv || '').trim();
  return dv ? `${base}-${dv}` : base;
}

async function obtenerDatosEmpresaInstitucional() {
  const [recibo, facturacion, certificado] = await Promise.all([
    Config.findOne({ clave: 'recibo' }).lean(),
    Config.findOne({ clave: 'facturacion' }).lean(),
    Config.findOne({ clave: 'certificado' }).lean(),
  ]);

  const razonSocial =
    String(facturacion?.emisorRazonSocial || '').trim() ||
    String(recibo?.nombreEmpresa || '').trim();
  const nit = nitEmpresaMostrar(recibo, facturacion);
  const representanteLegal = String(recibo?.representanteLegal || '').trim();

  let ciudad = String(recibo?.ciudad || '').trim();
  if (!ciudad) ciudad = String(certificado?.ciudad || '').trim();
  if (!ciudad) {
    const ub = await resolverUbicacionDesdeMunicipioDian();
    if (ub?.ciudad) ciudad = ub.ciudad;
  }

  return {
    razonSocial,
    nit,
    representanteLegal,
    ciudad,
    nombreEmpresa: String(recibo?.nombreEmpresa || '').trim(),
    direccion: String(recibo?.direccion || '').trim(),
    telefono: String(recibo?.telefono || '').trim(),
    email: String(recibo?.email || '').trim(),
  };
}

/** Combina datos guardados del formulario con defaults de empresa (solo rellena vacíos). */
function mezclarOrganizacionEnDatos(datosGuardados, org) {
  const out = { ...(datosGuardados || {}) };
  for (const [k, v] of Object.entries(org || {})) {
    const actual = out[k];
    if (actual === null || actual === undefined || String(actual).trim() === '') {
      out[k] = v ?? '';
    }
  }
  return out;
}

module.exports = {
  obtenerDatosEmpresaInstitucional,
  mezclarOrganizacionEnDatos,
};
