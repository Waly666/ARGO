const {
  PROVEEDOR_STUB,
  PROVEEDOR_FACTUS,
  ESTADO_VALIDADA,
  ESTADO_PENDIENTE_ENVIO,
  ESTADO_RECHAZADA,
} = require('../constants/facturacionElectronica');
const { credencialesEfectivas, credencialesCompletas } = require('./configFacturacion');
const { generarUuidDev } = require('./facturaQrDian');

/**
 * Cliente Factus — integración real pendiente de credenciales/resolución DIAN.
 * Por ahora expone la interfaz y devuelve errores claros si se intenta usar sin config.
 */
async function obtenerTokenFactus() {
  const cfg = await credencialesEfectivas();
  if (!credencialesCompletas(cfg)) {
    const err = new Error('Credenciales Factus incompletas. Configure client_id, secret, usuario y contraseña.');
    err.status = 428;
    err.code = 'FACTUS_SIN_CREDENCIALES';
    throw err;
  }

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    username: cfg.username,
    password: cfg.password,
  });

  const res = await fetch(`${cfg.baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: params,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || 'Error al autenticar con Factus');
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    err.code = 'FACTUS_AUTH_ERROR';
    err.details = data;
    throw err;
  }
  return data;
}

async function validarFacturaFactus(payload) {
  const cfg = await credencialesEfectivas();
  const tokenData = await obtenerTokenFactus();
  const token = tokenData.access_token;
  if (!token) {
    const err = new Error('Factus no devolvió access_token');
    err.status = 502;
    throw err;
  }

  const res = await fetch(`${cfg.baseUrl}/v2/bills/validate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || 'Factus rechazó la factura');
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    err.code = 'FACTUS_EMISION_ERROR';
    err.details = data;
    throw err;
  }
  return data;
}

async function listarRangosFactus() {
  const cfg = await credencialesEfectivas();
  const tokenData = await obtenerTokenFactus();
  const token = tokenData.access_token;
  const res = await fetch(`${cfg.baseUrl}/v2/numbering-ranges?filter[is_active]=1`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || 'No se pudieron listar rangos Factus');
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    throw err;
  }
  return data;
}

/** Emisión en modo desarrollo: no llama DIAN; simula respuesta mínima. */
function emitirStub(payload, montos) {
  const ts = Date.now();
  const numero = `DEV-${ts}`;
  const cufe = generarUuidDev('FE', [payload.reference_code, numero, montos?.valorTotal]);
  return {
    proveedor: PROVEEDOR_STUB,
    modoDesarrollo: true,
    estado: ESTADO_VALIDADA,
    numeroFactura: numero,
    prefijo: 'DEV',
    cufe,
    validadaAt: new Date(),
    respuestaProveedor: {
      status: 'Created',
      message: 'Modo desarrollo: documento registrado localmente sin envío a DIAN.',
      data: {
        reference_code: payload.reference_code,
        number: numero,
        is_validated: false,
        cufe: null,
        totals: {
          total: String(montos.valorTotal.toFixed(2)),
        },
      },
    },
  };
}

/**
 * Punto único de emisión: stub o Factus según configuración.
 */
async function emitirFactura({ payload, montos, config }) {
  const cfg = config || (await credencialesEfectivas());
  const proveedor = cfg.proveedor || PROVEEDOR_STUB;

  if (proveedor === PROVEEDOR_STUB || !cfg.activo) {
    return emitirStub(payload, montos);
  }

  if (proveedor === PROVEEDOR_FACTUS) {
    try {
      const resp = await validarFacturaFactus(payload);
      const data = resp?.data || {};
      return {
        proveedor: PROVEEDOR_FACTUS,
        modoDesarrollo: false,
        estado: data.is_validated ? ESTADO_VALIDADA : ESTADO_PENDIENTE_ENVIO,
        numeroFactura: data.number || '',
        prefijo: data.numbering_range?.prefix || '',
        cufe: data.cufe || '',
        validadaAt: data.is_validated ? new Date() : null,
        urlPdf: data.links?.public_url || '',
        urlQr: data.links?.qr || '',
        respuestaProveedor: resp,
        erroresValidacion: data.errors || null,
      };
    } catch (e) {
      return {
        proveedor: PROVEEDOR_FACTUS,
        modoDesarrollo: false,
        estado: ESTADO_RECHAZADA,
        respuestaProveedor: e.details || null,
        erroresValidacion: e.details?.errors || { message: e.message },
        error: e.message,
      };
    }
  }

  const err = new Error(`Proveedor de facturación no soportado: ${proveedor}`);
  err.status = 400;
  throw err;
}

