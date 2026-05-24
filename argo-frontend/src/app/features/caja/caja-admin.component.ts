import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CajaAbiertaItem,
  CajaCierreGeneral,
  CajaSesion,
  CajaSesionService,
  ResumenCierreGeneral,
} from '../../core/services/caja-sesion.service';

@Component({
  selector: 'argo-caja-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './caja-admin.component.html',
  styleUrls: ['./caja-cuadre.component.scss', './caja-layout.component.scss'],
})
export class CajaAdminComponent implements OnInit {
  private cajaSvc = inject(CajaSesionService);

  cajasAbiertas = signal<CajaAbiertaItem[]>([]);
  historial = signal<CajaSesion[]>([]);
  previewGeneral = signal<ResumenCierreGeneral | null>(null);
  cierresGenerales = signal<CajaCierreGeneral[]>([]);
  fechaGenDesde = signal(new Date().toISOString().slice(0, 10));
  fechaGenHasta = signal(new Date().toISOString().slice(0, 10));
  obsCierreGeneral = signal('');
  filtroHistDesde = signal(new Date().toISOString().slice(0, 10));
  filtroHistHasta = signal(new Date().toISOString().slice(0, 10));
  loading = signal(false);
  msg = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarAbiertas();
    this.cargarHistorial();
    this.cargarCierresGenerales();
  }

  cargarAbiertas(): void {
    this.cajaSvc.listarAbiertas().subscribe({
      next: (r) => this.cajasAbiertas.set(r || []),
    });
  }

  cargarHistorial(): void {
    this.cajaSvc
      .listar({
        todas: true,
        desde: this.filtroHistDesde(),
        hasta: this.filtroHistHasta(),
        limit: 50,
      })
      .subscribe({
        next: (r) => this.historial.set(r || []),
      });
  }

  cerrarAjena(item: CajaAbiertaItem): void {
    if (!item.sesion?.idSesion) return;
    if (!confirm(`¿Cerrar caja de ${item.sesion.usuario}?`)) return;
    this.cajaSvc.cerrar(item.sesion.idSesion, { observaciones: 'Cierre administrador' }).subscribe({
      next: () => {
        this.cargarAbiertas();
        this.cargarHistorial();
      },
    });
  }

  cargarPreview(): void {
    this.cajaSvc.previewCierreGeneral(this.fechaGenDesde(), this.fechaGenHasta()).subscribe({
      next: (r) => this.previewGeneral.set(r),
    });
  }

  registrarGeneral(forzar = false): void {
    this.loading.set(true);
    this.cajaSvc
      .registrarCierreGeneral({
        desde: this.fechaGenDesde(),
        hasta: this.fechaGenHasta(),
        observaciones: this.obsCierreGeneral() || undefined,
        forzar,
      })
      .subscribe({
        next: (r) => {
          this.previewGeneral.set(r.resumen);
          this.loading.set(false);
          this.cargarCierresGenerales();
        },
        error: (e) => {
          this.loading.set(false);
          if (e?.status === 409 && confirm(`${e.error?.message}\n\n¿Registrar igualmente?`)) {
            this.registrarGeneral(true);
          }
        },
      });
  }

  cargarCierresGenerales(): void {
    this.cajaSvc.listarCierresGenerales().subscribe({
      next: (r) => this.cierresGenerales.set(r || []),
    });
  }
}
