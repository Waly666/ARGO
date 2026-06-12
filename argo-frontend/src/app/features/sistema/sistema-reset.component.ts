import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ResultadoReset, SistemaService } from '../../core/services/sistema.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'argo-sistema-reset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sistema-reset.component.html',
  styleUrls: ['./sistema-reset.component.scss'],
})
export class SistemaResetComponent implements OnInit {
  private svc = inject(SistemaService);
  private confirm = inject(ConfirmDialogService);

  frase = signal('REINICIAR EMPRESA');
  resultado = signal<ResultadoReset | null>(null);
  ejecutando = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

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
    this.svc
      .resetEmpresa({
        password: this.password,
        codigoMfa: this.codigoMfa,
        confirmacion: this.confirmacion,
      })
      .subscribe({
        next: (r) => {
          this.ejecutando.set(false);
          this.resultado.set(r);
          this.password = '';
          this.codigoMfa = '';
          this.confirmacion = '';
          this.entendido = false;
        },
        error: (e) => {
          this.ejecutando.set(false);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'La puesta en cero falló. No se borró nada.');
        },
      });
  }
}
