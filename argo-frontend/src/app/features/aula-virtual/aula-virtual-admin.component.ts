import { CommonModule } from '@angular/common';

import { Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';



import {

  AulaVirtualAdminService,

  CategoriaVirtual,

  CursoVirtualAdmin,

  GuardarCursoVirtualBody,

  NIVELES_VIRTUAL,

  PortalAulaConfig,

  SesionMeet,

  UsuarioPortalAdmin,

  VirtualConfig,

} from '../../core/services/aula-virtual-admin.service';

import { environment } from '../../../environments/environment';
import { mergePortalLanding, PORTAL_LANDING_DEFAULTS } from '../../core/constants/portal-landing-defaults';
import { PortalLandingEditorComponent } from './portal-landing-editor.component';

type TabAula = 'cursos' | 'usuarios' | 'empresa' | 'portal';



@Component({

  selector: 'argo-aula-virtual-admin',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, PortalLandingEditorComponent],

  templateUrl: './aula-virtual-admin.component.html',

  styleUrls: ['./aula-virtual-admin.component.scss'],

})

export class AulaVirtualAdminComponent implements OnInit {

  private svc = inject(AulaVirtualAdminService);



  readonly niveles = NIVELES_VIRTUAL;

  readonly portalUrl = 'http://localhost:4202/';



  tab = signal<TabAula>('cursos');

  cursos = signal<CursoVirtualAdmin[]>([]);

  categorias = signal<CategoriaVirtual[]>([]);

  seleccionado = signal<CursoVirtualAdmin | null>(null);

  config = signal<VirtualConfig | null>(null);

  ficha = {
    descripcionVirtual: '',
    horas: null as number | null,
    urlPortadaAbsoluta: null as string | null,
  };



  usuarios = signal<UsuarioPortalAdmin[]>([]);

  usuariosTotal = signal(0);

  buscarUsuario = '';



  portalForm: PortalAulaConfig = {

    nombreEmpresa: '',

    nit: '',

    direccion: '',

    ciudad: '',

    telefono: '',

    email: '',

    heroTitulo: '',

    heroSubtitulo: '',

    acercaDeHtml: '',

    telefonoWhatsapp: '',

    emailContacto: '',

    landing: mergePortalLanding(PORTAL_LANDING_DEFAULTS),

  };



  loading = signal(true);

  loadingUsuarios = signal(false);

  saving = signal(false);

  msg = signal<string | null>(null);

  err = signal(false);



  nuevaSesion: SesionMeet = { titulo: '', url: '', fecha: '', obligatoria: false };

  matriculaNumDoc = '';
  matriculaEmail = '';
  matriculaCrearUsuario = true;
  matriculando = signal(false);
  matriculaCredenciales = signal<{ email: string; passwordTemporal: string | null } | null>(null);

  ngOnInit(): void {

    this.svc.listarCursos().subscribe({

      next: (rows) => {

        this.cursos.set(rows);

        this.loading.set(false);

      },

      error: () => {

        this.loading.set(false);

        this.toast('No se pudo cargar cursos virtuales', true);

      },

    });

    this.cargarCategorias();

    this.svc.obtenerPortal().subscribe({
      next: (p) => {
        Object.assign(this.portalForm, p);
        this.portalForm.landing = mergePortalLanding(p.landing);
      },
    });

    this.cargarUsuarios();

  }



  autorPreview(): string {

    return this.portalForm.nombreEmpresa?.trim() || this.portalForm.vistaPreviaEmpresa?.nombreCea || '—';

  }



  setTab(t: TabAula) {

    this.tab.set(t);

    if (t === 'usuarios') this.cargarUsuarios();

  }



  cargarCategorias() {

    this.svc.listarCategorias().subscribe({

      next: (rows) => this.categorias.set(rows),

      error: () => this.toast('No se pudo cargar categorías', true),

    });

  }



  cargarUsuarios() {

    this.loadingUsuarios.set(true);

    this.svc.listarUsuarios(this.buscarUsuario.trim()).subscribe({

      next: (res) => {

        this.usuarios.set(res.usuarios);

        this.usuariosTotal.set(res.total);

        this.loadingUsuarios.set(false);

      },

      error: () => {

        this.loadingUsuarios.set(false);

        this.toast('No se pudo cargar usuarios del portal', true);

      },

    });

  }



