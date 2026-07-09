import { Injectable, computed, inject, signal } from '@angular/core';

import {
  EstadoOperacionJornadas,
  JornadaCapService,
} from './jornada-cap.service';

@Injectable({ providedIn: 'root' })
export class JornadasOperacionConfigService {
  private jornadaSvc = inject(JornadaCapService);

  private readonly _estado = signal<EstadoOperacionJornadas | null>(null);
  readonly estado = this._estado.asReadonly();
  readonly puedeOperarFueraDeDia = computed(() => this._estado()?.puedeUsar === true);
  readonly modoHabilitado = computed(
    () => this._estado()?.operacionFueraDeDiaHabilitada === true,
  );

  cargar(): void {
    this.jornadaSvc.estadoOperacionEspecialJornadas().subscribe({
      next: (st) => this._estado.set(st),
      error: () =>
        this._estado.set({
          operacionFueraDeDiaHabilitada: false,
          puedeUsar: false,
          motivo: null,
        }),
    });
  }

  marcarDesdeConfig(_cfg: { operacionFueraDeDiaHabilitada: boolean }): void {
    this.cargar();
  }
}
