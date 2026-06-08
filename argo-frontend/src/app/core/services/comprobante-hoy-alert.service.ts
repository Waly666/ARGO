import { Injectable, signal } from '@angular/core';

export type ComprobanteHoyTipo = 'ingreso' | 'egreso' | 'factura';

export interface ComprobanteHoyAlerta {
  key: string;
  tipo: ComprobanteHoyTipo;
  id: string;
  numRecibo?: string | null;
  numeroFactura?: string | null;
  valor: number;
  numDoc?: number | string;
  nombreCompleto?: string;
  alumnoId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ComprobanteHoyAlertService {
  private vistos = new Set<string>();
  private readonly _alertas = signal<ComprobanteHoyAlerta[]>([]);

  readonly alertas = this._alertas.asReadonly();

  private clave(tipo: ComprobanteHoyTipo, id: string): string {
    return `${tipo}:${id}`;
  }

  notificarDesdeEgreso(
    eg: Record<string, unknown> | null | undefined,
    ctx?: { nombreCompleto?: string; alumnoId?: string; numDoc?: number | string },
  ) {
    if (!eg) return;
    const id = String(eg['idEgreso'] || eg['_id'] || eg['id'] || '');
    if (!id) return;
    this.notificar(
      {
        key: this.clave('egreso', id),
        tipo: 'egreso',
        id,
        numRecibo: eg['numRecibo'] != null ? String(eg['numRecibo']) : null,
        valor: Number(eg['valorEgreso'] ?? eg['valor']) || 0,
        numDoc: (eg['numeroDocumento'] as string | undefined) ?? ctx?.numDoc,
        nombreCompleto:
          ctx?.nombreCompleto ||
          (eg['pagueA'] != null ? String(eg['pagueA']) : '') ||
          (eg['empleadoNombre'] != null ? String(eg['empleadoNombre']) : ''),
        alumnoId: ctx?.alumnoId || null,
      },
      { inmediato: true },
    );
  }

  notificarDesdeFactura(
    f: Record<string, unknown> | null | undefined,
    ctx?: { nombreCompleto?: string; alumnoId?: string; numDoc?: number | string },
  ) {
    if (!f) return;
    const id = String(f['_id'] || f['id'] || '');
    if (!id) return;
    const adq = f['adquirente'] as { nombre?: string } | undefined;
    this.notificar(
      {
        key: this.clave('factura', id),
        tipo: 'factura',
        id,
        numeroFactura: f['numeroFactura'] != null ? String(f['numeroFactura']) : null,
        valor: Number(f['valorTotal']) || 0,
        numDoc: (f['numDoc'] as number | string | undefined) ?? ctx?.numDoc,
        nombreCompleto: ctx?.nombreCompleto || adq?.nombre || '',
        alumnoId: ctx?.alumnoId || null,
      },
      { inmediato: true },
    );
  }

  notificarDesdeIngreso(
    ing: Record<string, unknown> | null | undefined,
    ctx?: { nombreCompleto?: string; alumnoId?: string; numDoc?: number | string },
  ) {
    if (!ing) return;
    const id = String(ing['_id'] || ing['id'] || '');
    if (!id) return;
    this.notificar(
      {
        key: this.clave('ingreso', id),
        tipo: 'ingreso',
        id,
        numRecibo: ing['numRecibo'] != null ? String(ing['numRecibo']) : null,
        valor: Number(ing['valor']) || 0,
        numDoc: (ing['numDoc'] as number | string | undefined) ?? ctx?.numDoc,
        nombreCompleto: ctx?.nombreCompleto || '',
        alumnoId: ctx?.alumnoId || null,
      },
      { inmediato: true },
    );
  }

  notificarDesdeRespuesta(row: Record<string, unknown> | null | undefined) {
    if (!row) return;
    const tipo = String(row['tipo'] || '') as ComprobanteHoyTipo;
    if (tipo !== 'ingreso' && tipo !== 'egreso' && tipo !== 'factura') return;
    const id = String(row['id'] || '');
    if (!id) return;
    this.notificar({
      key: this.clave(tipo, id),
      tipo,
      id,
      numRecibo: row['numRecibo'] != null ? String(row['numRecibo']) : null,
      numeroFactura: row['numeroFactura'] != null ? String(row['numeroFactura']) : null,
      valor: Number(row['valor']) || 0,
      numDoc: row['numDoc'] as number | string | undefined,
      nombreCompleto: row['nombreCompleto'] != null ? String(row['nombreCompleto']) : '',
      alumnoId: row['alumnoId'] != null ? String(row['alumnoId']) : null,
    });
  }

  notificar(alerta: ComprobanteHoyAlerta, opts?: { inmediato?: boolean }) {
    const key = String(alerta.key || '');
    if (!key) return;
    if (opts?.inmediato) {
      this.vistos.delete(key);
      this._alertas.update((list) => list.filter((a) => a.key !== key));
    } else if (this.vistos.has(key)) {
      return;
    }
    if (this._alertas().some((a) => a.key === key)) return;
    this._alertas.update((list) => [alerta, ...list].slice(0, 12));
  }

  descartar(key: string) {
    const k = String(key || '');
    if (k) this.vistos.add(k);
    this._alertas.update((list) => list.filter((a) => a.key !== k));
  }

  marcarConocidos(keys: string[]) {
    for (const key of keys) {
      const k = String(key || '');
      if (k) this.vistos.add(k);
    }
  }
}