  matricularAlumno() {
    const sel = this.seleccionado();
    const numDoc = this.matriculaNumDoc.trim();
    if (!sel || !numDoc || this.matriculando()) return;
    this.matriculando.set(true);
    this.matriculaCredenciales.set(null);
    this.svc
      .matricularAlumno(sel.idPrograma, {
        numDoc,
        email: this.matriculaEmail.trim() || undefined,
        crearUsuarioPortal: this.matriculaCrearUsuario,
      })
      .subscribe({
        next: (res) => {
          this.matriculando.set(false);
          this.toast(res.message);
          if (res.usuarioPortal) {
            this.matriculaCredenciales.set({
              email: res.usuarioPortal.email,
              passwordTemporal: res.usuarioPortal.passwordTemporal,
            });
          }
        },
        error: (e) => {
          this.matriculando.set(false);
          this.toast(e?.error?.message || 'No se pudo matricular', true);
        },
      });
  }

  elegir(c: CursoVirtualAdmin) {

    this.seleccionado.set(c);
    this.matriculaCredenciales.set(null);

    const cfg = c.config || {

      idPrograma: String(c.idPrograma),

      publicadoPortal: false,

      modoCertificado: 'al_pagar' as const,

      requierePagoParaCursar: false,

      pctMinCompletitud: 80,

      pctMinEvaluaciones: 60,

      intentosMaxEval: 3,

      indexHtml: 'index.html',

      idCategorias: [...(c.idCategorias ?? [])],

      nivel: c.nivel ?? null,

      materiales: [],

      sesionesMeet: [],

    };

    this.config.set({

      ...cfg,

      idCategorias: [...(cfg.idCategorias ?? c.idCategorias ?? [])],

      nivel: cfg.nivel ?? c.nivel ?? null,

    });

    this.ficha.descripcionVirtual = c.descripcionVirtual || '';
    this.ficha.horas = c.horas ?? null;
    this.ficha.urlPortadaAbsoluta = this.absolutaPortada(c.urlPortadaAbsoluta, c.urlPortadaVirtual);

  }



  guardarCurso() {

    const sel = this.seleccionado();

    const cfg = this.config();

    const fic = this.ficha;

    if (!sel || !cfg) return;

    const body: GuardarCursoVirtualBody = {

      ...cfg,

      descripcionVirtual: fic.descripcionVirtual,

      horas: fic.horas,

    };

    this.saving.set(true);

    this.svc.guardarConfig(sel.idPrograma, body).subscribe({

      next: (res) => {

        this.config.set({

          ...res.config,

          idCategorias: [...(res.config.idCategorias ?? cfg.idCategorias ?? [])],

          nivel: res.config.nivel ?? cfg.nivel ?? null,

        });

        this.saving.set(false);

        this.toast('Curso guardado');

        this.refrescarLista();

      },

      error: (e) => {

        this.saving.set(false);

        this.toast(e?.error?.message || 'Error al guardar', true);

      },

    });

  }



