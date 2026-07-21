import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import {
  EmpleadoService,
  InformeDesempenoEmpleadoRow,
  InformeDesempenoRes,
} from '../../core/services/empleado.service';
import { RrhhCatalogService } from '../../core/services/rrhh-catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { abrirInformeDesempenoPdf, buildInformeDesempenoHtml } from './informe-desempeno-print';

@Component({
  selector: 'argo-informe-desempeno',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ArgoDateInputComponent],
  templateUrl: './informe-desempeno.component.html',
  styleUrls: ['./informe-desempeno.component.scss', './rrhh-shared.scss'],
})
export class InformeDesempenoComponent implements OnInit {
  private svc = inject(EmpleadoService);
  private cat = inject(RrhhCatalogService);
  private auth = inject(AuthService);

  cargos = signal<any[]>([]);
  loading = signal(false);
  err = signal<string | null>(null);
  data = signal<InformeDesempenoRes | null>(null);
  detalle = signal<InformeDesempenoEmpleadoRow | null>(null);

  desde = signal('');
  hasta = signal('');
  cargoId = signal<number | undefined>(undefined);
  q = signal('');

  puedeVer = () =>
    this.auth.tienePermiso(['rrhh.evaluaciones.ver', 'rrhh.evaluaciones.gestionar', 'rrhh', '*']);

  ngOnInit(): void {
    this.cat.listar('cargos').subscribe({ next: (r) => this.cargos.set(r || []) });
    const now = new Date();
    const y = now.getFullYear();
    this.desde.set(`${y}-01-01`);
    this.hasta.set(now.toISOString().slice(0, 10));
    this.buscar();
  }

  buscar(): void {
    if (!this.puedeVer()) {
      this.err.set('Sin permiso para ver el informe de desempeño.');
      return;
    }
    this.loading.set(true);
    this.err.set(null);
    this.detalle.set(null);
    this.svc
      .informeDesempeno({
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        cargoId: this.cargoId(),
        q: this.q().trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.data.set(res);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.err.set(e?.error?.message || 'No se pudo cargar el informe');
          this.data.set(null);
        },
      });
  }

  verDetalle(row: InformeDesempenoEmpleadoRow): void {
    this.detalle.set(this.detalle()?.idEmpleado === row.idEmpleado ? null : row);
  }

  exportarPdf(): void {
    const d = this.data();
    if (!d) return;
    const html = buildInformeDesempenoHtml({
      titulo: 'Informe de desempeño',
      subtitulo: `Periodo ${d.filtros.desde || '…'} — ${d.filtros.hasta || '…'} · ${d.resumen.empleadosConEval} empleado(s) · promedio general ${d.resumen.promedioGeneral ?? '—'}`,
      data: d,
    });
    if (!abrirInformeDesempenoPdf(html)) {
      this.err.set('El navegador bloqueó la ventana de impresión/PDF.');
    }
  }
}
