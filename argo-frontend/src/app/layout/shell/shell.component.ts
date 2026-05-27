import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { forkJoin, interval, of } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { CertificadoJornadaAlertService } from '../../core/services/certificado-jornada-alert.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { JornadaCapService } from '../../core/services/jornada-cap.service';
import { JornadaEnProcesoAlertService } from '../../core/services/jornada-en-proceso-alert.service';
import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import { PermisoService } from '../../core/services/permiso.service';
import { AlarmaService } from '../../core/services/alarma.service';
import { VehiculoDocsAlertService } from '../../core/services/vehiculo-docs-alert.service';
import { VehiculoDocsFaltantesAlertService } from '../../core/services/vehiculo-docs-faltantes-alert.service';
import { VehiculoInspeccionAlertService } from '../../core/services/vehiculo-inspeccion-alert.service';
import { VehiculoService } from '../../core/services/vehiculo.service';
import { InspeccionVehiculoService } from '../../core/services/inspeccion-vehiculo.service';
import { EmpleadoDocsAlertService } from '../../core/services/empleado-docs-alert.service';
import { EmpleadoDocsFaltantesAlertService } from '../../core/services/empleado-docs-faltantes-alert.service';
import { EmpleadoService } from '../../core/services/empleado.service';
import { CajaCerradaBannerComponent } from '../../features/caja/caja-cerrada-banner.component';
import { CertificadoJornadaBannerComponent } from '../../features/jornadas/certificado-jornada-banner.component';
import { JornadaEnProcesoBannerComponent } from '../../features/jornadas/jornada-en-proceso-banner.component';
import { JornadaLiveToastComponent } from '../../features/jornadas/jornada-live-toast.component';
import { VehiculoDocsVencimientoBannerComponent } from '../../features/vehiculos/vehiculo-docs-vencimiento-banner.component';
import { VehiculoDocsFaltantesBannerComponent } from '../../features/vehiculos/vehiculo-docs-faltantes-banner.component';
import { VehiculoInspeccionBannerComponent } from '../../features/vehiculos/vehiculo-inspeccion-banner.component';
import { EmpleadoDocsVencimientoBannerComponent } from '../../features/rrhh/empleado-docs-vencimiento-banner.component';
import { EmpleadoDocsFaltantesBannerComponent } from '../../features/rrhh/empleado-docs-faltantes-banner.component';

interface MenuLink {
  kind: 'link';
  label: string;
  icon: string;
  path: string;
  iconTone?: string;
  gestionOnly?: boolean;
  /** Permiso requerido para ver el ítem */
  permiso?: string | string[];
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
  permiso?: string | string[];
}

type MenuEntry = MenuLink | MenuGroup;

