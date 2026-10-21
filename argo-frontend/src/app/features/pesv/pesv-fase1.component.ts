import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PesvNavComponent } from './pesv-nav.component';

import { PesvFase1Dto, PesvFase1ItemView, PesvService } from '../../core/services/pesv.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { tituloPaso40595 } from './pesv-fase1.constants';

export interface PesvFase1GrupoListado {
  paso: number | null;
  titulo: string;
  ayuda: string;
  destacado: boolean;
  items: PesvFase1ItemView[];
}

export interface PesvFase1EstadoItem {
  codigo: string;
  etiqueta: string;
  clase: string;
}

@Component({
  selector: 'argo-pesv-fase1',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PesvNavComponent],
  templateUrl: './pesv-fase1.component.html',
  styleUrls: ['./pesv-shared.scss', './pesv-fase1.component.scss'],
})
export class PesvFase1Component implements OnInit {
  private pesv = inject(PesvService);
  accionPerm = inject(AccionPermisoService);

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  data = signal<PesvFase1Dto | null>(null);
  /** Paso Res. 40595 seleccionado en el filtro (null = todos). */
  filtroPaso = signal<number | null>(null);
  aplicablesCount = signal(0);
  completitudPorItem = signal<Map<number, number>>(new Map());

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.pesv.fase1().subscribe({
      next: (d) => {
        this.data.set(d);
        this.aplicablesCount.set(d.items.filter((i) => i.aplica).length);
        this.pesv.capturaIndice(d.vigencia).subscribe({
          next: (idx) => {
            const m = new Map<number, number>();
            for (const row of idx.items) {
              m.set(row.itemNo, row.completitud?.pct ?? 0);
            }
            this.completitudPorItem.set(m);
          },
        });
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar Fase 1');
        this.loading.set(false);
      },
    });
  }

  pctCaptura(itemNo: number): number | null {
    const m = this.completitudPorItem();
    return m.has(itemNo) ? m.get(itemNo)! : null;
  }

  /** Valor enlazado al select (string; vacío = todos). */
  filtroPasoStr(): string {
    const p = this.filtroPaso();
    return p == null ? '' : String(p);
  }

  onFiltroPasoChange(raw: string): void {
    const t = String(raw ?? '').trim();
    this.filtroPaso.set(t === '' ? null : Number(t));
  }

  itemsFiltrados(): PesvFase1ItemView[] {
    const items = this.data()?.items || [];
    const p = this.filtroPaso();
    const base =
      p == null || Number.isNaN(p) ? items : items.filter((i) => Number(i.paso40595) === p);
    return [...base].sort((a, b) => {
      const pa = a.paso40595 ?? -1;
      const pb = b.paso40595 ?? -1;
      if (pa !== pb) return pa - pb;
      return a.itemNo - b.itemNo;
    });
  }

  gruposListado(): PesvFase1GrupoListado[] {
    const filtro = this.filtroPaso();
    const map = new Map<number | null, PesvFase1ItemView[]>();
    for (const i of this.itemsFiltrados()) {
      const k = i.paso40595 != null ? Number(i.paso40595) : null;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    }
    const keys = [...map.keys()].sort((a, b) => {
      if (a == null) return -1;
      if (b == null) return 1;
      return a - b;
    });
    return keys.map((paso) => ({
      paso,
      titulo: tituloPaso40595(paso),
      ayuda:
        paso == null
          ? 'Certificaciones del representante legal (Res. 1565 y 40595) — previo al plan por pasos.'
          : `Bloque ${paso} del plan según Resolución 40595 de 2022.`,
      destacado: filtro != null && paso === filtro,
      items: map.get(paso)!,
    }));
  }

  tituloPaso(paso: number | null): string {
    return tituloPaso40595(paso);
  }

  resumenAvance(): { aplicables: number; conFormulario: number; pctGlobal: number } {
    const items = (this.data()?.items || []).filter((i) => i.aplica);
    const aplicables = items.length;
    let sumPct = 0;
    let conFormulario = 0;
    const m = this.completitudPorItem();
    for (const i of items) {
      const pct = m.get(i.itemNo) ?? 0;
      sumPct += pct;
      if (pct > 0) conFormulario += 1;
    }
    const pctGlobal = aplicables ? Math.round(sumPct / aplicables) : 0;
    return { aplicables, conFormulario, pctGlobal };
  }

  estadoItem(item: PesvFase1ItemView): PesvFase1EstadoItem {
    if (!item.aplica) {
      return { codigo: 'na', etiqueta: 'No aplica', clase: 'estado-chip--na' };
    }
    if (this.esExternoSt(item)) {
      const ok = !!item.respuesta.adjuntoRuta;
      return ok
        ? { codigo: 'cert', etiqueta: 'Certificado cargado', clase: 'estado-chip--ok' }
        : { codigo: 'cert_pend', etiqueta: 'Falta PDF firmado', clase: 'estado-chip--pend' };
    }
    if (item.documento?.modo === 'na') {
      return { codigo: 'info', etiqueta: 'Solo registro', clase: 'estado-chip--info' };
    }
    const pct = this.pctCaptura(item.itemNo) ?? 0;
    if (item.respuesta.documentoGeneradoRuta) {
      return { codigo: 'gen', etiqueta: 'Archivo generado', clase: 'estado-chip--ok' };
    }
    if (pct >= 80) {
      return { codigo: 'listo', etiqueta: 'Listo para crear PDF', clase: 'estado-chip--listo' };
    }
    if (pct > 0) {
      return { codigo: 'prog', etiqueta: 'En progreso', clase: 'estado-chip--prog' };
    }
    return { codigo: 'pend', etiqueta: 'Por empezar', clase: 'estado-chip--pend' };
  }

  etiquetaModoAmigable(item: PesvFase1ItemView): string {
    switch (item.documento?.modo) {
      case 'cert_representante_legal':
      case 'externo_st':
        return 'Formulario + PDF firmado por rep. legal';
      case 'excel_generado':
        return 'ARGO genera Excel';
      case 'derivado_flota':
        return 'Datos desde vehículos ARGO';
      case 'na':
        return 'Sin archivo';
      default:
        return 'ARGO genera PDF';
    }
  }

  pasoResaltado(item: PesvFase1ItemView): boolean {
    const f = this.filtroPaso();
    return f != null && Number(item.paso40595) === f;
  }

  pasosUnicos(): number[] {
    const s = new Set<number>();
    for (const i of this.data()?.items || []) {
      if (i.paso40595 != null) s.add(i.paso40595);
    }
    return [...s].sort((a, b) => a - b);
  }

  onExiste(item: PesvFase1ItemView, val: string): void {
    item.respuesta.existe = val === 'si' || val === 'no' ? val : null;
  }

  esCertRepresentanteLegal(item: PesvFase1ItemView): boolean {
    const m = item.documento?.modo;
    return m === 'cert_representante_legal' || m === 'externo_st';
  }

  /** @deprecated use esCertRepresentanteLegal */
  esExternoSt(item: PesvFase1ItemView): boolean {
    return this.esCertRepresentanteLegal(item);
  }

  esGenerable(item: PesvFase1ItemView): boolean {
    const m = item.documento?.modo;
    return m === 'generado_argo' || m === 'excel_generado' || m === 'derivado_flota';
  }

  etiquetaModo(item: PesvFase1ItemView): string {
    switch (item.documento?.modo) {
      case 'cert_representante_legal':
      case 'externo_st':
        return 'Cert. representante legal';
      case 'excel_generado':
        return 'Excel desde datos';
      case 'derivado_flota':
        return 'Desde flota ARGO';
      case 'na':
        return 'N/A';
      default:
        return 'PDF desde datos';
    }
  }

  guardar(): void {
    const d = this.data();
    if (!d) return;
    if (!this.accionPerm.tiene('pesv', 'editar')) {
      this.msg.set('Sin permiso para editar');
      return;
    }
    this.saving.set(true);
    const items = d.items.map((i) => ({ itemNo: i.itemNo, ...i.respuesta }));
    this.pesv.guardarFase1({ vigencia: d.vigencia, items }).subscribe({
      next: () => {
        this.saving.set(false);
        this.msg.set('Datos de Fase 1 guardados');
      },
      error: () => {
        this.saving.set(false);
        this.msg.set('Error al guardar');
      },
    });
  }

  generar(item: PesvFase1ItemView): void {
    const d = this.data();
    if (!d || !this.esGenerable(item)) return;
    this.guardarSilencioso(() => {
      this.pesv.generarDocumentoFase1(d.vigencia, item.itemNo).subscribe({
        next: () => this.msg.set(`Documento ítem ${item.itemNo} generado`),
        error: (err) => {
          const body = err?.error;
          if (body?.code === 'PESV_GENERACION_PENDIENTE') {
            this.msg.set(
              'Datos guardados. El motor PDF/Excel con las plantillas del pack se activará en la siguiente etapa.',
            );
            return;
          }
          this.msg.set(body?.message || 'No se pudo generar el documento');
        },
      });
    });
  }

  onFileExterno(item: PesvFase1ItemView, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    const d = this.data();
    if (!file || !d || !this.esExternoSt(item)) return;
    this.pesv.subirAdjuntoFase1(d.vigencia, item.itemNo, file).subscribe({
      next: (r) => {
        item.respuesta.adjuntoRuta = r.adjuntoRuta;
        item.respuesta.adjuntoNombre = file.name;
        this.msg.set('Certificación externa registrada');
      },
      error: (err) => this.msg.set(err?.error?.message || 'Solo aplica a certificaciones del representante legal (ítems 1–2)'),
    });
  }

  urlGenerado(item: PesvFase1ItemView): string | null {
    return this.pesv.urlUploads(item.respuesta.documentoGeneradoRuta);
  }

  urlAdjExterno(item: PesvFase1ItemView): string | null {
    return this.pesv.urlUploads(item.respuesta.adjuntoRuta);
  }

  private guardarSilencioso(done: () => void): void {
    const d = this.data();
    if (!d) return;
    const items = d.items.map((i) => ({ itemNo: i.itemNo, ...i.respuesta }));
    this.pesv.guardarFase1({ vigencia: d.vigencia, items }).subscribe({
      next: () => done(),
      error: () => this.msg.set('Guarde los datos antes de generar'),
    });
  }

  motivos(): { codigo: string; label: string }[] {
    return this.data()?.motivos || [];
  }
}
