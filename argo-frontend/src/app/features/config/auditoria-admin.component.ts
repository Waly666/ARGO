import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AuditoriaService,
  FiltrosAuditoria,
  RegistroAuditoria,
} from '../../core/services/auditoria.service';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';

@Component({
  selector: 'argo-auditoria-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './auditoria-admin.component.html',
  styleUrls: ['./auditoria-admin.component.scss'],
})
export class AuditoriaAdminComponent implements OnInit {
  private svc = inject(AuditoriaService);

  items = signal<RegistroAuditoria[]>([]);
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  cargando = signal(false);
  detalle = signal<RegistroAuditoria | null>(null);
  vista = signal<VistaLista>(readVistaLista('argo-auditoria-vista'));

  filtros: FiltrosAuditoria = { limit: 50, page: 1 };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.filtros.page = this.page();
    this.svc.listar(this.filtros).subscribe({
      next: (r) => {
        this.items.set(r.items);
        this.total.set(r.total);
        this.pages.set(r.pages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  setVista(v: VistaLista): void {
    this.vista.set(v);
    saveVistaLista('argo-auditoria-vista', v);
  }

  verDetalle(row: RegistroAuditoria): void {
    this.detalle.set(row);
    this.svc.obtener(row.idAuditoria).subscribe({
      next: (d) => this.detalle.set(d),
    });
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
  }

  paginaAnterior(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.page() >= this.pages()) return;
    this.page.update((p) => p + 1);
    this.cargar();
  }

  json(v: unknown): string {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
}
