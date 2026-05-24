import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';

interface MenuLink {
  kind: 'link';
  label: string;
  icon: string;
  path: string;
  iconTone?: string;
  gestionOnly?: boolean;
  /** Título de sección dentro de un grupo (solo en children) */
  section?: string;
  adminOnly?: boolean;
  /** Activo en cualquier /rrhh/catalogos/… */
  catalogosMatch?: boolean;
}

interface MenuGroup {
  kind: 'group';
  label: string;
  icon: string;
  iconTone?: string;
  children: MenuLink[];
  adminOnly?: boolean;
  gestionOnly?: boolean;
}

type MenuEntry = MenuLink | MenuGroup;

@Component({
  selector: 'argo-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  collapsed = signal(false);
  /** Acordeón: solo abierto si el usuario lo abre o está en esa sección de la ruta */
  groupAbierto = signal<Record<string, boolean>>({});

  user = computed(() => this.auth.user());
  isAdmin = computed(() => {
    const r = String(this.auth.user()?.rol || '').toLowerCase();
    return r === 'admin' || r.includes('admin');
  });

  puedeGestion = computed(() => {
    const r = String(this.auth.user()?.rol || '').toLowerCase();
    if (r.includes('admin') || r.includes('rec') || r.includes('caj')) return true;
    return r === 'usuario';
  });

  userLabel = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    const name = `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim();
    return name || u.username;
  });

  welcomeName = computed(() => {
    const u = this.auth.user();
    if (!u) return 'Usuario';
    const rol = String(u.rol || '').toLowerCase();
    if (rol.includes('admin')) return 'Administrador';
    const name = this.userLabel();
    return name || u.username || 'Usuario';
  });

  rolLabel = computed(() => {
    const r = String(this.auth.user()?.rol || '').toLowerCase();
    if (r.includes('admin')) return 'Administrador';
    if (r.includes('caj')) return 'Cajero';
    if (r.includes('rec')) return 'Recepción';
    if (r.includes('inst')) return 'Instructor';
    return this.auth.user()?.rol || 'Usuario';
  });

  private readonly menuAll: MenuEntry[] = [
    { kind: 'link', label: 'Dashboard', icon: '◆', path: '/app/dashboard', iconTone: 'violet' },
    { kind: 'link', label: 'Alumnos', icon: '◉', path: '/app/alumnos', iconTone: 'cyan' },
    { kind: 'link', label: 'Programas', icon: '▤', path: '/app/programas', iconTone: 'blue', gestionOnly: true },
    { kind: 'link', label: 'Servicios', icon: '◇', path: '/app/servicios', iconTone: 'teal', gestionOnly: true },
    { kind: 'link', label: 'Facturación', icon: '$', path: '/app/facturacion', iconTone: 'emerald' },
    { kind: 'link', label: 'Instructores', icon: '◈', path: '/app/instructores', iconTone: 'orange' },
    {
      kind: 'group',
      label: 'Flujo de Caja',
      icon: '⇅',
      iconTone: 'amber',
      children: [
        {
          kind: 'link',
          label: 'Resumen del día',
          path: '/app/caja',
          icon: '⌂',
          iconTone: 'amber',
          section: 'TURNO',
        },
        {
          kind: 'link',
          label: 'Cobros pendientes',
          path: '/app/cobros-pendientes',
          icon: '◉',
          iconTone: 'cyan',
        },
        {
          kind: 'link',
          label: 'Todos los ingresos',
          path: '/app/caja/ingresos-todos',
          icon: '$',
          iconTone: 'emerald',
          section: 'ADMIN',
          adminOnly: true,
        },
        {
          kind: 'link',
          label: 'Todos los egresos',
          path: '/app/caja/egresos-todos',
          icon: '⇣',
          iconTone: 'rose',
          adminOnly: true,
        },
      ],
    },
    {
      kind: 'group',
      label: 'RRHH',
      icon: '👥',
      iconTone: 'rose',
      gestionOnly: true,
      children: [
        { kind: 'link', label: 'Inicio y guía', path: '/app/rrhh/inicio', icon: '⌂', iconTone: 'rose', section: 'GENERAL' },
        { kind: 'link', label: 'Empleados', path: '/app/rrhh/empleados', icon: '◉', iconTone: 'cyan', section: 'PERSONAL' },
        { kind: 'link', label: 'Contratos', path: '/app/rrhh/contratos', icon: '▤', iconTone: 'indigo' },
        {
          kind: 'link',
          label: 'Cargos y seguridad social',
          path: '/app/rrhh/catalogos/cargos',
          icon: '▦',
          iconTone: 'blue',
          section: 'CATÁLOGOS',
          catalogosMatch: true,
        },
        { kind: 'link', label: 'Liquidación', path: '/app/rrhh/nomina', icon: '₱', iconTone: 'emerald', section: 'NÓMINA' },
        { kind: 'link', label: 'Novedades', path: '/app/rrhh/novedades', icon: '▥', iconTone: 'pink' },
        {
          kind: 'link',
          label: 'Empresa (NIT)',
          path: '/app/configuracion/recibos',
          icon: '▤',
          iconTone: 'teal',
          section: 'CONFIGURACIÓN',
        },
        {
          kind: 'link',
          label: 'Parámetros legales',
          path: '/app/configuracion/nomina',
          icon: '％',
          iconTone: 'amber',
        },
      ],
    },
    { kind: 'link', label: 'Vehículos', icon: '◐', path: '/app/vehiculos', iconTone: 'pink' },
    {
      kind: 'group',
      label: 'Configuración',
      icon: '⚙',
      iconTone: 'indigo',
      adminOnly: true,
      children: [
        { kind: 'link', label: 'Usuarios', path: '/app/configuracion/usuarios', icon: '◎', iconTone: 'purple' },
        { kind: 'link', label: 'Catálogos', path: '/app/configuracion/catalogos', icon: '▦', iconTone: 'cyan' },
        { kind: 'link', label: 'Empresa y comprobantes', path: '/app/configuracion/recibos', icon: '▤', iconTone: 'blue' },
        { kind: 'link', label: 'Parámetros nómina', path: '/app/configuracion/nomina', icon: '％', iconTone: 'amber' },
        { kind: 'link', label: 'Config. Certificados', path: '/app/configuracion/certificados', icon: '▣', iconTone: 'violet' },
        { kind: 'link', label: 'Requisitos documentos', path: '/app/configuracion/requisitos-documentos', icon: '▥', iconTone: 'teal' },
        { kind: 'link', label: 'Auditoría', path: '/app/configuracion/auditoria', icon: '◉', iconTone: 'rose' },
      ],
    },
  ];

  /** Lista plana para el menú (evita Signal en *ngFor). */
  get menuItems(): MenuEntry[] {
    return this.menuAll.filter((m) => {
      if (m.kind === 'group') {
        if (m.adminOnly && !this.isAdmin()) return false;
        if (m.gestionOnly && !this.puedeGestion()) return false;
        return true;
      }
      if (m.gestionOnly && !this.puedeGestion()) return false;
      return true;
    });
  }

  trackMenu(m: MenuEntry): string {
    return m.kind === 'link' ? m.path : m.label;
  }

  constructor() {
    this.syncMenuGroupsFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncMenuGroupsFromUrl(this.router.url));
  }

  /** Abre el grupo solo cuando la ruta actual pertenece a esa sección */
  private syncMenuGroupsFromUrl(url: string) {
    const u = url.split('?')[0];
    const patch: Record<string, boolean> = { RRHH: false, Configuración: false, 'Flujo de Caja': false };

    if (u.includes('/caja') || u.includes('/cobros-pendientes')) {
      patch['Flujo de Caja'] = true;
    }

    if (
      u.includes('/rrhh') ||
      u.includes('/configuracion/recibos') ||
      u.includes('/configuracion/nomina')
    ) {
      patch['RRHH'] = true;
    }

    if (
      u.includes('/configuracion/usuarios') ||
      u.includes('/configuracion/catalogos') ||
      u.includes('/configuracion/certificados') ||
      u.includes('/configuracion/requisitos-documentos') ||
      u.includes('/configuracion/auditoria')
    ) {
      patch['Configuración'] = true;
    }

    this.groupAbierto.set(patch);
  }

  toggle() { this.collapsed.update((v) => !v); }

  isGroupOpen(label: string): boolean {
    return this.groupAbierto()[label] === true;
  }

  toggleGroup(label: string, children: MenuLink[], ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (this.collapsed()) {
      const first = children[0];
      if (first) this.router.navigateByUrl(first.path);
      return;
    }
    this.groupAbierto.update((g) => ({ ...g, [label]: !this.isGroupOpen(label) }));
  }

  isRrhhGroup(label: string): boolean {
    return label === 'RRHH';
  }

  isCajaGroup(label: string): boolean {
    return label === 'Flujo de Caja';
  }

  rrhhGroupActive(): boolean {
    const u = this.router.url.split('?')[0];
    return (
      u.includes('/rrhh') ||
      u.includes('/configuracion/recibos') ||
      u.includes('/configuracion/nomina')
    );
  }

  cajaGroupActive(): boolean {
    const u = this.router.url.split('?')[0];
    return u.includes('/caja') || u.includes('/cobros-pendientes');
  }

  subLinkActive(link: MenuLink): boolean {
    const url = this.router.url.split('?')[0];
    if (link.path === '/app/caja') {
      return url === '/app/caja' || url === '/app/caja/';
    }
    if (link.catalogosMatch) return url.includes('/rrhh/catalogos');
    if (link.path === '/app/rrhh/inicio') {
      return url === link.path || url === '/app/rrhh' || url === '/app/rrhh/';
    }
    return url === link.path || url.startsWith(`${link.path}/`);
  }

  logout() { this.auth.logout(); this.router.navigateByUrl('/login'); }

  iconClass(tone?: string): string {
    return tone ? `icon-cap tone-${tone}` : 'icon-cap tone-slate';
  }

  capRol(rol?: string): string {
    const r = String(rol ?? '').toLowerCase();
    if (r.includes('admin')) return 'cap cap-purple cap-sm';
    if (r.includes('caj')) return 'cap cap-emerald cap-sm';
    if (r.includes('rec')) return 'cap cap-cyan cap-sm';
    return 'cap cap-slate cap-sm';
  }
}
