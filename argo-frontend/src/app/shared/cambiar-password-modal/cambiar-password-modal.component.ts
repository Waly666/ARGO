import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'argo-cambiar-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (abierto()) {
      <div class="cpm-backdrop" (click)="cerrar()" role="presentation"></div>
      <div class="cpm-panel card" role="dialog" aria-modal="true" aria-labelledby="cpm-title">
        <header class="cpm-head">
          <h2 id="cpm-title">Cambiar contraseña</h2>
          <button type="button" class="ghost mini" (click)="cerrar()" aria-label="Cerrar">×</button>
        </header>
        <p class="cpm-hint">
          Indique su contraseña actual y la nueva. El 2FA (Authenticator) no se modifica.
        </p>
        @if (msg()) {
          <p class="cpm-msg" [class.cpm-msg--err]="msgError()">{{ msg() }}</p>
        }
        <label class="cpm-field">
          <span>Contraseña actual</span>
          <input
            type="password"
            autocomplete="current-password"
            [ngModel]="passwordActual()"
            (ngModelChange)="passwordActual.set($event)"
            [disabled]="saving()" />
        </label>
        <label class="cpm-field">
          <span>Contraseña nueva</span>
          <input
            type="password"
            autocomplete="new-password"
            [ngModel]="passwordNueva()"
            (ngModelChange)="passwordNueva.set($event)"
            [disabled]="saving()" />
        </label>
        <label class="cpm-field">
          <span>Confirmar nueva</span>
          <input
            type="password"
            autocomplete="new-password"
            [ngModel]="passwordConfirm()"
            (ngModelChange)="passwordConfirm.set($event)"
            [disabled]="saving()" />
        </label>
        <footer class="cpm-actions">
          <button type="button" class="ghost" (click)="cerrar()" [disabled]="saving()">Cancelar</button>
          <button type="button" class="primary" (click)="guardar()" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : 'Guardar' }}
          </button>
        </footer>
      </div>
    }
  `,
  styles: [
    `
      .cpm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 13000;
        background: rgba(2, 8, 22, 0.72);
      }
      .cpm-panel {
        position: fixed;
        z-index: 13001;
        top: 12vh;
        left: 50%;
        transform: translateX(-50%);
        width: min(420px, 92vw);
        padding: 1rem 1.1rem 1.15rem;
        border-radius: 14px;
        border: 1px solid rgba(120, 170, 255, 0.22);
        background: #071428;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      }
      .cpm-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.35rem;
        h2 {
          margin: 0;
          font-size: 1.05rem;
          color: #e2e8f0;
        }
      }
      .cpm-hint {
        margin: 0 0 0.85rem;
        font-size: 0.8rem;
        color: rgba(226, 232, 240, 0.65);
        line-height: 1.4;
      }
      .cpm-msg {
        margin: 0 0 0.7rem;
        padding: 0.45rem 0.6rem;
        border-radius: 8px;
        font-size: 0.82rem;
        background: rgba(16, 185, 129, 0.15);
        color: #a7f3d0;
      }
      .cpm-msg--err {
        background: rgba(248, 113, 113, 0.15);
        color: #fecaca;
      }
      .cpm-field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-bottom: 0.7rem;
        span {
          font-size: 0.72rem;
          font-weight: 650;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        input {
          width: 100%;
        }
      }
      .cpm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.35rem;
      }
    `,
  ],
})
export class CambiarPasswordModalComponent {
  private auth = inject(AuthService);

  abierto = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  passwordActual = signal('');
  passwordNueva = signal('');
  passwordConfirm = signal('');

  abrir(): void {
    this.passwordActual.set('');
    this.passwordNueva.set('');
    this.passwordConfirm.set('');
    this.msg.set(null);
    this.msgError.set(false);
    this.abierto.set(true);
  }

  cerrar(): void {
    if (this.saving()) return;
    this.abierto.set(false);
  }

  guardar(): void {
    const actual = this.passwordActual();
    const nueva = this.passwordNueva();
    const conf = this.passwordConfirm();
    if (!actual || !nueva) {
      this.msgError.set(true);
      this.msg.set('Indique la contraseña actual y la nueva.');
      return;
    }
    if (nueva.length < 4) {
      this.msgError.set(true);
      this.msg.set('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (nueva !== conf) {
      this.msgError.set(true);
      this.msg.set('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    this.saving.set(true);
    this.msg.set(null);
    this.auth.cambiarPassword(actual, nueva).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.msgError.set(false);
        this.msg.set(r.message || 'Contraseña actualizada.');
        setTimeout(() => this.cerrar(), 900);
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo cambiar la contraseña.');
      },
    });
  }
}
