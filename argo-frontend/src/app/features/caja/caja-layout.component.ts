import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import { CajaEstadoService } from '../../core/services/caja-estado.service';

@Component({
  selector: 'argo-caja-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './caja-layout.component.html',
  styleUrls: ['./caja-layout.component.scss'],
})
export class CajaLayoutComponent implements OnInit {
  private cajaEstado = inject(CajaEstadoService);
  private router = inject(Router);

  cajaAbierta = this.cajaEstado.abierta;
  sesionId = computed(() => this.cajaEstado.sesion()?.idSesion ?? null);

  /** Ficha 1 Resumen: mismo vocabulario visual que el dashboard. */
  esResumen = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.esRutaResumen()),
      startWith(this.esRutaResumen()),
    ),
    { initialValue: this.esRutaResumen() },
  );

  ngOnInit(): void {
    void this.cajaEstado.refrescar();
  }

  private esRutaResumen(): boolean {
    const path = this.router.url.split('?')[0].replace(/\/+$/, '');
    return path === '/app/caja' || path.endsWith('/app/caja');
  }
}
