const Config = require('../models/Config');
const { obtenerConfigRecibo } = require('./configRecibo');
const { publicUploadUrl } = require('../utils/uploadPublicUrl');

const CLAVE_AULA = 'aula_virtual';

const DEFAULTS_AULA = {
  clave: CLAVE_AULA,
  /** Datos de empresa mostrados en el portal (prioridad sobre Recibos). */
  nombreEmpresa: '',
  nit: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  /** Ruta relativa bajo uploads/; vacío = usar logo de Config → Recibos. */
  urlLogo: '',
  heroTitulo: 'Educar para salvar vidas: cada aprendizaje cuenta en el camino.',
  heroSubtitulo:
    'Porque la seguridad vial comienza con la educación: entrenamientos hechos para usted.',
  acercaDeHtml:
    'La FUNDACIÓN FINSTRUVIAL lleva la seguridad vial en el alma.\n\nSomos tu mejor opción en formación, consultoría y campañas de seguridad vial para empresas, instituciones educativas y el sector público.\n\nMás de 28 años de experiencia práctica respaldan nuestro compromiso: educar para salvar vidas.',
  telefonoWhatsapp: '',
  emailContacto: '',
};

function logoAbsoluto(urlLogo) {
  return publicUploadUrl(urlLogo);
}

function pickLogo(aula, recibo) {
  const rel = String(aula.urlLogo || recibo.urlLogo || '').trim();
  return {
    urlLogo: rel,
    urlLogoAbsoluta: logoAbsoluto(rel),
    logoDesdeRecibos: !String(aula.urlLogo || '').trim() && !!String(recibo.urlLogo || '').trim(),
  };
}

function pickEmpresa(aula, recibo) {
  return {
    nombreCea: String(aula.nombreEmpresa || recibo.nombreEmpresa || 'CEA').trim() || 'CEA',
    nit: String(aula.nit || recibo.nit || '').trim(),
    direccion: String(aula.direccion || recibo.direccion || '').trim(),
    ciudad: String(aula.ciudad || recibo.ciudad || '').trim(),
    telefono: String(aula.telefono || recibo.telefono || aula.telefonoWhatsapp || '').trim(),
    email: String(aula.email || recibo.email || aula.emailContacto || '').trim(),
  };
}

async function obtenerConfigAula() {
  let doc = await Config.findOne({ clave: CLAVE_AULA }).lean();
  if (!doc) doc = DEFAULTS_AULA;
  return { ...DEFAULTS_AULA, ...doc };
}

async function guardarConfigAula(body, usuario) {
  const dto = {
    ...DEFAULTS_AULA,
    ...body,
    clave: CLAVE_AULA,
    nombreEmpresa: String(body.nombreEmpresa ?? body.nombreCea ?? '').trim(),
    nit: String(body.nit ?? '').trim(),
    direccion: String(body.direccion ?? '').trim(),
    ciudad: String(body.ciudad ?? '').trim(),
    telefono: String(body.telefono ?? '').trim(),
    email: String(body.email ?? '').trim(),
    urlLogo: body.urlLogo !== undefined ? String(body.urlLogo ?? '').trim() : undefined,
    userChangeRecord: usuario?.username || 'sistema',
  };
  delete dto._id;
  delete dto.nombreCea;
  if (dto.urlLogo === undefined) delete dto.urlLogo;
  await Config.updateOne({ clave: CLAVE_AULA }, { $set: dto }, { upsert: true });
  return obtenerConfigAula();
}

/** Config editable en admin (rellena con Recibos si el portal aún no tiene datos). */
async function obtenerConfigPortalAdmin() {
  const [aula, recibo] = await Promise.all([obtenerConfigAula(), obtenerConfigRecibo()]);
  const empresa = pickEmpresa(aula, recibo);
  const logo = pickLogo(aula, recibo);
  return {
    ...aula,
    nombreEmpresa: aula.nombreEmpresa || recibo.nombreEmpresa || '',
    nit: aula.nit || recibo.nit || '',
    direccion: aula.direccion || recibo.direccion || '',
    ciudad: aula.ciudad || recibo.ciudad || '',
    telefono: aula.telefono || recibo.telefono || '',
    email: aula.email || recibo.email || '',
    urlLogo: aula.urlLogo || '',
    urlLogoAbsoluta: logo.urlLogoAbsoluta,
    logoDesdeRecibos: logo.logoDesdeRecibos,
    vistaPreviaEmpresa: empresa,
  };
}

/** Config pública del portal (marca CEA + textos aula). */
async function obtenerConfigPortalPublica() {
  const [recibo, aula] = await Promise.all([obtenerConfigRecibo(), obtenerConfigAula()]);
  const empresa = pickEmpresa(aula, recibo);
  const logo = pickLogo(aula, recibo);
  return {
    ...empresa,
    urlLogo: logo.urlLogo,
    urlLogoAbsoluta: logo.urlLogoAbsoluta,
    heroTitulo: aula.heroTitulo,
    heroSubtitulo: aula.heroSubtitulo,
    acercaDeHtml: aula.acercaDeHtml || '',
  };
}

module.exports = {
  obtenerConfigAula,
  guardarConfigAula,
  obtenerConfigPortalAdmin,
  obtenerConfigPortalPublica,
  pickLogo,
  logoAbsoluto,
  DEFAULTS_AULA,
};
