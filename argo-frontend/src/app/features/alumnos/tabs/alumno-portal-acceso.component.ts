import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AlumnoService } from '../../../core/services/alumno.service';
import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { PermisoService } from '../../../core/services/permiso.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

interface PortalEstado {
  tieneAcceso: boolean;
  email: string | null;
  activo: boolean;
  ultimoAcceso: string | null;
}

@Component({
  selector: 'argo-alumno-portal-acceso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alumno-portal-acceso.component.html',
  styleUrl: './alumno-portal-acceso.component.scss',
})
export class AlumnoPortalAccesoComponent {
  private alumnoSvc = inject(AlumnoService);
  private store = inject(AlumnoStore);
  private permisos = inject(PermisoService);
  private confirm = inject(ConfirmDialogService);

  estado = signal<PortalEstado | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);
  campoInvalido = signal(false);

  passwordNueva = '';
  generarAleatoria = false;
  expandido = signal(false);

  alumnoId = computed(() => {
    const id = this.store.alumno()?._id;
    return id ? String(id) : null;
  });

  puedeGestionar = computed(() =>
    this.permisos.tiene(['alumnos.gestionar', 'aula_virtual.gestionar']),
  );

  resumenColapsado = computed(() => {
    if (this.cargando()) return 'Consultando acceso…';
    const e = this.estado();
    if (!e?.tieneAcceso) return 'Sin usuario del portal';
    const mail = e.email || 'Sin correo';
    const estado = e.activo === false ? ' · inactiva' : '';
    return `${mail}${estado}`;
  });

  constructor() {
    effect(() => {
      const id = this.alumnoId();
      if (id) this.cargarEstado(id);
      else {
        this.estado.set(null);
        this.limpiarFormulario();
        this.expandido.set(false);
      }
    });
  }

  toggleExpand(): void {
    this.expandido.update((v) => !v);
  }

  onGenerarChange(): void {
    if (this.generarAleatoria) {
      this.passwordNueva = '';
      this.campoInvalido.set(false);
      this.error.set(null);
    }
  }

  async restablecer(enviarCorreo: boolean): Promise<void> {
    const id = this.alumnoId();
    if (!id || this.guardando()) return;

    const pass = this.passwordNueva.trim();
    if (!this.generarAleatoria && (!pass || pass.length < 6)) {
      this.expandido.set(true);
      this.campoInvalido.set(true);
      this.error.set('Indique una contraseña de al menos 6 caracteres o marque «Generar aleatoria».');
      return;
    }

    const ok = await this.confirm.open({
      title: enviarCorreo ? 'Restablecer y enviar por correo' : 'Restablecer contraseña',
      message: enviarCorreo
        ? `Se generará una nueva contraseña para ${this.estado()?.email || 'el alumno'} y se enviará por correo. ¿Continuar?`
        : `Se cambiará la contraseña del portal para ${this.estado()?.email || 'el alumno'}. El correo de usuario no se modifica. ¿Continuar?`,
      variant: 'warn',
      confirmLabel: 'Sí, restablecer',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;

    this.guardando.set(true);
    this.error.set(null);
    this.campoInvalido.set(false);

    this.alumnoSvc
      .resetearPasswordPortal(id, {
        password: this.generarAleatoria ? undefined : pass,
        generarPassword: this.generarAleatoria,
        enviarCorreo,
      })
      .subscribe({
        next: async (res) => {
          this.guardando.set(false);
          this.limpiarFormulario();
          await this.mostrarCredenciales(res);
          this.cargarEstado(id);
        },
        error: (e) => {
          this.guardando.set(false);
          this.expandido.set(true);
          this.error.set(e?.error?.message || 'No se pudo restablecer la contraseña.');
        },
      });
  }

  private cargarEstado(alumnoId: string): void {
    this.cargando.set(true);
    this.alumnoSvc.estadoPortal(alumnoId).subscribe({
      next: (r) => {
        this.estado.set({
          tieneAcceso: !!r?.tieneAcceso,
          email: r?.email || null,
          activo: r?.activo !== false,
          ultimoAcceso: r?.ultimoAcceso || null,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.estado.set({ tieneAcceso: false, email: null, activo: false, ultimoAcceso: null });
        this.cargando.set(false);
      },
    });
  }

  private limpiarFormulario(): void {
    this.passwordNueva = '';
    this.generarAleatoria = false;
    this.error.set(null);
    this.campoInvalido.set(false);
  }

  private async mostrarCredenciales(res: {
    email: string;
    password: string;
    correoEnviado?: boolean;
    correoError?: string | null;
    message?: string;
  }): Promise<void> {
    const correoLinea = res.correoEnviado
      ? `También se envió un correo a ${res.email} con estos datos.`
      : res.correoError
        ? `No se pudo enviar el correo (${res.correoError}). Anote la clave.`
        : 'Anote la clave y entréguesela al alumno.';

    await this.confirm.open({
      title: 'Contraseña restablecida',
      message:
        `Usuario (correo): ${res.email}\n` +
        `Nueva contraseña: ${res.password}\n\n` +
        `${correoLinea}`,
      variant: 'success',
      confirmLabel: 'Entendido',
      cancelLabel: 'Cerrar',
    });
  }
}
