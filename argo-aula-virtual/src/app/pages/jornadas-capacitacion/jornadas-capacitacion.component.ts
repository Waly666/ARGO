import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TurnstileComponent } from '../../components/turnstile/turnstile.component';
import { AulaApiService } from '../../core/aula-api.service';
import { catEtiqueta, catValor, etiquetaGenero, GENEROS_FALLBACK, TIPOS_DOC_FALLBACK } from '../../core/catalogo.helpers';
import { PortalCatalogService } from '../../core/portal-catalog.service';
import { PortalSeoService } from '../../core/portal-seo.service';

@Component({
  selector: 'av-jornadas-capacitacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TurnstileComponent],
  templateUrl: './jornadas-capacitacion.component.html',
  styleUrl: './jornadas-capacitacion.component.scss',
})
export class JornadasCapacitacionComponent implements OnInit {
  private api = inject(AulaApiService);
  private catalogs = inject(PortalCatalogService);
  private seo = inject(PortalSeoService);

  turnstile = viewChild(TurnstileComponent);

  readonly catEtiqueta = catEtiqueta;
  readonly catValor = catValor;
  readonly etiquetaGenero = etiquetaGenero;

  tiposDoc = signal<Record<string, unknown>[]>([]);
  generos = signal<Record<string, unknown>[]>([]);
  departamentos = signal<{ codDepto: string; nombreDepto: string }[]>([]);
  municipiosExp = signal<{ codMunicipio: string; nombreMunicipio: string; label: string }[]>([]);
  municipiosOrigen = signal<{ codMunicipio: string; nombreMunicipio: string; label: string }[]>([]);

  deptoExp = '';
  codMunicipioExp = '';
  deptoOrigen = '';
  codMunicipioOrigen = '';

  form = {
    email: '',
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
    codMunicipio: '',
    munOrigen: '',
    codDepartamento: '',
    nombreDepartamento: '',
    nombreMunicipio: '',
    empresaId: null as string | null,
    empresaNombre: null as string | null,
  };

  empresaBusqReg = signal('');
  empresaSugsReg = signal<{ _id: string; nombre: string; identificacion: string }[]>([]);
  empresaDropReg = signal(false);
  empresaCargReg = signal(false);

  error = signal('');
  info = signal('');
  loading = signal(false);
  buscando = signal(false);
  alumnoEnArgo = signal(false);
  registroAbierto = signal(true);
  emailVerificacion = signal(false);
  paso = signal<'formulario' | 'codigo' | 'exito'>('formulario');
  pendingId = signal('');
  emailEnmascarado = signal('');
  codigoVerificacion = signal('');
  reenviando = signal(false);
  turnstileSiteKey = signal('');
  turnstileToken = signal('');
  mensajeExito = signal('');
  nombreExito = signal('');

  ngOnInit() {
    this.catalogs.tiposDoc().subscribe({
      next: (rows) => this.tiposDoc.set(rows?.length ? rows : TIPOS_DOC_FALLBACK),
      error: () => this.tiposDoc.set(TIPOS_DOC_FALLBACK),
    });
    this.catalogs.generos().subscribe({
      next: (rows) => this.generos.set(rows?.length ? rows : GENEROS_FALLBACK),
      error: () => this.generos.set(GENEROS_FALLBACK),
    });
    this.catalogs.departamentos().subscribe({
      next: (rows) => this.departamentos.set(rows || []),
      error: () => this.departamentos.set([]),
    });

    this.api.config().subscribe({
      next: (c) => {
        this.turnstileSiteKey.set(c.turnstileSiteKey || '');
        this.registroAbierto.set(c.registroAbierto !== false);
        this.emailVerificacion.set(!!c.emailVerificacionRegistro);
        this.seo.applyRegistro(c);
      },
      error: () => undefined,
    });
  }

  onDeptoExpChange() {
    this.codMunicipioExp = '';
    this.form.expedida = '';
    this.cargarMunicipiosExp();
  }

