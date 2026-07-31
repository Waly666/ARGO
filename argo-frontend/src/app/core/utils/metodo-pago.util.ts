export interface MetodoPagoDef {
  id: string;
  label: string;
  icon: string;
  tone: string;
}

/** Medios del cajero (sin pago en línea / pasarela). */
export const METODOS_PAGO_CAJA: MetodoPagoDef[] = [
  { id: 'efectivo', label: 'Efectivo', icon: '💵', tone: 'emerald' },
  { id: 'transferencia', label: 'Transferencia', icon: '🏦', tone: 'blue' },
  { id: 'tc', label: 'Tarjeta de crédito', icon: '💳', tone: 'purple' },
  { id: 'td', label: 'Tarjeta débito', icon: '💳', tone: 'indigo' },
  { id: 'cheque', label: 'Cheque', icon: '◎', tone: 'amber' },
  { id: 'nequi', label: 'Nequi / Daviplata', icon: '📱', tone: 'pink' },
];

/** Incluye pasarela — solo dashboard / informes globales. */
export const METODOS_PAGO_DEF: MetodoPagoDef[] = [
  ...METODOS_PAGO_CAJA,
  { id: 'linea', label: 'Pago en línea', icon: '🌐', tone: 'cyan' },
];

export interface MetodoPagoRow {
  forma: string;
  total: number;
  cantidad: number;
  pct?: number;
}

export interface MetodoPagoCard extends MetodoPagoDef {
  total: number;
  cantidad: number;
  pct: number;
}

function normalizar(txt: string): string {
  return String(txt ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Agrupa etiquetas del catálogo / formaPago en un medio canónico. */
export function canonicoMetodoPago(texto: string): string {
  const t = normalizar(texto);
  if (!t) return 'Efectivo';
  if (/nequi|daviplata|\bdavi\b/.test(t)) return 'Nequi / Daviplata';
  if (/pago en linea|en linea|\bpl\b/.test(t)) return 'Pago en línea';
  if (/efect|\bef\b/.test(t)) return 'Efectivo';
  if (/cheq/.test(t)) return 'Cheque';
  if (/debit|tarjeta debito/.test(t)) return 'Tarjeta débito';
  if (/credit|tarjeta de credito|tarjeta credito/.test(t)) return 'Tarjeta de crédito';
  if (/transf|consign|pse|banco/.test(t)) return 'Transferencia';
  return 'Otro';
}

export function tonoMetodoPago(label: string): { tone: string; icon: string } {
  const canon = canonicoMetodoPago(label);
  const def = METODOS_PAGO_DEF.find((m) => m.label === canon);
  if (def) return { tone: def.tone, icon: def.icon };
  return { tone: 'cyan', icon: '◎' };
}

export function esTipoPagoEnLineaCatalogo(t: Record<string, unknown> | null | undefined): boolean {
  if (!t) return false;
  const id = String(t['idTipoPago'] ?? t['codigo'] ?? t['id'] ?? '')
    .trim()
    .toUpperCase();
  if (id === 'PL' || id === '7') return true;
  const label = normalizar(String(t['descripcion'] ?? t['nombre'] ?? ''));
  return /pago en linea/.test(label) || label === 'pl';
}

/** Catálogo de medios para formularios de caja (sin pasarela). */
export function filtrarTiposPagoCaja<T extends Record<string, unknown>>(tipos: T[]): T[] {
  return (tipos || []).filter((t) => !esTipoPagoEnLineaCatalogo(t));
}

export interface BuildMetodosOpts {
  /** Si true (default en caja), omite la tarjeta «Pago en línea». */
  excluirPagoEnLinea?: boolean;
}

/**
 * Tarjetas de medios de pago.
 * En caja: sin «Pago en línea» (eso va a su propia ficha).
 * En dashboard: incluir con `excluirPagoEnLinea: false`.
 */
export function buildMetodosPagoCards(
  rows: MetodoPagoRow[],
  opts: BuildMetodosOpts = {},
): MetodoPagoCard[] {
  const excluir = opts.excluirPagoEnLinea !== false;
  const defs = excluir ? METODOS_PAGO_CAJA : METODOS_PAGO_DEF;

  const porCanon = new Map<string, { total: number; cantidad: number }>();
  for (const r of rows) {
    const canon = canonicoMetodoPago(r.forma);
    if (excluir && canon === 'Pago en línea') continue;
    const prev = porCanon.get(canon) || { total: 0, cantidad: 0 };
    prev.total += r.total ?? 0;
    prev.cantidad += r.cantidad ?? 0;
    porCanon.set(canon, prev);
  }

  const cards: MetodoPagoCard[] = defs.map((def) => {
    const agg = porCanon.get(def.label) || { total: 0, cantidad: 0 };
    return {
      ...def,
      total: agg.total,
      cantidad: agg.cantidad,
      pct: 0,
    };
  });

  const otro = porCanon.get('Otro');
  if (otro && (otro.total > 0 || otro.cantidad > 0)) {
    cards.push({
      id: 'otro',
      label: 'Otro',
      icon: '◎',
      tone: 'cyan',
      total: otro.total,
      cantidad: otro.cantidad,
      pct: 0,
    });
  }

  const base = cards.reduce((a, c) => a + c.total, 0);
  for (const c of cards) {
    c.pct = base ? Math.round((c.total / base) * 1000) / 10 : 0;
  }
  return cards;
}
