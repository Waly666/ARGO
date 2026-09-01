const Config = require('../models/Config');
const { obtenerConfigRecibo } = require('./configRecibo');
const { publicUploadUrl } = require('../utils/uploadPublicUrl');
const { mergeLanding, normalizarLanding } = require('./aulaVirtualPortalLanding');
const {
  mergePortalSite,
  sincronizarNavLanding,
  copyrightPublico,
  HOME_SECCIONES_ORDEN,
  HOME_SECCIONES_LABELS,
} = require('./portalSiteConfig');
const { urlPublicaVerificacion } = require('./portalGoogleSearchConsole');
const { resolverBasePortal } = require('../utils/portalPublicUrl');

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
  heroTitulo: 'Cursos y programas virtuales para formar conductores y equipos más seguros.',
  heroSubtitulo:
    'Matricúlese en el aula virtual, avance a su ritmo y certifique su capacitación en seguridad vial con programas diseñados para usted.',
  acercaDeHtml:
    'La FUNDACIÓN FINSTRUVIAL lleva la seguridad vial en el alma.\n\nSomos tu mejor opción en formación, consultoría y campañas de seguridad vial para empresas, instituciones educativas y el sector público.\n\nMás de 28 años de experiencia práctica respaldan nuestro compromiso: educar para salvar vidas.',
  telefonoWhatsapp: '',
  /** Correo destino del formulario de contacto general */
  emailContacto: '',
  /** Remitente visible en los correos de confirmación de registro del aula */
  emailConfirmacion: '',
  /** Correo destino para el formulario PQR del aula */
  emailPqr: '',
  /** Google Search Console — archivo HTML en la raíz del portal (por cliente). */
  googleSearchConsoleFilename: '',
  googleSearchConsoleContent: '',
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

