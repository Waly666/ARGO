/**
 * Texto legible para el panel Vigilancia LIVE (auditoría + actividad HTTP).
 */

const CAMPOS_IGNORADOS = new Set([
  '_id',
  '__v',
  'password',
  'passwordHash',
  'token',
  'fechaMod',
  'fechaAudi',
  'fechaReg',
  'userAddReg',
  'userChangeRecord',
  'createdAt',
  'updatedAt',
]);

function nombrePersona(o) {
  if (!o || typeof o !== 'object') return '';
  if (o.nombreCompleto) return String(o.nombreCompleto).trim();
  if (o.razonSocial) return String(o.razonSocial).trim();
  if (o.nombreComercial) return String(o.nombreComercial).trim();
  const nom = [o.nombre1, o.nombre2, o.apellido1, o.apellido2].filter(Boolean).join(' ').trim();
  if (nom) return nom;
  return [o.nombres, o.apellidos].filter(Boolean).join(' ').trim();
}

function fmtScalar(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    const s = v.trim();
    return s.length > 72 ? `${s.slice(0, 69)}…` : s;
  }
  if (Array.isArray(v)) return `[${v.length}]`;
  try {
    const j = JSON.stringify(v);
    return j.length > 72 ? `${j.slice(0, 69)}…` : j;
  } catch {
    return '…';
  }
}

function fmtMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fmtScalar(v);
  return `$${Math.round(n).toLocaleString('es-CO')}`;
}

function pickData(row) {
  const despues = row?.datosDespues;
  const antes = row?.datosAntes;
  const payload = row?.payload;
  if (despues && typeof despues === 'object' && Object.keys(despues).length) return despues;
  if (antes && typeof antes === 'object' && Object.keys(antes).length) return antes;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) return payload;
  return {};
}

function resumenCambios(cambios, max = 5) {
  if (!Array.isArray(cambios) || !cambios.length) return '';
  return cambios
    .filter((c) => c?.campo && !CAMPOS_IGNORADOS.has(String(c.campo)))
    .slice(0, max)
    .map((c) => `${c.campo}: ${fmtScalar(c.antes)} → ${fmtScalar(c.despues)}`)
    .join(' · ');
}

function contextoAlumno(data, accion) {
  const partes = [];
  const doc = data.numDoc ?? data.numdoc ?? data.documento;
  const nom = nombrePersona(data);
  if (doc != null && String(doc).trim()) partes.push(`CC ${doc}`);
  if (nom) partes.push(nom);
  if (data.gestorNombre) partes.push(`Gestor: ${fmtScalar(data.gestorNombre)}`);
  if (data.tipoReferidorComercial) partes.push(`Ref. ${data.tipoReferidorComercial}`);
  if (accion === 'crear' && data.tipoAlumno) partes.push(`Tipo ${data.tipoAlumno}`);
  return partes;
}

function contextoIngreso(data) {
  const partes = [];
  if (data.numDoc != null) partes.push(`Alumno CC ${data.numDoc}`);
  if (data.valor != null) partes.push(fmtMoney(data.valor));
  if (data.numRecibo) partes.push(`Recibo ${data.numRecibo}`);
  if (data.observaciones) partes.push(fmtScalar(data.observaciones));
  return partes;
}

function contextoMatricula(data) {
  const partes = [];
  if (data.numDoc != null) partes.push(`CC ${data.numDoc}`);
  if (data.idPrograma || data.idProg) partes.push(`Prog ${data.idPrograma || data.idProg}`);
  if (data.tarifa != null) partes.push(`Tarifa ${data.tarifa}`);
  if (data.observaciones) partes.push(fmtScalar(data.observaciones));
  return partes;
}

function contextoGestor(data) {
  const partes = [];
  if (data.numero) partes.push(`Doc ${data.numero}`);
  const nom = data.seudonimo || nombrePersona(data);
  if (nom) partes.push(nom);
  if (data.tipoGestor) partes.push(String(data.tipoGestor).replace('_', ' '));
  return partes;
}

