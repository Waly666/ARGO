import { Injectable, computed, signal } from '@angular/core';

import type { AulaVirtualAccesoPorVencerRes } from './aula-virtual-admin.service';

@Injectable({ providedIn: 'root' })
export class AulaVirtualAccesoPorVencerAlertService {
  private ocultaManual = signal(false);
  private firmaAnterior = '';
  private _data = signal<AulaVirtualAccesoPorVencerRes | null>(null);

  readonly data = this._data.asReadonly();
  readonly items = computed(() => this._data()?.items ?? []);
  readonly total = computed(() => this._data()?.total ?? 0);
  readonly venceHoy = computed(() => this._data()?.venceHoy ?? 0);
  readonly venceManana = computed(() => this._data()?.venceManana ?? 0);
  readonly hayAlertas = computed(() => this.total() > 0);
  readonly visible = computed(() => this.hayAlertas() && !this.ocultaManual());

  actualizar(data: AulaVirtualAccesoPorVencerRes | null | undefined) {
    const next = data ?? null;
    const firma = next
      ? `${next.total}|${next.venceHoy}|${next.items.map((i) => `${i.id}:${i.diasRestantes}`).join(',')}`
      : '';

    if (!next || next.total <= 0) {
      this.ocultaManual.set(false);
      this.firmaAnterior = '';
      this._data.set(null);
      return;
    }

    if (firma !== this.firmaAnterior) this.ocultaManual.set(false);
    this.firmaAnterior = firma;
    this._data.set(next);
  }

  cerrar() {
    this.ocultaManual.set(true);
  }

  etiquetaDias(dias: number): string {
    if (dias <= 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `Vence en ${dias} días`;
  }

  resumenItem(item: AulaVirtualAccesoPorVencerRes['items'][0]): string {
    const curso = item.nombrePrograma || item.idPrograma;
    const doc = item.numDoc ? `CC ${item.numDoc}` : '';
    return [curso, doc, this.etiquetaDias(item.diasRestantes)].filter(Boolean).join(' · ');
  }
}