function validarEmailPortal(email) {
  const mail = String(email || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? mail : null;
}

/** Correo donde llegan los mensajes del formulario (contacto → portal → recibos). */
function resolverEmailFormularioContacto(aula, recibo) {
  for (const raw of [aula?.emailContacto, aula?.email, recibo?.email]) {
    const mail = validarEmailPortal(raw);
    if (mail) return mail;
  }
  return null;
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
  // Base = configuración actual (no DEFAULTS) para que los guardados parciales
  // (subir imagen hero/logo, etc.) NO reinicien campos no enviados como los textos del hero.
  const actual = await obtenerConfigAula();
  const dto = {
    ...actual,
    ...body,
    clave: CLAVE_AULA,
    nombreEmpresa: String(body.nombreEmpresa ?? body.nombreCea ?? actual.nombreEmpresa ?? '').trim(),
    nit: String(body.nit ?? actual.nit ?? '').trim(),
    direccion: String(body.direccion ?? actual.direccion ?? '').trim(),
    ciudad: String(body.ciudad ?? actual.ciudad ?? '').trim(),
    telefono: String(body.telefono ?? actual.telefono ?? '').trim(),
    email: String(body.email ?? actual.email ?? '').trim(),
    emailContacto:      String(body.emailContacto ?? actual.emailContacto ?? '').trim().toLowerCase(),
    emailConfirmacion:  String(body.emailConfirmacion ?? actual.emailConfirmacion ?? '').trim().toLowerCase(),
    emailPqr:           String(body.emailPqr ?? actual.emailPqr ?? '').trim().toLowerCase(),
    telefonoWhatsapp: String(body.telefonoWhatsapp ?? actual.telefonoWhatsapp ?? '').trim(),
    urlLogo: body.urlLogo !== undefined ? String(body.urlLogo ?? '').trim() : undefined,
    userChangeRecord: usuario?.username || 'sistema',
  };
  delete dto._id;
  delete dto.nombreCea;
  if (dto.urlLogo === undefined) delete dto.urlLogo;
  if (body.landing !== undefined) {
    dto.landing = normalizarLanding(body.landing);
  } else {
    dto.landing = mergeLanding(actual.landing);
  }
  if (body.site !== undefined) {
    const navBase = dto.landing?.nav || mergeLanding(actual.landing).nav;
    const footerBase = dto.landing?.footer || mergeLanding(actual.landing).footer;
    dto.site = mergePortalSite(body.site, { nav: navBase, footer: footerBase });
    dto.landing = sincronizarNavLanding(dto.landing || mergeLanding(actual.landing), dto.site);
  }
  await Config.updateOne({ clave: CLAVE_AULA }, { $set: dto }, { upsert: true });
  return obtenerConfigAula();
}

/** Config editable en admin (rellena con Recibos si el portal aún no tiene datos). */
function armarSitePublico(aula, landing) {
  const site = mergePortalSite(aula.site, { nav: landing.nav, footer: landing.footer });
  return {
    ...site,
    homeSeccionesLabels: HOME_SECCIONES_LABELS,
    homeSeccionesOrden: HOME_SECCIONES_ORDEN,
  };
}

async function obtenerConfigPortalAdmin(req) {
  const [aula, recibo] = await Promise.all([obtenerConfigAula(), obtenerConfigRecibo()]);
  const empresa = pickEmpresa(aula, recibo);
  const logo = pickLogo(aula, recibo);
  const landing = mergeLanding(aula.landing);
  const portalPublicUrl = resolverBasePortal({
    origin: req?.headers?.origin || req?.get?.('origin'),
  });
  return {
    ...aula,
    landing,
    site: armarSitePublico(aula, landing),
    nombreEmpresa: aula.nombreEmpresa || recibo.nombreEmpresa || '',
    nit: aula.nit || recibo.nit || '',
    direccion: aula.direccion || recibo.direccion || '',
    ciudad: aula.ciudad || recibo.ciudad || '',
    telefono: aula.telefono || recibo.telefono || '',
    email: aula.email || recibo.email || '',
    urlLogo: aula.urlLogo || '',
    urlLogoAbsoluta: logo.urlLogoAbsoluta,
    logoDesdeRecibos: logo.logoDesdeRecibos,
    googleSearchConsoleFilename: String(aula.googleSearchConsoleFilename || '').trim(),
    googleSearchConsoleUrl: urlPublicaVerificacion(aula.googleSearchConsoleFilename),
    portalPublicUrl: portalPublicUrl ? `${portalPublicUrl}/` : '',
    vistaPreviaEmpresa: empresa,
  };
}

/** Config pública del portal (marca CEA + textos aula). */
async function obtenerConfigPortalPublica() {
  const [recibo, aula] = await Promise.all([obtenerConfigRecibo(), obtenerConfigAula()]);
  const empresa = pickEmpresa(aula, recibo);
  const logo = pickLogo(aula, recibo);
  const landing = mergeLanding(aula.landing);
  const site = armarSitePublico(aula, landing);
  const landingNav = sincronizarNavLanding(landing, site);
  return {
    ...empresa,
    urlLogo: logo.urlLogo,
    urlLogoAbsoluta: logo.urlLogoAbsoluta,
    heroTitulo: aula.heroTitulo,
    heroSubtitulo: aula.heroSubtitulo,
    acercaDeHtml: aula.acercaDeHtml || '',
    landing: {
      ...landingNav,
      footer: {
        ...landingNav.footer,
        copyright: copyrightPublico(site, landingNav, empresa.nombreCea),
      },
    },
    site,
    formularioContactoActivo: !!resolverEmailFormularioContacto(aula, recibo),
    formularioPqrActivo: !!validarEmailPortal(aula?.emailPqr),
  };
}

module.exports = {
  obtenerConfigAula,
  guardarConfigAula,
  obtenerConfigPortalAdmin,
  obtenerConfigPortalPublica,
  resolverEmailFormularioContacto,
  pickLogo,
  logoAbsoluto,
  DEFAULTS_AULA,
  mergeLanding,
};
