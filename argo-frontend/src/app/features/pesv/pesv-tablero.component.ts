import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PesvNavComponent } from './pesv-nav.component';

import { PesvTablero, PesvTableroMes, PesvService } from '../../core/services/pesv.service';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'argo-pesv-tablero',
  standalone: true,
  imports: [CommonModule, RouterLink, PesvNavComponent],
  templateUrl: './pesv-tablero.component.html',
  styleUrls: ['./pesv-shared.scss', './pesv-tablero.component.scss'],
})
export class PesvTableroComponent implements OnInit {
  private pesv = inject(PesvService);

  vigencia = signal(new Date().getFullYear());
  loading = signal(true);
  msg = signal<string | null>(null);
  tablero = signal<PesvTablero | null>(null);

  readonly cols = ['6.1', '6.2', '8.1', '8.2', '9.1', '9.2'] as const;

  ngOnInit(): void {
    this.pesv.config().subscribe({
      next: (c) => {
        if (c.vigenciaActiva) this.vigencia.set(c.vigenciaActiva);
        this.cargar();
      },
      error: () => this.cargar(),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.pesv.tablero(this.vigencia()).subscribe({
      next: (t) => {
        this.tablero.set(t);
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar el tablero');
        this.loading.set(false);
      },
    });
  }

  labelMes(m: number): string {
    return MESES[m - 1] || String(m);
  }

  celda(row: PesvTableroMes, id: (typeof this.cols)[number]): string {
    const v = row[id];
    return v == null ? '—' : String(v);
  }

  semaforo(row: PesvTableroMes): 'ok' | 'vacío' | 'borrador' {
    const vals = this.cols.map((c) => row[c]);
    const filled = vals.filter((v) => v != null).length;
    if (filled === 0) return 'vacío';
    if (row.estado === 'enviado_st') return 'ok';
    return 'borrador';
  }
}
