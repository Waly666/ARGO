const { models: cat } = require('../models/catalogos');
const Liquidacion = require('../models/Liquidacion');
const { esTipoIngresoCajaDoc, resolverTipoIngreso } = require('./tipoIngresoCaja');

/** tipoServ (catálogo servicios) → nombre en catálogo tipoIngreso */
const TIPO_SERV_A_NOMBRE = {
  CUR: 'CURSOS',
  DIP: 'DIPLOMADOS',
  TEC: 'TECNICOS',
  SEG: 'SEGURO',
  CEA: 'CEA',
  CRC: 'CRC',
  ASE: 'ASESORIA',
  TRM: 'TRAMITES',
  DET: 'DERECHOS TRANSITO',
  RUNT: 'DERECHOS RUNT',
  FNSV: 'DERECHOS FNSV',
};

function normalizar(txt) {
  return String(txt ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function buscarServicio(idServ) {
  const raw = String(idServ ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return cat.servicios
    .findOne({
      $or: [{ idServ: raw }, ...(Number.isFinite(n) ? [{ idServ: n }] : [])],
    })
    .lean();
}

async function buscarTipoIngresoPorNombre(nombre) {
  const buscado = normalizar(nombre);
  if (!buscado) return null;
  const rows = await cat.tipoIngreso.find({}).lean();
  return (
    rows.find((r) => normalizar(r.tipo) === buscado) ||
    rows.find((r) => normalizar(r.tipo).includes(buscado) || buscado.includes(normalizar(r.tipo))) ||
    null
  );
}

/** El programa manda sobre un tipoServ viejo. «Competencias» sin «técnico» no es técnico laboral. */
function codigoDesdeEtiquetaCap(etiqueta) {
  const t = normalizar(etiqueta);
  if (!t) return '';
  if (t.includes('TECNICO') && (t.includes('LABORAL') || t.includes('COMPETENC'))) return 'TEC';
  if (t.includes('CURSO') || t.includes('NO FORMAL') || t.includes('COMPLEMENTARI')) return 'CUR';
  if (t.includes('DIPLOMADO')) return 'DIP';
  if (t.includes('LICENCIA') || t.includes('CONDUCC')) return 'CEA';
  if (t.includes('TECNICO')) return 'TEC';
  return '';
}

function codigoLinea(serv, etiquetaCap) {
  const desdePrograma = codigoDesdeEtiquetaCap(etiquetaCap);
  if (desdePrograma) return desdePrograma;
  return String(serv?.tipoServ || '').trim().toUpperCase();
}

function etiquetaTipCapEnIndice(idTipCap, indice) {
  const raw = String(idTipCap ?? '').trim();
  if (!raw || !indice?.rows) return '';
  const fila = indice.rows.find((r) => String(r.idTipCap ?? r.id ?? '').trim() === raw);
  if (fila) return String(fila.tipoCap || fila.descripcion || fila.nombre || '').trim();
  const pref = raw.match(/^(\d+)/);
  if (pref) {
    const porPrefijo = indice.rows.find((r) => {
      const id = String(r.idTipCap ?? r.id ?? '').trim();
      return id === pref[1] || id.startsWith(`${pref[1]} `) || id.startsWith(`${pref[1]}-`);
    });
    if (porPrefijo) {
      return String(porPrefijo.tipoCap || porPrefijo.descripcion || porPrefijo.nombre || '').trim();
    }
  }
  return /^\d+$/.test(raw) ? '' : raw;
}

async function tipoDocDesdeCodigo(cod, serv) {
  const nombre = TIPO_SERV_A_NOMBRE[cod] || serv?.descrServicio || cod;
  const tipoDoc = await buscarTipoIngresoPorNombre(nombre);
  if (tipoDoc) return tipoDoc;
  if (cod || nombre) return { idTipoIngreso: null, tipo: nombre };
  return null;
}

async function resolverTipoIngresoDesdeIdServ(idServ) {
  const serv = await buscarServicio(idServ);
  if (!serv) return null;
  const cod = codigoLinea(serv, '');
  return tipoDocDesdeCodigo(cod, serv);
}

async function mapaServicios(idServs) {
  const ids = [...new Set(idServs.map((id) => String(id ?? '').trim()).filter(Boolean))];
  const map = new Map();
  if (!ids.length) return map;
  const nums = ids.map(Number).filter((n) => Number.isFinite(n));
  const rows = await cat.servicios
    .find({ $or: [{ idServ: { $in: ids } }, ...(nums.length ? [{ idServ: { $in: nums } }] : [])] })
    .lean();
  for (const row of rows) {
    if (row.idServ != null) map.set(String(row.idServ), row);
  }
  return map;
}

async function mapaProgramas(idProgs) {
  const ids = [...new Set(idProgs.map((id) => String(id ?? '').trim()).filter(Boolean))];
  const map = new Map();
  if (!ids.length) return map;
  const nums = ids.map(Number).filter((n) => Number.isFinite(n));
  const oids = ids.filter((id) => /^[a-fA-F0-9]{24}$/.test(id));
  const rows = await cat.programas
    .find({
      $or: [
        { idPrograma: { $in: [...ids, ...nums] } },
        { idProg: { $in: [...ids, ...nums] } },
        { codigoProg: { $in: ids } },
        ...(oids.length ? [{ _id: { $in: oids } }] : []),
      ],
    })
    .lean();
  for (const row of rows) {
    for (const key of [row.idPrograma, row.idProg, row.codigoProg, row._id]) {
      if (key != null && String(key).trim()) map.set(String(key), row);
    }
  }
  return map;
}

function tipoDocEnCatalogo(tipos, cod, serv) {
  const nombre = TIPO_SERV_A_NOMBRE[cod] || serv?.descrServicio || cod;
  const buscado = normalizar(nombre);
  if (!buscado) return null;
  const exacto = tipos.find((r) => normalizar(r.tipo) === buscado);
  if (exacto) return exacto;
  const parecido = tipos.find((r) => {
    const tipo = normalizar(r.tipo);
    if (tipo.length < 4) return false;
    return tipo.includes(buscado) || buscado.includes(tipo);
  });
  if (parecido) return parecido;
  if (cod || nombre) return { idTipoIngreso: null, tipo: nombre };
  return null;
}

function elegirTipo(lineas, ctx) {
  const pesos = new Map();
  for (const linea of lineas) {
    const serv = ctx.servicios.get(String(linea.idServ ?? '')) || null;
    const prog = ctx.programas.get(String(linea.idProg ?? '')) || null;
    const etiqueta = etiquetaTipCapEnIndice(prog?.idTipCap, ctx.indice);
    const cod = codigoLinea(serv, etiqueta);
    if (!cod && !serv) continue;
    const tipoDoc = tipoDocEnCatalogo(ctx.tipos, cod, serv);
    if (!tipoDoc?.tipo) continue;
    const key = normalizar(tipoDoc.tipo);
    const prev = pesos.get(key) || { tipoDoc, valor: 0, n: 0 };
    prev.valor += Number(linea.valor) || 0;
    prev.n += 1;
    pesos.set(key, prev);
  }
  let mejor = null;
  for (const row of pesos.values()) {
    if (!mejor || row.valor > mejor.valor || (row.valor === mejor.valor && row.n > mejor.n)) {
      mejor = row;
    }
  }
  return mejor?.tipoDoc || null;
}

async function contextoTipos(lineas) {
  const { cargarIndiceTipCap } = require('./tipoCapacitacionMatch');
  const [servicios, programas, indice, tipos] = await Promise.all([
    mapaServicios(lineas.map((l) => l.idServ)),
    mapaProgramas(lineas.map((l) => l.idProg)),
    cargarIndiceTipCap(),
    cat.tipoIngreso.find({}).lean(),
  ]);
  return { servicios, programas, indice, tipos };
}

async function completarLineas(filas) {
  const lista = (filas || []).filter((l) => l && (l.idLiquidacion || l.idServ));
  const ids = lista
    .filter((l) => l.idLiquidacion && l.idServ == null && l.idProg == null)
    .map((l) => l.idLiquidacion);
  const liqs = ids.length
    ? await Liquidacion.find({ _id: { $in: ids } }).select('idServ idProg').lean()
    : [];
  const liqPorId = new Map(liqs.map((l) => [String(l._id), l]));
  return lista.map((l) => {
    const liq = l.idLiquidacion ? liqPorId.get(String(l.idLiquidacion)) : null;
    return {
      idServ: l.idServ ?? liq?.idServ,
      idProg: l.idProg ?? liq?.idProg,
      valor: Number(l.valor) || 0,
      ref: l.ref,
    };
  });
}

/**
 * Tipo de un comprobante con varios servicios: el que más valor aporta.
 * No se usa el primer ítem, porque al pagar varios cursos ese orden deja el recibo como técnicos.
 */
async function resolverTipoIngresoPredominante(lineas) {
  const normalizadas = await completarLineas(lineas);
  if (!normalizadas.length) return null;
  const ctx = await contextoTipos(normalizadas);
  return elegirTipo(normalizadas, ctx);
}

async function resolverTipoIngresoDesdeLiquidacion(idLiquidacion) {
  if (!idLiquidacion) return null;
  return resolverTipoIngresoPredominante([{ idLiquidacion, valor: 1 }]);
}

/** Recibos ya guardados con el tipo del primer servicio. El listado muestra el tipo que más pesa. */
async function aplicarTipoPredominante(items) {
  const multi = (items || []).filter((item) => {
    if (!Array.isArray(item?.detalle) || item.detalle.length < 2) return false;
    if (item.ingresoCaja || item.esIngresoCaja) return false;
    if (item.origenMigracion || item.esMigracion) return false;
    if (normalizar(item.tipoIngreso) === 'MIGRACION') return false;
    return true;
  });
  if (!multi.length) return items;

  const crudas = [];
  multi.forEach((item, idx) => {
    for (const d of item.detalle) {
      crudas.push({
        idLiquidacion: d.idLiquidacion,
        valor: Number(d.valor) || 0,
        ref: idx,
      });
    }
  });
  const normalizadas = await completarLineas(crudas);
  const ctx = await contextoTipos(normalizadas);
  const porRecibo = new Map();
  for (const linea of normalizadas) {
    const grupo = porRecibo.get(linea.ref) || [];
    grupo.push(linea);
    porRecibo.set(linea.ref, grupo);
  }
  multi.forEach((item, idx) => {
    const tipoDoc = elegirTipo(porRecibo.get(idx) || [], ctx);
    if (!tipoDoc?.tipo) return;
    item.tipoIngreso = tipoDoc.tipo;
    item.tipoIngresoDescr = tipoDoc.tipo;
    if (tipoDoc.idTipoIngreso != null) item.idTipoIngreso = String(tipoDoc.idTipoIngreso);
  });
  return items;
}

async function resolverTipoIngresoIngreso(ing) {
  if (ing.idTipoIngreso) {
    const t = await resolverTipoIngreso(ing.idTipoIngreso);
    if (t) return t;
  }
  if (ing.tipoIngreso) {
    const t = await buscarTipoIngresoPorNombre(ing.tipoIngreso);
    if (t) return t;
    return { idTipoIngreso: ing.idTipoIngreso || null, tipo: ing.tipoIngreso };
  }
  if (ing.idLiquidacion) {
    return resolverTipoIngresoDesdeLiquidacion(ing.idLiquidacion);
  }
  return null;
}

function formaPagoDesdeCatalogo(tipoDoc, idTipoPago) {
  const txt = `${tipoDoc?.descripcion || ''} ${tipoDoc?.codigo || ''} ${idTipoPago || ''}`.toLowerCase();
  if (txt.includes('efect') || txt === 'ef' || String(idTipoPago) === '1') return 'Efectivo';
  if (txt.includes('cheq')) return 'Cheque';
  if (txt.includes('nequi') || txt.includes('davi') || String(idTipoPago) === '6') return 'Nequi / Daviplata';
  if (txt.includes('línea') || txt.includes('linea') || txt.includes(' pl') || String(idTipoPago) === '7') {
    return 'Pago en línea';
  }
  if (txt.includes('débit') || txt.includes('debit') || txt.includes(' td')) return 'Tarjeta debito';
  if (txt.includes('créd') || txt.includes('credi') || txt.includes(' tc')) return 'Tarjeta de Credito';
  if (txt.includes('transf') || txt.includes('consign') || txt.includes('pse')) return 'Transferencia';
  return tipoDoc?.descripcion ? String(tipoDoc.descripcion).trim() : 'Efectivo';
}

module.exports = {
  TIPO_SERV_A_NOMBRE,
  resolverTipoIngresoDesdeIdServ,
  resolverTipoIngresoDesdeLiquidacion,
  resolverTipoIngresoPredominante,
  aplicarTipoPredominante,
  resolverTipoIngresoIngreso,
  formaPagoDesdeCatalogo,
  buscarTipoIngresoPorNombre,
  esTipoIngresoCajaDoc,
};
