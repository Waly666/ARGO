import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AccionCrudCatalogo,
  AlarmaGrupo,
  CategoriaCrudCatalogo,
  ModuloCrudCatalogo,
  PermisoGrupo,
  RolApp,
  RolAppDto,
  RolAppService,
} from '../../core/services/rol-app.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  ACCIONES_CRUD,
  AccionCrud,
  ETIQUETA_ACCION_CORTA,
  ModuloCrud,
  aplicarAccionCrudEnPermisos,
  aplicarFilaCrudEnPermisos,
  contarAccionesCrudActivas,
  filaCrudCompleta,
  tieneAccionModulo,
} from '../../core/utils/crud-permiso.util';

type FichaRol = 'datos' | 'tablas' | 'modulos' | 'alarmas';
type VistaAlarmas = 'todas' | 'android';

@Component({
  selector: 'argo-roles-permisos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './roles-permisos-admin.component.html',
  styleUrls: ['./roles-permisos-admin.component.scss'],
})
export class RolesPermisosAdminComponent implements OnInit {
  private svc = inject(RolAppService);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmDialogService);

  roles = signal<RolApp[]>([]);
  grupos = signal<PermisoGrupo[]>([]);
  modulosCrud = signal<ModuloCrudCatalogo[]>([]);
  accionesCrud = signal<AccionCrudCatalogo[]>([]);
  categoriasCrud = signal<CategoriaCrudCatalogo[]>([]);
  alarmasGrupos = signal<AlarmaGrupo[]>([]);
  seleccionado = signal<RolApp | null>(null);
  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  filtroRoles = signal('');
  filtroTablas = signal('');
  mostrarNuevo = signal(false);
  ficha = signal<FichaRol>('datos');
  vistaAlarmas = signal<VistaAlarmas>('android');

  readonly accionesCrudCols = ACCIONES_CRUD;
  readonly etiquetaAccionCorta = ETIQUETA_ACCION_CORTA;

  rolesFiltrados = computed(() => {
    const q = this.filtroRoles().trim().toLowerCase();
    const list = this.roles();
    if (!q) return list;
    return list.filter((r) => {
      const nombre = String(r.nombre || '').toLowerCase();
      const codigo = String(r.codigo || '').toLowerCase();
      const desc = String(r.descripcion || '').toLowerCase();
      return nombre.includes(q) || codigo.includes(q) || desc.includes(q);
    });
  });

  form = signal<RolAppDto>({
    codigo: '',
    nombre: '',
    descripcion: '',
    permisos: [],
    alarmas: [],
    activo: true,
  });

  permisosSeleccionados = computed(() => new Set(this.form().permisos || []));

  totalPermisosActivos = computed(() => {
    const p = this.form().permisos || [];
    if (p.includes('*')) return 'Todos';
    return String(p.length);
  });

  totalAlarmasActivas = computed(() => {
    const a = this.form().alarmas || [];
    if (a.includes('*')) return 'Todas';
    return String(a.length);
  });

  totalAlarmasMovilActivas = computed(() => {
    const raw = this.form().alarmas || [];
    if (raw.includes('*')) return String(this.totalAlarmasMovilDisponibles());
    const sel = new Set(raw);
    let n = 0;
    for (const g of this.alarmasGrupos()) {
      for (const al of g.alarmas) {
        if (al.movilCajero && sel.has(al.key)) n += 1;
      }
    }
    return String(n);
  });

  totalAlarmasMovilDisponibles = computed(() => {
    let n = 0;
    for (const g of this.alarmasGrupos()) {
      for (const al of g.alarmas) {
        if (al.movilCajero) n += 1;
      }
    }
    return n;
  });

  todasAlarmasAndroidActivas = computed(() => {
    const raw = this.form().alarmas || [];
    if (raw.includes('*')) return true;
    const sel = new Set(raw);
    for (const g of this.alarmasGrupos()) {
      for (const al of g.alarmas) {
        if (al.movilCajero && !sel.has(al.key)) return false;
      }
    }
    return this.totalAlarmasMovilDisponibles() > 0;
  });

  alarmasGruposVisibles = computed(() => {
    if (this.vistaAlarmas() !== 'android') return this.alarmasGrupos();
    return this.alarmasGrupos()
      .map((g) => ({
        ...g,
        alarmas: g.alarmas.filter((a) => a.movilCajero),
      }))
      .filter((g) => g.alarmas.length > 0);
  });

  totalTiposPermisos = computed(() =>
    this.grupos().reduce((n, g) => n + (g.permisos?.length || 0), 0),
  );

  totalTiposAlarmas = computed(() =>
    this.alarmasGrupos().reduce((n, g) => n + (g.alarmas?.length || 0), 0),
  );

  modulosCrudFiltrados = computed(() => {
    const q = this.filtroTablas().trim().toLowerCase();
    const list = this.modulosCrud();
    if (!q) return list;
    return list.filter((m) => m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  });

  modulosCrudPorCategoria = computed(() => {
    const cats = this.categoriasCrud();
    const map = new Map<string, ModuloCrudCatalogo[]>();
    for (const m of this.modulosCrudFiltrados()) {
      const cat = m.categoria || 'otros';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m);
    }
    return cats
      .map((c) => ({ categoria: c, modulos: map.get(c.id) || [] }))
      .filter((x) => x.modulos.length > 0);
  });

  esAdminSistema = computed(
    () => this.seleccionado()?.codigo === 'admin' && !!this.seleccionado()?.esSistema,
  );

  permisosCrudResumen = computed(() => {
    const p = this.form().permisos || [];
    if (p.includes('*')) return 'Todos';
    const total = this.modulosCrud().length * ACCIONES_CRUD.length;
    let activos = 0;
    for (const m of this.modulosCrud()) {
      activos += contarAccionesCrudActivas(p, m.id as ModuloCrud);
    }
    return `${activos}/${total}`;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.catalogo().subscribe({
      next: (c) => {
        this.grupos.set(c.grupos || []);
        this.modulosCrud.set(c.modulosCrud || []);
        this.accionesCrud.set(c.accionesCrud || []);
        this.categoriasCrud.set(c.categoriasCrud || []);
        this.alarmasGrupos.set(c.alarmasGrupos || []);
      },
      error: () => {
        this.grupos.set([]);
        this.modulosCrud.set([]);
        this.accionesCrud.set([]);
        this.categoriasCrud.set([]);
        this.alarmasGrupos.set([]);
      },
    });
    this.svc.listar().subscribe({
      next: (r) => {
        this.roles.set(r || []);
        this.loading.set(false);
        const sel = this.seleccionado();
        if (sel) {
          const actualizado = (r || []).find((x) => x.codigo === sel.codigo);
          if (actualizado) this.seleccionar(actualizado);
        }
      },
      error: (e) => {
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'Error cargando roles');
      },
    });
  }

  seleccionar(rol: RolApp): void {
    this.mostrarNuevo.set(false);
    this.ficha.set('datos');
    this.seleccionado.set(rol);
    this.form.set({
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      permisos: rol.permisos?.includes('*') ? ['*'] : [...(rol.permisos || [])],
      alarmas: rol.alarmas?.includes('*') ? ['*'] : [...(rol.alarmas || [])],
      activo: rol.activo !== false,
    });
  }

  nuevo(): void {
    this.seleccionado.set(null);
    this.mostrarNuevo.set(true);
    this.ficha.set('datos');
    this.msg.set(null);
    this.msgError.set(false);
    this.form.set({
      codigo: '',
      nombre: '',
      descripcion: '',
      permisos: ['dashboard'],
      alarmas: ['alarmas.vehiculos.docs_vencidos'],
      activo: true,
    });
  }

  patch(campo: keyof RolAppDto, valor: unknown): void {
    this.form.update((f) => ({ ...f, [campo]: valor }));
  }

  setFicha(f: FichaRol): void {
    this.ficha.set(f);
    if (f === 'alarmas') this.vistaAlarmas.set('android');
  }

  setVistaAlarmas(v: VistaAlarmas): void {
    this.vistaAlarmas.set(v);
  }

  accionCrudActiva(moduloId: string, accion: AccionCrud): boolean {
    const p = this.form().permisos || [];
    return tieneAccionModulo(p, moduloId as ModuloCrud, accion);
  }

  toggleAccionCrud(moduloId: string, accion: AccionCrud, event: Event): void {
    if (this.esAdminSistema()) return;
    const input = event.target as HTMLInputElement;
    const activo = !!input?.checked;
    this.form.update((f) => ({
      ...f,
      permisos: aplicarAccionCrudEnPermisos(
        (f.permisos || []).filter((p) => p !== '*'),
        moduloId as ModuloCrud,
        accion,
        activo,
      ),
    }));
  }

  toggleFilaCrud(moduloId: string, event: Event): void {
    if (this.esAdminSistema()) return;
    const input = event.target as HTMLInputElement;
    const activo = !!input?.checked;
    this.form.update((f) => ({
      ...f,
      permisos: aplicarFilaCrudEnPermisos(
        (f.permisos || []).filter((p) => p !== '*'),
        moduloId as ModuloCrud,
        activo,
      ),
    }));
  }

  toggleColumnaCrud(accion: AccionCrud, event: Event): void {
    if (this.esAdminSistema()) return;
    const input = event.target as HTMLInputElement;
    const activo = !!input?.checked;
    this.form.update((f) => {
      let permisos = (f.permisos || []).filter((p) => p !== '*');
      for (const m of this.modulosCrud()) {
        permisos = aplicarAccionCrudEnPermisos(permisos, m.id as ModuloCrud, accion, activo);
      }
      return { ...f, permisos };
    });
  }

  filaCrudCompleta(moduloId: string): boolean {
    return filaCrudCompleta(this.form().permisos || [], moduloId as ModuloCrud);
  }

  contarFilaCrud(moduloId: string): number {
    return contarAccionesCrudActivas(this.form().permisos || [], moduloId as ModuloCrud);
  }

  columnaCrudCompleta(accion: AccionCrud): boolean {
    const mods = this.modulosCrud();
    if (!mods.length) return false;
    return mods.every((m) => this.accionCrudActiva(m.id, accion));
  }

  etiquetaCategoria(catId: string): string {
    return this.categoriasCrud().find((c) => c.id === catId)?.label || catId;
  }

  tienePermiso(key: string): boolean {
    const p = this.form().permisos || [];
    if (p.includes('*')) return true;
    return p.includes(key);
  }

  togglePermiso(key: string): void {
    const rol = this.seleccionado();
    if (rol?.esSistema && rol.codigo === 'admin') return;

    this.form.update((f) => {
      let permisos = [...(f.permisos || [])];
      if (permisos.includes('*')) permisos = [];
      if (permisos.includes(key)) {
        permisos = permisos.filter((p) => p !== key);
      } else {
        permisos.push(key);
      }
      return { ...f, permisos };
    });
  }

  toggleGrupo(grupo: PermisoGrupo): void {
    const rol = this.seleccionado();
    if (rol?.esSistema && rol.codigo === 'admin') return;

    const keys = grupo.permisos.map((p) => p.key);
    const todos = keys.every((k) => this.tienePermiso(k));
    this.form.update((f) => {
      let permisos = [...(f.permisos || [])].filter((p) => p !== '*');
      if (todos) {
        permisos = permisos.filter((p) => !keys.includes(p));
      } else {
        for (const k of keys) {
          if (!permisos.includes(k)) permisos.push(k);
        }
      }
      return { ...f, permisos };
    });
  }

  grupoCompleto(grupo: PermisoGrupo): boolean {
    return grupo.permisos.every((p) => this.tienePermiso(p.key));
  }

  tieneAlarma(key: string): boolean {
    const a = this.form().alarmas || [];
    if (a.includes('*')) return true;
    return a.includes(key);
  }

  private todasLasClavesAlarmas(): string[] {
    return this.alarmasGrupos().flatMap((g) => g.alarmas.map((a) => a.key));
  }

  private expandirAlarmasSiWildcard(alarmas: string[]): string[] {
    if (!alarmas.includes('*')) return [...alarmas];
    return this.todasLasClavesAlarmas();
  }

  toggleAlarma(key: string): void {
    this.form.update((f) => {
      let alarmas = this.expandirAlarmasSiWildcard([...(f.alarmas || [])]);
      if (alarmas.includes(key)) {
        alarmas = alarmas.filter((x) => x !== key);
      } else {
        alarmas.push(key);
      }
      return { ...f, alarmas };
    });
  }

  toggleGrupoAlarmas(grupo: AlarmaGrupo): void {
    const keys = grupo.alarmas.map((a) => a.key);
    const todos = keys.every((k) => this.tieneAlarma(k));
    this.form.update((f) => {
      let alarmas = this.expandirAlarmasSiWildcard([...(f.alarmas || [])]);
      if (todos) {
        alarmas = alarmas.filter((x) => !keys.includes(x));
      } else {
        for (const k of keys) {
          if (!alarmas.includes(k)) alarmas.push(k);
        }
      }
      return { ...f, alarmas };
    });
  }

  grupoAlarmasCompleto(grupo: AlarmaGrupo): boolean {
    return grupo.alarmas.every((a) => this.tieneAlarma(a.key));
  }

  alarmasGrupoActivas(grupo: AlarmaGrupo): number {
    return grupo.alarmas.filter((a) => this.tieneAlarma(a.key)).length;
  }

  detalleAlarmasMovilRol(rol: RolApp): string {
    const total = this.totalAlarmasMovilDisponibles();
    const a = rol.alarmas || [];
    if (a.includes('*')) return total ? `Android ${total}/${total}` : 'Android todas';
    let n = 0;
    for (const g of this.alarmasGrupos()) {
      for (const al of g.alarmas) {
        if (al.movilCajero && a.includes(al.key)) n += 1;
      }
    }
    if (!total) return `Android ${n}`;
    return `Android ${n}/${total}`;
  }

  private clavesAlarmasAndroid(): string[] {
    return this.alarmasGrupos()
      .flatMap((g) => g.alarmas)
      .filter((a) => a.movilCajero)
      .map((a) => a.key);
  }

  toggleTodasAlarmasAndroid(activar: boolean): void {
    const keys = this.clavesAlarmasAndroid();
    if (!keys.length) return;
    this.form.update((f) => {
      let alarmas = this.expandirAlarmasSiWildcard([...(f.alarmas || [])]);
      if (activar) {
        for (const k of keys) {
          if (!alarmas.includes(k)) alarmas.push(k);
        }
      } else {
        alarmas = alarmas.filter((k) => !keys.includes(k));
      }
      return { ...f, alarmas };
    });
  }

  capGrupoAlarmas(id: string): string {
    const map: Record<string, string> = {
      caja: 'cap-amber',
      jornadas: 'cap-orange',
      vehiculos: 'cap-pink',
      alumnos: 'cap-cyan',
    };
    return map[id] || 'cap-indigo';
  }

  capRol(rol: RolApp): string {
    const c = String(rol.codigo || '').toLowerCase();
    if (c === 'admin') return 'cap-purple';
    if (c === 'cajero') return 'cap-emerald';
    if (c === 'instructor') return 'cap-orange';
    if (c === 'recepcion') return 'cap-cyan';
    if (c === 'usuario') return 'cap-slate';
    return 'cap-indigo';
  }

  dotRol(rol: RolApp): string {
    const c = String(rol.codigo || '').toLowerCase();
    if (c === 'admin') return 'tone-purple';
    if (c === 'cajero') return 'tone-emerald';
    if (c === 'instructor') return 'tone-orange';
    if (c === 'recepcion') return 'tone-cyan';
    if (c === 'usuario') return 'tone-slate';
    return 'tone-indigo';
  }

  capGrupo(id: string): string {
    const map: Record<string, string> = {
      general: 'cap-violet',
      alumnos: 'cap-cyan',
      academico: 'cap-blue',
      jornadas: 'cap-orange',
      caja: 'cap-amber',
      otros: 'cap-teal',
      config_usuarios: 'cap-purple',
      config: 'cap-purple',
    };
    return map[id] || 'cap-indigo';
  }

  permisosGrupoActivos(grupo: PermisoGrupo): number {
    return grupo.permisos.filter((p) => this.tienePermiso(p.key)).length;
  }

  progresoGrupo(activos: number, total: number): number {
    if (!total) return 0;
    return Math.round((activos / total) * 100);
  }

  detallePermisosRol(rol: RolApp): string {
    const total = this.totalTiposPermisos();
    const p = rol.permisos || [];
    if (p.includes('*')) return total ? `Todos/${total}` : 'Todos';
    if (!total) return String(p.length);
    return `${p.length}/${total}`;
  }

  detalleAlarmasRol(rol: RolApp): string {
    const total = this.totalTiposAlarmas();
    const a = rol.alarmas || [];
    if (a.includes('*')) return total ? `Todas/${total}` : 'Todas';
    if (!total) return String(a.length);
    return `${a.length}/${total}`;
  }

  async guardar(): Promise<void> {
    const f = this.form();
    const sel = this.seleccionado();
    if (!String(f.nombre || '').trim()) {
      this.msgError.set(true);
      this.msg.set('El nombre del rol es obligatorio');
      return;
    }

    const esAdminSistema = sel?.esSistema && sel?.codigo === 'admin';
    const permisos = esAdminSistema
      ? ['*']
      : this.prepararPermisosAntesGuardar(f.permisos || []);
    const alarmas = [...(f.alarmas || [])];
    const payload = {
      nombre: f.nombre,
      descripcion: f.descripcion,
      permisos,
      alarmas: alarmas.includes('*') ? ['*'] : alarmas,
      activo: f.activo,
    };

    this.saving.set(true);
    this.msg.set(null);
    this.msgError.set(false);

    const obs = sel
      ? this.svc.actualizar(sel.codigo, payload)
      : this.svc.crear({ ...payload, codigo: f.codigo });

    obs.subscribe({
      next: (doc) => {
        this.saving.set(false);
        const enviados = permisos.length;
        const guardados = doc.permisos?.length ?? 0;
        const metaMsg = this.mensajeMeta(doc.meta);
        let msg = `Rol «${doc.codigo}» guardado en servidor (${guardados} permiso(s)).`;
        if (enviados !== guardados) {
          msg += ` Enviados: ${enviados}, aplicados: ${guardados}.`;
        }
        if (metaMsg) msg += ` ${metaMsg}`;

        const rolUsuario = String(this.auth.user()?.rol || '').toLowerCase();
        const esMiRol = rolUsuario === String(doc.codigo || '').toLowerCase();
        this.auth.refreshMe().subscribe({
          next: () => {
            if (esMiRol) {
              msg += ' Su menú ya se actualizó.';
            } else {
              msg +=
                ' Los usuarios con ese rol verán el menú actualizado en unos segundos (máx. 8 s) o al recargar la página.';
            }
            this.msgError.set(false);
            this.msg.set(msg);
          },
          error: () => {
            msg += esMiRol
              ? ' Recargue la página para ver su menú actualizado.'
              : ' Los usuarios con ese rol deben recargar la página o esperar unos segundos.';
            this.msgError.set(false);
            this.msg.set(msg);
          },
        });

        this.mostrarNuevo.set(false);
        this.cargar();
        this.seleccionar(doc);
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'Error guardando rol');
      },
    });
  }

  /** Evita login bloqueado: todo rol con permisos debe incluir dashboard. */
  private prepararPermisosAntesGuardar(permisos: string[]): string[] {
    if (permisos.includes('*')) return ['*'];
    const p = [...permisos];
    if (p.length > 0 && !p.includes('dashboard')) p.push('dashboard');
    return p;
  }

  private mensajeMeta(meta?: { permisosRemovidos?: string[]; permisosAgregados?: string[] }): string | null {
    if (!meta) return null;
    const partes: string[] = [];
    if (meta.permisosAgregados?.length) {
      partes.push(
        `Se agregó «${meta.permisosAgregados.join('», «')}» (mínimo para iniciar sesión).`,
      );
    }
    if (meta.permisosRemovidos?.length) {
      partes.push(`Ignorados por no estar en catálogo: ${meta.permisosRemovidos.join(', ')}.`);
    }
    return partes.length ? partes.join(' ') : null;
  }

  async eliminar(rol: RolApp): Promise<void> {
    if (rol.esSistema) return;
    const ok = await this.confirm.open({
      title: 'Eliminar rol',
      message: `¿Eliminar el rol «${rol.nombre}»? Solo es posible si ningún usuario activo lo usa.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    this.svc.eliminar(rol.codigo).subscribe({
      next: (r) => {
        this.msgError.set(false);
        this.msg.set(r.message);
        this.seleccionado.set(null);
        this.cargar();
      },
      error: (e) => {
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo eliminar');
      },
    });
  }

  async reiniciar(): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Restaurar roles del sistema',
      message: 'Restaura permisos y alarmas por defecto de Administrador, Cajero, Instructor, etc.',
      confirmLabel: 'Restaurar',
      variant: 'warn',
    });
    if (!ok) return;

    this.svc.reiniciarSistema().subscribe({
      next: (r) => {
        this.msgError.set(false);
        this.msg.set(r.message);
        this.cargar();
      },
      error: (e) => {
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'Error al restaurar');
      },
    });
  }
}
