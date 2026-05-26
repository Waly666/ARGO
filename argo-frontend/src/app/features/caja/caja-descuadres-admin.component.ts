import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CajaDescuadre, CajaSesionService } from '../../core/services/caja-sesion.service';

@Component({
  selector: 'argo-caja-descuadres',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './caja-descuadres-admin.component.html',
  styleUrls: ['./caja-descuadres-admin.component.scss'],
})
export class CajaDescuadresAdminComponent implements OnInit {
  private cajaSvc = inject(CajaSesionService);

  mes = signal(new Date().toISOString().slice(0, 7));
  detalle = signal<CajaDescuadre[]>([]);
  loading = signal(false);
  msg = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.msg.set(null);
    const mes = this.mes();
    const desde = `${mes}-01`;
    const [y, m] = mes.split('-').map(Number);
    const ultimo = new Date(y, m, 0).getDate();
    const hasta = `${mes}-${String(ultimo).padStart(2, '0')}`;

    this.cajaSvc
      .listarDescuadres({
        desde,
        hasta,
        estado: 'pendiente',
        limit: 200,
      })
      .subscribe({
        next: (rows) => {
          this.detalle.set(rows || []);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.msg.set(e?.error?.message || 'No se pudo cargar');
        },
      });
  }
}