function contextoPorEntidad(entidad, data, accion) {
  const ent = String(entidad || '').toLowerCase();
  let partes = [];

  if (ent.includes('alumno')) partes = contextoAlumno(data, accion);
  else if (ent === 'ingreso' || ent === 'ingresos') partes = contextoIngreso(data);
  else if (ent.includes('matricula')) partes = contextoMatricula(data);
  else if (ent.includes('gestor')) partes = contextoGestor(data);
  else if (ent === 'egreso' || ent === 'egresos') {
    if (data.numeroDocumento) partes.push(`Doc ${data.numeroDocumento}`);
    if (data.valorEgreso != null) partes.push(fmtMoney(data.valorEgreso));
    if (data.pagueA) partes.push(fmtScalar(data.pagueA));
  } else if (ent.includes('usuario')) {
    if (data.username) partes.push(`@${data.username}`);
    if (data.rol) partes.push(`Rol ${data.rol}`);
  } else if (ent.includes('certificado')) {
    if (data.numDoc != null) partes.push(`CC ${data.numDoc}`);
    if (data.numero) partes.push(`Cert ${data.numero}`);
  } else if (nombrePersona(data)) {
    partes.push(nombrePersona(data));
  }

  return partes;
}

function detalleOpsAuditoria(row) {
  if (!row) return null;
  const partes = [];
  const data = pickData(row);
  const ent = row.entidad;
  const accion = row.accion;

  partes.push(...contextoPorEntidad(ent, data, accion));

  const delta = resumenCambios(row.cambios);
  if (delta) partes.push(`Cambios: ${delta}`);
  else if (accion === 'eliminar' && row.datosAntes) {
    partes.push(...contextoPorEntidad(ent, row.datosAntes, accion));
  }

  if (!partes.length && row.resumen) partes.push(String(row.resumen).trim());
  if (!partes.length && row.idEntidad) partes.push(`ID ${row.idEntidad}`);

  const txt = [...new Set(partes.filter(Boolean))].join(' · ');
  return txt || null;
}

function queryDeRuta(ruta) {
  const raw = String(ruta || '');
  const idx = raw.indexOf('?');
  if (idx < 0) return {};
  const out = {};
  try {
    for (const [k, v] of new URLSearchParams(raw.slice(idx + 1))) {
      if (v) out[k] = v;
    }
  } catch {
    /* ignore */
  }
  return out;
}

function extraerContextoBody(req, rutaBase) {
  const body = req?.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const rb = String(rutaBase || '');
  const partes = [];

  if (/alumnos/i.test(rb)) {
    partes.push(...contextoAlumno(body));
    const editando = Object.keys(body).filter(
      (k) =>
        !CAMPOS_IGNORADOS.has(k) &&
        body[k] != null &&
        body[k] !== '' &&
        !String(k).startsWith('url'),
    );
    if (editando.length && req?.method && req.method !== 'GET') {
      partes.push(`Campos: ${editando.slice(0, 8).join(', ')}`);
    }
  } else if (/ingresos/i.test(rb)) {
    partes.push(...contextoIngreso(body));
    if (Array.isArray(body.items) && body.items.length) {
      partes.push(`${body.items.length} ítem(s) de pago`);
    }
  } else if (/matriculas/i.test(rb)) {
    partes.push(...contextoMatricula(body));
  } else if (/gestores/i.test(rb)) {
    partes.push(...contextoGestor(body));
  } else if (/egresos/i.test(rb)) {
    partes.push(...contextoPorEntidad('egreso', body));
  } else if (body.numDoc != null) {
    partes.push(`CC ${body.numDoc}`);
  }

  const txt = [...new Set(partes.filter(Boolean))].join(' · ');
  return txt || null;
}

function detalleOpsHttp(row) {
  if (!row) return null;
  if (row.contexto) return String(row.contexto);

  const partes = [];
  const q = queryDeRuta(row.ruta);
  if (q.numDoc) partes.push(`CC ${q.numDoc}`);
  if (q.q) partes.push(`Búsqueda: ${q.q}`);
  if (q.idPrograma || q.idProg) partes.push(`Prog ${q.idPrograma || q.idProg}`);

  const rb = String(row.rutaBase || row.ruta || '');
  if (/alumnos/i.test(rb) && row.actividad) {
    const m = String(row.actividad).match(/alumno/i);
    if (m) partes.push(row.actividad);
  }

  const txt = [...new Set(partes.filter(Boolean))].join(' · ');
  return txt || null;
}

module.exports = {
  detalleOpsAuditoria,
  detalleOpsHttp,
  extraerContextoBody,
  nombrePersona,
  fmtScalar,
};
