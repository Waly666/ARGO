import { CommonModule } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TurnstileComponent } from '../../components/turnstile/turnstile.component';
import { AulaApiService } from '../../core/aula-api.service';
import { PortalAuthService } from '../../core/portal-auth.service';

@Component({
  selector: 'av-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TurnstileComponent],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private api = inject(AulaApiService);
  private auth = inject(PortalAuthService);
  private router = inject(Router);

  turnstile = viewChild(TurnstileComponent);

  form = {
    email: '',
    password: '',
    tipoDoc: '1',
    numDoc: '',
    expedida: '',
    apellido1: '',
    apellido2: '',
    nombre1: '',
    nombre2: '',
    celular: '',
    direccion: '',
    genero: '',
    fechaNac: '',
  };

  error = signal('');
  info = signal('');
  loading = signal(false);
  buscando = signal(false);
  alumnoEnArgo = signal(false);
  tieneCuentaPortal = signal(false);
  registroAbierto = signal(true);
  turnstileSiteKey = signal('');
  turnstileToken = signal('');

  constructor() {
    this.api.config().subscribe({
      next: (c) => {
        this.turnstileSiteKey.set(c.turnstileSiteKey || '');
        this.registroAbierto.set(c.registroAbierto !== false);
      },
      error: () => {},
    });
  }

  private captchaToken(): string {
    return this.turnstileToken() || this.turnstile()?.getToken() || '';
  }

  buscarDocumento() {
    const nd = String(this.form.numDoc || '').trim();
    if (!nd) return;
    const token = this.captchaToken();
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot antes de consultar el documento.');
      return;
    }
    this.buscando.set(true);
    this.error.set('');
    this.info.set('');
    this.api.buscarAlumno(nd, token || undefined).subscribe({
      next: (res) => {
        this.buscando.set(false);
        this.turnstile()?.reset();
        this.alumnoEnArgo.set(res.existeEnArgo);
        this.tieneCuentaPortal.set(res.tieneCuentaPortal);
        if (res.tieneCuentaPortal) {
          this.error.set(
            `Este documento ya tiene cuenta en el portal${res.emailPortal ? ` (${res.emailPortal})` : ''}. Use «Acceder».`,
          );
          return;
        }
        if (res.existeEnArgo && res.alumno) {
          const a = res.alumno;
          this.form.tipoDoc = String(a['tipoDoc'] || this.form.tipoDoc);
          this.form.expedida = String(a['expedida'] || '');
          this.form.apellido1 = String(a['apellido1'] || '');
          this.form.apellido2 = String(a['apellido2'] || '');
          this.form.nombre1 = String(a['nombre1'] || '');
          this.form.nombre2 = String(a['nombre2'] || '');
          this.form.genero = String(a['genero'] || '');
          this.form.fechaNac = String(a['fechaNac'] || '');
          this.info.set(
            a['tieneCorreoEnArgo']
              ? 'Ya está inscrito en ARGO. Defina correo y contraseña para el portal (no mostramos el correo guardado por seguridad).'
              : 'Ya está inscrito en ARGO. Solo cree correo y contraseña para el portal; sus datos se conservan.',
          );
        } else {
          this.info.set('Documento nuevo: complete sus datos como en recepción ARGO.');
        }
      },
      error: (e) => {
        this.buscando.set(false);
        this.turnstile()?.reset();
        this.error.set(e?.error?.message || 'No se pudo consultar el documento');
      },
    });
  }

  enviar() {
    if (!this.registroAbierto()) {
      this.error.set('El registro en línea está temporalmente cerrado.');
      return;
    }
    const token = this.captchaToken();
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.registro({ ...this.form }, token || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.setSession(res.token, res.usuario, res.alumno);
        this.router.navigateByUrl('/aula');
      },
      error: (e) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        this.error.set(e?.error?.message || 'No se pudo registrar');
      },
    });
  }
}
