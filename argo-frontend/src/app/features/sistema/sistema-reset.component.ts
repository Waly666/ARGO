import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ProgresoOperacion,
  ResultadoReset,
  SistemaService,
} from '../../core/services/sistema.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

import { BackupResetRestoreNavComponent } from './backup-reset-restore-nav.component';

@Component({
  selector: 'argo-sistema-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, BackupResetRestoreNavComponent],
  templateUrl: './sistema-reset.component.html',
  styleUrls: ['./sistema-reset.component.scss'],
})
export class SistemaResetComponent implements OnInit, OnDestroy {
  private svc = inject(SistemaService);
  private confirm = inject(ConfirmDialogService);

  frase = signal('REINICIAR EMPRESA');
  resultado = signal<ResultadoReset | null>(null);
  ejecutando = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  progreso = signal<ProgresoOperacion | null>(null);

  private pollId: ReturnType<typeof setInterval> | null = null;

  password = '';
  codigoMfa = '';
  confirmacion = '';
  entendido = false;

  ngOnInit(): void {
    this.svc.infoReset().subscribe({
      next: (i) => this.frase.set(i.fraseConfirmacion),
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  private iniciarPolling() {
    this.detenerPolling();
    this.progreso.set(null);
    this.pollId = setInterval(() => {
      this.svc.progresoOperacion().subscribe({
        next: (p) => this.progreso.set(p),
        error: () => {},
      });
    }, 700);
  }

  private detenerPolling() {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  puedeEjecutar(): boolean {
    return (
      this.entendido &&
      !!this.password &&
      this.confirmacion.trim().toUpperCase() === this.frase() &&
      !this.ejecutando()
    );
  }

  async ejecutar() {
    const ok = await this.confirm.open({
      title: 'Puesta en cero definitiva',
      message:
        'Última confirmación: se borrarán TODOS los datos de la empresa actual (alumnos, pagos, ' +
        'certificados, caja, nómina…) y los consecutivos quedarán en 0. Se creará una copia de ' +
        'seguridad completa antes de borrar. ¿Ejecutar la puesta en cero?',
      variant: 'danger',
      confirmLabel: 'Sí, poner en cero',
    });
    if (!ok) return;

    this.ejecutando.set(true);
    this.msg.set(null);
    this.iniciarPolling();
    this.svc
      .resetEmpresa({
        password: this.password,
        codigoMfa: this.codigoMfa,
        confirmacion: this.confirmacion,
      })
      .subscribe({
        next: (r) => {
          this.ejecutando.set(false);
          this.detenerPolling();
          this.progreso.set(null);
          this.resultado.set(r);
          this.msgError.set(false);
          this.msg.set(
            r.mensaje ||
              `Puesta en cero completada: ${r.coleccionesLimpiadas} tablas en cero, ${r.coleccionesConservadas} catálogos conservados.`,
          );
          this.password = '';
          this.codigoMfa = '';
          this.confirmacion = '';
          this.entendido = false;
        },
        error: (e) => {
          this.ejecutando.set(false);
          this.detenerPolling();
          this.progreso.set(null);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'La puesta en cero falló. No se borró nada.');
        },
      });
  }
}
