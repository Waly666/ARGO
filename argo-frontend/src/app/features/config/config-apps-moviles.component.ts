import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  APPS_MOVILES,
  AppMovilDef,
  AppMovilId,
  appMovilPorId,
  clavesAlarmasApp,
  clavesPermisosApp,
} from '../../core/constants/catalogos/apps-moviles.catalogo';
import { AuthService } from '../../core/services/auth.service';
import { RolApp, RolAppService } from '../../core/services/rol-app.service';

@Component({
  selector: 'argo-config-apps-moviles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './config-apps-moviles.component.html',
  styleUrls: ['./config-apps-moviles.component.scss'],
})
export class ConfigAppsMovilesComponent implements OnInit {
  private svc = inject(RolAppService);
  private auth = inject(AuthService);

  readonly apps = APPS_MOVILES;

  appId = signal<AppMovilId>('jornadas');
  roles = signal<RolApp[]>([]);
  seleccionado = signal<RolApp | null>(null);
  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  filtroRoles = signal('');

  /** Claves de la app actual que están activas en el rol (edición local). */
  permisosApp = signal<string[]>([]);
  alarmasApp = signal<string[]>([]);

  appActual = computed(() => appMovilPorId(this.appId()));

  rolesFiltrados = computed(() => {
    const q = this.filtroRoles().trim().toLowerCase();
    const list = this.roles();
    if (!q) return list;
    return list.filter((r) => {
      const nombre = String(r.nombre || '').toLowerCase();
      const codigo = String(r.codigo || '').toLowerCase();
      return nombre.includes(q) || codigo.includes(q);
    });
  });

  esAdminSistema = computed(() => {
    const r = this.seleccionado();
    return !!(r?.esSistema && r.codigo === 'admin');
  });

  permisosTotales = computed(() => (this.seleccionado()?.permisos || []).includes('*'));
  alarmasTotales = computed(() => (this.seleccionado()?.alarmas || []).includes('*'));

  bloqueadoEdicion = computed(
    () => this.esAdminSistema() || this.permisosTotales() || this.alarmasTotales(),
  );