  reintegrarBridge() {
    const sel = this.seleccionado();
    if (!sel || this.saving()) return;
    this.saving.set(true);
    this.svc.reintegrarBridge(sel.idPrograma).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast(res.message);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast(e?.error?.message || 'No se pudo reintegrar ARGO', true);
      },
    });
  }

  onZip(ev: Event) {

    const sel = this.seleccionado();

    const input = ev.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!sel || !file) return;

    this.saving.set(true);

    this.svc.subirPaquete(sel.idPrograma, file).subscribe({

      next: (res) => {

        this.saving.set(false);

        this.toast(res.message || 'Paquete subido');

        input.value = '';

        this.refrescarLista();

      },

      error: (e) => {

        this.saving.set(false);

        input.value = '';

        this.toast(e?.error?.message || 'Error al subir ZIP', true);

      },

    });

  }



  onPortada(ev: Event) {

    const sel = this.seleccionado();

    const input = ev.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!sel || !file) return;

    this.saving.set(true);

    this.svc.subirPortada(sel.idPrograma, file).subscribe({

      next: (res) => {

        this.saving.set(false);

        input.value = '';

        this.ficha.urlPortadaAbsoluta = this.absolutaPortada(null, res.urlPortadaVirtual);

        this.toast(res.message || 'Portada actualizada');

        this.refrescarLista();

      },

      error: (e) => {

        this.saving.set(false);

        input.value = '';

        this.toast(e?.error?.message || 'Error al subir portada', true);

      },

    });

  }



  quitarPortada() {

    const sel = this.seleccionado();

    if (!sel) return;

    this.saving.set(true);

    this.svc.quitarPortada(sel.idPrograma).subscribe({

      next: (res) => {

        this.saving.set(false);

        this.ficha.urlPortadaAbsoluta = null;

        this.toast(res.message || 'Portada eliminada');

        this.refrescarLista();

      },

      error: (e) => {

        this.saving.set(false);

        this.toast(e?.error?.message || 'Error', true);

      },

    });

  }



  onMaterial(ev: Event) {

    const sel = this.seleccionado();

    const input = ev.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!sel || !file) return;

    this.saving.set(true);

    this.svc.subirMaterial(sel.idPrograma, file).subscribe({

      next: (res) => {

        this.config.set(res.config);

        this.saving.set(false);

        this.toast(res.message || 'Material agregado');

        input.value = '';

      },

      error: (e) => {

        this.saving.set(false);

        input.value = '';

        this.toast(e?.error?.message || 'Error al subir material', true);

      },

    });

  }



  quitarMaterial(id: string) {

    const sel = this.seleccionado();

    if (!sel) return;

    this.svc.eliminarMaterial(sel.idPrograma, id).subscribe({

      next: (res) => {

        this.config.set(res.config);

        this.toast('Material eliminado');

      },

      error: (e) => this.toast(e?.error?.message || 'Error', true),

    });

  }



  agregarSesion() {

    const cfg = this.config();

    if (!cfg || !this.nuevaSesion.titulo.trim() || !this.nuevaSesion.url.trim()) return;

    const sesiones = [...(cfg.sesionesMeet || []), { ...this.nuevaSesion }];

    this.config.set({ ...cfg, sesionesMeet: sesiones });

    this.nuevaSesion = { titulo: '', url: '', fecha: '', obligatoria: false };

  }



  quitarSesion(i: number) {

    const cfg = this.config();

    if (!cfg) return;

    const sesiones = [...(cfg.sesionesMeet || [])];

    sesiones.splice(i, 1);

    this.config.set({ ...cfg, sesionesMeet: sesiones });

  }



  onLogo(ev: Event) {

    const input = ev.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) return;

    this.saving.set(true);

    this.svc.subirLogoPortal(file).subscribe({

      next: (res) => {

        Object.assign(this.portalForm, res.config);
        this.portalForm.landing = mergePortalLanding(res.config.landing);

        this.saving.set(false);

        input.value = '';

        this.toast(res.message || 'Logo actualizado');

      },

      error: (e) => {

        this.saving.set(false);

        input.value = '';

        this.toast(e?.error?.message || 'Error al subir logo', true);

      },

    });

  }



  quitarLogo() {

    this.saving.set(true);

    this.svc.quitarLogoPortal().subscribe({

      next: (res) => {

        Object.assign(this.portalForm, res.config);
        this.portalForm.landing = mergePortalLanding(res.config.landing);

        this.saving.set(false);

        this.toast(res.message || 'Logo eliminado');

      },

      error: (e) => {

        this.saving.set(false);

        this.toast(e?.error?.message || 'Error al quitar logo', true);

      },

    });

  }



  guardarPortal() {

    this.saving.set(true);

    this.svc.guardarPortal(this.portalForm).subscribe({

      next: (res) => {

        this.svc.obtenerPortal().subscribe({

          next: (p) => Object.assign(this.portalForm, p),

        });

        this.saving.set(false);

        this.toast(res.message || 'Configuración guardada');

      },

      error: (e) => {

        this.saving.set(false);

        this.toast(e?.error?.message || 'Error al guardar portal', true);

      },

    });

  }



  fmtFecha(iso?: string | null) {

    if (!iso) return '—';

    try {

      return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(

        new Date(iso),

      );

    } catch {

      return '—';

    }

  }



  labelNivel(n: string | null | undefined) {

    if (!n) return '—';

    return n.charAt(0) + n.slice(1).toLowerCase();

  }

  tieneCategoria(id: number): boolean {
    return (this.config()?.idCategorias || []).includes(id);
  }

  toggleCategoria(id: number, ev: Event) {
    const cfg = this.config();
    if (!cfg) return;
    const checked = (ev.target as HTMLInputElement).checked;
    let ids = [...(cfg.idCategorias || [])];
    if (checked) {
      if (!ids.includes(id)) ids.push(id);
    } else {
      ids = ids.filter((x) => x !== id);
    }
    this.config.set({ ...cfg, idCategorias: ids });
  }

  private absolutaPortada(abs?: string | null, rel?: string | null) {

    if (abs) return abs;

    const r = String(rel || '').trim().replace(/^\/+/, '');

    if (!r) return null;

    const base = environment.uploadsUrl?.replace(/\/+$/, '') || '';

    return r.startsWith('http') ? r : `${base}/${r}`;

  }



  private refrescarLista() {
    this.cargarCategorias();
    this.svc.listarCursos().subscribe({
      next: (rows) => {
        this.cursos.set(rows);
        const id = this.seleccionado()?.idPrograma;
        if (id) {
          const found = rows.find((r) => String(r.idPrograma) === String(id));
          if (found) this.elegir(found);
        }
      },
    });
  }



  private toast(text: string, isErr = false) {

    this.msg.set(text);

    this.err.set(isErr);

    setTimeout(() => this.msg.set(null), 4000);

  }

}


