import { Injectable, signal } from '@angular/core';

export type HorarioGraciaAviso = {
  mensaje: string;
  minutosRestantes?: number;
  graciaFinIso?: string;
  cajaAbierta?: boolean;
};

@Injectable({ providedIn: 'root' })
export class HorarioOperacionRuntimeService {
  readonly avisoGracia = signal<HorarioGraciaAviso | null>(null);
  private ultimoAvisoMs = 0;

  procesarHeaders(headers: { get(name: string): string | null }): void {
    const tipo = headers.get('X-ARGO-Horario-Aviso');
    if (tipo !== 'gracia') return;
    const now = Date.now();
    if (now - this.ultimoAvisoMs < 8000) return;
    this.ultimoAvisoMs = now;
    const min = Number(headers.get('X-ARGO-Horario-Gracia-Min') || '');
    this.avisoGracia.set({
      mensaje:
        'El horario de operación ha finalizado. Termine su trabajo pendiente; la sesión se cerrará al agotar el período de gracia o al cerrar la caja.',
      minutosRestantes: Number.isFinite(min) ? min : undefined,
      graciaFinIso: headers.get('X-ARGO-Horario-Gracia-Fin') || undefined,
      cajaAbierta: headers.get('X-ARGO-Horario-Caja-Abierta') === '1',
    });
  }

  cerrarAviso(): void {
    this.avisoGracia.set(null);
  }
}
