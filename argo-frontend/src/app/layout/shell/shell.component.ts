import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { forkJoin, interval, of } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { rutaAccesible } from '../../core/utils/auth-routes.util';
import { SedeService, SedeDto } from '../../core/services/sede.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { CajaAperturaAlertService } from '../../core/services/caja-apertura-alert.service';
import { CertificadoJornadaAlertService } from '../../core/services/certificado-jornada-alert.service';
import { CertificadoVencimientoAlertService } from '../../core/services/certificado-vencimiento-alert.service';
import { CertificadoVencidoAlertService } from '../../core/services/certificado-vencido-alert.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { JornadaCapService } from '../../core/services/jornada-cap.service';
import { JornadaEnProcesoAlertService } from '../../core/services/jornada-en-proceso-alert.service';
import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import { PermisoService } from '../../core/services/permiso.service';
import { AlarmaService } from '../../core/services/alarma.service';
import { AlertasRuntimeService } from '../../core/services/alertas-runtime.service';
import { VehiculoDocsAlertService } from '../../core/services/vehiculo-docs-alert.service';
import { VehiculoDocsFaltantesAlertService } from '../../core/services/vehiculo-docs-faltantes-alert.service';
import { VehiculoInspeccionAlertService } from '../../core/services/vehiculo-inspeccion-alert.service';
import { VehiculoService } from '../../core/services/vehiculo.service';
import { InspeccionVehiculoService } from '../../core/services/inspeccion-vehiculo.service';
import { EmpleadoDocsAlertService } from '../../core/services/empleado-docs-alert.service';
import { EmpleadoDocsFaltantesAlertService } from '../../core/services/empleado-docs-faltantes-alert.service';
import { EmpleadoService } from '../../core/services/empleado.service';
import { ProgramacionCeaPendienteAlertService } from '../../core/services/programacion-cea-pendiente-alert.service';
import { ProgramacionCeaClaseCreadoAlertService } from '../../core/services/programacion-cea-clase-creado-alert.service';
import { ProgramacionCeaClaseProximaAlertService } from '../../core/services/programacion-cea-clase-proxima-alert.service';
import { ProgramacionCeaService } from '../../core/services/programacion-cea.service';
import { InstructorPortalAlertService } from '../../core/services/instructor-portal-alert.service';
import { InstructorPortalService } from '../../core/services/instructor-portal.service';
import { CajaCerradaBannerComponent } from '../../features/caja/caja-cerrada-banner.component';
import { CajaAbiertaDiasBannerComponent } from '../../features/caja/caja-abierta-dias-banner.component';
import { CertificadoJornadaBannerComponent } from '../../features/jornadas/certificado-jornada-banner.component';
import { MetaAlumnosJornadaBannerComponent } from '../../features/jornadas/meta-alumnos-jornada-banner.component';
import { MetaAlumnosJornadaAlertService } from '../../core/services/meta-alumnos-jornada-alert.service';
import { CertificadoVencimientoBannerComponent } from '../../features/certificados/certificado-vencimiento-banner.component';
import { CertificadoVencidoBannerComponent } from '../../features/certificados/certificado-vencido-banner.component';
import { JornadaEnProcesoBannerComponent } from '../../features/jornadas/jornada-en-proceso-banner.component';
import { JornadaLiveToastComponent } from '../../features/jornadas/jornada-live-toast.component';
import { VehiculoDocsVencimientoBannerComponent } from '../../features/vehiculos/vehiculo-docs-vencimiento-banner.component';
import { VehiculoDocsFaltantesBannerComponent } from '../../features/vehiculos/vehiculo-docs-faltantes-banner.component';
import { VehiculoInspeccionBannerComponent } from '../../features/vehiculos/vehiculo-inspeccion-banner.component';
import { EmpleadoDocsVencimientoBannerComponent } from '../../features/rrhh/empleado-docs-vencimiento-banner.component';
import { EmpleadoDocsFaltantesBannerComponent } from '../../features/rrhh/empleado-docs-faltantes-banner.component';
import { ProgramacionCeaPendienteBannerComponent } from '../../features/programacion-cea/programacion-cea-pendiente-banner.component';
import { ProgramacionCeaClaseCreadoBannerComponent } from '../../features/programacion-cea/programacion-cea-clase-creado-banner.component';
import { ProgramacionCeaClaseProximaBannerComponent } from '../../features/programacion-cea/programacion-cea-clase-proxima-banner.component';
import { InstructorPortalBannerComponent } from '../../features/instructores/instructor-portal-banner.component';
import { ForoMensajeBannerComponent } from '../../features/aula-virtual/foro-mensaje-banner.component';
import { AulaVirtualRegistroBannerComponent } from '../../features/aula-virtual/aula-virtual-registro-banner.component';
import { AulaVirtualMatriculaBannerComponent } from '../../features/aula-virtual/aula-virtual-matricula-banner.component';
import { AulaVirtualAccesoPorVencerBannerComponent } from '../../features/aula-virtual/aula-virtual-acceso-por-vencer-banner.component';
import { ComprobanteHoyBannerComponent } from '../../features/alumnos/comprobante-hoy-banner.component';
import { AulaVirtualAccesoPorVencerAlertService } from '../../core/services/aula-virtual-acceso-por-vencer-alert.service';
import { ForoMensajeAlertService } from '../../core/services/foro-mensaje-alert.service';
import { AulaVirtualPortalAlertService } from '../../core/services/aula-virtual-portal-alert.service';
import { AulaVirtualAdminService } from '../../core/services/aula-virtual-admin.service';
import { ChatService } from '../../core/services/chat.service';
import { ChatMensajeAlertService } from '../../core/services/chat-mensaje-alert.service';
import { ChatPanelComponent } from '../../features/chat/chat-panel.component';
import { ChatMensajeBannerComponent } from '../../features/chat/chat-mensaje-banner.component';
import { CambiarPasswordModalComponent } from '../../shared/cambiar-password-modal/cambiar-password-modal.component';
import {
  ComprobanteHoyAlertService,
  ComprobanteHoyTipo,
} from '../../core/services/comprobante-hoy-alert.service';
import { AlertaPagoAlumnoService } from '../../core/services/alerta-pago-alumno.service';
import { AlertaPagoAlumnoBannerComponent } from '../../features/alumnos/alerta-pago-alumno-banner.component';
import { AlumnoService } from '../../core/services/alumno.service';
import { AutorizacionPendientesAlertService } from '../../core/services/autorizacion-pendientes-alert.service';
import { AutorizacionAlertService } from '../../core/services/autorizacion-alert.service';
import {
  AutorizacionPendienteBannerComponent,
  AutorizacionResueltaBannerComponent,
} from '../../features/config/autorizacion-alert-banner.component';

interface MenuLink {
  kind: 'link';
  label: string;
  icon: string;
  path: string;
  iconTone?: string;
  /** Query params para routerLink (p. ej. tab en hub CEA) */
  queryParams?: Record<string, string>;
  gestionOnly?: boolean;
  /** Permiso mínimo para la ruta (guard). */
  permiso?: string | string[];
  /** Permiso para mostrar en menú (puede ser más estricto que la ruta). */
  permisoMenu?: string | string[];
  /** Título de sección dentro de un grupo (solo en children planos) */
  section?: string;
  adminOnly?: boolean;
  /**
   * Si se define, el rol del usuario debe coincidir con uno de estos códigos
   * (p. ej. admin | contador). Complementa permiso/permisoMenu.
   */
  rolesMenu?: string[];
  /** Activo en cualquier /rrhh/catalogos/… */
  catalogosMatch?: boolean;
}

interface MenuSubgroup {
  kind: 'subgroup';
  label: string;
  icon?: string;
  iconTone?: string;
  children: MenuLink[];
}

type MenuChild = MenuLink | MenuSubgroup;

interface MenuGroup {
  kind: 'group';
  label: string;
  icon: string;
  iconTone?: string;
  children: MenuChild[];
  adminOnly?: boolean;
  gestionOnly?: boolean;
  permiso?: string | string[];
}

type MenuEntry = MenuLink | MenuGroup;

