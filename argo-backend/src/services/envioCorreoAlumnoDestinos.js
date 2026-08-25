const Gestor = require('../models/Gestor');
const { esAlumnoReferidorComercial } = require('./gestorEmpresaMatricula');

const DESTINOS_VALIDOS = ['ninguno', 'alumno', 'referidor', 'ambos'];

const REGLAS_REFERIDOR_DEFAULT = {
  gestor: {
    comprobanteIngreso: 'ninguno',
    certificado: 'alumno',
  },
  empresa: {
    comprobanteIngreso: 'ninguno',
    certificado: 'alumno',
  },
};

function normalizarDestino(val, fallback = 'alumno') {
  const d = String(val || '').trim().toLowerCase();
  return DESTINOS_VALIDOS.includes(d) ? d : fallback;
}

function normalizarReglasReferidor(raw = {}) {
  const gestor = raw.gestor || {};
  const empresa = raw.empresa || {};
  return {
    gestor: {
      comprobanteIngreso: normalizarDestino(
        gestor.comprobanteIngreso,
        REGLAS_REFERIDOR_DEFAULT.gestor.comprobanteIngreso,
      ),
      certificado: normalizarDestino(gestor.certificado, REGLAS_REFERIDOR_DEFAULT.gestor.certificado),
    },
    empresa: {
      comprobanteIngreso: normalizarDestino(
        empresa.comprobanteIngreso,
        REGLAS_REFERIDOR_DEFAULT.empresa.comprobanteIngreso,
      ),
      certificado: normalizarDestino(
        empresa.certificado,
        REGLAS_REFERIDOR_DEFAULT.empresa.certificado,
      ),
    },
  };
}

function emailValido(val) {
  const email = String(val || '').trim().toLowerCase();
  return email.includes('@') ? email : null;
}

async function emailReferidorComercial(alumno) {
  const tipo = String(alumno?.tipoReferidorComercial || '').trim().toLowerCase();
  if (tipo === 'gestor' && alumno?.gestorId) {
    const g = await Gestor.findById(alumno.gestorId).select('correo seudonimo nombres apellidos').lean();
    const email = emailValido(g?.correo);
    if (!email) return null;
    const nombre =
      String(g?.seudonimo || '').trim() ||
      [g?.nombres, g?.apellidos].filter(Boolean).join(' ').trim() ||
      'Gestor';
    return { email, nombre, rol: 'referidor', tipoReferidor: 'gestor' };
  }
  return null;
}

/**
 * Resuelve destinatarios según config global y reglas gestor/empresa.
 * @param {'comprobanteIngreso'|'certificado'} tipoCorreo
 */
async function resolverDestinatariosCorreoAlumno({ alumno, tipoCorreo, cfg }) {
  const globalOn =
    tipoCorreo === 'certificado' ? cfg.enviarCertificados : cfg.enviarComprobantesIngreso;
  if (!globalOn) {
    return { destinatarios: [], motivo: 'envio_desactivado' };
  }

  const reglasRef = normalizarReglasReferidor(cfg.referidorComercial);
  let destino = 'alumno';

  if (esAlumnoReferidorComercial(alumno)) {
    destino = normalizarDestino(reglasRef.gestor[tipoCorreo], REGLAS_REFERIDOR_DEFAULT.gestor[tipoCorreo]);
  }

  if (destino === 'ninguno') {
    return { destinatarios: [], motivo: 'regla_ninguno' };
  }

  const destinatarios = [];
  const emailAlumno = emailValido(alumno?.correo);

  if (destino === 'alumno' || destino === 'ambos') {
    if (emailAlumno) {
      destinatarios.push({ email: emailAlumno, nombre: null, rol: 'alumno' });
    }
  }

  if (destino === 'referidor' || destino === 'ambos') {
    const ref = await emailReferidorComercial(alumno);
    if (ref) destinatarios.push(ref);
  }

  const unicos = [];
  const vistos = new Set();
  for (const d of destinatarios) {
    if (vistos.has(d.email)) continue;
    vistos.add(d.email);
    unicos.push(d);
  }

  if (!unicos.length) {
    return {
      destinatarios: [],
      motivo: destino === 'referidor' ? 'sin_correo_referidor' : 'sin_correo_destino',
      destino,
    };
  }

  return { destinatarios: unicos, destino };
}

module.exports = {
  DESTINOS_VALIDOS,
  REGLAS_REFERIDOR_DEFAULT,
  normalizarReglasReferidor,
  resolverDestinatariosCorreoAlumno,
  emailValido,
};