  onMunicipioExpChange() {
    const m = this.municipiosExp().find((x) => x.codMunicipio === this.codMunicipioExp);
    this.form.expedida = m?.nombreMunicipio || '';
  }

  onDeptoOrigenChange() {
    this.codMunicipioOrigen = '';
    this.form.codMunicipio = '';
    this.form.munOrigen = '';
    this.form.codDepartamento = this.deptoOrigen || '';
    const dep = this.departamentos().find((d) => d.codDepto === this.deptoOrigen);
    this.form.nombreDepartamento = dep?.nombreDepto || '';
    this.form.nombreMunicipio = '';
    this.cargarMunicipiosOrigen();
  }

  onMunicipioOrigenChange() {
    this.form.codMunicipio = this.codMunicipioOrigen;
    this.form.munOrigen = this.codMunicipioOrigen;
    this.form.codDepartamento = this.deptoOrigen || '';
    const dep = this.departamentos().find((d) => d.codDepto === this.deptoOrigen);
    this.form.nombreDepartamento = dep?.nombreDepto || '';
    const m = this.municipiosOrigen().find((x) => x.codMunicipio === this.codMunicipioOrigen);
    this.form.nombreMunicipio = m?.nombreMunicipio || '';
  }

  private cargarMunicipiosExp() {
    if (!this.deptoExp) {
      this.municipiosExp.set([]);
      return;
    }
    this.catalogs.municipios(this.deptoExp).subscribe({
      next: (rows) => this.municipiosExp.set(rows || []),
      error: () => this.municipiosExp.set([]),
    });
  }

  private cargarMunicipiosOrigen() {
    if (!this.deptoOrigen) {
      this.municipiosOrigen.set([]);
      return;
    }
    this.catalogs.municipios(this.deptoOrigen).subscribe({
      next: (rows) => this.municipiosOrigen.set(rows || []),
      error: () => this.municipiosOrigen.set([]),
    });
  }

  private aplicarMunicipioOrigenDesdeCodigo(cod: string) {
    const c = String(cod || '').trim();
    if (!c) return;
    this.catalogs.municipioPorCodigo(c).subscribe({
      next: (m) => {
        this.deptoOrigen = m.codDepto;
        this.catalogs.municipios(m.codDepto).subscribe({
          next: (rows) => {
            this.municipiosOrigen.set(rows || []);
            this.codMunicipioOrigen = m.codMunicipio;
            this.form.codMunicipio = m.codMunicipio;
            this.form.munOrigen = m.codMunicipio;
          },
        });
      },
    });
  }

  private aplicarExpedidaDesdeTexto(texto: string) {
    const t = String(texto || '').trim();
    if (!t) return;
    this.catalogs.buscarMunicipios(t, 10).subscribe({
      next: (rows) => {
        const exact =
          rows.find((r) => r.nombreMunicipio.toLowerCase() === t.toLowerCase()) || rows[0];
        if (!exact) return;
        this.deptoExp = exact.codDepto;
        this.catalogs.municipios(exact.codDepto).subscribe({
          next: (list) => {
            this.municipiosExp.set(list || []);
            this.codMunicipioExp = exact.codMunicipio;
            this.form.expedida = exact.nombreMunicipio;
          },
        });
      },
    });
  }

  buscarEmpresaReg(q: string) {
    this.empresaBusqReg.set(q);
    if (!q.trim() || q.trim().length < 2) {
      this.empresaSugsReg.set([]);
      this.empresaDropReg.set(false);
      return;
    }
    this.empresaCargReg.set(true);
    this.api.buscarEmpresasPublico(q.trim()).subscribe({
      next: (rows) => {
        this.empresaSugsReg.set(rows);
        this.empresaDropReg.set(rows.length > 0);
        this.empresaCargReg.set(false);
      },
      error: () => this.empresaCargReg.set(false),
    });
  }

  onEmpresaBlurReg() {
    setTimeout(() => this.empresaDropReg.set(false), 200);
  }

  seleccionarEmpresaReg(e: { _id: string; nombre: string; identificacion: string }) {
    this.form.empresaId = e._id;
    this.form.empresaNombre = e.nombre;
    this.empresaBusqReg.set(e.nombre);
    this.empresaDropReg.set(false);
    this.empresaSugsReg.set([]);
  }

