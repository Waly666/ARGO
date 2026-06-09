import { CommonModule } from '@angular/common';

import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';



import { AulaApiService } from '../../core/aula-api.service';

import { PortalAuthService } from '../../core/portal-auth.service';



@Component({

  selector: 'av-registro',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink],

  templateUrl: './registro.component.html',

  styleUrl: './registro.component.scss',

})

export class RegistroComponent {

  private api = inject(AulaApiService);

  private auth = inject(PortalAuthService);

  private router = inject(Router);



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



  buscarDocumento() {

    const nd = String(this.form.numDoc || '').trim();

    if (!nd) return;

    this.buscando.set(true);

    this.error.set('');

    this.info.set('');

    this.api.buscarAlumno(nd).subscribe({

      next: (res) => {

        this.buscando.set(false);

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

          this.form.celular = String(a['celular'] || '');

          this.form.direccion = String(a['direccion'] || '');

          this.form.genero = String(a['genero'] || '');

          this.form.fechaNac = String(a['fechaNac'] || '');

          if (a['correo'] && !this.form.email) {

            this.form.email = String(a['correo']);

          }

          this.info.set(

            'Ya está inscrito en ARGO. Solo cree correo y contraseña para el portal; sus datos se conservan.',

          );

        } else {

          this.info.set('Documento nuevo: complete sus datos como en recepción ARGO.');

        }

      },

      error: (e) => {

        this.buscando.set(false);

        this.error.set(e?.error?.message || 'No se pudo consultar el documento');

      },

    });

  }



  enviar() {

    this.loading.set(true);

    this.error.set('');

    this.api.registro({ ...this.form }).subscribe({

      next: (res) => {

        this.loading.set(false);

        this.auth.setSession(res.token, res.usuario, res.alumno);

        this.router.navigateByUrl('/aula');

      },

      error: (e) => {

        this.loading.set(false);

        this.error.set(e?.error?.message || 'No se pudo registrar');

      },

    });

  }

}