@Component({
  selector: 'argo-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, CajaCerradaBannerComponent, CajaAbiertaDiasBannerComponent, CertificadoJornadaBannerComponent, MetaAlumnosJornadaBannerComponent, ComprobanteHoyBannerComponent, CertificadoVencimientoBannerComponent, CertificadoVencidoBannerComponent, JornadaEnProcesoBannerComponent, JornadaLiveToastComponent, VehiculoDocsVencimientoBannerComponent, VehiculoDocsFaltantesBannerComponent, VehiculoInspeccionBannerComponent, EmpleadoDocsVencimientoBannerComponent, EmpleadoDocsFaltantesBannerComponent, ProgramacionCeaPendienteBannerComponent, ProgramacionCeaClaseCreadoBannerComponent, ProgramacionCeaClaseProximaBannerComponent, InstructorPortalBannerComponent, ForoMensajeBannerComponent, AulaVirtualRegistroBannerComponent, AulaVirtualMatriculaBannerComponent, AulaVirtualAccesoPorVencerBannerComponent, AlertaPagoAlumnoBannerComponent, ChatPanelComponent, ChatMensajeBannerComponent, AutorizacionPendienteBannerComponent, AutorizacionResueltaBannerComponent, CambiarPasswordModalComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  @ViewChild(CambiarPasswordModalComponent) cambiarPasswordModal?: CambiarPasswordModalComponent;
  private destroyRef = inject(DestroyRef);
  private pollsAlertasIniciados = false;
  private readonly syncPermisosOnFocus = () => {
    if (!this.auth.isAuth()) return;
    this.auth.refreshMe().subscribe({ error: () => undefined });
  };
  private auth = inject(AuthService);
  readonly sedeSvc = inject(SedeService);
  private permisos = inject(PermisoService);
  private alarmas = inject(AlarmaService);
  private router = inject(Router);
  private certAlertSvc = inject(CertificadoJornadaAlertService);
  private metaAlumnosJornadaAlertSvc = inject(MetaAlumnosJornadaAlertService);
  private comprobanteAlertSvc = inject(ComprobanteHoyAlertService);
  private alertasRuntime = inject(AlertasRuntimeService);
  private alumnoSvc = inject(AlumnoService);
  private certVencimientoAlert = inject(CertificadoVencimientoAlertService);
  private certVencidoAlert = inject(CertificadoVencidoAlertService);
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
  private programacionCeaAlert = inject(ProgramacionCeaPendienteAlertService);
  private programacionCeaClaseCreadoAlert = inject(ProgramacionCeaClaseCreadoAlertService);
  private programacionCeaProximaAlert = inject(ProgramacionCeaClaseProximaAlertService);
  private programacionCeaSvc = inject(ProgramacionCeaService);
  private instructorPortalSvc = inject(InstructorPortalService);
  private instructorPortalAlert = inject(InstructorPortalAlertService);
  private foroMensajeAlert = inject(ForoMensajeAlertService);
  private aulaVirtualPortalAlert = inject(AulaVirtualPortalAlertService);
  private aulaVirtualAdminSvc = inject(AulaVirtualAdminService);
  private aulaVirtualAccesoPorVencerAlert = inject(AulaVirtualAccesoPorVencerAlertService);
  readonly chatSvc = inject(ChatService);
  private chatMensajeAlert = inject(ChatMensajeAlertService);
  private alertaPagoSvc = inject(AlertaPagoAlumnoService);
  private vehiculoSvc = inject(VehiculoService);
  private inspeccionSvc = inject(InspeccionVehiculoService);
  readonly cajaEstado = inject(CajaEstadoService);
  private cajaAperturaAlert = inject(CajaAperturaAlertService);
  readonly autorizPendientesAlert = inject(AutorizacionPendientesAlertService);
  private autorizacionAlert = inject(AutorizacionAlertService);

  collapsed = signal(false);
  /** Acordeón: solo abierto si el usuario lo abre o está en esa sección de la ruta */
  groupAbierto = signal<Record<string, boolean>>({});

  user = computed(() => this.auth.user());
  esSoporteMaestro = computed(() => this.auth.isSoporteMaestro());
  sedes = computed((): SedeDto[] => {
    const u = this.auth.user();
    return (u?.sedes as SedeDto[] | undefined) || [];
  });
  /** Admin o permiso sedes.ver_todas: selector si hay varias sedes. */
  puedeFiltrarPorSede = computed(() => {
    const u = this.auth.user();
    if (!u) return false;
    if (u.permisos?.includes('*')) return true;
    const r = String(u.rol || '').toLowerCase();
    if (r === 'admin' || r.includes('admin')) return true;
    return u.permisos?.includes('sedes.ver_todas') === true;
  });
  mostrarFiltroSede = computed(() => this.puedeFiltrarPorSede() && this.sedes().length > 1);
  /** Etiqueta fija: usuario con una sede, o admin con una sola sede en el sistema. */
  mostrarSedeFija = computed(() => {
    if (this.mostrarFiltroSede()) return false;
    return !!this.labelSedeHeader();
  });
  labelSedeHeader = computed((): string => {
    const activa = this.sedeSvc.labelActiva();
    if (this.sedeSvc.idSede() && activa !== 'Sin sede') return activa;
    const lista = this.sedes();
    if (!lista.length) return '';
    const s = lista.find((x) => x.esPrincipal) || lista[0];
    return s ? `${s.nombre}${s.codigo ? ` (${s.codigo})` : ''}` : '';
  });
  isAdmin = computed(() => {
    const r = String(this.auth.user()?.rol || '').toLowerCase();
    return r === 'admin' || r.includes('admin');
  });

  isContador = computed(() => {
    const r = String(this.auth.user()?.rol || '').toLowerCase();
    return r === 'contador' || r.includes('contador') || r.includes('contab');
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
  mostrarAlertaCaja = computed(() => this.alarmaHabilitada('alarmas.caja.cerrada'));

  /** Caja abierta varios días sin cerrar (fallback a claves legacy de cajero). */
  mostrarAlertaCajaAbiertaDias = computed(
    () =>
      this.alarmaHabilitada('alarmas.caja.abierta_dias') ||
      this.alarmaHabilitada('alarmas.caja.cerrada') ||
      this.alarmaHabilitada('alarmas.caja.sin_abrir'),
  );

  /** Usuarios que emiten o gestionan certificados: aviso parpadeante al generarse uno nuevo. */
  mostrarAlertaCertificado = computed(() => this.alarmaHabilitada('alarmas.jornadas.certificado_nuevo'));

  mostrarAlertaCertificadoVencimiento = computed(() =>
    this.alarmaHabilitada('alarmas.certificados.vencimiento'),
  );

  mostrarAlertaCertificadoVencido = computed(() => this.alarmaHabilitada('alarmas.certificados.vencidos'));

  mostrarAlertaComprobanteIngreso = computed(() =>
    this.alarmaHabilitada('alarmas.alumnos.comprobante_ingreso'),
  );

  mostrarAlertaComprobanteEgreso = computed(() =>
    this.alarmaHabilitada('alarmas.alumnos.comprobante_egreso'),
  );

  mostrarAlertaComprobanteFactura = computed(() => this.alarmaHabilitada('alarmas.alumnos.factura'));

  /** Toast efímero (3 s) cuando se crean clases/jornadas. */
  mostrarToastJornadaLive = computed(() => this.alarmaHabilitada('alarmas.jornadas.live_toast'));

  /** Alarma persistente de jornada(s) EN PROCESO hoy. */
  mostrarAlarmaJornadaProceso = computed(() => this.alarmaHabilitada('alarmas.jornadas.en_proceso'));

  /** Alerta roja de vencimiento de papeles de vehículos. */
  mostrarAlertaDocsVehiculos = computed(() => this.alarmaHabilitada('alarmas.vehiculos.docs_vencidos'));

  /** Alerta de documentos requeridos sin registrar en vehículos. */
  mostrarAlertaDocsFaltantesVehiculos = computed(() =>
    this.alarmaHabilitada('alarmas.vehiculos.docs_faltantes'),
  );

  mostrarAlertaInspeccionVehiculos = computed(() =>
    this.alarmaHabilitada('alarmas.vehiculos.inspeccion_pendiente'),
  );

  mostrarAlertaDocsEmpleados = computed(() => this.alarmaHabilitada('alarmas.empleados.docs_vencidos'));

  mostrarAlertaDocsFaltantesEmpleados = computed(() =>
    this.alarmaHabilitada('alarmas.empleados.docs_faltantes'),
  );

  mostrarAlertaProgramacionCea = computed(() =>
    this.alarmaHabilitada('alarmas.programacion_cea.pendiente'),
  );

  puedeVerProgramacionCea = computed(() =>
    this.permisos.tiene(['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar']),
  );

  mostrarAlertaClasesCeaCreado = computed(
    () => this.puedeVerProgramacionCea() && this.alarmaHabilitada('alarmas.alumnos.clases_cea_creado'),
  );

  mostrarAlertaClaseProximaCea = computed(() =>
    this.alarmaHabilitada('alarmas.programacion_cea.clase_proxima'),
  );

  mostrarAlertaInstructorPortal = computed(() =>
    this.CLAVES_INSTRUCTOR_PORTAL.some((k) => this.alarmaHabilitada(k)),
  );

  puedeModerarForo = computed(() =>
    this.permisos.tiene([
      'aula_virtual.foro',
      'aula_virtual.gestionar',
    ]),
  );

  mostrarAlertaForoMensaje = computed(() => this.alarmaHabilitada('alarmas.aula_virtual.foro_mensaje'));

  puedeVerAulaVirtual = computed(() =>
    this.permisos.tiene(['aula_virtual.ver', 'aula_virtual.gestionar']),
  );

  mostrarAlertaRegistroPortal = computed(() =>
    this.alarmaHabilitada('alarmas.aula_virtual.registro_nuevo'),
  );

  mostrarAlertaMatriculaPortal = computed(() =>
    this.alarmaHabilitada('alarmas.aula_virtual.matricula_nueva'),
  );

  mostrarAlertaAccesoPorVencer = computed(() =>
    this.alarmaHabilitada('alarmas.aula_virtual.acceso_por_vencer'),
  );

  mostrarBannerAccesoPorVencer = computed(
    () =>
      this.mostrarAlertaAccesoPorVencer() &&
      this.puedeVerAulaVirtual() &&
      this.aulaVirtualAccesoPorVencerAlert.visible(),
  );

  mostrarBannerRegistroPortal = computed(
    () =>
      this.mostrarAlertaRegistroPortal() &&
      this.puedeVerAulaVirtual() &&
      this.aulaVirtualPortalAlert.registroAlertas().length > 0,
  );

  mostrarBannerMatriculaPortal = computed(
    () =>
      this.mostrarAlertaMatriculaPortal() &&
      this.puedeVerAulaVirtual() &&
      this.aulaVirtualPortalAlert.matriculaAlertas().length > 0,
  );

  mostrarAlertaPagoAlumno = computed(() => this.alarmaHabilitada('alarmas.caja.alerta_pago'));

  mostrarBannerAlertaPagoAlumno = computed(
    () => this.mostrarAlertaPagoAlumno() && this.alertaPagoSvc.visibleBanner(),
  );

  mostrarBannerForoMensaje = computed(
    () =>
      this.mostrarAlertaForoMensaje() &&
      this.puedeModerarForo() &&
      this.foroMensajeAlert.alertas().length > 0,
  );

  mostrarBannerChatMensaje = computed(() => this.chatMensajeAlert.alertas().length > 0);

  mostrarAlertaAutorizacionPendiente = computed(() =>
    this.alarmaHabilitada('alarmas.config.autorizacion_pendiente'),
  );

  mostrarAlertaAutorizacionResuelta = computed(() =>
    this.alarmaHabilitada('alarmas.config.autorizacion_resuelta'),
  );

  mostrarBannerAutorizacionPendiente = computed(
    () =>
      this.mostrarAlertaAutorizacionPendiente() &&
      this.permisos.tiene(['config.autorizaciones', 'config.roles']) &&
      this.autorizacionAlert.pendientesAdmin().length > 0,
  );

  mostrarBannerAutorizacionResuelta = computed(
    () =>
      this.mostrarAlertaAutorizacionResuelta() &&
      this.autorizacionAlert.resueltasMias().length > 0,
  );

  mostrarBannerCertificado = computed(
    () => this.mostrarAlertaCertificado() && this.certAlertSvc.alertas().length > 0,
  );

  mostrarBannerMetaAlumnosJornada = computed(
    () =>
      (this.permisos.tiene('jornadas.operar') || this.permisos.tiene('jornadas.gestionar')) &&
      this.metaAlumnosJornadaAlertSvc.alertas().length > 0,
  );

  mostrarBannerComprobantesHoy = computed(() => {
    if (
      !this.mostrarAlertaComprobanteIngreso() &&
      !this.mostrarAlertaComprobanteEgreso() &&
      !this.mostrarAlertaComprobanteFactura()
    ) {
      return false;
    }
    return this.comprobanteAlertSvc.alertas().some((a) => {
      if (a.tipo === 'ingreso') return this.mostrarAlertaComprobanteIngreso();
      if (a.tipo === 'egreso') return this.mostrarAlertaComprobanteEgreso();
      return this.mostrarAlertaComprobanteFactura();
    });
  });

  mostrarBannerCertificadoVencimiento = computed(
    () => this.mostrarAlertaCertificadoVencimiento() && this.certVencimientoAlert.visible(),
  );

  mostrarBannerCertificadoVencido = computed(
    () => this.mostrarAlertaCertificadoVencido() && this.certVencidoAlert.visible(),
  );

  mostrarFilaCertificadosVencimiento = computed(
    () => this.mostrarBannerCertificadoVencimiento() || this.mostrarBannerCertificadoVencido(),
  );

  mostrarBannerCajaCerrada = computed(
    () =>
      this.mostrarAlertaCaja() &&
      !this.cajaEstado.loading() &&
      this.cajaEstado.abierta() === false &&
      this.cajaEstado.mostrarBannerCerrada(),
  );

  mostrarBannerCajaAbiertaDias = computed(
    () =>
      this.mostrarAlertaCajaAbiertaDias() &&
      !this.cajaEstado.loading() &&
      this.cajaEstado.abierta() === true &&
      this.cajaEstado.diasSinCerrar() >= 1 &&
      this.cajaEstado.mostrarBannerAbiertaDias(),
  );

  mostrarBannerJornadaProceso = computed(
    () => this.mostrarAlarmaJornadaProceso() && this.jornadaProcesoAlert.visible(),
  );

  mostrarBannerDocsVehiculosVencidos = computed(
    () => this.mostrarAlertaDocsVehiculos() && this.vehiculoDocsAlert.visible(),
  );

  mostrarBannerDocsVehiculosFaltantes = computed(
    () => this.mostrarAlertaDocsFaltantesVehiculos() && this.vehiculoDocsFaltantesAlert.visible(),
  );

  mostrarBannerInspeccionVehiculos = computed(
    () => this.mostrarAlertaInspeccionVehiculos() && this.vehiculoInspeccionAlert.visible(),
  );

  mostrarBannerDocsEmpleadosVencidos = computed(
    () => this.mostrarAlertaDocsEmpleados() && this.empleadoDocsAlert.visible(),
  );

  mostrarBannerDocsEmpleadosFaltantes = computed(
    () => this.mostrarAlertaDocsFaltantesEmpleados() && this.empleadoDocsFaltantesAlert.visible(),
  );

  mostrarBannerProgramacionCea = computed(
    () => this.mostrarAlertaProgramacionCea() && this.programacionCeaAlert.visible(),
  );

  mostrarBannerClasesCeaCreado = computed(
    () => this.mostrarAlertaClasesCeaCreado() && this.programacionCeaClaseCreadoAlert.visible(),
  );

  mostrarBannerClaseProximaCea = computed(
    () => this.mostrarAlertaClaseProximaCea() && this.programacionCeaProximaAlert.visible(),
  );

  mostrarBannerInstructorPortal = computed(
    () =>
      this.auth.puedeUsarPortalInstructor() &&
      this.mostrarAlertaInstructorPortal() &&
      this.instructorPortalAlert.hayAlertasActivas(),
  );

  mostrarFilaPapelesVehiculos = computed(() => this.mostrarBannerDocsVehiculosVencidos());

  mostrarFilaEmpleados = computed(() => this.mostrarBannerDocsEmpleadosVencidos());

  mostrarAlarmasCabecera = computed(
    () =>
      this.mostrarBannerCajaCerrada() ||
      this.mostrarBannerCajaAbiertaDias() ||
      this.mostrarBannerCertificado() ||
      this.mostrarBannerMetaAlumnosJornada() ||
      this.mostrarBannerComprobantesHoy() ||
      this.mostrarBannerAlertaPagoAlumno() ||
      this.mostrarBannerDocsVehiculosFaltantes() ||
      this.mostrarBannerDocsEmpleadosFaltantes() ||
      this.mostrarBannerCertificadoVencimiento() ||
      this.mostrarBannerCertificadoVencido() ||
      this.mostrarBannerJornadaProceso() ||
      this.mostrarFilaPapelesVehiculos() ||
      this.mostrarBannerInspeccionVehiculos() ||
      this.mostrarFilaEmpleados() ||
      this.mostrarBannerProgramacionCea() ||
      this.mostrarBannerClasesCeaCreado() ||
      this.mostrarBannerClaseProximaCea() ||
      this.mostrarBannerInstructorPortal() ||
      this.mostrarBannerForoMensaje() ||
      this.mostrarBannerRegistroPortal() ||
      this.mostrarBannerMatriculaPortal() ||
      this.mostrarBannerAccesoPorVencer() ||
      this.mostrarBannerChatMensaje() ||
      this.mostrarBannerAutorizacionPendiente() ||
      this.mostrarBannerAutorizacionResuelta(),
  );

  private readonly menuAll: MenuEntry[] = [
    { kind: 'link', label: 'Dashboard', icon: '◆', path: '/app/dashboard', iconTone: 'violet', permiso: 'dashboard' },
    {
      kind: 'group',
      label: 'Operación del día',
      icon: '☀',
      iconTone: 'amber',
      permiso: [
        'alumnos.ver',
        'alumnos.gestionar',
        'caja.turno',
        'caja.cobros',
        'caja.admin',
        'combos.gestionar',
        'instructores.mi_portal',
        'instructores',
        'rrhh',
        'jornadas.gestionar',
        'jornadas.operar',
        'programacion_cea.operar',
      ],
      children: [
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
          label: 'Cobros pendientes',
          path: '/app/cobros-pendientes',
          icon: '◉',
          iconTone: 'cyan',
          permiso: ['caja.cobros', 'caja.turno'],
        },
        {
          kind: 'subgroup',
          label: 'Mi turno',
          icon: '⌂',
          iconTone: 'amber',
          children: [
            {
              kind: 'link',
              label: 'Resumen del día',
              path: '/app/caja',
              icon: '⌂',
              iconTone: 'amber',
              permiso: 'caja.turno',
            },
            {
              kind: 'link',
              label: 'Combos de cursos',
              icon: '⊞',
              path: '/app/combos',
              iconTone: 'teal',
              permiso: ['combos.gestionar', 'alumnos.pagos', 'alumnos.gestionar'],
            },
            {
              kind: 'link',
              label: 'Terceros',
              path: '/app/caja/terceros',
              icon: '◎',
              iconTone: 'teal',
              permiso: ['caja.turno', 'caja.admin'],
            },
            {
              kind: 'link',
              label: 'Clases CEA pendientes',
              path: '/app/programacion-cea/clases-hoy',
              icon: '◷',
              iconTone: 'cyan',
              permiso: ['caja.turno', 'caja.admin'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Gestores y empresas',
          icon: '◉',
          iconTone: 'cyan',
          children: [
            {
              kind: 'link',
              label: 'Gestores',
              path: '/app/caja/gestores',
              icon: '◉',
              iconTone: 'cyan',
              permiso: ['caja.turno', 'caja.admin'],
            },
            {
              kind: 'link',
              label: 'Empresas',
              path: '/app/caja/empresa',
              icon: '▣',
              iconTone: 'indigo',
              permiso: ['caja.turno', 'caja.admin'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Clases hoy',
          icon: '◷',
          iconTone: 'cyan',
          children: [
            {
              kind: 'link',
              label: 'Instructores',
              icon: '◈',
              path: '/app/instructores',
              queryParams: { vista: 'portal' },
              iconTone: 'rose',
              permiso: [
                'instructores.mi_portal',
                'instructores',
                'rrhh',
                'jornadas.gestionar',
                'jornadas.operar',
                'programacion_cea.operar',
              ],
              permisoMenu: '__instructores_hub__',
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
              label: 'Clases en desarrollo',
              path: '/app/jornadas/clases-en-desarrollo',
              icon: '◎',
              iconTone: 'emerald',
              permiso: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar'],
            },
            {
              kind: 'link',
              label: 'Clases en ejecución',
              path: '/app/jornadas/instructor',
              icon: '◈',
              iconTone: 'amber',
              permiso: ['jornadas.operar', 'jornadas.gestionar'],
            },
          ],
        },
      ],
    },
    {
      kind: 'group',
      label: 'Académico',
      icon: '▦',
      iconTone: 'blue',
      permiso: [
        'programas.ver',
        'programas.gestionar',
        'programas.agregar',
        'servicios.ver',
        'servicios.gestionar',
        'alumnos.certificados',
        'certificados.vencidos',
        'informes.ver',
        'cohortes_academicas.ver',
        'cohortes_academicas.gestionar',
        'cohortes_academicas.operar',
        'aula_virtual.ver',
        'aula_virtual.gestionar',
        'aula_virtual.sitio',
        'aula_virtual.foro',
        'jornadas.ver',
        'jornadas.gestionar',
        'jornadas.operar',
        'jornadas.evaluaciones.ver',
        'jornadas.evaluaciones.gestionar',
        'programacion_cea.ver',
        'programacion_cea.gestionar',
        'programacion_cea.operar',
      ],
      children: [
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
          kind: 'subgroup',
          label: 'Certificados e informes',
          icon: '▣',
          iconTone: 'violet',
          children: [
            {
              kind: 'link',
              label: 'Certificados',
              icon: '▣',
              path: '/app/certificados',
              iconTone: 'violet',
              permiso: 'alumnos.certificados',
            },
            {
              kind: 'link',
              label: 'Certificados Vencidos',
              icon: '⚠',
              path: '/app/certificados/vencidos',
              iconTone: 'red',
              permiso: ['certificados.vencidos', 'alumnos.certificados'],
            },
            {
              kind: 'link',
              label: 'Informes académicos',
              icon: '☰',
              path: '/app/informes',
              iconTone: 'sky',
              permiso: [
                'informes.ver',
                'alumnos.ver',
                'alumnos.gestionar',
                'programas.ver',
                'programas.gestionar',
                'programas.agregar',
                'servicios.ver',
                'servicios.gestionar',
              ],
            },
          ],
        },
        {
          kind: 'link',
          label: 'Cohortes académicas',
          icon: '🎓',
          path: '/app/cohortes',
          iconTone: 'indigo',
          permiso: ['cohortes_academicas.ver', 'cohortes_academicas.gestionar', 'cohortes_academicas.operar'],
        },
        {
          kind: 'subgroup',
          label: 'Aula Virtual',
          icon: '▣',
          iconTone: 'indigo',
          children: [
            {
              kind: 'link',
              label: 'Cursos virtuales',
              icon: '▣',
              path: '/app/aula-virtual',
              iconTone: 'indigo',
              permiso: ['aula_virtual.ver', 'aula_virtual.gestionar'],
            },
            {
              kind: 'link',
              label: 'Editor sitio portal',
              icon: '✎',
              path: '/app/aula-virtual/sitio',
              iconTone: 'indigo',
              permiso: ['aula_virtual.sitio', 'aula_virtual.gestionar'],
            },
            {
              kind: 'link',
              label: 'Blog del portal',
              icon: '📰',
              path: '/app/aula-virtual/blog',
              iconTone: 'indigo',
              permiso: ['aula_virtual.sitio', 'aula_virtual.gestionar'],
            },
            {
              kind: 'link',
              label: 'Galería del portal',
              icon: '📷',
              path: '/app/aula-virtual/galeria',
              iconTone: 'indigo',
              adminOnly: true,
            },
            {
              kind: 'link',
              label: 'Foro de cursos',
              icon: '💬',
              path: '/app/aula-virtual/foro',
              iconTone: 'indigo',
              permiso: ['aula_virtual.foro', 'aula_virtual.gestionar'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Jornadas Cap.',
          icon: '⛺',
          iconTone: 'orange',
          children: [
            {
              kind: 'link',
              label: 'Gestión de jornadas',
              path: '/app/jornadas',
              icon: '⌂',
              iconTone: 'orange',
              permiso: ['jornadas.gestionar', 'jornadas.registrar_alumnos'],
              permisoMenu: ['jornadas.gestionar', 'jornadas.registrar_alumnos'],
            },
            {
              kind: 'link',
              label: 'Contratos',
              path: '/app/contratos',
              icon: '▦',
              iconTone: 'indigo',
              permiso: ['jornadas.ver', 'jornadas.gestionar'],
              permisoMenu: 'jornadas.gestionar',
            },
            {
              kind: 'link',
              label: 'Jornadas en proceso',
              path: '/app/jornadas/en-proceso',
              icon: '⛺',
              iconTone: 'emerald',
              permiso: ['jornadas.ver', 'jornadas.gestionar'],
              permisoMenu: 'jornadas.gestionar',
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
              label: 'Clases en desarrollo',
              path: '/app/jornadas/clases-en-desarrollo',
              icon: '◎',
              iconTone: 'emerald',
              permiso: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar'],
            },
            {
              kind: 'link',
              label: 'Alumnos jornada',
              path: '/app/jornadas/alumnos',
              icon: '◉',
              iconTone: 'cyan',
              permiso: ['alumnos.ver', 'alumnos.gestionar', 'jornadas.ver'],
              permisoMenu: ['alumnos.ver', 'jornadas.gestionar'],
            },
            {
              kind: 'link',
              label: 'Clases en ejecución',
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
              permisoMenu: 'jornadas.gestionar',
            },
            {
              kind: 'link',
              label: 'Informes',
              path: '/app/jornadas/informes',
              icon: '▤',
              iconTone: 'teal',
              permiso: ['jornadas.ver', 'jornadas.gestionar'],
              permisoMenu: 'jornadas.gestionar',
            },
            {
              kind: 'link',
              label: 'Evaluaciones',
              path: '/app/jornadas/evaluaciones',
              icon: '★',
              iconTone: 'amber',
              permiso: ['jornadas.evaluaciones.ver', 'jornadas.evaluaciones.gestionar'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Programación CEA',
          icon: '📅',
          iconTone: 'blue',
          children: [
            {
              kind: 'link',
              label: 'Teoría y taller',
              path: '/app/programacion-cea/clases-grupales',
              icon: '▦',
              iconTone: 'indigo',
              permiso: ['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar'],
            },
            {
              kind: 'link',
              label: 'Práctica en vehículo',
              path: '/app/programacion-cea/clases-practica',
              icon: '◐',
              iconTone: 'cyan',
              permiso: ['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar'],
            },
            {
              kind: 'link',
              label: 'Hub CEA (config / temas)',
              path: '/app/programacion-cea',
              icon: '⚙',
              iconTone: 'slate',
              permiso: ['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar'],
              permisoMenu: 'programacion_cea.gestionar',
            },
            {
              kind: 'link',
              label: 'Clases de hoy',
              path: '/app/programacion-cea/clases-hoy',
              icon: '◷',
              iconTone: 'cyan',
              permiso: ['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar'],
            },
            {
              kind: 'link',
              label: 'Pendientes',
              path: '/app/programacion-cea',
              queryParams: { tab: 'pendientes' },
              icon: '⚠',
              iconTone: 'amber',
              permiso: ['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar'],
              permisoMenu: ['programacion_cea.gestionar', 'programacion_cea.operar'],
            },
          ],
        },
      ],
    },
    {
      kind: 'group',
      label: 'Finanzas',
      icon: '∑',
      iconTone: 'teal',
      permiso: ['contabilidad', 'caja.admin', 'facturacion'],
      children: [
        {
          kind: 'subgroup',
          label: 'Contabilidad',
          icon: '∑',
          iconTone: 'teal',
          children: [
            {
              kind: 'link',
              label: 'Inicio',
              path: '/app/contabilidad/inicio',
              icon: '⌂',
              iconTone: 'teal',
              permiso: 'contabilidad',
            },
            {
              kind: 'link',
              label: 'Ingresos',
              path: '/app/contabilidad/ingresos',
              icon: '↑',
              iconTone: 'emerald',
              permiso: 'contabilidad',
            },
            {
              kind: 'link',
              label: 'Egresos',
              path: '/app/contabilidad/egresos',
              icon: '↓',
              iconTone: 'rose',
              permiso: 'contabilidad',
            },
            {
              kind: 'link',
              label: 'Cuadres de caja',
              path: '/app/contabilidad/cuadres',
              icon: '▣',
              iconTone: 'indigo',
              permiso: 'contabilidad',
            },
            {
              kind: 'link',
              label: 'Cierre general',
              path: '/app/contabilidad/cierre-general',
              icon: '⊞',
              iconTone: 'amber',
              permiso: 'contabilidad',
            },
            {
              kind: 'link',
              label: 'Descuadres',
              path: '/app/contabilidad/descuadres',
              icon: '⚠',
              iconTone: 'amber',
              permiso: 'contabilidad',
            },
            {
              kind: 'link',
              label: 'Pagos en línea',
              path: '/app/contabilidad/pagos-en-linea',
              icon: '🌐',
              iconTone: 'cyan',
              permiso: 'contabilidad',
              rolesMenu: ['admin', 'contador'],
            },
            {
              kind: 'link',
              label: 'Facturación (contabilidad)',
              path: '/app/contabilidad/facturacion',
              icon: '$',
              iconTone: 'emerald',
              permiso: ['contabilidad', 'facturacion'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Facturación y caja',
          icon: '$',
          iconTone: 'emerald',
          children: [
            {
              kind: 'link',
              label: 'Facturación',
              path: '/app/facturacion',
              icon: '$',
              iconTone: 'emerald',
              permiso: 'facturacion',
            },
            {
              kind: 'link',
              label: 'Cierres',
              path: '/app/cierres',
              icon: '▣',
              iconTone: 'indigo',
              permiso: ['caja.admin', 'contabilidad'],
              permisoMenu: ['caja.admin', 'contabilidad'],
              rolesMenu: ['admin', 'contador'],
            },
            {
              kind: 'link',
              label: 'Cierre general (caja)',
              path: '/app/cierre-general',
              icon: '⊞',
              iconTone: 'amber',
              permiso: ['caja.admin', 'contabilidad'],
              permisoMenu: ['caja.admin', 'contabilidad'],
              rolesMenu: ['admin', 'contador'],
            },
            {
              kind: 'link',
              label: 'Todos los ingresos',
              path: '/app/caja/ingresos-todos',
              icon: '$',
              iconTone: 'emerald',
              permiso: ['caja.admin', 'contabilidad'],
              permisoMenu: ['caja.admin', 'contabilidad'],
              rolesMenu: ['admin', 'contador'],
            },
            {
              kind: 'link',
              label: 'Todos los egresos',
              path: '/app/caja/egresos-todos',
              icon: '⇣',
              iconTone: 'rose',
              permiso: ['caja.admin', 'contabilidad'],
              permisoMenu: ['caja.admin', 'contabilidad'],
              rolesMenu: ['admin', 'contador'],
            },
            {
              kind: 'link',
              label: 'Descuadres de caja',
              path: '/app/caja/descuadres',
              icon: '⚠',
              iconTone: 'amber',
              permiso: ['caja.admin', 'contabilidad'],
              permisoMenu: ['caja.admin', 'contabilidad'],
              rolesMenu: ['admin', 'contador'],
            },
          ],
        },
      ],
    },
    {
      kind: 'group',
      label: 'Talento y flota',
      icon: '👥',
      iconTone: 'rose',
      permiso: ['rrhh', 'vehiculos'],
      children: [
        {
          kind: 'subgroup',
          label: 'RRHH',
          icon: '👥',
          iconTone: 'rose',
          children: [
            {
              kind: 'link',
              label: 'Inicio y guía',
              path: '/app/rrhh/inicio',
              icon: '⌂',
              iconTone: 'rose',
              permiso: 'rrhh',
            },
            { kind: 'link', label: 'Empleados', path: '/app/rrhh/empleados', icon: '◉', iconTone: 'cyan', permiso: 'rrhh' },
            { kind: 'link', label: 'Desempeño', path: '/app/rrhh/desempeno', icon: '★', iconTone: 'amber', permiso: 'rrhh' },
            { kind: 'link', label: 'Contratos', path: '/app/rrhh/contratos', icon: '▤', iconTone: 'indigo', permiso: 'rrhh' },
            {
              kind: 'link',
              label: 'Cargos y seguridad social',
              path: '/app/rrhh/catalogos/cargos',
              icon: '▦',
              iconTone: 'blue',
              catalogosMatch: true,
              permiso: 'rrhh',
            },
            {
              kind: 'link',
              label: 'Competencias',
              path: '/app/rrhh/catalogos/competencias',
              icon: '✦',
              iconTone: 'violet',
              permiso: 'rrhh',
            },
            { kind: 'link', label: 'Liquidación', path: '/app/rrhh/nomina', icon: '₱', iconTone: 'emerald', permiso: 'rrhh' },
            { kind: 'link', label: 'Novedades', path: '/app/rrhh/novedades', icon: '▥', iconTone: 'pink', permiso: 'rrhh' },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Flota',
          icon: '◐',
          iconTone: 'pink',
          children: [
            {
              kind: 'link',
              label: 'Vehículos',
              icon: '◐',
              path: '/app/vehiculos',
              iconTone: 'pink',
              permiso: 'vehiculos',
            },
          ],
        },
      ],
    },
    {
      kind: 'group',
      label: 'Configuración',
      icon: '⚙',
      iconTone: 'indigo',
      permiso: [
        'config.usuarios',
        'config.usuarios.ver',
        'config.roles',
        'config.catalogos',
        'config.recibos',
        'config.georef',
        'config.facturacion',
        'config.nomina',
        'config.certificados',
        'jornadas.gestionar',
        'config.alertas',
        'config.paginas_informes',
        'config.requisitos',
        'config.auditoria',
        'config.autorizaciones',
        'sedes.gestionar',
        'config.sedes',
      ],
      children: [
        {
          kind: 'subgroup',
          label: 'Acceso y seguridad',
          icon: '◈',
          iconTone: 'violet',
          children: [
            {
              kind: 'link',
              label: 'Usuarios',
              path: '/app/configuracion/usuarios',
              icon: '◎',
              iconTone: 'purple',
              permiso: ['config.usuarios.ver', 'config.usuarios'],
            },
            {
              kind: 'link',
              label: 'Sedes',
              path: '/app/configuracion/sedes',
              icon: '⌂',
              iconTone: 'teal',
              permiso: ['sedes.gestionar', 'config.sedes'],
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
              label: 'Autorizaciones pendientes',
              path: '/app/configuracion/autorizaciones',
              icon: '⚠',
              iconTone: 'amber',
              permiso: ['config.autorizaciones', 'config.roles'],
            },
            {
              kind: 'link',
              label: 'Alertas y notificaciones',
              path: '/app/configuracion/alertas',
              icon: '◉',
              iconTone: 'amber',
              permiso: ['config.alertas', 'config.roles'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Empresa y caja',
          icon: '▤',
          iconTone: 'blue',
          children: [
            {
              kind: 'link',
              label: 'Empresa',
              path: '/app/configuracion/empresa',
              icon: '▤',
              iconTone: 'blue',
              permiso: 'config.recibos',
            },
            {
              kind: 'link',
              label: 'Comprobantes de caja',
              path: '/app/configuracion/recibos',
              icon: '▣',
              iconTone: 'cyan',
              permiso: 'config.recibos',
            },
            {
              kind: 'link',
              label: 'Servicios adicionales',
              path: '/app/configuracion/servicios-adicionales',
              icon: '⊕',
              iconTone: 'teal',
              permiso: 'config.recibos',
            },
            {
              kind: 'link',
              label: 'Gestores y empresas',
              path: '/app/configuracion/gestores-empresas',
              icon: '◉',
              iconTone: 'cyan',
              permiso: 'config.recibos',
            },
            {
              kind: 'link',
              label: 'Correos a alumnos',
              path: '/app/configuracion/envio-correos-alumno',
              icon: '✉',
              iconTone: 'sky',
              permiso: ['config.recibos', 'config.certificados', 'config.alertas'],
            },
            {
              kind: 'link',
              label: 'Parámetros nómina',
              path: '/app/configuracion/nomina',
              icon: '％',
              iconTone: 'amber',
              permiso: 'config.nomina',
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Facturación y pagos',
          icon: '$',
          iconTone: 'emerald',
          children: [
            {
              kind: 'link',
              label: 'Pasarela Wompi',
              path: '/app/configuracion/pasarela',
              icon: '◉',
              iconTone: 'violet',
              permiso: ['config.recibos', 'aula_virtual.gestionar'],
            },
            {
              kind: 'link',
              label: 'Facturación electrónica',
              path: '/app/configuracion/facturacion',
              icon: '$',
              iconTone: 'emerald',
              permiso: ['config.facturacion', 'facturacion'],
            },
            {
              kind: 'link',
              label: 'Clientes de facturación',
              path: '/app/configuracion/clientes',
              icon: '$',
              iconTone: 'emerald',
              permiso: ['config.facturacion', 'facturacion'],
            },
            {
              kind: 'link',
              label: 'Contratos capacitación (fiscal)',
              path: '/app/configuracion/contratos-cap-fiscal',
              icon: '$',
              iconTone: 'emerald',
              permiso: ['config.facturacion', 'facturacion'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Académico y portal',
          icon: '▦',
          iconTone: 'cyan',
          children: [
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
              label: 'Geocodificación',
              path: '/app/configuracion/georef',
              icon: '⌖',
              iconTone: 'lime',
              permiso: 'config.georef',
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
              label: 'Jornadas',
              path: '/app/configuracion/jornadas',
              icon: '▦',
              iconTone: 'emerald',
              permiso: 'jornadas.gestionar',
            },
            {
              kind: 'link',
              label: 'Páginas de informes',
              path: '/app/configuracion/paginas-informes',
              icon: '▤',
              iconTone: 'blue',
              permiso: ['config.paginas_informes', 'config.roles'],
            },
          ],
        },
        {
          kind: 'subgroup',
          label: 'Documentos y requisitos',
          icon: '▥',
          iconTone: 'teal',
          children: [
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
          ],
        },
        {
          kind: 'subgroup',
          label: 'Mantenimiento del sistema',
          icon: '⛁',
          iconTone: 'emerald',
          children: [
            {
              kind: 'link',
              label: 'Backup',
              path: '/app/configuracion/backup',
              icon: '⛁',
              iconTone: 'emerald',
              adminOnly: true,
            },
            {
              kind: 'link',
              label: 'Restore',
              path: '/app/configuracion/restore',
              icon: '↺',
              iconTone: 'amber',
              adminOnly: true,
            },
            {
              kind: 'link',
              label: 'Reset',
              path: '/app/configuracion/reset',
              icon: '⚠',
              iconTone: 'rose',
              adminOnly: true,
            },
            {
              kind: 'link',
              label: 'Limpieza tablas',
              path: '/app/configuracion/limpieza-tablas',
              icon: '⌫',
              iconTone: 'rose',
              adminOnly: true,
            },
            {
              kind: 'link',
              label: 'Migración',
              path: '/app/configuracion/migracion',
              icon: '⇄',
              iconTone: 'cyan',
              adminOnly: true,
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
      ],
    },
  ];
  /** Menú reactivo: se recalcula cuando cambian permisos o usuario en sesión. */
  menuItems = computed((): MenuEntry[] => {
    this.permisos.permisos();
    this.auth.user();
    return this.menuAll
      .map((m) => this.filtrarEntrada(m))
      .filter((m): m is MenuEntry => m != null);
  });

  private filtrarEntrada(m: MenuEntry): MenuEntry | null {
    if (m.kind === 'group') {
      const children = this.visibleMenuChildren(m.children);
      if (!children.length) return null;
      return { ...m, children };
    }
    return this.puedeVerItem(m) ? m : null;
  }

  private puedeVerItem(item: MenuLink): boolean {
    if (item.permisoMenu === '__instructores_hub__') {
      return this.puedeVerInstructoresMenu();
    }
    if (item.rolesMenu?.length && !this.rolPermitidoEnMenu(item.rolesMenu)) {
      return false;
    }
    const claveMenu = item.permisoMenu ?? item.permiso;
    if (claveMenu && !this.permisos.tiene(claveMenu)) return false;
    if (item.path) {
      const ctx = { puedeUsarPortalInstructor: this.auth.puedeUsarPortalInstructor() };
      if (!rutaAccesible(item.path, this.permisos.permisos(), ctx)) return false;
    }
    if (item.adminOnly && !this.isAdmin()) return false;
    if (item.gestionOnly && !this.puedeGestion()) return false;
    return true;
  }

  /** Coincide rol de sesión con rolesMenu (admin / contador, etc.). */
  private rolPermitidoEnMenu(roles: string[]): boolean {
    const allowed = roles.map((r) => String(r || '').toLowerCase().trim()).filter(Boolean);
    if (!allowed.length) return true;
    if (allowed.includes('admin') && this.isAdmin()) return true;
    if (allowed.includes('contador') && this.isContador()) return true;
    const rol = String(this.auth.user()?.rol || '').toLowerCase().trim();
    return allowed.some((a) => rol === a || rol.includes(a));
  }

  /** Portal instructor o directorio admin (no enlace “fantasma”). */
  private puedeVerInstructoresMenu(): boolean {
    const ctx = { puedeUsarPortalInstructor: this.auth.puedeUsarPortalInstructor() };
    return rutaAccesible('/app/instructores', this.permisos.permisos(), ctx);
  }

  visibleMenuChildren(children: MenuChild[]): MenuChild[] {
    return children
      .map((c) => {
        if (c.kind === 'subgroup') {
          const links = c.children.filter((l) => this.puedeVerItem(l));
          return links.length ? { ...c, children: links } : null;
        }
        return this.puedeVerItem(c) ? c : null;
      })
      .filter((c): c is MenuChild => c != null);
  }

  visibleChildren(children: MenuChild[]): MenuLink[] {
    return children.flatMap((c) => {
      if (c.kind === 'subgroup') return c.children.filter((l) => this.puedeVerItem(l));
      return this.puedeVerItem(c) ? [c] : [];
    });
  }

  visibleSubgroupChildren(subgroup: MenuSubgroup): MenuLink[] {
    return subgroup.children.filter((l) => this.puedeVerItem(l));
  }

  hasSubgroups(children: MenuChild[]): boolean {
    return children.some((c) => c.kind === 'subgroup');
  }

  subgroupKey(parentLabel: string, subgroupLabel: string): string {
    return `${parentLabel}::${subgroupLabel}`;
  }

  isSubgroupOpen(parentLabel: string, subgroupLabel: string): boolean {
    return this.groupAbierto()[this.subgroupKey(parentLabel, subgroupLabel)] === true;
  }

  subgroupActive(subgroup: MenuSubgroup): boolean {
    return subgroup.children.some((link) => this.subLinkActive(link));
  }

  isConfigGroup(label: string): boolean {
    return label === 'Configuración';
  }

  configGroupActive(): boolean {
    return this.router.url.split('?')[0].includes('/configuracion/');
  }

  private firstNavigableLink(children: MenuChild[]): MenuLink | null {
    for (const c of this.visibleMenuChildren(children)) {
      if (c.kind === 'link') return c;
      const links = this.visibleSubgroupChildren(c);
      if (links[0]) return links[0];
    }
    return null;
  }

  private syncGroupSubgroupsFromUrl(parentLabel: string, url: string, patch: Record<string, boolean>): void {
    const group = this.menuAll.find((m) => m.kind === 'group' && m.label === parentLabel);
    if (!group || group.kind !== 'group') return;
    for (const child of group.children) {
      if (child.kind !== 'subgroup') continue;
      const match = child.children.some((link) => this.subLinkActive(link));
      if (match) {
        patch[this.subgroupKey(parentLabel, child.label)] = true;
      }
    }
  }

  toggleSubgroup(parentLabel: string, subgroup: MenuSubgroup, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    const key = this.subgroupKey(parentLabel, subgroup.label);
    this.groupAbierto.update((g) => ({ ...g, [key]: !this.isSubgroupOpen(parentLabel, subgroup.label) }));
  }

  trackMenu(m: MenuEntry): string {
    return m.kind === 'link' ? `${m.label}|${m.path}` : `group:${m.label}`;
  }

  onSedeChange(idSede: string): void {
    const s = this.sedes().find((x) => x.idSede === idSede);
    if (!s) return;
    this.sedeSvc.seleccionar(s);
    void this.refrescarCajaSiAplica();
  }

  /** Asegura sede activa tras login/refresh (p. ej. admin con una sola sede). */
  private syncSedeDesdeUsuario(): void {
    const u = this.auth.user();
    if (!u?.sedes?.length) return;
    this.sedeSvc.initDesdeUsuario(u.sedes as SedeDto[], {
      filtrarComoAdmin: this.puedeFiltrarPorSede(),
    });
  }

  private readonly CLAVES_INSTRUCTOR_PORTAL = [
    'alarmas.instructores.clase_proxima',
    'alarmas.instructores.clase_asignada',
    'alarmas.instructores.inspeccion_requerida',
  ] as const;

  constructor() {
    effect(() => {
      if (!this.alertasRuntime.cargado()) return;
      this.alertasRuntime.reglasMap();
      this.alarmas.alarmas();
      if (!this.auth.isAuth()) return;
      untracked(() => this.sincronizarAlertasConConfig());
    });

    this.auth.refreshMe().subscribe({
      next: () => {
        this.syncSedeDesdeUsuario();
        void this.revisarCajaPostLogin();
      },
      error: () => undefined,
    });
    this.syncMenuGroupsFromUrl(this.router.url);
    void this.refrescarCajaSiAplica();
    this.alertasRuntime.cargar().subscribe({
      next: () => {
        this.sincronizarAlertasConConfig();
        void this.revisarCajaPostLogin();
      },
      error: () => this.sincronizarAlertasConConfig(),
    });
    this.iniciarAlertasPollsOnce();
    this.autorizPendientesAlert.iniciarPolling();
    this.programacionCeaProximaAlert.refresh
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAlertasClaseProximaCea());
    this.vehiculoInspeccionAlert.refresh
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAlertasInspeccionVehiculos());
    this.instructorPortalAlert.refresh
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollInstructorPortal());
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.syncMenuGroupsFromUrl(this.router.url);
        void this.refrescarCajaSiAplica();
      });
  }

  private refrescarCajaSiAplica(): void {
    if (
      this.mostrarAlertaCaja() ||
      this.mostrarAlertaCajaAbiertaDias() ||
      this.debeRevisarCajaPostLogin()
    ) {
      void this.cajaEstado.refrescar();
    }
  }

  private debeRevisarCajaPostLogin(): boolean {
    if (!this.auth.isAuth()) return false;
    if (!this.cajaAperturaAlert.usuarioConAccesoCaja()) return false;
    // No exigir solo las claves nuevas: muchos roles aún tienen cerrada/sin_abrir.
    return (
      this.cajaAperturaAlert.puedeAvisarLoginCerrada() ||
      this.cajaAperturaAlert.puedeAvisarDiasAbiertos()
    );
  }

  private async revisarCajaPostLogin(): Promise<void> {
    if (!this.debeRevisarCajaPostLogin()) return;
    // Esperar un tick de pintura del shell para que el modal no quede detrás del layout.
    await new Promise((r) => setTimeout(r, 400));
    if (!this.auth.isAuth()) return;
    await this.cajaAperturaAlert.revisarAlEntrar();
  }

  private iniciarAlertasPollsOnce(): void {
    if (this.pollsAlertasIniciados) return;
    this.pollsAlertasIniciados = true;
    this.iniciarAlertasPolls();
  }

  private iniciarAlertasPolls(): void {
    this.iniciarPollCertificados();
    this.iniciarPollComprobantesHoy();
    this.iniciarPollAlertasPago();
    this.iniciarPollCertificadosPorVencer();
    this.iniciarPollCertificadosVencidos();
    this.iniciarPollJornadasLive();
    this.iniciarPollAlertasVehiculos();
    this.iniciarPollAlertasEmpleados();
    this.iniciarPollAlertasProgramacionCea();
    this.iniciarPollAlertasClasesCeaCreado();
    this.iniciarPollAlertasClaseProximaCea();
    this.iniciarPollInstructorPortal();
    this.iniciarPollAulaVirtualPortalEventos();
    this.iniciarPollAulaVirtualAccesoPorVencer();
    this.iniciarForoMensajeAlert();
    this.iniciarChatInterno();
    this.iniciarAutorizacionAlertas();
    this.iniciarPollPermisosSesion();
  }

  private iniciarAutorizacionAlertas(): void {
    if (!this.auth.isAuth()) return;
    this.autorizacionAlert.conectar();
    const msPend = this.pollIntervalMs('alarmas.config.autorizacion_pendiente');
    const msRes = this.pollIntervalMs('alarmas.config.autorizacion_resuelta');
    if (this.alarmaHabilitada('alarmas.config.autorizacion_pendiente')) {
      this.autorizacionAlert.cargarPendientesAdmin();
      interval(msPend)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.autorizacionAlert.cargarPendientesAdmin());
    }
    if (this.alarmaHabilitada('alarmas.config.autorizacion_resuelta')) {
      this.autorizacionAlert.cargarMisResueltas();
      interval(msRes)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.autorizacionAlert.cargarMisResueltas());
    }
  }

  private iniciarChatInterno(): void {
    if (!this.auth.isAuth()) return;
    this.chatSvc.conectar();
  }

  private pollIntervalMs(...keys: string[]): number {
    let ms = 60_000;
    for (const k of keys) {
      if (this.alarmaHabilitada(k)) {
        ms = Math.min(ms, this.alertasRuntime.intervaloPollMs(k));
      }
    }
    return ms;
  }

  /** Rol + configuración global (Configuración → Alertas). */
  private alarmaHabilitada(key: string): boolean {
    void this.alertasRuntime.reglasMap();
    return this.alarmas.tiene(key) && this.alertasRuntime.activa(key);
  }

  /** Limpia datos en memoria cuando la config global desactiva un tipo de alerta. */
  private sincronizarAlertasConConfig(): void {
    if (!this.alarmaHabilitada('alarmas.programacion_cea.pendiente')) {
      this.programacionCeaAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.alumnos.clases_cea_creado')) {
      this.programacionCeaClaseCreadoAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.programacion_cea.clase_proxima')) {
      this.programacionCeaProximaAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.jornadas.en_proceso')) {
      this.jornadaProcesoAlert.actualizarDesdeListado([]);
    }
    if (!this.alarmaHabilitada('alarmas.jornadas.certificado_nuevo')) {
      this.certAlertSvc.descartarTodas();
    }
    if (
      !this.alarmaHabilitada('alarmas.alumnos.comprobante_ingreso') &&
      !this.alarmaHabilitada('alarmas.alumnos.comprobante_egreso') &&
      !this.alarmaHabilitada('alarmas.alumnos.factura')
    ) {
      for (const a of [...this.comprobanteAlertSvc.alertas()]) {
        this.comprobanteAlertSvc.descartar(a.key);
      }
    }
    if (!this.alarmaHabilitada('alarmas.certificados.vencimiento')) {
      this.certVencimientoAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.certificados.vencidos')) {
      this.certVencidoAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.vehiculos.docs_vencidos')) {
      this.vehiculoDocsAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.vehiculos.docs_faltantes')) {
      this.vehiculoDocsFaltantesAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.vehiculos.inspeccion_pendiente')) {
      this.vehiculoInspeccionAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.empleados.docs_vencidos')) {
      this.empleadoDocsAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.empleados.docs_faltantes')) {
      this.empleadoDocsFaltantesAlert.actualizar(null);
    }
    if (!this.CLAVES_INSTRUCTOR_PORTAL.some((k) => this.alarmaHabilitada(k))) {
      this.instructorPortalAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.aula_virtual.foro_mensaje')) {
      this.foroMensajeAlert.descartarTodas();
      this.foroMensajeAlert.desconectar();
    } else if (this.puedeModerarForo()) {
      this.foroMensajeAlert.conectar();
    }
    if (!this.alarmaHabilitada('alarmas.aula_virtual.registro_nuevo')) {
      this.aulaVirtualPortalAlert.descartarTodasRegistro();
    }
    if (!this.alarmaHabilitada('alarmas.aula_virtual.matricula_nueva')) {
      this.aulaVirtualPortalAlert.descartarTodasMatricula();
    }
    if (!this.alarmaHabilitada('alarmas.aula_virtual.acceso_por_vencer')) {
      this.aulaVirtualAccesoPorVencerAlert.actualizar(null);
    }
    if (!this.alarmaHabilitada('alarmas.config.autorizacion_pendiente')) {
      this.autorizacionAlert.descartarTodasPendientes();
    }
    if (!this.alarmaHabilitada('alarmas.config.autorizacion_resuelta')) {
      this.autorizacionAlert.descartarTodasResueltas();
    }
  }

  private iniciarForoMensajeAlert(): void {
    if (!this.mostrarAlertaForoMensaje() || !this.puedeModerarForo()) return;
    this.foroMensajeAlert.conectar();
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

      this.pollAlertasInspeccionVehiculos();
    };
    poll();
    interval(
      this.pollIntervalMs(
        'alarmas.vehiculos.docs_vencidos',
        'alarmas.vehiculos.docs_faltantes',
        'alarmas.vehiculos.inspeccion_pendiente',
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => poll());
  }

  /** Vehículos con práctica hoy sin inspección preoperacional. */
  pollAlertasInspeccionVehiculos(): void {
    if (this.mostrarAlertaInspeccionVehiculos()) {
      this.inspeccionSvc.alertasPendientes().subscribe({
        next: (data) => this.vehiculoInspeccionAlert.actualizar(data),
        error: () => undefined,
      });
    } else {
      this.vehiculoInspeccionAlert.actualizar(null);
    }
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
    interval(this.pollIntervalMs('alarmas.empleados.docs_vencidos', 'alarmas.empleados.docs_faltantes'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => poll());
  }

  /** Alumnos/servicios CEA con horas sin programar. */
  private pollAlertasProgramacionCea(): void {
    if (this.mostrarAlertaProgramacionCea()) {
      this.programacionCeaSvc.alertasPendientes().subscribe({
        next: (data) => this.programacionCeaAlert.actualizar(data),
        error: () => undefined,
      });
    } else {
      this.programacionCeaAlert.actualizar(null);
    }
  }

  private iniciarPollAlertasProgramacionCea(): void {
    this.pollAlertasProgramacionCea();
    interval(this.pollIntervalMs('alarmas.programacion_cea.pendiente'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAlertasProgramacionCea());
  }

  /** Clases CEA en estado CREADO sin programar (fecha/hora). */
  private pollAlertasClasesCeaCreado(): void {
    if (this.mostrarAlertaClasesCeaCreado()) {
      this.programacionCeaSvc.alertasClasesCreado().subscribe({
        next: (data) => this.programacionCeaClaseCreadoAlert.actualizar(data),
        error: () => undefined,
      });
    } else {
      this.programacionCeaClaseCreadoAlert.actualizar(null);
    }
  }

  private iniciarPollAlertasClasesCeaCreado(): void {
    this.pollAlertasClasesCeaCreado();
    interval(this.pollIntervalMs('alarmas.alumnos.clases_cea_creado'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAlertasClasesCeaCreado());
  }

  /** Clases CEA que inician en los próximos 15 minutos. */
  pollAlertasClaseProximaCea(): void {
    if (this.mostrarAlertaClaseProximaCea()) {
      const min =
        this.alertasRuntime.antelacionMinutos('alarmas.programacion_cea.clase_proxima') || 15;
      this.programacionCeaSvc.alertasClasesProximas(min).subscribe({
        next: (data) => this.programacionCeaProximaAlert.actualizar(data),
        error: () => undefined,
      });
    } else {
      this.programacionCeaProximaAlert.actualizar(null);
    }
  }

  private iniciarPollAlertasClaseProximaCea(): void {
    this.pollAlertasClaseProximaCea();
    interval(this.pollIntervalMs('alarmas.programacion_cea.clase_proxima'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAlertasClaseProximaCea());
  }

  /** Portal instructor: clases asignadas, próximas (20 min) e inspección. */
  private pollInstructorPortal(): void {
    if (!this.auth.puedeUsarPortalInstructor()) {
      this.instructorPortalAlert.actualizar(null);
      return;
    }
    if (!this.mostrarAlertaInstructorPortal()) {
      this.instructorPortalAlert.actualizar(null);
      return;
    }
    const min =
      this.alertasRuntime.antelacionMinutos('alarmas.instructores.clase_proxima') || 20;
    this.instructorPortalSvc.misAlertas({ minutos: min, diasAsignacion: 3 }).subscribe({
      next: (data) => this.instructorPortalAlert.actualizar(data),
      error: () => this.instructorPortalAlert.actualizar(null),
    });
  }

  private iniciarPollInstructorPortal(): void {
    this.pollInstructorPortal();
    interval(
      this.pollIntervalMs(
        'alarmas.instructores.clase_asignada',
        'alarmas.instructores.clase_proxima',
        'alarmas.instructores.inspeccion_requerida',
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollInstructorPortal());
  }

  /** Registro y matrícula de alumnos en el portal aula virtual. */
  private pollAulaVirtualPortalEventos(): void {
    const registro = this.mostrarAlertaRegistroPortal() && this.puedeVerAulaVirtual();
    const matricula = this.mostrarAlertaMatriculaPortal() && this.puedeVerAulaVirtual();
    if (!registro && !matricula) {
      this.aulaVirtualPortalAlert.actualizar(null, { registro: false, matricula: false });
      return;
    }
    const minReg = Math.max(
      5,
      this.alertasRuntime.regla('alarmas.aula_virtual.registro_nuevo').duracionMinutos || 120,
    );
    const minMat = Math.max(
      5,
      this.alertasRuntime.regla('alarmas.aula_virtual.matricula_nueva').duracionMinutos || 120,
    );
    this.aulaVirtualAdminSvc
      .listarAlertasEventosPortal({
        minutosRegistro: registro ? minReg : undefined,
        minutosMatricula: matricula ? minMat : undefined,
      })
      .subscribe({
        next: (data) =>
          this.aulaVirtualPortalAlert.actualizar(data, { registro, matricula }),
        error: () =>
          this.aulaVirtualPortalAlert.actualizar(null, { registro, matricula }),
      });
  }

  private iniciarPollAulaVirtualPortalEventos(): void {
    this.pollAulaVirtualPortalEventos();
    interval(
      this.pollIntervalMs(
        'alarmas.aula_virtual.registro_nuevo',
        'alarmas.aula_virtual.matricula_nueva',
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAulaVirtualPortalEventos());
  }

  private iniciarPollAulaVirtualAccesoPorVencer(): void {
    this.pollAulaVirtualAccesoPorVencer();
    interval(this.pollIntervalMs('alarmas.aula_virtual.acceso_por_vencer'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAulaVirtualAccesoPorVencer());
  }

  private pollAulaVirtualAccesoPorVencer(): void {
    if (!this.mostrarAlertaAccesoPorVencer() || !this.puedeVerAulaVirtual()) {
      this.aulaVirtualAccesoPorVencerAlert.actualizar(null);
      return;
    }
    const dias = this.alertasRuntime.diasAntelacion('alarmas.aula_virtual.acceso_por_vencer') ?? 1;
    this.aulaVirtualAdminSvc.alertasAccesoPorVencer(dias).subscribe({
      next: (data) => this.aulaVirtualAccesoPorVencerAlert.actualizar(data),
      error: () => this.aulaVirtualAccesoPorVencerAlert.actualizar(null),
    });
  }

  /** Sincroniza permisos del rol desde el servidor (cambios hechos en Configuración → Roles). */
  private iniciarPollPermisosSesion(): void {
    const sync = () => {
      if (!this.auth.isAuth()) return;
      this.auth.refreshMe().subscribe({ error: () => undefined });
    };
    interval(8_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => sync());
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.syncPermisosOnFocus);
      this.destroyRef.onDestroy(() => window.removeEventListener('focus', this.syncPermisosOnFocus));
    }
  }

  private puedeComprobanteTipo(tipo: string): boolean {
    const t = tipo as ComprobanteHoyTipo;
    if (t !== 'ingreso' && t !== 'egreso' && t !== 'factura') return false;
    const clave = AlertasRuntimeService.claveComprobante(t);
    if (!this.alertasRuntime.activa(clave)) return false;
    if (t === 'ingreso') return this.mostrarAlertaComprobanteIngreso();
    if (t === 'egreso') return this.mostrarAlertaComprobanteEgreso();
    return this.mostrarAlertaComprobanteFactura();
  }

  /** Recordatorios de cobro programados para hoy (técnicos / cuotas). */
  private pollAlertasPago(): void {
    if (!this.mostrarAlertaPagoAlumno()) {
      this.alertaPagoSvc.limpiar();
      return;
    }
    this.alertaPagoSvc.cargar().subscribe({ error: () => this.alertaPagoSvc.limpiar() });
  }

  private iniciarPollAlertasPago(): void {
    this.pollAlertasPago();
    interval(this.pollIntervalMs('alarmas.caja.alerta_pago'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollAlertasPago());
  }

  /** Comprobantes y facturas recientes (alertas globales en cabecera). */
  private iniciarPollComprobantesHoy(): void {
    const poll = (minutosAtras: number, alertarNuevos: boolean) => {
      const puedePoll =
        this.puedeComprobanteTipo('ingreso') ||
        this.puedeComprobanteTipo('egreso') ||
        this.puedeComprobanteTipo('factura');
      if (!puedePoll) return;
      const desde = new Date(Date.now() - minutosAtras * 60 * 1000).toISOString();
      this.alumnoSvc.comprobantesRecientes(desde).subscribe({
        next: (rows) => {
          for (const row of rows || []) {
            const tipo = String(row.tipo || '');
            if (!this.puedeComprobanteTipo(tipo)) continue;
            const key = `${tipo}:${row.id}`;
            if (alertarNuevos) {
              this.comprobanteAlertSvc.notificarDesdeRespuesta(row as Record<string, unknown>);
            } else {
              this.comprobanteAlertSvc.marcarConocidos([key]);
            }
          }
        },
      });
    };

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const desdeHoy = inicioHoy.toISOString();
    this.alumnoSvc.comprobantesRecientes(desdeHoy).subscribe({
      next: (rows) => {
        for (const row of rows || []) {
          const tipo = String(row.tipo || '') as ComprobanteHoyTipo;
          if (!this.puedeComprobanteTipo(tipo)) continue;
          const clave = AlertasRuntimeService.claveComprobante(tipo);
          const key = `${tipo}:${row.id}`;
          if (this.alertasRuntime.ventanaInicio(clave) === 'desde_inicio_dia') {
            this.comprobanteAlertSvc.notificarDesdeRespuesta(row as Record<string, unknown>);
          } else {
            this.comprobanteAlertSvc.marcarConocidos([key]);
          }
        }
      },
    });

    const pollMs = this.pollIntervalMs(
      'alarmas.alumnos.comprobante_ingreso',
      'alarmas.alumnos.comprobante_egreso',
      'alarmas.alumnos.factura',
    );
    const minutosVentana = Math.max(2, Math.ceil(pollMs / 60_000) * 2);
    interval(pollMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => poll(minutosVentana, true));
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
    const pollMs = this.pollIntervalMs('alarmas.jornadas.certificado_nuevo');
    // Ventana ≥ intervalo: createdAt de jornadas a veces cae fuera de 3 min si el poll es más largo.
    const minutosVentana = Math.max(5, Math.ceil(pollMs / 60_000) * 2);
    poll(60, false);
    interval(pollMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => poll(minutosVentana, true));
  }

  /** Certificados por vencer: días configurados en alertas o en config certificados. */
  private pollCertificadosPorVencer(): void {
    if (!this.mostrarAlertaCertificadoVencimiento()) {
      this.certVencimientoAlert.actualizar(null);
      return;
    }
    const dias = this.alertasRuntime.diasAntelacion('alarmas.certificados.vencimiento');
    this.certSvc.alertasPorVencer(dias).subscribe({
      next: (data) => this.certVencimientoAlert.actualizar(data),
      error: () => this.certVencimientoAlert.actualizar(null),
    });
  }

  private iniciarPollCertificadosPorVencer(): void {
    this.pollCertificadosPorVencer();
    interval(this.pollIntervalMs('alarmas.certificados.vencimiento'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollCertificadosPorVencer());
  }

  /** Certificados vencidos: días de gracia configurados en alertas o en config certificados. */
  private pollCertificadosVencidos(): void {
    if (!this.mostrarAlertaCertificadoVencido()) {
      this.certVencidoAlert.actualizar(null);
      return;
    }
    const dias = this.alertasRuntime.diasGracia('alarmas.certificados.vencidos');
    this.certSvc.alertasVencidos(dias).subscribe({
      next: (data) => this.certVencidoAlert.actualizar(data),
      error: () => this.certVencidoAlert.actualizar(null),
    });
  }

  private iniciarPollCertificadosVencidos(): void {
    this.pollCertificadosVencidos();
    interval(this.pollIntervalMs('alarmas.certificados.vencidos'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollCertificadosVencidos());
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
          } else {
            this.jornadaProcesoAlert.actualizarDesdeListado([]);
          }
          if (inicial) {
            this.liveSync.marcarClasesConocidas(clases.map((c) => c._id));
            this.liveSync.marcarJornadasConocidas(jornadas.map((j) => j._id));
            this.liveSync.sincronizarEstadosClases(clases);
            if (this.mostrarToastJornadaLive()) {
              this.liveSync.restaurarClasesEnCurso(clasesRaw);
            }
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
    interval(this.pollIntervalMs('alarmas.jornadas.live_toast', 'alarmas.jornadas.en_proceso'))
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      'Operación del día': false,
      Académico: false,
      Finanzas: false,
      'Talento y flota': false,
      Configuración: false,
    };

    if (
      u.includes('/alumnos') ||
      u.includes('/cobros-pendientes') ||
      u === '/app/caja' ||
      u === '/app/caja/' ||
      u.includes('/caja/terceros') ||
      u.includes('/caja/gestores') ||
      u.includes('/caja/empresa') ||
      u.includes('/combos') ||
      u.includes('/instructores') ||
      u.includes('/jornadas/clases-hoy') ||
      u.includes('/jornadas/clases-en-desarrollo') ||
      u.includes('/jornadas/instructor') ||
      (u.includes('/programacion-cea/clases-hoy') && !u.includes('/programacion-cea/clases-grupales'))
    ) {
      patch['Operación del día'] = true;
      this.syncGroupSubgroupsFromUrl('Operación del día', u, patch);
    }

    if (
      u.includes('/programas') ||
      u.includes('/servicios') ||
      u.includes('/certificados') ||
      u.includes('/informes') ||
      u.includes('/cohortes') ||
      u.includes('/aula-virtual') ||
      u === '/app/contratos' ||
      u.startsWith('/app/contratos/') ||
      u.includes('/jornadas') ||
      u.includes('/programacion-cea')
    ) {
      patch['Académico'] = true;
      this.syncGroupSubgroupsFromUrl('Académico', u, patch);
    }

    if (
      u.includes('/contabilidad') ||
      u.includes('/facturacion') ||
      u.includes('/cierres') ||
      u.includes('/cierre-general') ||
      u.includes('/caja/ingresos-todos') ||
      u.includes('/caja/egresos-todos') ||
      u.includes('/caja/descuadres')
    ) {
      patch['Finanzas'] = true;
      this.syncGroupSubgroupsFromUrl('Finanzas', u, patch);
    }

    if (u.includes('/rrhh') || u.includes('/vehiculos')) {
      patch['Talento y flota'] = true;
      this.syncGroupSubgroupsFromUrl('Talento y flota', u, patch);
    }

    if (u.includes('/configuracion/')) {
      patch['Configuración'] = true;
      this.syncGroupSubgroupsFromUrl('Configuración', u, patch);
    }

    this.groupAbierto.set(patch);
  }

  toggle() { this.collapsed.update((v) => !v); }

  isGroupOpen(label: string): boolean {
    return this.groupAbierto()[label] === true;
  }

  toggleGroup(label: string, children: MenuChild[], ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (this.collapsed()) {
      const first = this.firstNavigableLink(children);
      if (first) this.router.navigateByUrl(first.path);
      return;
    }
    this.groupAbierto.update((g) => ({ ...g, [label]: !this.isGroupOpen(label) }));
  }

  isOperacionGroup(label: string): boolean {
    return label === 'Operación del día';
  }

  isAcademicoGroup(label: string): boolean {
    return label === 'Académico';
  }

  isFinanzasGroup(label: string): boolean {
    return label === 'Finanzas';
  }

  isTalentoGroup(label: string): boolean {
    return label === 'Talento y flota';
  }

  operacionGroupActive(): boolean {
    const u = this.router.url.split('?')[0];
    return (
      u.includes('/alumnos') ||
      u.includes('/cobros-pendientes') ||
      u === '/app/caja' ||
      u === '/app/caja/' ||
      u.includes('/caja/terceros') ||
      u.includes('/caja/gestores') ||
      u.includes('/caja/empresa') ||
      u.includes('/combos') ||
      u.includes('/instructores') ||
      u.includes('/jornadas/clases-hoy') ||
      u.includes('/jornadas/clases-en-desarrollo') ||
      u.includes('/jornadas/instructor')
    );
  }

  academicoGroupActive(): boolean {
    const u = this.router.url.split('?')[0];
    return (
      u.includes('/programas') ||
      u.includes('/servicios') ||
      u.includes('/certificados') ||
      u.includes('/informes') ||
      u.includes('/cohortes') ||
      u.includes('/aula-virtual') ||
      u.includes('/contratos') ||
      u.includes('/jornadas') ||
      u.includes('/programacion-cea')
    );
  }

  finanzasGroupActive(): boolean {
    const u = this.router.url.split('?')[0];
    return (
      u.includes('/contabilidad') ||
      u.includes('/facturacion') ||
      u.includes('/cierres') ||
      u.includes('/cierre-general') ||
      u.includes('/caja/ingresos-todos') ||
      u.includes('/caja/egresos-todos') ||
      u.includes('/caja/descuadres')
    );
  }

  talentoGroupActive(): boolean {
    const u = this.router.url.split('?')[0];
    return u.includes('/rrhh') || u.includes('/vehiculos');
  }

  trackMenuChild(c: MenuChild): string {
    if (c.kind === 'link') {
      const tab = c.queryParams?.['tab'] ?? '';
      return `${c.path}|${c.label}|${tab}`;
    }
    return `subgroup:${c.label}`;
  }

  /** Encabezado de sección solo cuando cambia respecto al ítem visible anterior (menús planos). */
  showSubmenuSection(children: MenuChild[], index: number): boolean {
    if (this.hasSubgroups(children)) return false;
    const visible = this.visibleMenuChildren(children);
    const current = visible[index];
    if (!current || current.kind !== 'link' || !current.section) return false;
    const prev = index > 0 ? visible[index - 1] : null;
    const prevSection = prev?.kind === 'link' ? prev.section : undefined;
    return current.section !== prevSection;
  }

  /** Encabezado de sección en grupos con subgrupos y enlaces planos mezclados (p. ej. Académico). */
  showSubmenuSectionMixed(children: MenuChild[], index: number): boolean {
    const visible = this.visibleMenuChildren(children);
    const current = visible[index];
    if (!current || current.kind !== 'link' || !current.section) return false;
    for (let i = index - 1; i >= 0; i--) {
      const prev = visible[i];
      if (prev.kind === 'link') {
        return current.section !== prev.section;
      }
    }
    return true;
  }

  subLinkActive(link: MenuLink): boolean {
    const full = this.router.url;
    const url = full.split('?')[0];
    if (link.path === '/app/cohortes' && link.queryParams?.['tab']) {
      const tab = link.queryParams['tab'];
      if (!(url === '/app/cohortes' || url.startsWith('/app/cohortes/'))) return false;
      if (full.includes(`tab=${tab}`)) return true;
      if (tab === 'plan' && !full.includes('tab=') && (url === '/app/cohortes' || url === '/app/cohortes/')) {
        return true;
      }
      if (tab === 'cohortes' && url.startsWith('/app/cohortes/') && !full.includes('tab=')) {
        return true;
      }
      return false;
    }
    if (link.path === '/app/jornadas' && link.queryParams?.['tab']) {
      const tab = link.queryParams['tab'];
      if (!(url === '/app/jornadas' || url === '/app/jornadas/')) return false;
      if (full.includes(`tab=${tab}`)) return true;
      if (tab === 'contratos' && !full.includes('tab=')) return true;
      return false;
    }
    if (link.path === '/app/jornadas' && !link.queryParams?.['tab']) {
      return (url === '/app/jornadas' || url === '/app/jornadas/') && !full.includes('tab=');
    }
    if (link.path === '/app/programacion-cea' && link.queryParams?.['tab']) {
      const tab = link.queryParams['tab'];
      if (!(url === '/app/programacion-cea' || url === '/app/programacion-cea/')) return false;
      if (full.includes(`tab=${tab}`)) return true;
      if (tab === 'inicio' && !full.includes('tab=')) return true;
      return false;
    }
    if (link.queryParams?.['tab']) {
      return (
        (url === link.path || url.startsWith(`${link.path}/`)) &&
        full.includes(`tab=${link.queryParams['tab']}`)
      );
    }
    if (link.path === '/app/programacion-cea' && full.includes('tab=')) {
      return false;
    }
    if (link.path === '/app/programacion-cea') {
      return url === '/app/programacion-cea' || url === '/app/programacion-cea/';
    }
    if (link.path === '/app/caja') {
      return url === '/app/caja' || url === '/app/caja/';
    }
    if (link.path === '/app/rrhh/catalogos/competencias') {
      return url.includes('/rrhh/catalogos/competencias');
    }
    if (link.catalogosMatch) {
      return url.includes('/rrhh/catalogos') && !url.includes('/rrhh/catalogos/competencias');
    }
    if (link.path === '/app/rrhh/inicio') {
      return url === link.path || url === '/app/rrhh' || url === '/app/rrhh/';
    }
    if (link.path === '/app/programacion-cea') {
      return url === '/app/programacion-cea' || url === '/app/programacion-cea/';
    }
    return url === link.path || url.startsWith(`${link.path}/`);
  }

  logout() {
    this.foroMensajeAlert.desconectar();
    this.chatSvc.desconectar();
    this.auth.logout();
  }

  abrirCambiarPassword(): void {
    if (this.auth.isSoporteMaestro()) return;
    this.cambiarPasswordModal?.abrir();
  }

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