  quitarEmpresaReg() {
    this.form.empresaId = null;
    this.form.empresaNombre = null;
    this.empresaBusqReg.set('');
    this.empresaSugsReg.set([]);
    this.empresaDropReg.set(false);
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
        if (res.existeEnArgo && res.alumno) {
          const a = res.alumno;
          this.form.tipoDoc = String(a['tipoDoc'] || this.form.tipoDoc);
          this.form.expedida = String(a['expedida'] || '');
          this.form.apellido1 = String(a['apellido1'] || '');
          this.form.apellido2 = String(a['apellido2'] || '');
          this.form.nombre1 = String(a['nombre1'] || '');
          this.form.nombre2 = String(a['nombre2'] || '');
          this.form.genero = String(a['genero'] || '').toUpperCase();
          this.form.fechaNac = String(a['fechaNac'] || '');
          this.form.codMunicipio = String(a['codMunicipio'] || a['munOrigen'] || '');
          this.form.munOrigen = String(a['munOrigen'] || a['codMunicipio'] || '');
          this.aplicarMunicipioOrigenDesdeCodigo(this.form.codMunicipio);
          this.aplicarExpedidaDesdeTexto(this.form.expedida);
          this.info.set(
            'Ya está en ARGO. Complete el correo para confirmar su inscripción a jornadas (no se crea cuenta del aula virtual).',
          );
        } else {
          this.info.set('Documento nuevo: complete sus datos. Quedará como alumno de Jornadas de Capacitación.');
        }
      },
      error: (e) => {
        this.buscando.set(false);
        this.turnstile()?.reset();
        this.error.set(e?.error?.message || 'No se pudo consultar el documento');
      },
    });
  }

  volverAlFormulario() {
    this.paso.set('formulario');
    this.codigoVerificacion.set('');
    this.error.set('');
  }

  reenviarCodigo() {
    const id = this.pendingId();
    if (!id) return;
    this.reenviando.set(true);
    this.error.set('');
    this.api.registroJornadaReenviarCodigo(id).subscribe({
      next: (res) => {
        this.reenviando.set(false);
        this.info.set(res.message);
      },
      error: (e) => {
        this.reenviando.set(false);
        this.error.set(e?.error?.message || 'No se pudo reenviar el código');
      },
    });
  }

  private mostrarExito(mensaje: string, nombre?: string) {
    this.mensajeExito.set(
      mensaje ||
        'Te has registrado en Jornadas de Capacitación. Revise su correo: le enviamos su código QR.',
    );
    this.nombreExito.set(nombre || '');
    this.paso.set('exito');
  }

  enviar() {
    if (!this.registroAbierto()) {
      this.error.set('El registro en línea está temporalmente cerrado.');
      return;
    }
    if (!String(this.form.email || '').trim()) {
      this.error.set('El correo es obligatorio.');
      return;
    }
    const token = this.captchaToken();
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.info.set('');

    this.api.registroJornadaSolicitar({ ...this.form }, token || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        if (res.step === 'done') {
          this.mostrarExito(res.mensaje || res.message || '', res.alumno?.nombreCompleto);
          return;
        }
        this.pendingId.set(res.pendingId || '');
        this.emailEnmascarado.set(res.email || '');
        this.paso.set('codigo');
        this.info.set(res.message || '');
      },
      error: (e) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        this.error.set(e?.error?.message || 'No se pudo iniciar la inscripción');
      },
    });
  }

  confirmarCodigo() {
    const codigo = String(this.codigoVerificacion() || '').trim();
    if (!/^\d{6}$/.test(codigo)) {
      this.error.set('Ingrese el código de 6 dígitos que recibió por correo.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.registroJornadaConfirmar(this.pendingId(), codigo).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.mostrarExito(res.mensaje || res.message || '', res.alumno?.nombreCompleto);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'No se pudo confirmar la inscripción');
      },
    });
  }
}
