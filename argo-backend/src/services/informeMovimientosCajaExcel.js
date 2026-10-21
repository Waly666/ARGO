const XLSX = require('xlsx');

const MAX_FILAS = 15000;

function norm(v) {
  return String(v ?? '')
    .trim()
    .toLocaleLowerCase('es');
}

function coincide(valor, filtro) {
  const f = norm(filtro);
  if (!f) return true;
  return norm(valor) === f;
}

function textoEsEfectivo(texto) {
  const s = String(texto ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!s) return true;
  if (s === 'ef' || s === '1') return true;
  return s.includes('efect');
}

function ingresoFaltaSoporte(i) {
  if (i?.anulado) return false;
  if (String(i?.idTipoPago ?? '').trim() === '1') return false;
  const candidatos = [i?.tipoPagoDescr, i?.formaPago]
    .map((v) => String(v ?? '').trim())
    .filter((v) => v && v !== '—');
  if (!candidatos.length || candidatos.every((c) => textoEsEfectivo(c))) return false;
  return !String(i?.urlSoporte || '').trim();
}

function coincideDocumento(valor, filtro) {
  const f = String(filtro ?? '').trim();
  if (!f) return true;
  const doc = String(valor ?? '').trim();
  const fDigits = f.replace(/\D/g, '');
  const dDigits = doc.replace(/\D/g, '');
  if (fDigits && dDigits) return dDigits.includes(fDigits);
  return norm(doc).includes(norm(f));
}

function filtrarEtiquetas(items, query, pick) {
  const tercero = query.tercero;
  const tipo = query.tipo;
  const concepto = query.concepto;
  return items.filter(
    (item) =>
      coincideDocumento(pick.tercero(item), tercero) &&
      coincide(pick.tipo(item), tipo) &&
      coincide(pick.concepto(item), concepto),
  );
}

function fmtFecha(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function libro({ titulo, filtros, headers, filas, totalVigente }) {
  const meta = [
    [titulo],
    ['Periodo', filtros.desde || filtros.hasta ? `${filtros.desde || '…'} — ${filtros.hasta || '…'}` : 'Todo el histórico consultado'],
    ['Documento', filtros.numDoc || filtros.numeroDocumento || filtros.doc || filtros.tercero || 'Todos'],
    ['Tipo', filtros.tipo || 'Todos'],
    ['Concepto', filtros.concepto || 'Todos'],
    ['Generado', new Date().toLocaleString('es-CO')],
    ['Total vigente', totalVigente],
    [],
    headers,
    ...filas,
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(meta);
  ws['!cols'] = headers.map((h) => ({ wch: Math.min(36, Math.max(12, String(h).length + 4)) }));
  const headerRow = 8;
  if (filas.length) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRow, c: 0 },
        e: { r: headerRow + filas.length, c: headers.length - 1 },
      }),
    };
  }
  XLSX.utils.book_append_sheet(wb, ws, titulo.slice(0, 31));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function enviar(res, buffer, nombre) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(buffer);
}

module.exports = {
  MAX_FILAS,
  filtrarEtiquetas,
  fmtFecha,
  libro,
  enviar,
  ingresoFaltaSoporte,
};
