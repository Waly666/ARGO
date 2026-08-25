const { esAdmin, normalizarRol } = require('../utils/roles');
const { obtenerConfigHorarioOperacion } = require('./configHorarioOperacion');
const { sesionAbiertaUsuario } = require('./cajaSesion');

const DIA_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function parseHoraMinutos(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function partesFechaZona(date, zonaHoraria) {
  const tz = zonaHoraria || 'America/Bogota';
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const dia = DIA_MAP[parts.weekday] ?? 0;
  const minutos = parseHoraMinutos(`${parts.hour}:${parts.minute}`) ?? 0;
  return { dia, minutos, tz };
}

function ventanasParaUsuario(config, rol) {
  const r = normalizarRol(rol);
  const porRol = (config.reglasPorRol || []).filter((x) => normalizarRol(x.rol) === r);
  if (porRol.length) return porRol;
  return config.reglasGenerales || [];
}

function ventanaActiva(ventana, dia, minutos) {
  if (!ventana?.dias?.includes(dia)) return false;
  const ini = parseHoraMinutos(ventana.horaInicio);
  const fin = parseHoraMinutos(ventana.horaFin);
  if (ini == null || fin == null) return false;
  if (ini > fin) return minutos >= ini || minutos <= fin;
  return minutos >= ini && minutos <= fin;
}

function ultimoCierreVentanaHoy(ventanas, dia, minutos) {
  let mejor = null;
  for (const v of ventanas) {
    if (!v?.dias?.includes(dia)) continue;
    const fin = parseHoraMinutos(v.horaFin);
    if (fin == null || fin > minutos) continue;
    if (mejor == null || fin > mejor) mejor = fin;
  }
  return mejor;
}

function proximaAperturaTexto(ventanas, dia, minutos) {
  let mejor = null;
  for (const v of ventanas) {
    if (!v?.dias?.includes(dia)) continue;
    const ini = parseHoraMinutos(v.horaInicio);
    if (ini == null || ini <= minutos) continue;
    if (mejor == null || ini < mejor) mejor = ini;
  }
  if (mejor == null) return null;
  const h = Math.floor(mejor / 60);
  const m = mejor % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutosAHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * @returns {Promise<{
 *   estado: 'permitido'|'gracia'|'bloqueado'|'inactivo',
 *   mensaje?: string,
 *   minutosGraciaRestantes?: number,
 *   graciaFinIso?: string,
 *   cajaAbierta?: boolean,
 *   proximaApertura?: string|null,
 * }>}
 */
async function evaluarHorarioOperacionUsuario(usuario, opts = {}) {
  const config = opts.config || (await obtenerConfigHorarioOperacion());
  if (!config.activo) return { estado: 'inactivo' };

  const rol = normalizarRol(usuario?.rol);
  if (esAdmin(rol) || usuario?.bg === true) return { estado: 'permitido' };

  const ventanas = ventanasParaUsuario(config, rol);
  if (!ventanas.length) {
    return {
      estado: 'bloqueado',
      mensaje:
        config.mensajeFueraHorario ||
        'No hay horario de operación configurado para su rol. Contacte al administrador.',
      code: 'HORARIO_OPERACION_CERRADO',
    };
  }

  const ahora = opts.fecha || new Date();
  const { dia, minutos } = partesFechaZona(ahora, config.zonaHoraria);

  if (ventanas.some((v) => ventanaActiva(v, dia, minutos))) {
    return { estado: 'permitido' };
  }

  const ultimoCierre = ultimoCierreVentanaHoy(ventanas, dia, minutos);
  const graciaMin = Math.max(Number(config.minutosGracia) || 30, 5);
  const idUsuario = usuario?.sub || usuario?.idUsuario || usuario?._id;

  let cajaAbierta = false;
  if (config.extenderSiCajaAbierta && idUsuario) {
    try {
      cajaAbierta = !!(await sesionAbiertaUsuario(String(idUsuario), opts.idSede || null));
    } catch {
      cajaAbierta = false;
    }
  }

  if (ultimoCierre != null) {
    const finGracia = ultimoCierre + graciaMin;
    if (minutos <= finGracia || cajaAbierta) {
      const restante = cajaAbierta
        ? graciaMin
        : Math.max(0, finGracia - minutos);
      const graciaFin = new Date(ahora.getTime() + restante * 60_000);
      return {
        estado: 'gracia',
        mensaje: cajaAbierta
          ? `${config.mensajeGracia} Tiene la caja abierta: cierre la caja para finalizar.`
          : config.mensajeGracia,
        minutosGraciaRestantes: restante,
        graciaFinIso: graciaFin.toISOString(),
        cajaAbierta,
        code: 'HORARIO_OPERACION_GRACIA',
      };
    }
  }

  const proxima = proximaAperturaTexto(ventanas, dia, minutos);
  let mensaje = config.mensajeFueraHorario;
  if (proxima) mensaje += ` Próxima ventana hoy: ${proxima}.`;

  return {
    estado: 'bloqueado',
    mensaje,
    proximaApertura: proxima,
    code: 'HORARIO_OPERACION_CERRADO',
  };
}

function aplicarHeadersHorario(res, evaluacion) {
  if (!evaluacion || evaluacion.estado === 'permitido' || evaluacion.estado === 'inactivo') return;
  if (evaluacion.estado === 'gracia') {
    res.setHeader('X-ARGO-Horario-Aviso', 'gracia');
    if (evaluacion.graciaFinIso) res.setHeader('X-ARGO-Horario-Gracia-Fin', evaluacion.graciaFinIso);
    if (evaluacion.minutosGraciaRestantes != null) {
      res.setHeader('X-ARGO-Horario-Gracia-Min', String(evaluacion.minutosGraciaRestantes));
    }
    if (evaluacion.cajaAbierta) res.setHeader('X-ARGO-Horario-Caja-Abierta', '1');
  }
}

function rutaExentaHorario(path) {
  const p = String(path || '').split('?')[0];
  if (/^\/api\/health/i.test(p)) return true;
  if (/^\/api\/auth\/config/i.test(p)) return true;
  if (/^\/api\/auth\/login/i.test(p)) return true;
  if (/^\/api\/auth\/mfa\//i.test(p)) return true;
  if (/^\/api\/aula-virtual/i.test(p)) return true;
  if (/^\/api\/config\/horario-operacion/i.test(p)) return true;
  return false;
}

module.exports = {
  evaluarHorarioOperacionUsuario,
  aplicarHeadersHorario,
  rutaExentaHorario,
  ventanasParaUsuario,
  partesFechaZona,
  parseHoraMinutos,
  minutosAHora,
};
