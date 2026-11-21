import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PesvAyudaComponent } from './pesv-ayuda.component';
import { PesvNavComponent } from './pesv-nav.component';
import {
  PesvCapturaDto,
  PesvCampoDef,
  PesvService,
} from '../../core/services/pesv.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';

@Component({
  selector: 'argo-pesv-captura-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PesvNavComponent, PesvAyudaComponent],
  templateUrl: './pesv-captura-form.component.html',
  styleUrls: ['./pesv-shared.scss', './pesv-captura-form.component.scss'],
})
export class PesvCapturaFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pesv = inject(PesvService);
  accionPerm = inject(AccionPermisoService);

  loading = signal(true);
  saving = signal(false);
  generando = signal(false);
  pdfGenerado = signal<string | null>(null);
  msg = signal<string | null>(null);
  payload = signal<PesvCapturaDto | null>(null);
  datos = signal<Record<string, unknown>>({});

  ngOnInit(): void {
    this.route.paramMap.subscribe((pm) => {
      const itemNo = Number(pm.get('itemNo'));
      if (!itemNo) return;
      this.cargar(itemNo);
    });
  }

  cargar(itemNo: number, vigencia?: number): void {
    this.loading.set(true);
    this.pesv.getCaptura(vigencia, itemNo).subscribe({
      next: (p) => {
        this.payload.set(p);
        this.datos.set({ ...(p.datos || {}) });
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar el formulario');
        this.loading.set(false);
      },
    });
  }

  puedeEditar(): boolean {
    return this.accionPerm.tiene('pesv', 'editar');
  }

  guardar(): void {
    const p = this.payload();
    if (!p || !this.puedeEditar()) {
      this.msg.set('Sin permiso para editar');
      return;
    }
    this.saving.set(true);
    this.pesv
      .guardarCaptura({ vigencia: p.vigencia, itemNo: p.itemNo, datos: this.datos() })
      .subscribe({
        next: (r) => {
          this.saving.set(false);
          this.msg.set(`Guardado · completitud ${r.completitud.pct}%`);
          this.payload.set({
            ...p,
            completitud: r.completitud,
          });
        },
        error: () => {
          this.saving.set(false);
          this.msg.set('Error al guardar');
        },
      });
  }

  valorCampo(key: string): unknown {
    return this.datos()[key];
  }

  setCampo(key: string, value: unknown): void {
    this.datos.update((d) => ({ ...d, [key]: value }));
  }

  filasTabla(campo: PesvCampoDef): Record<string, unknown>[] {
    const v = this.datos()[campo.key];
    return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
  }

  agregarFila(campo: PesvCampoDef): void {
    const rows = [...this.filasTabla(campo)];
    const row: Record<string, unknown> = {};
    for (const col of campo.columnas || []) {
      row[col.key] = '';
    }
    rows.push(row);
    this.setCampo(campo.key, rows);
  }

  quitarFila(campo: PesvCampoDef, index: number): void {
    const rows = this.filasTabla(campo).filter((_, i) => i !== index);
    this.setCampo(campo.key, rows);
  }

  setCelda(campo: PesvCampoDef, index: number, colKey: string, value: unknown): void {
    const rows = this.filasTabla(campo).map((r) => ({ ...r }));
    if (!rows[index]) return;
    rows[index][colKey] = value;
    this.setCampo(campo.key, rows);
  }

  esTabla(c: PesvCampoDef): boolean {
    return c.tipo === 'tabla';
  }

  esCertificacion(): boolean {
    const n = this.payload()?.itemNo;
    return n === 1 || n === 2;
  }

  generarCertificacion(): void {
    const p = this.payload();
    if (!p || !this.puedeEditar()) {
      this.msg.set('Sin permiso para editar');
      return;
    }
    this.generando.set(true);
    this.msg.set(null);
    this.pesv.guardarCaptura({ vigencia: p.vigencia, itemNo: p.itemNo, datos: this.datos() }).subscribe({
      next: (r) => {
        this.payload.set({ ...p, completitud: r.completitud });
        this.pesv.generarDocumentoFase1(p.vigencia, p.itemNo).subscribe({
          next: (out) => {
            this.generando.set(false);
            this.pdfGenerado.set(this.pesv.urlUploads(out.documentoGeneradoRuta));
            this.msg.set('Certificación generada. Descargue el PDF, fírmelo y, si quiere, adjúntelo en la lista de Fase 1.');
          },
          error: (e) => {
            this.generando.set(false);
            this.msg.set(e?.error?.message || 'No se pudo generar la certificación');
          },
        });
      },
      error: () => {
        this.generando.set(false);
        this.msg.set('No se pudo guardar el formulario');
      },
    });
  }
}