@Component({
  selector: 'argo-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CajaCerradaBannerComponent, CertificadoJornadaBannerComponent, JornadaEnProcesoBannerComponent, JornadaLiveToastComponent, VehiculoDocsVencimientoBannerComponent, VehiculoDocsFaltantesBannerComponent, VehiculoInspeccionBannerComponent, EmpleadoDocsVencimientoBannerComponent, EmpleadoDocsFaltantesBannerComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private auth = inject(AuthService);
  private permisos = inject(PermisoService);
  private alarmas = inject(AlarmaService);
  private router = inject(Router);
  private certAlertSvc = inject(CertificadoJornadaAlertService);
  private certSvc = inject(CertificadoService);
  private jornadaSvc = inject(JornadaCapService);
  private liveSync = inject(JornadaLiveSyncService);
  private jornadaProcesoAlert = inject(JornadaEnProcesoAlertService);
  private vehiculoDocsAlert = inject(VehiculoDocsAlertService);
  private vehiculoDocsFaltantesAlert = inject(VehiculoDocsFaltantesAlertService);
  private vehiculoInspeccionAlert = inject(VehiculoInspeccionAlertService);
  private empleadoSvc = inject(EmpleadoService);
  private empleadoDocsAlert = inject(EmpleadoDocsAlertService);
  private empleadoDocsFaltantesAlert = inject(EmpleadoDocsFaltantesAlertService);
  private vehiculoSvc = inject(VehiculoService);
  private inspeccionSvc = inject(InspeccionVehiculoService);
  readonly cajaEstado = inject(CajaEstadoService);

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
    const u = this.auth.user();
    if (u?.rolNombre) return u.rolNombre;
    const r = String(u?.rol || '').toLowerCase();
    if (r.includes('admin')) return 'Administrador';
    if (r.includes('caj')) return 'Cajero';
    if (r.includes('rec')) return 'Recepción';
    if (r.includes('inst')) return 'Instructor';
    return u?.rol || 'Usuario';
  });

  /** Usuarios con permiso de caja del turno deben abrir caja personal. */
  mostrarAlertaCaja = computed(() => this.alarmas.tiene('alarmas.caja.cerrada'));

  /** Usuarios que emiten o gestionan certificados: aviso parpadeante al generarse uno nuevo. */
  mostrarAlertaCertificado = computed(() => this.alarmas.tiene('alarmas.jornadas.certificado_nuevo'));

  /** Toast efímero (3 s) cuando se crean clases/jornadas. */
  mostrarToastJornadaLive = computed(() => this.alarmas.tiene('alarmas.jornadas.live_toast'));

  /** Alarma persistente de jornada(s) EN PROCESO hoy. */
  mostrarAlarmaJornadaProceso = computed(() => this.alarmas.tiene('alarmas.jornadas.en_proceso'));

  /** Alerta roja de vencimiento de papeles de vehículos. */
  mostrarAlertaDocsVehiculos = computed(() => this.alarmas.tiene('alarmas.vehiculos.docs_vencidos'));

  /** Alerta de documentos requeridos sin registrar en vehículos. */
  mostrarAlertaDocsFaltantesVehiculos = computed(() => this.alarmas.tiene('alarmas.vehiculos.docs_faltantes'));

  mostrarAlertaInspeccionVehiculos = computed(() => this.alarmas.tiene('alarmas.vehiculos.inspeccion_pendiente'));

  mostrarAlertaDocsEmpleados = computed(() => this.alarmas.tiene('alarmas.empleados.docs_vencidos'));

  mostrarAlertaDocsFaltantesEmpleados = computed(() => this.alarmas.tiene('alarmas.empleados.docs_faltantes'));

  private readonly menuAll: MenuEntry[] = [
    { kind: 'link', label: 'Dashboard', icon: '◆', path: '/app/dashboard', iconTone: 'violet', permiso: 'dashboard' },
    {
      kind: 'link',
      label: 'Alumnos',
      icon: '◉',
      path: '/app/alumnos',
      iconTone: 'cyan',
      permiso: ['alumnos.ver', 'alumnos.gestionar'],
    },
    {
      kind: 'link',
      label: 'Programas',
      icon: '▤',
      path: '/app/programas',
      iconTone: 'blue',
      permiso: ['programas.ver', 'programas.gestionar', 'programas.agregar'],
    },
    {
      kind: 'link',
      label: 'Servicios',
      icon: '◇',
      path: '/app/servicios',
      iconTone: 'teal',
      permiso: ['servicios.ver', 'servicios.gestionar'],
    },
    {
      kind: 'group',
      label: 'Jornadas Cap.',
      icon: '⛺',
      iconTone: 'orange',
      permiso: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar'],
      children: [
        {
          kind: 'link',
          label: 'Contratos',
          path: '/app/contratos',
          icon: '▦',
          iconTone: 'indigo',
          permiso: ['jornadas.ver', 'jornadas.gestionar'],
        },
        {
          kind: 'link',
          label: 'Jornadas en proceso',
          path: '/app/jornadas/en-proceso',
          icon: '⛺',
          iconTone: 'emerald',
          permiso: ['jornadas.ver', 'jornadas.gestionar'],
        },
        {
          kind: 'link',
          label: 'Clases de hoy',
          path: '/app/jornadas/clases-hoy',
          icon: '◷',
          iconTone: 'cyan',
          permiso: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar'],
        },
        {
          kind: 'link',
          label: 'Alumnos jornada',
          path: '/app/jornadas/alumnos',
          icon: '◉',
          iconTone: 'cyan',
          permiso: ['alumnos.ver', 'alumnos.gestionar', 'jornadas.ver'],
        },
        {
          kind: 'link',
          label: 'Clase en carpa',
          path: '/app/jornadas/instructor',
          icon: '◈',
          iconTone: 'amber',
          permiso: ['jornadas.operar', 'jornadas.gestionar'],
        },
        {
          kind: 'link',
          label: 'Certificados',
          path: '/app/jornadas/certificados',
          icon: '▣',
          iconTone: 'violet',
          permiso: ['jornadas.ver', 'jornadas.gestionar'],
        },
      ],
    },
    { kind: 'link', label: 'Facturación', icon: '$', path: '/app/facturacion', iconTone: 'emerald', permiso: 'facturacion' },
    { kind: 'link', label: 'Instructores', icon: '◈', path: '/app/instructores', iconTone: 'orange', permiso: 'instructores' },
    {
      kind: 'group',
      label: 'Flujo de Caja',
      icon: '⇅',
      iconTone: 'amber',
      permiso: ['caja.turno', 'caja.cobros', 'caja.admin'],
      children: [
        {
          kind: 'link',
          label: 'Resumen del día',
          path: '/app/caja',
          icon: '⌂',
          iconTone: 'amber',
          section: 'TURNO',
          permiso: 'caja.turno',
        },
        {
          kind: 'link',
          label: 'Cobros pendientes',
          path: '/app/cobros-pendientes',
          icon: '◉',
          iconTone: 'cyan',
          permiso: ['caja.cobros', 'caja.turno'],
        },
        {
          kind: 'link',
          label: 'Cierres',
          path: '/app/cierres',
          icon: '▣',
          iconTone: 'indigo',
          section: 'ADMIN',
          permiso: 'caja.admin',
        },
        {
          kind: 'link',
          label: 'Cierre general',
          path: '/app/cierre-general',
          icon: '⊞',
          iconTone: 'amber',
          section: 'ADMIN',
          permiso: 'caja.admin',
        },
        {
          kind: 'link',
          label: 'Todos los ingresos',
          path: '/app/caja/ingresos-todos',
          icon: '$',
          iconTone: 'emerald',
          section: 'ADMIN',
          permiso: 'caja.admin',
        },
        {
          kind: 'link',
          label: 'Todos los egresos',
          path: '/app/caja/egresos-todos',
          icon: '⇣',
          iconTone: 'rose',
          permiso: 'caja.admin',
        },
        {
          kind: 'link',
          label: 'Descuadres de caja',
          path: '/app/caja/descuadres',
          icon: '⚠',
          iconTone: 'amber',
          section: 'ADMIN',
          permiso: 'caja.admin',
        },
      ],
    },
    {
      kind: 'group',
      label: 'RRHH',
      icon: '👥',
      iconTone: 'rose',
      permiso: 'rrhh',
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
    { kind: 'link', label: 'Vehículos', icon: '◐', path: '/app/vehiculos', iconTone: 'pink', permiso: 'vehiculos' },
    {
      kind: 'group',
      label: 'Configuración',
      icon: '⚙',
      iconTone: 'indigo',
      permiso: [
        'config.usuarios',
        'config.roles',
        'config.catalogos',
        'config.recibos',
        'config.nomina',
        'config.certificados',
        'config.requisitos',
        'config.auditoria',
      ],
      children: [
        {
          kind: 'link',
          label: 'Usuarios',
          path: '/app/configuracion/usuarios',
          icon: '◎',
          iconTone: 'purple',
          permiso: 'config.usuarios',
        },
        {
          kind: 'link',
          label: 'Roles, permisos y alarmas',
          path: '/app/configuracion/roles',
          icon: '◈',
          iconTone: 'violet',
          permiso: 'config.roles',
        },
        {
          kind: 'link',
          label: 'Catálogos',
          path: '/app/configuracion/catalogos',
          icon: '▦',
          iconTone: 'cyan',
          permiso: 'config.catalogos',
        },
        {
          kind: 'link',
          label: 'Empresa y comprobantes',
          path: '/app/configuracion/recibos',
          icon: '▤',
          iconTone: 'blue',
          permiso: 'config.recibos',
        },
        {
          kind: 'link',
          label: 'Parámetros nómina',
          path: '/app/configuracion/nomina',
          icon: '％',
          iconTone: 'amber',
          permiso: 'config.nomina',
        },
        {
          kind: 'link',
          label: 'Config. Certificados',
          path: '/app/configuracion/certificados',
          icon: '▣',
          iconTone: 'violet',
          permiso: 'config.certificados',
        },
        {
          kind: 'link',
          label: 'Requisitos alumnos',
          path: '/app/configuracion/requisitos-documentos-alumnos',
          icon: '▥',
          iconTone: 'teal',
          permiso: 'config.requisitos',
        },
        {
          kind: 'link',
          label: 'Requisitos vehículos',
          path: '/app/configuracion/requisitos-documentos-vehiculos',
          icon: '▥',
          iconTone: 'pink',
          permiso: 'config.requisitos',
        },
        {
          kind: 'link',
          label: 'Requisitos empleados',
          path: '/app/configuracion/requisitos-documentos-empleados',
          icon: '▥',
          iconTone: 'amber',
          permiso: 'config.requisitos',
        },
        {
          kind: 'link',
          label: 'Formato inspección',
          path: '/app/configuracion/formato-inspeccion-vehiculos',
          icon: '▥',
          iconTone: 'lime',
          permiso: 'config.requisitos',
        },
        {
          kind: 'link',
          label: 'Monitor de recursos',
          path: '/app/configuracion/monitor',
          icon: '◫',
          iconTone: 'cyan',
          permiso: 'config.auditoria',
        },
        {
          kind: 'link',
          label: 'Monitoreo y auditoría',
          path: '/app/configuracion/auditoria',
          icon: '◉',
          iconTone: 'rose',
          permiso: 'config.auditoria',
        },
      ],
    },
  ];

  /** Lista plana para el menú (evita Signal en *ngFor). */
  get menuItems(): MenuEntry[] {
    return this.menuAll
      .map((m) => this.filtrarEntrada(m))
      .filter((m): m is MenuEntry => m != null);
  }

  private filtrarEntrada(m: MenuEntry): MenuEntry | null {
    if (m.kind === 'group') {
      const children = m.children.filter((c) => this.puedeVerItem(c));
      if (!children.length) return null;
      if (m.permiso && !this.permisos.tiene(m.permiso)) {
        if (!children.some((c) => this.puedeVerItem(c))) return null;
      }
      return { ...m, children };
    }
    return this.puedeVerItem(m) ? m : null;
  }

  private puedeVerItem(item: MenuLink): boolean {
    if (item.permiso) return this.permisos.tiene(item.permiso);
    if (item.adminOnly && !this.isAdmin()) return false;
    if (item.gestionOnly && !this.puedeGestion()) return false;
    return true;
  }

  visibleChildren(children: MenuLink[]): MenuLink[] {
    return children.filter((c) => this.puedeVerItem(c));
  }

  trackMenu(m: MenuEntry): string {
    return m.kind === 'link' ? m.path : m.label;
  }

  constructor() {
    this.auth.refreshMe().subscribe({ error: () => undefined });
    this.syncMenuGroupsFromUrl(this.router.url);
    void this.refrescarCajaSiAplica();
    this.iniciarPollCertificados();
    this.iniciarPollJornadasLive();
    this.iniciarPollAlertasVehiculos();
    this.iniciarPollAlertasEmpleados();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.syncMenuGroupsFromUrl(this.router.url);
        void this.refrescarCajaSiAplica();
      });
  }

  private refrescarCajaSiAplica(): void {
    if (this.mostrarAlertaCaja()) {
      void this.cajaEstado.refrescar();
    }
  }

  /** Alertas globales de documentos de vehículos. */
  private iniciarPollAlertasVehiculos(): void {
    const poll = () => {
      if (this.mostrarAlertaDocsVehiculos()) {
        this.vehiculoSvc.alertasDocumentos().subscribe({
          next: (data) => this.vehiculoDocsAlert.actualizar(data),
          error: () => undefined,
        });
      } else {
        this.vehiculoDocsAlert.actualizar(null);
      }

      if (this.mostrarAlertaDocsFaltantesVehiculos()) {
        this.vehiculoSvc.alertasDocumentosFaltantes().subscribe({
          next: (data) => this.vehiculoDocsFaltantesAlert.actualizar(data),
          error: () => undefined,
        });
      } else {
        this.vehiculoDocsFaltantesAlert.actualizar(null);
      }

      if (this.mostrarAlertaInspeccionVehiculos()) {
        this.inspeccionSvc.alertasPendientes().subscribe({
          next: (data) => this.vehiculoInspeccionAlert.actualizar(data),
          error: () => undefined,
        });
      } else {
        this.vehiculoInspeccionAlert.actualizar(null);
      }
    };
    poll();
    interval(60_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => poll());
  }

  /** Alertas globales de documentos de empleados. */
  private iniciarPollAlertasEmpleados(): void {
    const poll = () => {
      if (this.mostrarAlertaDocsEmpleados()) {
        this.empleadoSvc.alertasDocumentos().subscribe({
          next: (data) => this.empleadoDocsAlert.actualizar(data),
          error: () => undefined,
        });
      } else {
        this.empleadoDocsAlert.actualizar(null);
      }

      if (this.mostrarAlertaDocsFaltantesEmpleados()) {
        this.empleadoSvc.alertasDocumentosFaltantes().subscribe({
          next: (data) => this.empleadoDocsFaltantesAlert.actualizar(data),
          error: () => undefined,
        });
      } else {
        this.empleadoDocsFaltantesAlert.actualizar(null);
      }
    };
    poll();
    interval(60_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => poll());
  }

  /** Detecta certificados emitidos recientemente (jornada, curso de pago y demás). */
  private iniciarPollCertificados(): void {
    const poll = (minutosAtras: number, alertarNuevos: boolean) => {
      if (!this.mostrarAlertaCertificado()) return;
      const desde = new Date(Date.now() - minutosAtras * 60 * 1000).toISOString();
      this.certSvc.listarRecientes(desde).subscribe({
        next: (rows) => {
          for (const c of rows || []) {
            if (alertarNuevos) {
              this.certAlertSvc.notificarDesdeRespuesta(c, c.nombreCompleto);
            } else {
              this.certAlertSvc.marcarConocidos([String(c._id)]);
            }
          }
        },
      });
    };
    poll(60, false);
    interval(45000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => poll(3, true));
  }

  /** Actualiza listados admin, toast efímero y alarma EN PROCESO. */
  private iniciarPollJornadasLive(): void {
    const poll = (inicial: boolean) => {
      const pollProceso = this.mostrarAlarmaJornadaProceso();
      forkJoin([
        this.jornadaSvc.listarClases({}),
        this.jornadaSvc.listarJornadas({}),
        pollProceso ? this.jornadaSvc.listarJornadasEnProceso() : of([]),
      ]).subscribe({
        next: ([clases, jornadas, enProceso]) => {
          const clasesRaw = (clases || []) as unknown as Array<Record<string, unknown>>;
          const jornadasRaw = (jornadas || []) as unknown as Array<Record<string, unknown>>;
          if (pollProceso) {
            this.jornadaProcesoAlert.actualizarDesdeListado(
              (enProceso || []) as unknown as Array<Record<string, unknown>>,
            );
          }
          if (inicial) {
            this.liveSync.marcarClasesConocidas(clases.map((c) => c._id));
            this.liveSync.marcarJornadasConocidas(jornadas.map((j) => j._id));
            this.liveSync.sincronizarEstadosClases(clases);
            this.liveSync.marcarPollInicializado();
            return;
          }
          if (this.mostrarToastJornadaLive()) {
            this.liveSync.procesarPoll(clasesRaw, jornadasRaw);
          }
        },
      });
    };

    poll(true);
    interval(12_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (
          this.liveSync.pollEstaListo() &&
          (this.mostrarToastJornadaLive() || this.mostrarAlarmaJornadaProceso())
        ) {
          poll(false);
        }
      });
  }

  /** Abre el grupo solo cuando la ruta actual pertenece a esa sección */
  private syncMenuGroupsFromUrl(url: string) {
    const u = url.split('?')[0];
    const patch: Record<string, boolean> = {
      RRHH: false,
      Configuración: false,
      'Flujo de Caja': false,
      'Jornadas Cap.': false,
    };

    if (u.includes('/caja') || u.includes('/cobros-pendientes')) {
      patch['Flujo de Caja'] = true;
    }

    if (u.includes('/contratos') || u.includes('/jornadas')) {
      patch['Jornadas Cap.'] = true;
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
      u.includes('/configuracion/roles') ||
      u.includes('/configuracion/catalogos') ||
      u.includes('/configuracion/certificados') ||
      u.includes('/configuracion/requisitos-documentos-vehiculos') ||
      u.includes('/configuracion/requisitos-documentos-empleados') ||
      u.includes('/configuracion/requisitos-documentos-alumnos') ||
      u.includes('/configuracion/formato-inspeccion-vehiculos') ||
      u.includes('/configuracion/requisitos-documentos') ||
      u.includes('/configuracion/monitor') ||
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
    return u.includes('/caja') || u.includes('/cobros-pendientes') || u.includes('/cierre-general');
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