  totalPermisosOn = computed(() => this.permisosApp().length);
  totalAlarmasOn = computed(() => this.alarmasApp().length);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (r) => {
        this.roles.set(r || []);
        this.loading.set(false);
        const sel = this.seleccionado();
        if (sel) {
          const actualizado = (r || []).find((x) => x.codigo === sel.codigo);
          if (actualizado) this.seleccionar(actualizado);
        } else if ((r || []).length) {
          const prefer =
            (r || []).find((x) => x.codigo === 'instructor') ||
            (r || []).find((x) => x.codigo === 'cajero') ||
            r![0];
          this.seleccionar(prefer);
        }
      },
      error: (e) => {
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'Error cargando roles');
      },
    });
  }

  setApp(id: AppMovilId): void {
    this.appId.set(id);
    const sel = this.seleccionado();
    if (sel) this.sincronizarDesdeRol(sel, appMovilPorId(id));
  }

  seleccionar(rol: RolApp): void {
    this.seleccionado.set(rol);
    this.msg.set(null);
    this.msgError.set(false);
    this.sincronizarDesdeRol(rol, this.appActual());
  }

  private sincronizarDesdeRol(rol: RolApp, app: AppMovilDef): void {
    const pKeys = clavesPermisosApp(app);
    const aKeys = clavesAlarmasApp(app);
    const p = rol.permisos || [];
    const a = rol.alarmas || [];
    const allP = p.includes('*');
    const allA = a.includes('*');
    this.permisosApp.set(allP ? [...pKeys] : pKeys.filter((k) => p.includes(k)));
    this.alarmasApp.set(allA ? [...aKeys] : aKeys.filter((k) => a.includes(k)));
  }

  tienePermiso(key: string): boolean {
    if (this.esAdminSistema() || this.permisosTotales()) return true;
    return this.permisosApp().includes(key);
  }

  tieneAlarma(key: string): boolean {
    if (this.esAdminSistema() || this.alarmasTotales()) return true;
    return this.alarmasApp().includes(key);
  }

  togglePermiso(key: string): void {
    if (this.bloqueadoEdicion()) return;
    this.permisosApp.update((list) =>
      list.includes(key) ? list.filter((x) => x !== key) : [...list, key],
    );
  }

  toggleAlarma(key: string): void {
    if (this.bloqueadoEdicion()) return;
    this.alarmasApp.update((list) =>
      list.includes(key) ? list.filter((x) => x !== key) : [...list, key],
    );
  }

  marcarTodosPermisos(on: boolean): void {
    if (this.bloqueadoEdicion()) return;
    this.permisosApp.set(on ? [...clavesPermisosApp(this.appActual())] : []);
  }

  marcarTodasAlarmas(on: boolean): void {
    if (this.bloqueadoEdicion()) return;
    this.alarmasApp.set(on ? [...clavesAlarmasApp(this.appActual())] : []);
  }

  detalleAppRol(rol: RolApp, app: AppMovilDef): string {
    const pKeys = clavesPermisosApp(app);
    const aKeys = clavesAlarmasApp(app);
    const p = rol.permisos || [];
    const a = rol.alarmas || [];
    const pn = p.includes('*') ? pKeys.length : pKeys.filter((k) => p.includes(k)).length;
    const an = a.includes('*') ? aKeys.length : aKeys.filter((k) => a.includes(k)).length;
    return `${pn}/${pKeys.length} · ${an}/${aKeys.length}`;
  }

  dotRol(rol: RolApp): string {
    const c = String(rol.codigo || '').toLowerCase();
    if (c === 'admin') return 'tone-purple';
    if (c === 'cajero') return 'tone-emerald';
    if (c === 'instructor') return 'tone-teal';
    if (c === 'recepcion') return 'tone-cyan';
    return 'tone-slate';
  }

  guardar(): void {
    const sel = this.seleccionado();
    if (!sel) return;
    if (this.bloqueadoEdicion()) {
      this.msgError.set(true);
      this.msg.set(
        this.esAdminSistema() || this.permisosTotales()
          ? 'Este rol tiene acceso total (*). Ajústelo en Roles, permisos y alarmas si necesita quitar el comodín.'
          : 'Este rol tiene todas las alarmas (*). Ajústelo en Roles, permisos y alarmas.',
      );
      return;
    }

    const app = this.appActual();
    const pKeys = new Set(clavesPermisosApp(app));
    const aKeys = new Set(clavesAlarmasApp(app));

    let permisos = [...(sel.permisos || [])].filter((k) => k !== '*' && !pKeys.has(k));
    for (const k of this.permisosApp()) {
      if (!permisos.includes(k)) permisos.push(k);
    }

    let alarmas = [...(sel.alarmas || [])].filter((k) => k !== '*' && !aKeys.has(k));
    for (const k of this.alarmasApp()) {
      if (!alarmas.includes(k)) alarmas.push(k);
    }

    if (permisos.length && !permisos.includes('dashboard')) {
      permisos = ['dashboard', ...permisos];
    }

    this.saving.set(true);
    this.msg.set(null);
    this.msgError.set(false);

    this.svc
      .actualizar(sel.codigo, {
        nombre: sel.nombre,
        descripcion: sel.descripcion,
        permisos,
        alarmas,
        activo: sel.activo !== false,
      })
      .subscribe({
        next: (doc) => {
          this.saving.set(false);
          let texto = `App «${app.label}» · rol «${doc.codigo}» guardado (${this.permisosApp().length} permisos, ${this.alarmasApp().length} alarmas de esta app).`;
          const rolUsuario = String(this.auth.user()?.rol || '').toLowerCase();
          const esMiRol = rolUsuario === String(doc.codigo || '').toLowerCase();
          this.auth.refreshMe().subscribe({
            next: () => {
              texto += esMiRol
                ? ' Su sesión ya se actualizó.'
                : ' Los usuarios con ese rol lo verán al reiniciar la app o en unos segundos.';
              this.msg.set(texto);
            },
            error: () => {
              this.msg.set(texto);
            },
          });
          this.cargar();
          this.seleccionar(doc);
        },
        error: (e) => {
          this.saving.set(false);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'Error guardando');
        },
      });
  }
}
