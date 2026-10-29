/** Misma regla que ERP / cron: vencido si estado «vencido» o fechaVencimiento ≤ hoy (inicio de día). */

function inicioDia(ref = new Date()) {
  const d = ref instanceof Date ? new Date(ref.getTime()) : new Date(ref);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function certificadoEstaVencido(cert) {
  if (!cert || String(cert.estado || '').trim().toLowerCase() === 'anulado') return false;
  if (String(cert.estado || '').trim().toLowerCase() === 'vencido') return true;
  const fv = inicioDia(cert.fechaVencimiento);
  const hoy = inicioDia(new Date());
  if (!fv || !hoy) return false;
  return fv.getTime() <= hoy.getTime();
}

function estadoVigenciaCertificado(cert) {
  if (!cert || String(cert.estado || '').trim().toLowerCase() === 'anulado') return 'anulado';
  if (certificadoEstaVencido(cert)) return 'vencido';
  return 'vigente';
}

module.exports = {
  inicioDia,
  certificadoEstaVencido,
  estadoVigenciaCertificado,
};
