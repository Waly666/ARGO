import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PermisoGrupo,
  RolApp,
  RolAppDto,
  RolAppService,
} from '../../core/services/rol-app.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'argo-roles-permisos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-permisos-admin.component.html',
  styleUrls: ['./roles-permisos-admin.component.scss'],
})
export class RolesPermisosAdminComponent implements OnInit {
  private svc = inject(RolAppService);
  private confirm = inject(ConfirmDialogService);

  roles = signal<RolApp[]>([]);
  grupos = signal<PermisoGrupo[]>([]);
  seleccionado = signal<RolApp | null>(null);
  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  mostrarNuevo = signal(false);

  form = signal<RolAppDto>({
    codigo: '',
    nombre: '',
    descripcion: '',
    permisos: [],
    activo: true,
  });

  permisosSeleccionados = computed(() => new Set(this.form().permisos || []));

  totalPermisosActivos = computed(() => {
    const p = this.form().permisos || [];
    if (p.includes('*')) return 'Todos';
    return String(p.length);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.catalogo().subscribe({
      next: (c) => this.grupos.set(c.grupos || []),
      error: () => this.grupos.set([]),
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
        this.msg.set(e?.error?.message || 'Error cargando roles');
      },
    });
  }

  seleccionar(rol: RolApp): void {
    this.mostrarNuevo.set(false);
    this.seleccionado.set(rol);
    this.form.set({
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      permisos: rol.permisos?.includes('*') ? ['*'] : [...(rol.permisos || [])],
      activo: rol.activo !== false,
    });
  }

  nuevo(): void {
    this.seleccionado.set(null);
    this.mostrarNuevo.set(true);
    this.form.set({
      codigo: '',
      nombre: '',
      descripcion: '',
      permisos: ['dashboard'],
      activo: true,
    });
  }

  patch(campo: keyof RolAppDto, valor: unknown): void {
    this.form.update((f) => ({ ...f, [campo]: valor }));
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
      config: 'cap-purple',
    };
    return map[id] || 'cap-indigo';
  }

  permisosGrupoActivos(grupo: PermisoGrupo): number {
    return grupo.permisos.filter((p) => this.tienePermiso(p.key)).length;
  }

  async guardar(): Promise<void> {
    const f = this.form();
    if (!String(f.nombre || '').trim()) {
      this.msg.set('El nombre del rol es obligatorio');
      return;
    }

    this.saving.set(true);
    this.msg.set(null);

    const sel = this.seleccionado();
    const obs = sel
      ? this.svc.actualizar(sel.codigo, {
          nombre: f.nombre,
          descripcion: f.descripcion,
          permisos: f.permisos,
          activo: f.activo,
        })
      : this.svc.crear({
          codigo: f.codigo,
          nombre: f.nombre,
          descripcion: f.descripcion,
          permisos: f.permisos,
          activo: f.activo,
        });

    obs.subscribe({
      next: (doc) => {
        this.saving.set(false);
        this.msg.set(sel ? 'Rol actualizado' : 'Rol creado');
        this.mostrarNuevo.set(false);
        this.cargar();
        this.seleccionar(doc);
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error guardando rol');
      },
    });
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
        this.msg.set(r.message);
        this.seleccionado.set(null);
        this.cargar();
      },
      error: (e) => this.msg.set(e?.error?.message || 'No se pudo eliminar'),
    });
  }

  async reiniciar(): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Restaurar roles del sistema',
      message: 'Restaura permisos por defecto de Administrador, Cajero, Instructor, etc.',
      confirmLabel: 'Restaurar',
      variant: 'warn',
    });
    if (!ok) return;

    this.svc.reiniciarSistema().subscribe({
      next: (r) => {
        this.msg.set(r.message);
        this.cargar();
      },
      error: (e) => this.msg.set(e?.error?.message || 'Error al restaurar'),
    });
  }
}
