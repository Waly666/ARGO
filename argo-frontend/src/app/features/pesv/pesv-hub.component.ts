import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PesvResumen, PesvService } from '../../core/services/pesv.service';
import { PesvNavComponent } from './pesv-nav.component';

@Component({
  selector: 'argo-pesv-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, PesvNavComponent],
  templateUrl: './pesv-hub.component.html',
  styleUrls: ['./pesv-shared.scss'],
})
export class PesvHubComponent implements OnInit {
  private pesv = inject(PesvService);
  loading = signal(true);
  msg = signal<string | null>(null);
  resumen = signal<PesvResumen | null>(null);
  vigencia = signal(new Date().getFullYear());

  ngOnInit(): void {
    this.pesv.config().subscribe({
      next: (c) => {
        if (c.vigenciaActiva) this.vigencia.set(c.vigenciaActiva);
        this.cargarResumen();
      },
      error: () => this.cargarResumen(),
    });
  }

  cargarResumen(): void {
    this.loading.set(true);
    this.pesv.resumen(this.vigencia()).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar el resumen PESV');
        this.loading.set(false);
      },
    });
  }

  pct(part?: number, total?: number): number {
    if (!total) return 0;
    return Math.round(((part || 0) / total) * 100);
  }
}