async function validarNotaCreditoFactus(payload) {
  const cfg = await credencialesEfectivas();
  const tokenData = await obtenerTokenFactus();
  const token = tokenData.access_token;
  if (!token) {
    const err = new Error('Factus no devolvió access_token');
    err.status = 502;
    throw err;
  }
  const res = await fetch(`${cfg.baseUrl}/v2/credit-notes/validate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || 'Factus rechazó la nota crédito');
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    err.code = 'FACTUS_NC_ERROR';
    err.details = data;
    throw err;
  }
  return data;
}

/** Nota crédito en modo desarrollo. */
function emitirNotaCreditoStub(payload, montos) {
  const ts = Date.now();
  const numero = `NC-DEV-${ts}`;
  const cude = generarUuidDev('NC', [payload.reference_code, numero, montos?.valorTotal]);
  return {
    proveedor: PROVEEDOR_STUB,
    modoDesarrollo: true,
    estado: ESTADO_VALIDADA,
    numeroNota: numero,
    prefijo: 'NC',
    cude,
    validadaAt: new Date(),
    respuestaProveedor: {
      status: 'Created',
      message: 'Modo desarrollo: nota crédito registrada localmente sin envío a DIAN.',
      data: {
        reference_code: payload.reference_code,
        number: numero,
        is_validated: false,
        cude: null,
        totals: { total: String(Number(montos?.valorTotal || 0).toFixed(2)) },
      },
    },
  };
}

/** Punto único de emisión de nota crédito: stub o Factus. */
async function emitirNotaCredito({ payload, montos, config }) {
  const cfg = config || (await credencialesEfectivas());
  const proveedor = cfg.proveedor || PROVEEDOR_STUB;

  if (proveedor === PROVEEDOR_STUB || !cfg.activo) {
    return emitirNotaCreditoStub(payload, montos);
  }

  if (proveedor === PROVEEDOR_FACTUS) {
    try {
      const resp = await validarNotaCreditoFactus(payload);
      const data = resp?.data || {};
      return {
        proveedor: PROVEEDOR_FACTUS,
        modoDesarrollo: false,
        estado: data.is_validated ? ESTADO_VALIDADA : ESTADO_PENDIENTE_ENVIO,
        numeroNota: data.number || '',
        prefijo: data.numbering_range?.prefix || '',
        cude: data.cude || '',
        validadaAt: data.is_validated ? new Date() : null,
        urlPdf: data.links?.public_url || '',
        urlQr: data.links?.qr || '',
        respuestaProveedor: resp,
        erroresValidacion: data.errors || null,
      };
    } catch (e) {
      return {
        proveedor: PROVEEDOR_FACTUS,
        modoDesarrollo: false,
        estado: ESTADO_RECHAZADA,
        respuestaProveedor: e.details || null,
        erroresValidacion: e.details?.errors || { message: e.message },
        error: e.message,
      };
    }
  }

  const err = new Error(`Proveedor de facturación no soportado: ${proveedor}`);
  err.status = 400;
  throw err;
}

async function probarConexionFactus() {
  const cfg = await credencialesEfectivas();
  if (cfg.proveedor === PROVEEDOR_STUB) {
    return {
      ok: true,
      modo: 'desarrollo',
      message: 'Modo desarrollo activo. No se requiere conexión a Factus.',
    };
  }
  const token = await obtenerTokenFactus();
  return {
    ok: true,
    modo: cfg.ambiente,
    message: 'Conexión con Factus exitosa.',
    expiresIn: token.expires_in,
  };
}

module.exports = {
  emitirFactura,
  emitirStub,
  emitirNotaCredito,
  emitirNotaCreditoStub,
  probarConexionFactus,
  listarRangosFactus,
  validarFacturaFactus,
  validarNotaCreditoFactus,
};
