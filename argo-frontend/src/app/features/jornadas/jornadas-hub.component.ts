import { CommonModule } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, DestroyRef, HostListener, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

import { CatalogoService, MunicipioDivipola } from '../../core/services/catalogo.service';
import { CertificadoJornadaAlertService } from '../../core/services/certificado-jornada-alert.service';
import { MetaAlumnosJornadaAlertService } from '../../core/services/meta-alumnos-jornada-alert.service';
import { CertificadoJornadaBloqueoService } from '../../core/services/certificado-jornada-bloqueo.service';
import { JornadasOperacionConfigService } from '../../core/services/jornadas-operacion-config.service';
import { JornadaHubDeepLinkService, JornadaHubDeepLink } from '../../core/services/jornada-hub-deeplink.service';
import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import {
  AlumnoClaseAnteriorItem,
  AvanceContratoDto,
  ClaseAnteriorResumenDto,
  ContratacionDto,
  ContratoSyncDto,
  CuotaPlanCobroDto,
  EstadoCobroContratoDto,
  InstructorJornadaDto,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import { AuthService } from '../../core/services/auth.service';
import { PermisoService } from '../../core/services/permiso.service';
import { MunicipioBuscarComponent } from '../alumnos/municipio-buscar.component';
import { AlumnoListItem } from '../../core/services/alumno.service';
import { formatNumDoc } from '../../core/utils/num-doc.helpers';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { FormModalComponent } from '../../shared/form-modal/form-modal.component';
import { Hora12InputComponent } from '../../shared/hora-12-input/hora-12-input.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { environment } from '../../../environments/environment';
import { AsistenteContextoService } from '../../core/services/asistente-contexto.service';
import { Cliente, ClienteService } from '../../core/services/cliente.service';
import { ComprobanteHoyImpresionService } from '../../core/services/comprobante-hoy-impresion.service';
import { ComprobanteHoyAlertService } from '../../core/services/comprobante-hoy-alert.service';
import { CajaSesionService } from '../../core/services/caja-sesion.service';
import { FacturacionService, FacturaElectronicaItem, PreviewFacturaContrato } from '../../core/services/facturacion.service';
import { IngresoService } from '../../core/services/ingreso.service';
import { NotaCreditoModalComponent } from '../facturacion/nota-credito-modal.component';
import { PagoSoporteFieldComponent } from '../../shared/pago-soporte-field/pago-soporte-field.component';
import { requiereReferenciaPago, requiereSoportePago } from '../../core/utils/referencia-pago.util';
import { leerImagenSoporte } from '../../core/utils/pago-soporte.helpers';
import { pagoIntangibleCompleto } from '../../core/utils/pago-intangible.validators';
import { tipFormulario } from '../../core/utils/asistente-formulario.util';
import { JornadaCapDto } from '../../core/services/jornada-cap.service';
import { JornadaMapaPickerComponent } from './jornada-mapa-picker.component';
import { ContratoInformesDashboardComponent } from './contrato-informes-dashboard.component';
import {
  ProgresoCertResp,
  etiquetaProgresoCert,
} from './jornada-progreso.util';
import { CoordsGeorefEvent, DeteGeorefe, etiquetaDeteGeorefe } from './jornada-georefe.util';
import {
  DIAS_SEMANA_CORTO,
  CeldaMes,
  DiaSemana,
  agruparPorFecha,
  celdasMes,
  diasSemana,
  finMes,
  finSemana,
  fmtDiaSemanaCorto,
  fmtMesAnio,
  fmtRangoSemana,
  horasSlots,
  inicioMes,
  inicioSemana,
  layoutHorarioClase,
  layoutsCalendarioDiaClase,
  ymdLocal,
  ymdCalendario,
  fmtFechaCalendario,
  esFechaHoy,
  ahoraLineaTopPct,
  esFinDeSemana,
  rangoVisibleMes,
  duracionSegundosDesdeHHmm,
} from './jornada-calendario.util';
import {
  JorMsgTipo,
  capAlumnoNombre,
  capCertCodigo,
  capCliente,
  capCodContrato,
  capDeteGeorefe,
  capDocAsis,
  capEstadoClase,
  capEstadoJornada,
  capEstadoJornadaColor,
  capFechaJor,
  capGenerado,
  capHorasCert,
  capHoraJor,
  capInstructor,
  capMetaNum,
  capMunicipioJor,
  capPrograma,
  capSesCert,
  capUbicacionClase,
  capCarpa,
  labelCarpaClase,
  etiquetaGenerado,
  iconoJorMsg,
  isoAHoraInput,
  listaOpcionesHora,
  tituloJorMsg,
  validarHoraInput,
  estadoContratoLiveClass,
  labelEstadoContrato,
  rowContratoClass,
  estadoJornadaLiveClass,
  estadoJornadaCalClass,
  rowJornadaClass,
  estadoClaseLiveClass,
  claseJornadaSePuedeEliminar,
  estadoClaseCalBlockClass,
  estadoClaseCalAccentClass,
  rowClaseClass,
  rowCertificadoHoyClass,
  certificadoEsDeHoy,
  labelEstadoClaseAmigable,
  labelEstadoJornadaAmigable,
  labelInstructorClase,
  claseTieneInstructor,
} from './jornada-ui.util';
import {
  CertZipProgreso,
  CertificadosZipProgresoModalComponent,
} from './certificados-zip-progreso-modal.component';
import { ejecutarExportZipCertificados } from './certificados-zip-export.helper';

type Tab = 'contratos' | 'avance' | 'jornadas' | 'clases' | 'certificados' | 'finanzas' | 'informes';

const TABS_CON_CONTRATO: Tab[] = ['avance', 'jornadas', 'clases', 'certificados', 'informes'];
type VistaAgenda = 'lista' | 'calendario';

/** Alumno con datos mínimos para mostrar nombre y matricular (búsqueda, clase anterior, etc.). */
type AlumnoNombrable = {
  numDoc: number | string;
  nombreCompleto?: string;
  nombre1?: string;
  nombre2?: string;
  nombres?: string;
  apellido1?: string;
  apellido2?: string;
  apellidos?: string;
};

@Component({
  selector: 'argo-jornadas-hub',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MunicipioBuscarComponent,
    JornadaMapaPickerComponent,
    FormModalComponent,
    ArgoDateInputComponent,
    CatalogoEnumBuscarComponent,
    Hora12InputComponent,
    PagoSoporteFieldComponent,
    NotaCreditoModalComponent,
    ContratoInformesDashboardComponent,
    CertificadosZipProgresoModalComponent,
  ],
  templateUrl: './jornadas-hub.component.html',
  styleUrls: ['./jornadas-hub.component.scss'],
})
export class JornadasHubComponent implements OnInit, OnDestroy {
  private jornadaSvc = inject(JornadaCapService);
  private auth = inject(AuthService);
  private permisoSvc = inject(PermisoService);
  private certAlertSvc = inject(CertificadoJornadaAlertService);
  private metaAlumnosAlertSvc = inject(MetaAlumnosJornadaAlertService);
  private liveSync = inject(JornadaLiveSyncService);
  private certBloqueoSvc = inject(CertificadoJornadaBloqueoService);
  private catSvc = inject(CatalogoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private deeplink = inject(JornadaHubDeepLinkService);
  private destroyRef = inject(DestroyRef);
  private confirmSvc = inject(ConfirmDialogService);
  private asistente = inject(AsistenteContextoService);
  private clienteSvc = inject(ClienteService);
  private feSvc = inject(FacturacionService);
  private comprobanteAlertSvc = inject(ComprobanteHoyAlertService);
  private comprobanteImpresion = inject(ComprobanteHoyImpresionService);
  private cajaSvc = inject(CajaSesionService);
  private ingresoSvc = inject(IngresoService);
  operacionCfg = inject(JornadasOperacionConfigService);
  operacionEspecialActiva = this.operacionCfg.puedeOperarFueraDeDia;

  tab = signal<Tab>('contratos');
  vistaJornadas = signal<VistaAgenda>('lista');
  vistaClases = signal<VistaAgenda>('lista');
  calMes = signal(new Date().getMonth());
  calAnio = signal(new Date().getFullYear());
  semanaInicio = signal(inicioSemana(new Date()));
  jornadasCalendario = signal<JornadaCapDto[]>([]);
  loadingCalJornadas = signal(false);
  calDiaExpandido = signal<string | null>(null);
  readonly calMaxEventosDia = 3;
  msg = signal<string | null>(null);
  msgTipo = signal<JorMsgTipo>('info');
  msgTitulo = signal('');
  modalMsg = signal<string | null>(null);
  modalMsgTipo = signal<JorMsgTipo>('info');
  modalMsgTitulo = signal('');
  msgEsError = signal(false);
  jornadaEditError = signal<string | null>(null);
  direccionAlertaActiva = signal(false);
  loading = signal(false);
  vistaContratoCal = signal(false);
  clasesContratoCal = signal<any[]>([]);
  loadingClasesContratoCal = signal(false);

  contratos = signal<ContratacionDto[]>([]);
  contratoSel = signal<string>('');
  clientesFe = signal<Cliente[]>([]);
  tiposContrato = signal<{ id: string; label: string }[]>([]);
  estadoFacturaContrato = signal<{
    facturado: boolean;
    factura: { _id: string; numeroFactura: string; estado?: string; valorTotal?: number } | null;
  } | null>(null);
  previewFacturaContrato = signal<PreviewFacturaContrato | null>(null);
  estadoCobroContrato = signal<EstadoCobroContratoDto | null>(null);
  generandoCuentaCobro = signal(false);
  generandoComprobanteCuota = signal(false);
  modalComprobanteCuotaOpen = signal(false);
  cuotaComprobanteSel = signal<CuotaPlanCobroDto | null>(null);
  comprobanteCuotaFecha = signal('');
  comprobanteCuotaTipoPago = signal('');
  comprobanteCuotaCuenta = signal('');
  comprobanteCuotaRef = signal('');
  comprobanteCuotaEntraCaja = signal(false);
  comprobanteCuotaObs = signal('');
  comprobanteCuotaArchivoSoporte = signal<File | null>(null);
  comprobanteCuotaPreviewSoporte = signal<string | null>(null);
  tiposPagoContrato = signal<Record<string, unknown>[]>([]);
  cuentasBancariasContrato = signal<Record<string, unknown>[]>([]);
  cajaAbiertaContrato = signal(false);
  emitiendoFactura = signal(false);
  mostrarAuthAnularIngresoContrato = signal(false);
  ingresoAnularContratoPendiente = signal<{ idIngreso: string; cuotaId: string } | null>(null);
  authAdminUserAnular = signal('');
  authAdminPassAnular = signal('');
  facturaContratoNota = signal<FacturaElectronicaItem | null>(null);
  cargandoFacturaContratoNota = signal(false);
  formContrato = signal<ContratacionDto>(this.emptyContrato());
  fechaFinalizacionContrato = signal(ymdLocal(new Date()));
  avanceContrato = signal<AvanceContratoDto | null>(null);
  avanceContratoLoading = signal(false);
  avanceRefreshTick = signal(0);
  formatNumDoc = formatNumDoc;

  /** ID de contrato en la URL (?contrato=) — visible aunque aún no se haya sincronizado contratoSel. */
  contratoDesdeUrl = toSignal(
    this.route.queryParamMap.pipe(map((qp) => String(qp.get('contrato') || '').trim())),
    {
      initialValue: String(this.route.snapshot.queryParamMap.get('contrato') || '').trim(),
    },
  );

  jornadas = signal<any[]>([]);
  jornadasEnProcesoAhora = computed(() => this.jornadas().filter((j) => j?.estado === 'EN PROCESO'));
  jornadaSel = signal<string>('');

  clases = signal<any[]>([]);
  claseSel = signal<string>('');
  claseActiva = signal<any | null>(null);
  programasJornada = signal<any[]>([]);
  programasJornadaLoading = signal(false);
  buscarProgramasContrato = signal('');
  nuevaClaseProg = signal('');
  nuevaClaseUbic = signal('Carpa');
  asistencias = signal<any[]>([]);
  numDocAsis = signal('');
  progresoPreview = signal<ProgresoCertResp | null>(null);
  nombreAlumnoPreview = signal('');
  progresoPreviewLoading = signal(false);

  certsGenerados = signal<any[]>([]);
  certsHoyCount = computed(
    () => this.certsGenerados().filter((c) => certificadoEsDeHoy(c)).length,
  );
  descargandoZipCerts = signal(false);
  zipProgresoOpen = signal(false);
  zipProgreso = signal<CertZipProgreso>({
    status: 'idle',
    fase: '',
    hecho: 0,
    total: 0,
    porcentaje: 0,
  });
  certFiltroJornadaId = signal('');
  certFiltroJornadaTexto = signal('');
  certFiltroClaseId = signal('');
  certFiltroClaseTexto = signal('');
  certFiltroDesde = signal('');
  certFiltroHasta = signal('');
  certFiltroTexto = signal('');

  opcionesCertJornada = computed<EnumBuscarOption[]>(() =>
    (this.jornadas() || []).map((j: any) => ({
      value: String(j._id),
      label: `${fmtFechaCalendario(j.fechaProgramacion)} · ${j.municipio || 'Sin municipio'} · ${j.estado || ''}`.trim(),
    })),
  );

  opcionesCertClase = computed<EnumBuscarOption[]>(() => {
    const jid = this.certFiltroJornadaId() || this.jornadaSel();
    return (this.clases() || [])
      .filter((c: any) => !jid || String(c.idJornada || '') === jid)
      .map((c: any) => ({
        value: String(c._id),
        label: [
          fmtFechaCalendario(c.fechaJornada || c.fechaClase),
          c.programaNombre || c.idPrograma || 'Sin programa',
          c.carpaNombre || '',
        ]
          .filter(Boolean)
          .join(' · '),
      }));
  });

  certsFiltradosVista = computed(() => {
    const q = this.certFiltroTexto().trim().toLowerCase();
    const list = this.certsGenerados();
    if (!q) return list;
    return list.filter((c: any) => {
      const campos = [
        c.nombreCompleto,
        c.encabezado,
        c.codigoCert,
        c.numDoc,
        c.codContrato,
      ];
      return campos.some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  });

  etiquetaProgresoCert = etiquetaProgresoCert;
  etiquetaDeteGeorefe = etiquetaDeteGeorefe;
  etiquetaGenerado = etiquetaGenerado;
  ymdLocal = ymdLocal;
  iconoJorMsg = iconoJorMsg;
  capEstadoJornada = capEstadoJornada;
  capEstadoJornadaColor = capEstadoJornadaColor;
  capEstadoClase = capEstadoClase;
  capUbicacionClase = capUbicacionClase;
  capCarpa = capCarpa;
  labelCarpaClase = labelCarpaClase;
  capDeteGeorefe = capDeteGeorefe;
  capCodContrato = capCodContrato;
  capCliente = capCliente;
  capMunicipioJor = capMunicipioJor;
  capFechaJor = capFechaJor;
  capHoraJor = capHoraJor;
  capMetaNum = capMetaNum;
  capSesCert = capSesCert;
  capHorasCert = capHorasCert;
  capCertCodigo = capCertCodigo;
  capDocAsis = capDocAsis;
  capAlumnoNombre = capAlumnoNombre;
  capPrograma = capPrograma;
  capGenerado = capGenerado;
  capInstructor = capInstructor;
  estadoContratoLiveClass = estadoContratoLiveClass;
  labelEstadoContrato = labelEstadoContrato;
  labelEstadoClaseAmigable = labelEstadoClaseAmigable;
  labelEstadoJornadaAmigable = labelEstadoJornadaAmigable;
  labelInstructorClase = labelInstructorClase;
  claseTieneInstructor = claseTieneInstructor;
  rowContratoClass = rowContratoClass;
  estadoJornadaLiveClass = estadoJornadaLiveClass;
  estadoJornadaCalClass = estadoJornadaCalClass;
  rowJornadaClass = rowJornadaClass;
  estadoClaseLiveClass = estadoClaseLiveClass;
  claseJornadaSePuedeEliminar = claseJornadaSePuedeEliminar;
  estadoClaseCalBlockClass = estadoClaseCalBlockClass;
  estadoClaseCalAccentClass = estadoClaseCalAccentClass;
  esFinDeSemana = esFinDeSemana;
  rowClaseClass = rowClaseClass;
  rowCertificadoHoyClass = rowCertificadoHoyClass;
  certificadoEsDeHoy = certificadoEsDeHoy;
  esFechaHoy = esFechaHoy;
  private progresoDebounce: ReturnType<typeof setTimeout> | null = null;

  contratoActivo = computed(() => this.contratos().find((c) => c._id === this.contratoSel()));

  contratoAvanceId = computed(
    () => this.contratoSel() || this.formContrato()._id || this.contratoDesdeUrl() || '',
  );

  contratoAvanceMeta = computed(() => {
    const id = this.contratoAvanceId();
    if (!id) return null;
    const c = this.buscarContratoPorId(id);
    if (c) return c;
    if (this.mismoContratoId(this.formContrato()._id, id)) return this.formContrato();
    return null;
  });

  avanceContratoAlumnos = computed(() => this.avanceContrato()?.alumnos ?? []);

  avanceContratoResumen = computed(() => this.avanceContrato()?.resumen ?? null);
  puedeAgregarJornadaExtra = computed(() => {
    if (!this.puedeAsignarInstructor()) return false;
    const c = this.contratoActivo();
    if (!c?._id) return false;
    return (c.estado || 'En Ejecución') !== 'Ejecutado';
  });
  puedeAsignarInstructor = computed(() => this.permisoSvc.tiene('jornadas.gestionar'));
  puedeEditarHorarioClase = computed(() =>
    this.permisoSvc.tiene(['jornadas.gestionar', 'jornadas.operar']),
  );
  /** Solo administrador (jornadas.gestionar) puede eliminar clases (cualquier estado). */
  puedeEliminarClase = computed(() => this.permisoSvc.tiene('jornadas.gestionar'));
  puedeEliminarClaseActiva = computed(
    () => this.puedeEliminarClase() && claseJornadaSePuedeEliminar(this.claseActiva()?.estado),
  );
  inscritosConAsistencia = computed(() => this.inscritos().filter((i) => i.tieneAsistencia).length);
  /** Inscritos que aún requieren asistencia (excluye certificados vigentes en el contrato). */
  inscritosPendientesAsistencia = computed(() =>
    this.inscritos().filter((i) => !i.tieneAsistencia && !i.yaCertificadoContrato),
  );
  inscritosSinAsistencia = computed(() => this.inscritosPendientesAsistencia().length);
  inscritosCertificadosContrato = computed(() =>
    this.inscritos().filter((i) => i.yaCertificadoContrato).length,
  );
  /** Alumnos de la clase fuente que aún no están matriculados en la clase actual. */
  alumnosClaseAnteriorDisponibles = computed(() => {
    const inscritosDocs = new Set(this.inscritos().map((i) => Number(i.numDoc)));
    return this.alumnosClaseAnterior().filter((a) => !inscritosDocs.has(Number(a.numDoc)));
  });
  /** Sin clase previa automática en la jornada (primera clase). */
  claseAnteriorSinPrevia = signal(false);
  opcionesClasesCopiarContrato = computed<EnumBuscarOption[]>(() => {
    const actual = String(this.claseSel() || '');
    return this.clasesContratoCopiar()
      .filter((c) => String(c._id) !== actual)
      .map((c) => ({
        value: String(c._id),
        label: this.labelClaseCopiar(c),
      }));
  });
  claseAnteriorMensajeVacio = computed(() => {
    if (this.cargandoAlumnosClaseAnterior() || !this.idClaseFuenteCopiar()) return '';
    if (this.alumnosClaseAnteriorDisponibles().length > 0) return '';
    if (this.alumnosClaseAnterior().length === 0) {
      return this.claseAnteriorInfo()
        ? 'La clase elegida no tiene alumnos inscritos.'
        : 'No hay alumnos para copiar de esa clase. Elija otra del listado.';
    }
    return 'Los alumnos de esa clase ya están matriculados en la clase actual.';
  });
  totalAlumnosMatriculadosModal = computed(() =>
    this.modalModoClase() === 'editar'
      ? this.inscritos().length
      : this.alumnosMatricular().length,
  );
  instructorSesionNombre = computed(
    () => this.auth.user()?.empleado?.nombreCompleto || this.auth.user()?.username || '—',
  );

  hoyKey = computed(() => ymdLocal(new Date()));
  tituloMesCal = computed(() => fmtMesAnio(this.calAnio(), this.calMes()));
  calCeldas = computed((): CeldaMes[] => celdasMes(this.calAnio(), this.calMes()));
  jornadasPorDia = computed(() =>
    agruparPorFecha(this.jornadasCalendario(), (j) => ymdCalendario(j.fechaProgramacion)),
  );
  tituloSemanaCal = computed(() => fmtRangoSemana(this.semanaInicio()));
  diasSemanaClases = computed((): DiaSemana[] => diasSemana(this.semanaInicio()));
  horasCal = horasSlots();
  diasSemanaLabels = DIAS_SEMANA_CORTO;
  clasesCalFuente = computed(() =>
    this.tab() === 'contratos' && this.vistaContratoCal() ? this.clasesContratoCal() : this.clases(),
  );
  clasesCalFuenteFiltradas = computed(() => {
    const src = this.clasesCalFuente();
    const idJ = this.jornadaSel();
    if (!idJ) return src;
    return src.filter((c) => String(c.idJornada || '') === idJ);
  });
  clasesSemanaFiltradas = computed(() => {
    const est = this.filtroAdminEstado();
    const keys = new Set(this.diasSemanaClases().map((d) => d.key));
    return this.clasesCalFuenteFiltradas().filter((c) => {
      if (!keys.has(ymdLocal(c.fechaJornada))) return false;
      if (!est) return true;
      return String(c.estado || '').toUpperCase() === est.toUpperCase();
    });
  });
  clasesPorDiaSemanaFiltradas = computed(() =>
    agruparPorFecha(this.clasesSemanaFiltradas(), (c) => ymdLocal(c.fechaJornada)),
  );
  clasesSinHorarioSemana = computed(() => {
    const keys = new Set(this.diasSemanaClases().map((d) => d.key));
    return this.clasesSemanaFiltradas().filter((c) => {
      if (!keys.has(ymdLocal(c.fechaJornada))) return false;
      return layoutHorarioClase(c.horaInicio, c.horaFin).sinHorario;
    });
  });
  clasesSemanaResumen = computed(() => {
    const items = this.clasesSemanaFiltradas();
    let programada = 0;
    let proceso = 0;
    let finalizado = 0;
    for (const c of items) {
      const e = String(c.estado || '').toUpperCase();
      if (e === 'EN PROCESO') proceso++;
      else if (e === 'FINALIZADO') finalizado++;
      else programada++;
    }
    return { total: items.length, programada, proceso, finalizado };
  });
  jornadasMesActual = computed(() => {
    const keysMes = new Set(
      this.calCeldas().filter((c) => !c.otroMes && c.key).map((c) => c.key),
    );
    return this.jornadasCalendario().filter((j) => keysMes.has(ymdCalendario(j.fechaProgramacion)));
  });
  jornadasMesResumen = computed(() => {
    const items = this.jornadasMesActual();
    let inactivo = 0;
    let proceso = 0;
    let finalizado = 0;
    for (const j of items) {
      const e = String(j.estado || '').toUpperCase();
      if (e === 'EN PROCESO') proceso++;
      else if (e === 'FINALIZADO') finalizado++;
      else inactivo++;
    }
    return { total: items.length, inactivo, proceso, finalizado };
  });
  ahoraCalTopPct = computed(() => {
    this.diasSemanaClases();
    return ahoraLineaTopPct(new Date());
  });
  semanaIncluyeHoy = computed(() => this.diasSemanaClases().some((d) => d.key === this.hoyKey()));

  /** Jornadas EN PROCESO = fecha programada = hoy (según el equipo). */
  jornadasOperablesHoy = computed(() =>
    this.jornadas().filter((j) => j.estado === 'EN PROCESO'),
  );

  /** Jornadas del contrato activo, ordenadas por fecha. */
  jornadasContratoOrdenadas = computed(() =>
    [...this.jornadas()].sort((a, b) =>
      String(a.fechaProgramacion || '').localeCompare(String(b.fechaProgramacion || '')),
    ),
  );

  opcionesJornadasFiltroClases = computed<EnumBuscarOption[]>(() => {
    const rows = this.jornadasContratoOrdenadas();
    if (!rows.length) {
      return [{ value: '', label: 'Sin jornadas en el contrato' }];
    }
    return [
      { value: '', label: 'Todas las jornadas del contrato' },
      ...rows.map((j) => ({
        value: j._id || '',
        label: this.etiquetaJornadaFiltro(j),
      })),
    ];
  });

  textoJornadaFiltroClases = computed(() => {
    const id = this.jornadaSel();
    if (!id) return '';
    const j = this.jornadas().find((x) => x._id === id);
    return j ? this.etiquetaJornadaFiltro(j) : '';
  });

  clasesListaFiltradas = computed(() => this.clases());

  ubicaciones = ['Carpa', 'Domo', 'Empresa', 'Colegio', 'Auditorio', 'Coliseo', 'Estadio', 'Otro'];

  supervisores = signal<{ _id: string; nombre: string }[]>([]);
  instructores = signal<InstructorJornadaDto[]>([]);
  ciudadContratoTexto = signal('');
  supNuevoNombre = signal('');

  jornadaEdit = signal<JornadaCapDto | null>(null);
  jornadaEditLat = signal('');
  jornadaEditLng = signal('');
  jornadaEditDeteGeorefe = signal<DeteGeorefe>('');
  jornadaEditDireccion = signal('');
  jornadaEditMunicipio = signal('');
  jornadaEditDepto = signal('');
  jornadaEditCodMunicipio = signal('');
  jornadaEditMunicipioTexto = signal('');
  jornadaEditSupervisor = signal('');
  jornadaEditIdSupervisor = signal('');
  jornadaEditFecha = signal('');
  jornadaEditMapaAbierto = signal(false);
  /** edit = jornada existente; nueva = jornada extra manual. */
  jornadaEditModo = signal<'edit' | 'nueva'>('edit');
  /** Autogenerar clases al crear jornada extra (según clasesPorJornada del contrato). */
  jornadaEditGenerarClases = signal(true);
  supNuevoNombreJornada = signal('');

  opcionesSupervisores = computed<EnumBuscarOption[]>(() =>
    this.supervisores().map((s) => ({ value: s._id, label: s.nombre })),
  );

  opcionesClientesContrato = computed<EnumBuscarOption[]>(() =>
    this.clientesFe().map((c) => ({
      value: c._id || '',
      label: `${c.nombre || c.razonSocial || c.nombres || '—'} · ${c.identificacion}`,
    })),
  );

  textoClienteContrato = computed(() => {
    const cli = this.clienteFeSeleccionado();
    if (!cli) return '';
    const nom = (cli.nombre || cli.razonSocial || cli.nombres || '').trim();
    return nom ? `${nom} · ${cli.identificacion}` : String(cli.identificacion || '');
  });

  opcionesContratosToolbar = computed<EnumBuscarOption[]>(() =>
    this.contratos().map((c) => ({
      value: c._id || '',
      label: this.labelContrato(c),
    })),
  );

  textoContratoSel = computed(() => {
    const id = this.contratoSel();
    if (!id) return '';
    const c = this.contratos().find((x) => x._id === id);
    return c ? this.labelContrato(c) : '';
  });

  opcionesJornadasHoyToolbar = computed<EnumBuscarOption[]>(() =>
    this.opcionesJornadasFiltroClases(),
  );

  textoJornadaSel = computed(() => this.textoJornadaFiltroClases());

  textoSupervisorContrato = computed(() => {
    const id = this.formContrato().idSupervisor || '';
    if (!id) return '';
    return this.supervisores().find((s) => s._id === id)?.nombre || this.formContrato().supervisor || '';
  });

  textoSupervisorJornadaEdit = computed(() => {
    const id = this.jornadaEditIdSupervisor();
    if (!id) return '';
    return this.supervisores().find((s) => s._id === id)?.nombre || this.jornadaEditSupervisor() || '';
  });

  opcionesJornadasCrear = computed<EnumBuscarOption[]>(() =>
    this.jornadasParaCrear().map((j) => ({
      value: j._id,
      label: `${this.labelJornadaCorta(j)} — ${j.estado}`,
    })),
  );

  textoJornadaModal = computed(() => {
    const id = this.modalCrearJornadaId();
    if (!id) return '';
    const j =
      this.jornadasParaCrear().find((x) => x._id === id) ||
      this.jornadas().find((x) => x._id === id);
    return j ? `${this.labelJornadaCorta(j)} — ${j.estado}` : '';
  });

  opcionesUbicacionClase = computed<EnumBuscarOption[]>(() =>
    this.ubicaciones.map((u) => ({ value: u, label: u })),
  );

  textoUbicacionClase = computed(() => this.nuevaClaseUbic() || 'Carpa');

  opcionesInstructoresModal = computed<EnumBuscarOption[]>(() => [
    { value: '', label: '— Automático (usuario actual) —' },
    ...this.instructores().map((i) => ({
      value: i.idEmpleado,
      label: i.nombreCompleto,
    })),
  ]);

  textoInstructorModal = computed(() => {
    const id = this.modalClaseInstructorId();
    if (!id) return '— Automático (usuario actual) —';
    const i = this.instructores().find((x) => Number(x.idEmpleado) === Number(id));
    return i?.nombreCompleto || '';
  });

  opcionesProgramasModal = computed<EnumBuscarOption[]>(() => {
    const base = this.programasJornada().map((p) => ({
      value: this.programaOptionValue(p),
      label: String(p.nombreProg || p.codigoProg || ''),
    }));
    const v = this.nuevaClaseProg();
    if (v && !this.buscarProgramaEnLista(v)) {
      return [{ value: v, label: this.etiquetaProgramaModal() }, ...base];
    }
    return base;
  });

  /** Programas para el selector de certificación global del contrato. */
  opcionesProgramaCertificacion = computed<EnumBuscarOption[]>(() => {
    const base = this.programasJornada().map((p) => {
      const id = this.programaOptionValue(p);
      const cod = String(p.codigoProg || '').trim();
      const nom = String(p.nombreProg || '').trim();
      const horas = p.horas != null ? ` · ${p.horas} h` : '';
      return {
        value: id,
        label: cod ? `${cod} — ${nom}${horas}` : `${nom || id}${horas}`,
      };
    });
    const v = String(this.formContrato().idProgramaCertificacion || '').trim();
    if (v && !base.some((o) => String(o.value) === v)) {
      return [{ value: v, label: this.programaContratoLabel(v) }, ...base];
    }
    return base;
  });

  textoProgramaCertificacion = computed(() => {
    const v = String(this.formContrato().idProgramaCertificacion || '').trim();
    if (!v) return '';
    const opt = this.opcionesProgramaCertificacion().find((o) => String(o.value) === v);
    return opt?.label || this.programaContratoLabel(v);
  });

  textoProgramaModalCombo = computed(() => {
    const v = this.nuevaClaseProg();
    if (!v) return '';
    return this.etiquetaProgramaModal();
  });

  programasContratoFiltrados = computed(() => {
    const q = this.buscarProgramasContrato().trim().toLowerCase();
    const list = this.programasJornada();
    if (!q) return list;
    return list.filter(
      (p) =>
        String(p.nombreProg || '').toLowerCase().includes(q) ||
        String(p.codigoProg || '').toLowerCase().includes(q) ||
        this.programaOptionValue(p).toLowerCase().includes(q),
    );
  });

  georefLoading = signal(false);
  private georefDebounce: ReturnType<typeof setTimeout> | null = null;

  claseEditando = signal(false);
  claseEditProg = signal('');
  claseEditUbic = signal('Carpa');
  claseEditInstructorId = signal<number | ''>('');

  /** Modo de operación de la pestaña Clases: 'operar' (jornada del día) o 'admin' (todas). */
  modoClases = signal<'operar' | 'admin'>('operar');
  filtroAdminEstado = signal<string>('');

  modalCrearClase = signal(false);
  /** 'nuevo' = crea; 'editar' = abre clase existente */
  modalModoClase = signal<'nuevo' | 'editar'>('nuevo');
  subiendoFotoEvidencia = signal(false);
  modalHoraInicio = signal('');
  modalHoraFin = signal('');
  readonly opcionesHoras = listaOpcionesHora(15);
  modalClaseInstructorId = signal<number | ''>('');
  guardandoClase = signal(false);
  alumnoBusqueda = signal('');
  alumnoBusquedaOpen = signal(false);
  alumnoBusquedaLoading = signal(false);
  alumnoBusquedaResults = signal<AlumnoListItem[]>([]);
  alumnosMatricular = signal<AlumnoListItem[]>([]);
  /** Alumnos ya matriculados al programa (modo editar) con flag de asistencia */
  inscritos = signal<
    Array<{
      numDoc: number;
      nombreCompleto: string;
      tieneAsistencia: boolean;
      asistenciaAt?: string | null;
      yaCertificadoContrato?: boolean;
      certificadoCodigo?: string | null;
      certificadoId?: string | null;
    }>
  >([]);
  guardandoAsistencia = signal<number | null>(null);
  guardandoInscripcion = signal(false);
  cronometroDisplay = signal('00:00:00');

  /** Utilidad «Copiar alumnos de otra clase del contrato». */
  claseAnteriorInfo = signal<ClaseAnteriorResumenDto | null>(null);
  alumnosClaseAnterior = signal<AlumnoClaseAnteriorItem[]>([]);
  cargandoAlumnosClaseAnterior = signal(false);
  /** Evita que una respuesta auto/atrasada pise una selección manual. */
  private reqAlumnosClaseAnteriorSeq = 0;
  alumnosClaseAnteriorSeleccion = signal<Set<number>>(new Set());
  matriculandoDesdeAnterior = signal(false);
  /** Otras clases del mismo contrato (para combo manual). */
  clasesContratoCopiar = signal<any[]>([]);
  idClaseFuenteCopiar = signal('');
  textoClaseFuenteCopiar = signal('');
  private cronometroTimer: ReturnType<typeof setInterval> | null = null;
  private alumnoBusqueda$ = new Subject<string>();
  private livePollTimer: ReturnType<typeof setInterval> | null = null;
  private ultimoLiveTick = 0;
  private jornadaPendienteQp = signal<string | null>(null);
  private clasePendienteQp = signal<string | null>(null);
  private tabPendienteQp = signal<Tab | null>(null);
  private deepLinkPendiente: JornadaHubDeepLink | null = null;
  private avanceFetchGen = 0;
  private contratosListos = false;

  constructor() {
    effect(() => {
      const tick = this.liveSync.refreshTick();
      if (tick <= this.ultimoLiveTick) return;
      this.ultimoLiveTick = tick;
      const t = this.tab();
      if (t === 'jornadas') this.recargarVistaJornadas();
      else if (t === 'clases') this.recargarClases();
    });
    effect(() => {
      if (this.modalCrearClase()) {
        this.asistente.setTipsPrepend([
          tipFormulario('Esta clase', this.subtituloModalClase(), 'jor-clase-ctx'),
        ]);
      } else {
        this.asistente.clearTipsPrepend();
      }
    });
    effect(() => {
      const id = this.contratoAvanceId();
      this.avanceRefreshTick();
      if (this.tab() !== 'avance' || !id) {
        if (!id) {
          this.avanceContrato.set(null);
          this.avanceContratoLoading.set(false);
        }
        return;
      }
      const gen = ++this.avanceFetchGen;
      this.avanceContratoLoading.set(true);
      this.jornadaSvc.avanceContrato(id).subscribe({
        next: (av) => {
          if (gen !== this.avanceFetchGen) return;
          this.avanceContrato.set(av);
          this.avanceContratoLoading.set(false);
        },
        error: () => {
          if (gen !== this.avanceFetchGen) return;
          this.avanceContrato.set(null);
          this.avanceContratoLoading.set(false);
        },
      });
    });
    effect(() => {
      const idUrl = this.contratoDesdeUrl();
      const n = this.contratos().length;
      if (!idUrl || !n || !this.contratosListos) return;
      if (this.contratoSel() && this.mismoContratoId(this.contratoSel(), idUrl)) return;
      const c = this.buscarContratoPorId(idUrl);
      if (!c) return;
      this.contratoSel.set(String(c._id));
      if (!this.mismoContratoId(this.formContrato()._id, c._id)) {
        this.editarContratoSinAvance(c);
      }
    });
  }

  ngOnInit() {
    this.operacionCfg.cargar();
    this.cargarSupervisores();
    this.cargarInstructores();
    this.cargarProgramasJornada();
    this.cargarDatosFacturacionContrato();
    this.cargarCatalogosCobroContrato();
    this.jornadaSvc.listarContratos().subscribe({
      next: (rows) => {
        this.contratos.set(rows || []);
        this.contratosListos = true;
        this.aplicarQueryParams(this.route.snapshot.queryParamMap);
        if (this.deepLinkPendiente) {
          this.aplicarDeepLink(this.deepLinkPendiente);
          this.deepLinkPendiente = null;
        }
      },
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((qp) => {
      if (!this.contratosListos) return;
      this.aplicarQueryParams(qp);
    });
    this.deeplink.nav$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((link) => {
      if (!this.contratosListos) {
        this.deepLinkPendiente = link;
        return;
      }
      this.aplicarDeepLink(link);
    });
    this.alumnoBusqueda$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((q) => {
          this.alumnoBusquedaLoading.set(true);
          return this.jornadaSvc.buscarAlumnos(q, 12);
        }),
      )
      .subscribe({
        next: (rows) => {
          this.alumnoBusquedaLoading.set(false);
          this.alumnoBusquedaResults.set(rows || []);
        },
        error: () => {
          this.alumnoBusquedaLoading.set(false);
          this.alumnoBusquedaResults.set([]);
        },
      });
  }

  ngOnDestroy() {
    this.detenerCronometro();
    this.detenerLivePoll();
  }

  private aplicarQueryParams(qp: ParamMap) {
    const contratoQp = qp.get('contrato');
    const nuevoQp = qp.get('nuevo');
    const tabQp = qp.get('tab');
    const jornadaQp = qp.get('jornada');
    const claseQp = qp.get('clase');

    if (claseQp) this.clasePendienteQp.set(claseQp);
    else this.clasePendienteQp.set(null);

    if (nuevoQp) {
      this.formContrato.set(this.emptyContrato());
      this.ciudadContratoTexto.set('');
      this.tab.set('contratos');
      return;
    }
    if (!contratoQp) return;

    const tab =
      tabQp === 'jornadas' ||
        tabQp === 'clases' ||
        tabQp === 'certificados' ||
        tabQp === 'informes' ||
        tabQp === 'finanzas' ||
        tabQp === 'contratos' ||
        tabQp === 'avance'
        ? tabQp
        : undefined;
    this.aplicarDeepLink({ contrato: contratoQp, tab, jornada: jornadaQp || undefined });
  }

  private aplicarDeepLink(link: { contrato: string; tab?: Tab; jornada?: string }) {
    const idContrato = String(link.contrato || '').trim();
    if (!idContrato) return;

    const tabDest = link.tab;
    if (
      tabDest === 'jornadas' ||
      tabDest === 'clases' ||
      tabDest === 'certificados' ||
      tabDest === 'informes' ||
      tabDest === 'finanzas' ||
      tabDest === 'contratos' ||
      tabDest === 'avance'
    ) {
      this.tab.set(tabDest);
      this.tabPendienteQp.set(tabDest);
    } else {
      this.tabPendienteQp.set(null);
    }
    if (link.jornada) this.jornadaPendienteQp.set(link.jornada);
    else this.jornadaPendienteQp.set(null);

    this.contratoSel.set(idContrato);

    const c = this.buscarContratoPorId(idContrato);
    const tab = this.tabPendienteQp();
    if (tab === 'jornadas' || tab === 'clases' || tab === 'avance') {
      this.tab.set(tab);
      if (c) this.onContratoSelChange(idContrato);
      else if (tab === 'jornadas') this.recargarVistaJornadas();
    } else if (c) {
      this.editarContrato(c);
      if (tab === 'certificados') {
        this.tab.set('certificados');
        this.recargarCerts();
      } else if (tab === 'informes') {
        this.tab.set('informes');
      } else if (tab === 'finanzas') {
        this.tab.set('finanzas');
        this.cargarFinanzasContrato();
      } else {
        this.tab.set('contratos');
      }
    } else if (tab) {
      this.tab.set(tab);
      if (tab === 'certificados') this.recargarCerts();
      if (tab === 'finanzas') this.cargarFinanzasContrato();
    } else {
      this.tab.set('contratos');
    }
  }

  private mismoContratoId(a?: string | null, b?: string | null): boolean {
    return String(a || '').trim() === String(b || '').trim();
  }

  private buscarContratoPorId(id?: string | null): ContratacionDto | undefined {
    const key = String(id || '').trim();
    if (!key) return undefined;
    return this.contratos().find((x) => this.mismoContratoId(x._id, key));
  }

  ESTADOS_CONTRATO: ReadonlyArray<'En Ejecución' | 'Ejecutado'> = ['En Ejecución', 'Ejecutado'];

  emptyContrato(): ContratacionDto {
    return {
      pais: 'Colombia',
      estado: 'En Ejecución',
      codContrato: '',
      objetoContrato: '',
      idClienteFacturacion: null,
      valorContrato: 0,
      comprobantesIngresoCaja: false,
      planCobro: [],
      numerojornadas: 1,
      jornadasPorDia: 1,
      clasesPorJornada: 1,
      tipoCertificado: 'global',
      idProgramaCertificacion: '',
      numeroAlumnos: 0,
      numSesCert: 1,
      incluiSab: false,
      incluiDom: false,
      incluiFest: false,
      idProgramas: [],
    };
  }

  nuevoContratoForm() {
    this.formContrato.set(this.emptyContrato());
    this.avanceContrato.set(null);
    this.ciudadContratoTexto.set('');
    this.fechaFinalizacionContrato.set(ymdLocal(new Date()));
  }

  abrirContratoEnJornadas(c: ContratacionDto, ev?: Event) {
    ev?.stopPropagation();
    if (!c._id) return;
    this.contratoSel.set(c._id);
    this.editarContrato(c);
    this.setTab('jornadas');
  }

  cambiarEstadoContrato(c: ContratacionDto, estado: string, ev?: Event) {
    ev?.stopPropagation();
    if (!c._id || c.estado === estado) return;
    this.jornadaSvc.actualizarContrato(c._id, { ...c, estado }).subscribe({
      next: (actualizado) => {
        this.contratos.update((arr) =>
          arr.map((x) => (x._id === actualizado._id ? actualizado : x)),
        );
        if (this.formContrato()._id === actualizado._id) {
          this.formContrato.update((f) => ({
            ...f,
            estado: actualizado.estado,
            fechaFinalizacion: actualizado.fechaFinalizacion,
          }));
        }
        if (actualizado.estado === 'Ejecutado' && this.contratoSel() === actualizado._id) {
          this.recargarVistaJornadas();
        }
        this.mostrarMsg(
          `Contrato marcado como «${actualizado.estado}».`,
          actualizado.estado === 'Ejecutado' ? 'info' : 'ok',
          'Estado actualizado',
        );
      },
      error: (e) =>
        this.mostrarMsg(e?.error?.message || 'No se pudo cambiar el estado.', 'error', 'Error'),
    });
  }

  contratoFormEjecutado(): boolean {
    // Solo el estado exacto "Ejecutado" (misma regla que el resto del hub).
    return String(this.formContrato().estado || '').trim() === 'Ejecutado';
  }

  /**
   * Normaliza el tipo de certificación del contrato (global | por_clase).
   * Acepta variantes guardadas antiguas: "por clase", "por-clase", etc.
   */
  normalizarTipoCertificadoContrato(raw: unknown): 'global' | 'por_clase' {
    const t = String(raw ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_');
    if (t === 'por_clase' || t === 'porclase') return 'por_clase';
    return 'global';
  }

  /** Tipo de certificación efectivo del formulario. */
  contratoTipoCertificado(): 'global' | 'por_clase' {
    return this.normalizarTipoCertificadoContrato(this.formContrato().tipoCertificado);
  }

  esCertPorClase(): boolean {
    return this.contratoTipoCertificado() === 'por_clase';
  }

  esCertGlobal(): boolean {
    return this.contratoTipoCertificado() === 'global';
  }

  /** Campos de Programas del contrato: solo editables en modo por_clase. */
  programasContratoDeshabilitados(): boolean {
    return this.esCertGlobal();
  }

  /** Programas editables (atajo positivo para la plantilla). */
  programasContratoHabilitados(): boolean {
    return !this.programasContratoDeshabilitados();
  }

  /** Atenúa la sección que no aplica al tipo actual. */
  programasSeccionInactiva(): boolean {
    return this.esCertGlobal();
  }

  certificadoSeccionInactiva(): boolean {
    return this.esCertPorClase();
  }

  /** Vista previa de encabezado/horas según el programa de certificación global. */
  previewCertificadoGlobal(): { encabezado: string; horas: string } | null {
    if (!this.esCertGlobal()) return null;
    const id = String(this.formContrato().idProgramaCertificacion || '').trim();
    if (!id) return null;
    const p = this.buscarProgramaEnLista(id);
    if (!p) {
      return { encabezado: '(programa no encontrado en catálogo)', horas: '—' };
    }
    const encabezado = String(p.nomCert || p.descripcion || p.nombreProg || '').trim() || '—';
    const h = p.horas != null && Number(p.horas) > 0 ? String(p.horas) : '—';
    return { encabezado, horas: h };
  }

  onProgramaCertificacionPick(opt: EnumBuscarOption): void {
    const id = String(opt?.value ?? '').trim();
    this.patchContrato('idProgramaCertificacion', id);
  }

  onProgramaCertificacionLimpiar(): void {
    this.patchContrato('idProgramaCertificacion', '');
  }

  async finalizarContratoActual() {
    const f = this.formContrato();
    if (!f._id) {
      this.mostrarMsg('Guarde el contrato antes de finalizarlo.', 'warn', 'Contrato sin guardar');
      return;
    }
    if (this.contratoFormEjecutado()) return;
    const cod = (f.codContrato || '').trim() || 'este contrato';
    const ok = await this.confirmSvc.open({
      title: 'Finalizar contrato',
      message: `¿Marcar «${cod}» como Ejecutado con fecha ${this.fmtFecha(this.fechaFinalizacionContrato())}? Las jornadas activas dejarán de generar alertas.`,
      confirmLabel: 'Finalizar contrato',
      variant: 'danger',
    });
    if (!ok) return;
    this.loading.set(true);
    this.jornadaSvc.finalizarContrato(f._id, this.fechaFinalizacionContrato()).subscribe({
      next: (r) => {
        this.loading.set(false);
        const c = r.contrato;
        this.formContrato.set({
          ...c,
          objetoContrato: c.objetoContrato || c.objeto || '',
          fechaInicJornadas: c.fechaInicJornadas ? ymdCalendario(c.fechaInicJornadas) : '',
        });
        this.recargarContratos();
        if (this.contratoSel() === c._id) this.recargarVistaJornadas();
        this.cargarAvanceContrato(c._id);
        this.mostrarMsg(
          r.message || 'Contrato finalizado correctamente.',
          'ok',
          'Contrato ejecutado',
        );
      },
      error: (e) => {
        this.loading.set(false);
        this.mostrarMsg(e?.error?.message || 'No se pudo finalizar el contrato.', 'error', 'Error');
      },
    });
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'contratos') {
      this.cargarProgramasJornada();
    }
    if (TABS_CON_CONTRATO.includes(t)) {
      if (!this.contratoSel() && this.contratos().length) {
        const c = this.contratos()[0];
        if (c._id) this.onContratoSelChange(c._id);
      }
    }
    if (t === 'avance') this.cargarAvanceContrato();
    if (t === 'jornadas') this.recargarVistaJornadas();
    if (t === 'clases') {
      this.cargarProgramasJornada();
      this.cargarInstructores();
      if (this.contratoSel()) {
        this.jornadaSvc.listarJornadas({ idContrato: this.contratoSel() }).subscribe({
          next: (r) => {
            this.jornadas.set(r || []);
            this.autoSeleccionarJornadaHoy();
            this.recargarClases();
          },
        });
      } else {
        this.recargarClases();
      }
    }
    if (t === 'certificados') {
      if (this.contratoSel()) {
        this.jornadaSvc.listarJornadas({ idContrato: this.contratoSel() }).subscribe({
          next: (r) => {
            this.jornadas.set(r || []);
            this.recargarClases();
          },
        });
      }
      this.recargarCerts();
    }
    if (t === 'finanzas') {
      if (!this.contratoSel() && this.contratos().length) {
        const c = this.contratos()[0];
        if (c._id) this.onContratoSelChange(c._id);
      }
      this.cargarFinanzasContrato();
    }
    this.syncLivePoll();
  }

  /** Refresco periódico de listados en pestañas Jornadas / Clases (vista admin). */
  private syncLivePoll() {
    this.detenerLivePoll();
    if (!this.puedeAsignarInstructor()) return;
    const t = this.tab();
    if (t !== 'jornadas' && t !== 'clases') return;
    this.livePollTimer = setInterval(() => {
      const tab = this.tab();
      if (tab === 'jornadas') this.recargarVistaJornadas();
      else if (tab === 'clases') this.recargarClases();
    }, 10_000);
  }

  private detenerLivePoll() {
    if (this.livePollTimer) {
      clearInterval(this.livePollTimer);
      this.livePollTimer = null;
    }
  }

  cargarProgramasJornada() {
    if (this.programasJornadaLoading()) return;
    this.programasJornadaLoading.set(true);
    this.jornadaSvc.programasJornadaCap().subscribe({
      next: (p) => {
        this.programasJornadaLoading.set(false);
        this.programasJornada.set(p || []);
        if (this.modalCrearClase()) {
          const idRaw = this.nuevaClaseProg() || this.claseActiva()?.idPrograma;
          if (idRaw) this.sincronizarProgramaModal(String(idRaw));
        }
      },
      error: () => {
        this.programasJornadaLoading.set(false);
        this.programasJornada.set([]);
      },
    });
  }

  /** Mismo criterio que el backend al guardar idPrograma en la clase. */
  programaOptionValue(p: { idPrograma?: unknown; _id?: unknown; idProg?: unknown }): string {
    if (p?.idPrograma != null && String(p.idPrograma).trim() !== '') {
      return String(p.idPrograma);
    }
    if (p?._id != null) return String(p._id);
    if (p?.idProg != null && String(p.idProg).trim() !== '') return String(p.idProg);
    return '';
  }

  buscarProgramaEnLista(idProg?: string | null) {
    const id = String(idProg ?? '').trim();
    if (!id) return undefined;
    return this.programasJornada().find((p) => {
      const claves = [p.idPrograma, p._id, p.idProg, p.codigoProg]
        .filter((v) => v != null && String(v).trim() !== '')
        .map((v) => String(v));
      return claves.includes(id);
    });
  }

  sincronizarProgramaModal(idProgRaw?: string | null) {
    const id = String(idProgRaw ?? '').trim();
    if (!id) {
      this.nuevaClaseProg.set('');
      return;
    }
    const hit = this.buscarProgramaEnLista(id);
    this.nuevaClaseProg.set(hit ? this.programaOptionValue(hit) : id);
  }

  programaModalEnLista(): boolean {
    const v = this.nuevaClaseProg();
    if (!v) return true;
    return !!this.buscarProgramaEnLista(v);
  }

  etiquetaProgramaModal(): string {
    const v = this.nuevaClaseProg();
    if (!v) return '';
    const p = this.buscarProgramaEnLista(v);
    if (p) return String(p.nombreProg || p.codigoProg || v);
    const cl = this.claseActiva();
    return String(cl?.programaNombre || v);
  }

  programaContratoLabel(id: string): string {
    const idStr = String(id).trim();
    const p = this.buscarProgramaEnLista(idStr);
    if (!p) return idStr;
    const cod = String(p.codigoProg || '').trim();
    return cod ? `${cod} — ${p.nombreProg}` : String(p.nombreProg || idStr);
  }

  tieneProgramaContrato(idPrograma: string): boolean {
    const id = String(idPrograma).trim();
    return (this.formContrato().idProgramas || []).some((x) => String(x).trim() === id);
  }

  toggleProgramaContrato(idPrograma: string, checked: boolean): void {
    if (this.programasContratoDeshabilitados()) return;
    const id = String(idPrograma).trim();
    if (!id) return;
    const set = new Set((this.formContrato().idProgramas || []).map(String));
    if (checked) set.add(id);
    else set.delete(id);
    this.patchContrato('idProgramas', [...set]);
  }

  async limpiarProgramasContrato(): Promise<void> {
    if (this.programasContratoDeshabilitados()) return;
    if (!this.cantidadProgramasContrato()) return;
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: '¿De verdad desea quitar todos los programas seleccionados de este contrato?',
      variant: 'danger',
      confirmLabel: 'Sí, quitar todos',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    this.patchContrato('idProgramas', []);
  }

  cantidadProgramasContrato(): number {
    return (this.formContrato().idProgramas || []).filter((id) => String(id).trim()).length;
  }

  cargarInstructores() {
    this.jornadaSvc.listarInstructores().subscribe({
      next: (r) => this.instructores.set(r || []),
      error: () => this.instructores.set([]),
    });
  }

  cargarSupervisores() {
    this.jornadaSvc.listarSupervisores().subscribe({
      next: (r) => this.supervisores.set(r || []),
    });
  }

  onClaseInstructorChange(id: string) {
    this.claseEditInstructorId.set(id ? Number(id) : '');
  }

  onModalClaseInstructorChange(id: string) {
    this.modalClaseInstructorId.set(id ? Number(id) : '');
  }

  abrirModalCrearClase() {
    this.modalModoClase.set('nuevo');
    this.claseActiva.set(null);
    this.claseSel.set('');
    this.modalClaseInstructorId.set('');
    this.alumnoBusqueda.set('');
    this.alumnoBusquedaResults.set([]);
    this.alumnoBusquedaOpen.set(false);
    this.alumnosMatricular.set([]);
    this.inscritos.set([]);
    this.claseAnteriorInfo.set(null);
    this.alumnosClaseAnterior.set([]);
    this.alumnosClaseAnteriorSeleccion.set(new Set());
    this.claseAnteriorSinPrevia.set(false);
    this.clasesContratoCopiar.set([]);
    this.idClaseFuenteCopiar.set('');
    this.textoClaseFuenteCopiar.set('');
    this.nuevaClaseProg.set('');
    this.nuevaClaseUbic.set('Carpa');
    this.modalFechaClase.set('');
    this.modalCrearJornadaId.set(this.jornadaSel() || '');
    this.cargarJornadasParaCrear();
    this.cargarProgramasJornada();
    this.sincronizarFechaClaseDesdeJornada(this.modalCrearJornadaId());
    this.modalCrearClase.set(true);
  }

  abrirModalEditarClase(c: any) {
    this.modalModoClase.set('editar');
    this.claseSel.set(c._id);
    this.claseActiva.set(c);
    this.modalCrearJornadaId.set(String(c.idJornada || ''));
    this.modalFechaClase.set(c.fechaClase ? String(c.fechaClase) : c.fechaJornada ? String(c.fechaJornada) : '');
    const progClase = String(c.idPrograma || '').trim();
    this.nuevaClaseProg.set(progClase);
    this.nuevaClaseUbic.set(c.ubicacion || 'Carpa');
    this.modalClaseInstructorId.set(c.idEmpleadoInstructor ?? '');
    this.modalHoraInicio.set(isoAHoraInput(c.horaInicio));
    this.modalHoraFin.set(isoAHoraInput(c.horaFin));
    this.alumnoBusqueda.set('');
    this.alumnoBusquedaResults.set([]);
    this.alumnoBusquedaOpen.set(false);
    this.alumnosMatricular.set([]);
    this.inscritos.set([]);
    this.alumnosClaseAnteriorSeleccion.set(new Set());
    this.idClaseFuenteCopiar.set('');
    this.textoClaseFuenteCopiar.set('');
    this.claseAnteriorInfo.set(null);
    this.alumnosClaseAnterior.set([]);
    this.claseAnteriorSinPrevia.set(false);
    if (!this.jornadasParaCrear().length) this.cargarJornadasParaCrear();
    this.sincronizarProgramaModal(progClase);
    this.cargarProgramasJornada();
    this.cargarInscritos(c._id);
    this.cargarClasesContratoParaCopiar(c);
    this.modalCrearClase.set(true);
    this.iniciarCronometroSiAplica();
  }

  labelClaseCopiar(c: any): string {
    const fecha = this.fmtFecha(c.fechaJornada || c.fechaClase);
    const prog =
      c.programaNombre ||
      (c.idPrograma ? this.nombrePrograma(String(c.idPrograma)) : '') ||
      'Sin programa';
    const carpa = labelCarpaClase(c);
    const idx = c.indiceClaseEnJornada != null ? `#${c.indiceClaseEnJornada}` : '';
    return [fecha, prog, carpa, idx].filter(Boolean).join(' · ');
  }

  cargarClasesContratoParaCopiar(
    claseActual?: any,
    opts?: { syncAlumnos?: boolean },
  ): void {
    const idContrato =
      claseActual?.idContrato ||
      this.idContratoParaClaseModal() ||
      this.contratoSel() ||
      '';
    const syncAlumnos = opts?.syncAlumnos !== false;
    if (!idContrato) {
      this.clasesContratoCopiar.set([]);
      if (syncAlumnos) {
        this.cargarAlumnosClaseAnterior(claseActual?._id || this.claseSel());
      }
      return;
    }
    this.jornadaSvc.listarClases({ idContrato: String(idContrato) }).subscribe({
      next: (rows) => {
        this.clasesContratoCopiar.set(rows || []);
        if (!syncAlumnos) return;
        const idActual = String(claseActual?._id || this.claseSel() || '');
        const idFuente = String(this.idClaseFuenteCopiar() || '').trim();
        // Si el usuario ya eligió una clase, no pisar con la auto “anterior” de la jornada.
        if (idFuente) {
          this.cargarAlumnosDesdeFuente(idActual, idFuente);
          return;
        }
        this.cargarAlumnosClaseAnterior(idActual, { autoSeleccionar: true });
      },
      error: () => {
        this.clasesContratoCopiar.set([]);
        if (syncAlumnos) {
          this.cargarAlumnosClaseAnterior(claseActual?._id || this.claseSel());
        }
      },
    });
  }

  onClaseFuenteCopiarPick(opt: EnumBuscarOption): void {
    this.onClaseFuenteCopiarChange(String(opt?.value ?? ''));
  }

  /** Carga alumnos desde la clase elegida (select o combobox). */
  onClaseFuenteCopiarChange(idFuenteRaw: string): void {
    const idFuente = String(idFuenteRaw || '').trim();
    if (!idFuente) {
      this.onClaseFuenteCopiarLimpiar();
      return;
    }
    this.idClaseFuenteCopiar.set(idFuente);
    const opt = this.opcionesClasesCopiarContrato().find((o) => String(o.value) === idFuente);
    this.textoClaseFuenteCopiar.set(opt?.label || idFuente);
    this.alumnosClaseAnteriorSeleccion.set(new Set());
    const idActual = String(this.claseSel() || '').trim();
    if (!idActual) {
      this.mostrarMsg('Abra una clase destino antes de copiar alumnos.', 'warn', 'Copiar alumnos');
      return;
    }
    this.cargarAlumnosDesdeFuente(idActual, idFuente);
  }

  onClaseFuenteCopiarLimpiar(): void {
    this.idClaseFuenteCopiar.set('');
    this.textoClaseFuenteCopiar.set('');
    this.claseAnteriorInfo.set(null);
    this.alumnosClaseAnterior.set([]);
    this.alumnosClaseAnteriorSeleccion.set(new Set());
    this.claseAnteriorSinPrevia.set(false);
  }

  private cargarAlumnosDesdeFuente(idClase: string, idClaseFuente: string): void {
    const seq = ++this.reqAlumnosClaseAnteriorSeq;
    this.cargandoAlumnosClaseAnterior.set(true);
    this.claseAnteriorInfo.set(null);
    this.alumnosClaseAnterior.set([]);
    this.jornadaSvc.alumnosClaseAnterior(idClase, idClaseFuente).subscribe({
      next: (r) => {
        if (seq !== this.reqAlumnosClaseAnteriorSeq) return;
        this.cargandoAlumnosClaseAnterior.set(false);
        this.claseAnteriorInfo.set(r?.clase || null);
        const alumnos = r?.alumnos || [];
        this.alumnosClaseAnterior.set(alumnos);
        this.claseAnteriorSinPrevia.set(false);
        // Preseleccionar a quienes sí se pueden matricular.
        const sel = new Set<number>();
        for (const a of alumnos) {
          if (a?.puedeMatricular !== false && !a?.yaInscritoEnEstaClase && Number.isFinite(Number(a.numDoc))) {
            sel.add(Number(a.numDoc));
          }
        }
        this.alumnosClaseAnteriorSeleccion.set(sel);
        if (r?.clase) {
          this.textoClaseFuenteCopiar.set(
            this.labelClaseCopiar({
              ...r.clase,
              fechaJornada: r.clase.fechaJornada,
              fechaClase: r.clase.fechaClase,
            }),
          );
        } else {
          this.mostrarMsg(
            'No se encontró la clase fuente o no pertenece al mismo contrato.',
            'warn',
            'Copiar alumnos',
          );
        }
      },
      error: (e) => {
        if (seq !== this.reqAlumnosClaseAnteriorSeq) return;
        this.cargandoAlumnosClaseAnterior.set(false);
        this.claseAnteriorInfo.set(null);
        this.alumnosClaseAnterior.set([]);
        const msg =
          e?.error?.message ||
          'No se pudieron cargar los alumnos de la clase elegida.';
        this.mostrarMsg(msg, 'warn', 'Copiar alumnos');
        this.mostrarMsgModal(msg, 'warn', 'Copiar alumnos');
      },
    });
  }

  cargarAlumnosClaseAnterior(
    idClase: string,
    opts?: { autoSeleccionar?: boolean },
  ) {
    const seq = ++this.reqAlumnosClaseAnteriorSeq;
    this.claseAnteriorInfo.set(null);
    this.alumnosClaseAnterior.set([]);
    this.claseAnteriorSinPrevia.set(false);
    if (!idClase) return;
    this.cargandoAlumnosClaseAnterior.set(true);
    this.jornadaSvc.alumnosClaseAnterior(idClase).subscribe({
      next: (r) => {
        if (seq !== this.reqAlumnosClaseAnteriorSeq) return;
        this.cargandoAlumnosClaseAnterior.set(false);
        this.claseAnteriorInfo.set(r?.clase || null);
        this.alumnosClaseAnterior.set(r?.alumnos || []);
        this.claseAnteriorSinPrevia.set(!r?.clase);
        if (opts?.autoSeleccionar && r?.clase?._id) {
          this.idClaseFuenteCopiar.set(String(r.clase._id));
          this.textoClaseFuenteCopiar.set(
            this.labelClaseCopiar({
              ...r.clase,
              fechaJornada: r.clase.fechaJornada,
              fechaClase: r.clase.fechaClase,
            }),
          );
        } else if (opts?.autoSeleccionar && !r?.clase) {
          // No había “anterior” automática: no dejar un id de selección huérfano.
          this.idClaseFuenteCopiar.set('');
          this.textoClaseFuenteCopiar.set('');
        }
      },
      error: (e) => {
        if (seq !== this.reqAlumnosClaseAnteriorSeq) return;
        this.cargandoAlumnosClaseAnterior.set(false);
        this.claseAnteriorInfo.set(null);
        this.alumnosClaseAnterior.set([]);
        this.claseAnteriorSinPrevia.set(false);
        if (!opts?.autoSeleccionar) {
          const msg =
            e?.error?.message ||
            'No se pudo consultar alumnos de la clase anterior. Verifique que el servidor esté actualizado.';
          this.mostrarMsg(msg, 'warn', 'Clase anterior');
        }
      },
    });
  }

  toggleAlumnoClaseAnterior(numDoc: number, checked: boolean): void {
    this.alumnosClaseAnteriorSeleccion.update((set) => {
      const next = new Set(set);
      if (checked) next.add(Number(numDoc));
      else next.delete(Number(numDoc));
      return next;
    });
  }

  alumnoClaseAnteriorSeleccionado(numDoc: number): boolean {
    return this.alumnosClaseAnteriorSeleccion().has(Number(numDoc));
  }

  alumnoPuedeMatricularDesdeAnterior(a: AlumnoClaseAnteriorItem): boolean {
    if (a.yaInscritoEnEstaClase) return false;
    if (a.puedeMatricular === false) return false;
    return true;
  }

  seleccionarTodosAlumnosClaseAnterior(): void {
    const disponibles = this.alumnosClaseAnteriorDisponibles().filter((a) =>
      this.alumnoPuedeMatricularDesdeAnterior(a),
    );
    if (!disponibles.length) {
      this.mostrarMsgModal(
        'Ningún alumno de esa lista se puede marcar (ya están en esta clase o bloqueados).',
        'warn',
        'Copiar alumnos',
      );
      return;
    }
    this.alumnosClaseAnteriorSeleccion.set(new Set(disponibles.map((a) => Number(a.numDoc))));
  }

  limpiarSeleccionAlumnosClaseAnterior(): void {
    this.alumnosClaseAnteriorSeleccion.set(new Set());
  }

  matricularSeleccionClaseAnterior(): void {
    const idClase = this.claseSel();
    const idP = this.nuevaClaseProg();
    if (!idClase || !idP) return;
    const seleccion = this.alumnosClaseAnteriorSeleccion();
    if (!seleccion.size) return;
    const alumnos = this.alumnosClaseAnteriorDisponibles().filter((a) =>
      seleccion.has(Number(a.numDoc)),
    );
    if (!alumnos.length) return;
    this.matriculandoDesdeAnterior.set(true);
    this.matricularAlumnosEnPrograma(idP, alumnos, idClase)
      .pipe(finalize(() => this.matriculandoDesdeAnterior.set(false)))
      .subscribe((results) => {
        const okRows = results.filter((r) => r.ok);
        const fail = results.filter((r) => !r.ok);
        this.cargarInscritos(idClase);
        this.recargarClases();
        this.alumnosClaseAnteriorSeleccion.set(new Set());
        let texto = `Matriculados ${okRows.length}/${results.length} desde la clase anterior.`;
        if (fail.length) texto += ` No matriculados: ${fail.map((f) => f.nombre).join(', ')}.`;
        this.mostrarMsgModal(texto, fail.length ? 'warn' : 'ok', 'Matrícula desde clase anterior');
        this.mostrarMsg(texto, fail.length ? 'warn' : 'ok', 'Matrícula desde clase anterior');
      });
  }

  cargarInscritos(idClase: string) {
    this.jornadaSvc.inscritosClase(idClase).subscribe({
      next: (rows) => this.inscritos.set(rows || []),
      error: () => this.inscritos.set([]),
    });
  }

  jornadaClaseModalOperable(): boolean {
    const cl = this.claseActiva();
    if (!cl) return false;
    if (this.operacionEspecialActiva()) return true;
    if (!esFechaHoy(cl.fechaClase || cl.fechaJornada)) return false;
    if (cl.jornadaEstado === 'EN PROCESO') return true;
    const jId = String(this.modalCrearJornadaId() || cl.idJornada || '');
    const j =
      this.jornadas().find((x) => x._id === jId) ||
      this.jornadasParaCrear().find((x: any) => x._id === jId);
    return j?.estado === 'EN PROCESO';
  }

  claseModalIniciable(): boolean {
    const cl = this.claseActiva();
    if (!cl || cl.estado === 'FINALIZADO') return false;
    if (cl.estado === 'EN PROCESO' && cl.horaInicio) return false;
    return this.jornadaClaseModalOperable();
  }

  tituloBotonIniciarClase(): string {
    const cl = this.claseActiva();
    if (cl && !this.operacionEspecialActiva() && !esFechaHoy(cl.fechaClase || cl.fechaJornada)) {
      return 'Solo puede iniciar la clase el día programado (hoy).';
    }
    if (!this.jornadaClaseModalOperable()) {
      return 'Solo puede iniciar la clase el día de la jornada (EN PROCESO).';
    }
    if (!this.claseModalIniciable()) {
      return 'La clase ya está iniciada o finalizada.';
    }
    return 'Iniciar clase y registrar hora de inicio';
  }

  formatDuracion(totalSegundos: number): string {
    const secs = Math.max(0, Math.floor(totalSegundos));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }

  lapsoClaseEtiqueta(): string {
    const cl = this.claseActiva();
    if (!cl) return '';
    if (cl.estado === 'FINALIZADO' && cl.duracionSegundos != null) {
      return this.formatDuracion(cl.duracionSegundos);
    }
    if (this.operacionEspecialActiva()) {
      const secs = duracionSegundosDesdeHHmm(this.modalHoraInicio(), this.modalHoraFin());
      if (secs != null) return this.formatDuracion(secs);
    }
    if (cl.duracionSegundos != null) return this.formatDuracion(cl.duracionSegundos);
    if (this.claseModalEnProceso() && cl.horaInicio) return this.cronometroDisplay();
    return '';
  }

  private horarioPayloadFinalizarClase(): { horaInicio?: string; horaFin?: string } {
    if (!this.operacionEspecialActiva()) return {};
    const hi = this.modalHoraInicio().trim();
    const hf = this.modalHoraFin().trim();
    const out: { horaInicio?: string; horaFin?: string } = {};
    if (validarHoraInput(hi)) out.horaInicio = hi;
    if (validarHoraInput(hf)) out.horaFin = hf;
    return out;
  }

  private validarHorarioAntesFinalizarEspecial(): boolean {
    if (!this.operacionEspecialActiva()) return true;
    if (this.claseActiva()?.estado === 'EN PROCESO') return true;
    const hi = this.modalHoraInicio().trim();
    const hf = this.modalHoraFin().trim();
    if (!validarHoraInput(hi) || !validarHoraInput(hf)) {
      this.mostrarMsg(
        'Indique hora de inicio y hora de fin antes de finalizar.',
        'error',
        'Horario requerido',
      );
      return false;
    }
    if (duracionSegundosDesdeHHmm(hi, hf) == null) {
      this.mostrarMsg('La hora de fin debe ser posterior a la de inicio.', 'error', 'Horario inválido');
      return false;
    }
    return true;
  }

  tituloBotonFinalizarClase(): string {
    if (this.claseActiva()?.estado === 'FINALIZADO') {
      return 'Reprocesar: emite certificados pendientes de alumnos matriculados después del cierre.';
    }
    if (!this.claseModalFinalizable()) {
      if (this.operacionEspecialActiva() && this.claseActiva()?.estado === 'PROGRAMADA') {
        return 'Indique hora de inicio y fin para finalizar en modo especial';
      }
      return 'Solo se puede finalizar una clase EN PROCESO';
    }
    if (this.operacionEspecialActiva()) {
      return 'Finalizar con el horario indicado (sin cambiar la hora de fin)';
    }
    return 'Finalizar clase y registrar hora de fin';
  }

  textoBotonFinalizarClase(): string {
    return this.claseActiva()?.estado === 'FINALIZADO' ? '↻ Reprocesar certificados' : '■ Finalizar clase';
  }

  private actualizarCronometroDisplay() {
    const cl = this.claseActiva();
    if (!cl?.horaInicio) {
      this.cronometroDisplay.set('00:00:00');
      return;
    }
    const inicio = new Date(cl.horaInicio).getTime();
    const fin = cl.horaFin ? new Date(cl.horaFin).getTime() : Date.now();
    const secs = Math.max(0, Math.floor((fin - inicio) / 1000));
    this.cronometroDisplay.set(this.formatDuracion(secs));
  }

  private detenerCronometro() {
    if (this.cronometroTimer) {
      clearInterval(this.cronometroTimer);
      this.cronometroTimer = null;
    }
  }

  private iniciarCronometroSiAplica() {
    this.detenerCronometro();
    this.actualizarCronometroDisplay();
    const cl = this.claseActiva();
    if (cl?.estado === 'EN PROCESO' && cl.horaInicio && !cl.horaFin) {
      this.cronometroTimer = setInterval(() => this.actualizarCronometroDisplay(), 1000);
    }
  }

  claseModalFinalizable(): boolean {
    const cl = this.claseActiva();
    if (!cl) return false;
    if (cl.estado === 'FINALIZADO') return true;
    if (cl.estado === 'EN PROCESO') return true;
    if (this.operacionEspecialActiva()) {
      const hi = this.modalHoraInicio().trim();
      const hf = this.modalHoraFin().trim();
      return validarHoraInput(hi) && validarHoraInput(hf) && duracionSegundosDesdeHHmm(hi, hf) != null;
    }
    return false;
  }

  claseModalEnProceso(): boolean {
    return this.claseActiva()?.estado === 'EN PROCESO';
  }

  /** Admin: también en clases finalizadas (correcciones). */
  puedeMarcarAsistenciaInscrito(): boolean {
    if (this.claseModalEnProceso()) return true;
    if (this.operacionEspecialActiva() && this.claseActiva()?.estado !== 'FINALIZADO') return true;
    return this.puedeEliminarClase() && this.claseActiva()?.estado === 'FINALIZADO';
  }

  puedeMarcarAsistenciaAlumno(a: {
    yaCertificadoContrato?: boolean;
    tieneAsistencia?: boolean;
  }): boolean {
    if (a.yaCertificadoContrato && !a.tieneAsistencia) return false;
    return this.puedeMarcarAsistenciaInscrito();
  }

  idContratoParaClaseModal(): string {
    const act = this.claseActiva();
    if (act?.idContrato) return String(act.idContrato);
    if (this.modalModoClase() === 'editar' && act) {
      const j = this.jornadas().find((x) => x._id === act.idJornada);
      return j?.idContrato || this.contratoSel() || '';
    }
    const j = this.jornadas().find((x) => x._id === this.modalCrearJornadaId());
    return j?.idContrato || this.contratoSel() || '';
  }

  urlFotoEvidencia(path?: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${environment.uploadsUrl}/${path.replace(/^\/+/, '')}`;
  }

  onFotoEvidenciaSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.claseSel();
    if (!file || !id) return;
    this.subiendoFotoEvidencia.set(true);
    this.jornadaSvc.subirFotoEvidenciaClase(id, file).subscribe({
      next: (c) => {
        this.claseActiva.set(c);
        this.subiendoFotoEvidencia.set(false);
        this.recargarClases();
        this.mostrarMsg('Foto de evidencia guardada.', 'ok', 'Evidencia');
      },
      error: (e) => {
        this.subiendoFotoEvidencia.set(false);
        this.mostrarMsg(e?.error?.message || 'No se pudo subir la foto.', 'error', 'Error');
      },
    });
    input.value = '';
  }

  /** Instructor: solo EN PROCESO. Administrador: en cualquier estado de la clase. */
  puedeBorrarAsistenciaDeClase(): boolean {
    if (this.puedeEliminarClase()) return true;
    return this.claseModalEnProceso();
  }

  /** Instructor: mientras la clase no esté finalizada. Administrador: siempre. */
  puedeQuitarInscritoDeClase(): boolean {
    if (this.puedeEliminarClase()) return true;
    return this.claseActiva()?.estado !== 'FINALIZADO';
  }

  iniciarClaseModal() {
    const id = this.claseSel();
    if (!id || !this.claseModalIniciable()) return;
    this.jornadaSvc.iniciarClase(id).subscribe({
      next: (c) => {
        this.claseActiva.set(c);
        this.iniciarCronometroSiAplica();
        this.recargarClases();
        this.liveSync.notificarClaseIniciada(c as unknown as Record<string, unknown>);
        this.mostrarMsg('Clase iniciada. El cronómetro está activo.', 'ok', 'Clase iniciada');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo iniciar la clase.', 'error', 'Error'),
    });
  }

  finalizarClaseModal() {
    const id = this.claseSel();
    if (!id) return;
    const yaFinalizada = this.claseActiva()?.estado === 'FINALIZADO';
    if (!yaFinalizada && !this.validarHorarioAntesFinalizarEspecial()) return;
    this.jornadaSvc.finalizarClase(id, this.horarioPayloadFinalizarClase()).subscribe({
      next: (r: any) => {
        const c = r?.clase || { ...this.claseActiva(), estado: 'FINALIZADO' };
        this.claseActiva.set(c);
        this.detenerCronometro();
        this.actualizarCronometroDisplay();
        this.cargarInscritos(id);
        this.recargarClases();
        this.recargarCerts();
        let msg: string;
        if (r?.reproceso) {
          msg = r?.message || 'Certificados pendientes reprocesados.';
        } else {
          const lapso =
            c.duracionSegundos != null ? this.formatDuracion(c.duracionSegundos) : this.cronometroDisplay();
          msg = `Clase finalizada. Duración: ${lapso}.`;
          if (r?.asistenciasRegistradas > 0) {
            msg += ` Asistencia registrada a ${r.asistenciasRegistradas} alumno(s).`;
          }
        }
        const nCert = this.contarCertificadosEmitidos(r);
        if (nCert > 0) {
          msg += ` Certificados emitidos: ${nCert}.`;
          this.certAlertSvc.notificarVariosDesdeRespuesta(r?.certificadosEmitidos);
        }
        this.liveSync.notificarClaseFinalizada(c as unknown as Record<string, unknown>);
        this.mostrarMsgModal(msg, nCert > 0 ? 'ok' : 'info', 'Clase finalizada');
        this.mostrarMsg(msg, nCert > 0 ? 'ok' : 'info', 'Clase finalizada');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo finalizar la clase.', 'error', 'Error'),
    });
  }

  sincronizarAsistenciasClaseModal() {
    const id = this.claseSel();
    if (!id) return;
    if (this.inscritosSinAsistencia() === 0) {
      this.mostrarMsgModal(
        'Todos los inscritos ya tienen asistencia o certificado vigente en el contrato.',
        'info',
        'Asistencia al día',
      );
      return;
    }
    this.jornadaSvc.sincronizarAsistenciasInscritos(id).subscribe({
      next: (r) => {
        this.cargarInscritos(id);
        this.recargarCerts();
        const nCert = this.contarCertificadosEmitidos(r);
        if (nCert > 0) {
          this.certAlertSvc.notificarVariosDesdeRespuesta(r.certificadosEmitidos);
        }
        const msg = r.message || 'Asistencias sincronizadas.';
        const tipo = nCert > 0 ? 'ok' : 'info';
        this.mostrarMsgModal(msg, tipo, 'Asistencia');
        this.mostrarMsg(msg, tipo, 'Asistencia');
      },
      error: (e) => {
        const err = e?.error?.message || 'No se pudo registrar la asistencia.';
        this.mostrarMsgModal(err, 'error', 'Error');
        this.mostrarMsg(err, 'error', 'Error');
      },
    });
  }

  guardarCambiosClaseModal() {
    const id = this.claseSel();
    if (!id) return;
    const dto: {
      idPrograma?: string;
      ubicacion?: string;
      idEmpleadoInstructor?: number | null;
      horaInicio?: string | null;
      horaFin?: string | null;
    } = {
      ubicacion: this.nuevaClaseUbic(),
    };
    if (this.nuevaClaseProg()) dto.idPrograma = this.nuevaClaseProg();
    if (this.puedeAsignarInstructor()) {
      const insId = this.modalClaseInstructorId();
      dto.idEmpleadoInstructor = insId ? Number(insId) : null;
    }
    if (this.puedeEditarHorarioClase()) {
      const hi = this.modalHoraInicio().trim();
      const hf = this.modalHoraFin().trim();
      if (!validarHoraInput(hi) || !validarHoraInput(hf)) {
        this.mostrarMsg('Use formato HH:mm (ej. 08:30).', 'error', 'Horario inválido');
        return;
      }
      dto.horaInicio = hi || null;
      dto.horaFin = hf || null;
    }
    this.jornadaSvc.actualizarClase(id, dto).subscribe({
      next: (r: any) => {
        const c = r?.clase || r;
        this.claseActiva.set(c);
        this.modalHoraInicio.set(isoAHoraInput(c.horaInicio));
        this.modalHoraFin.set(isoAHoraInput(c.horaFin));
        this.iniciarCronometroSiAplica();
        this.recargarClases();
        this.recargarCerts();
        const nCert = this.contarCertificadosEmitidos(r);
        if (nCert > 0) {
          this.certAlertSvc.notificarVariosDesdeRespuesta(r?.certificadosEmitidos);
        }
        const msg = r?.message || 'Cambios guardados.';
        this.mostrarMsg(msg, nCert > 0 ? 'ok' : 'info', 'Clase actualizada');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo guardar la clase.', 'error', 'Error'),
    });
  }

  async quitarInscritoDeClase(
    numDoc: number,
    nombre?: string,
    opts?: { tieneAsistencia?: boolean },
  ) {
    const id = this.claseSel();
    if (!id) return;
    const extraAsist =
      opts?.tieneAsistencia
        ? ' También se eliminará su asistencia en esta clase.'
        : '';
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message:
        `¿De verdad desea quitar a ${nombre || 'el alumno'} (doc ${numDoc}) de esta clase?\n\n` +
        `La matrícula al programa se conserva.${extraAsist}`,
      confirmLabel: 'Sí, quitar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.guardandoAsistencia.set(numDoc);
    this.jornadaSvc.quitarInscripcionClase(id, numDoc).subscribe({
      next: () => {
        this.guardandoAsistencia.set(null);
        this.cargarInscritos(id);
        this.cargarAsistencias(id);
        this.mostrarMsg('Alumno retirado de la clase.', 'ok', 'Inscripción eliminada');
      },
      error: (e) => {
        this.guardandoAsistencia.set(null);
        this.mostrarMsg(e?.error?.message || 'No se pudo quitar al alumno.', 'error', 'Error');
      },
    });
  }

  async borrarAsistenciaInscrito(numDoc: number, nombre?: string) {
    const id = this.claseSel();
    if (!id) return;
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: `¿De verdad desea borrar la asistencia de ${nombre || 'el alumno'} (doc ${numDoc}) en esta clase?\n\nEl alumno permanecerá inscrito.`,
      confirmLabel: 'Sí, borrar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.guardandoAsistencia.set(numDoc);
    this.jornadaSvc.eliminarAsistencia(id, numDoc).subscribe({
      next: () => {
        this.guardandoAsistencia.set(null);
        this.cargarInscritos(id);
        this.cargarAsistencias(id);
        this.mostrarMsg('Asistencia eliminada.', 'ok', 'Asistencia borrada');
      },
      error: (e) => {
        this.guardandoAsistencia.set(null);
        this.mostrarMsg(e?.error?.message || 'No se pudo borrar la asistencia.', 'error', 'Error');
      },
    });
  }

  marcarAsistenciaInscrito(numDoc: number) {
    const id = this.claseSel();
    if (!id) return;
    this.guardandoAsistencia.set(numDoc);
    this.jornadaSvc.registrarAsistencia(id, numDoc).subscribe({
      next: (r: any) => {
        this.guardandoAsistencia.set(null);
        this.cargarInscritos(id);
        this.cargarAsistencias(id);
        this.mostrarResultadoAsistencia(r);
      },
      error: (e) => {
        this.guardandoAsistencia.set(null);
        const body = e?.error;
        if (e?.status === 409 && body?.codigo === 'ya_certificado_contrato') {
          const ins = this.inscritos().find((x) => Number(x.numDoc) === Number(numDoc));
          void this.certBloqueoSvc.mostrarDesdeError(body, ins?.nombreCompleto || String(numDoc));
          return;
        }
        if (e?.status === 409 && body?.sesiones != null) {
          this.cargarInscritos(id);
          this.mostrarResultadoAsistencia(body);
          return;
        }
        this.mostrarMsg(body?.message || 'No se pudo registrar la asistencia.', 'error', 'Error');
      },
    });
  }

  /** Jornadas disponibles para crear clase (hoy/mañana en modo normal; todas las del contrato en modo especial). */
  jornadasParaCrear = signal<any[]>([]);
  modalCrearJornadaId = signal<string>('');
  /** Fecha de la clase (= fecha programada de la jornada elegida). */
  modalFechaClase = signal<string>('');

  onModalCrearJornadaChange(id: string) {
    this.modalCrearJornadaId.set(id || '');
    this.sincronizarFechaClaseDesdeJornada(id);
  }

  seleccionarUbicacionClase(ubicacion: string) {
    this.nuevaClaseUbic.set(ubicacion || 'Carpa');
  }

  crearClaseListo(): boolean {
    return !!(this.modalCrearJornadaId() && this.nuevaClaseProg());
  }

  textoBotonCrearClase(): string {
    if (this.guardandoClase()) return 'Guardando…';
    if (!this.modalCrearJornadaId()) return '① Elija el día de la jornada';
    if (!this.nuevaClaseProg()) return '② Elija el programa';
    const n = this.alumnosMatricular().length;
    return n ? `✓ Crear clase (${n} alumno${n === 1 ? '' : 's'})` : '✓ Crear clase';
  }

  modalClaseSubtitle(): string {
    if (this.modalModoClase() === 'nuevo') {
      return this.operacionEspecialActiva()
        ? 'Modo operación especial — elija jornada, curso y ubicación'
        : 'Complete los pasos y pulse Crear clase';
    }
    const cl = this.claseActiva();
    if (!cl) return 'Datos, horario, instructor y alumnos';
    const partes = [
      cl.fechaJornada || cl.fechaClase ? this.fmtFecha(cl.fechaJornada || cl.fechaClase) : '',
      cl.idPrograma ? this.nombrePrograma(cl.idPrograma) : '',
      cl.ubicacion || '',
    ].filter(Boolean);
    return partes.length ? partes.join(' · ') : 'Datos, horario, instructor y alumnos';
  }

  usarTarjetasJornadaCrear(): boolean {
    return this.jornadasParaCrear().length > 0 && this.jornadasParaCrear().length <= 6;
  }

  private sincronizarFechaClaseDesdeJornada(jornadaId: string) {
    if (!jornadaId) {
      this.modalFechaClase.set('');
      return;
    }
    const j =
      this.jornadasParaCrear().find((x: any) => x._id === jornadaId) ||
      this.jornadas().find((x) => x._id === jornadaId);
    this.modalFechaClase.set(j?.fechaProgramacion ? String(j.fechaProgramacion) : '');
  }

  private filtrarJornadasParaCrear(rows: any[]): any[] {
    const list = rows || [];
    if (this.operacionEspecialActiva()) {
      const idContrato = this.contratoSel();
      if (!idContrato) return [];
      return list.filter((j) => String(j.idContrato || '') === String(idContrato));
    }
    return list.filter((j) => this.jornadaEnVentanaCreacion(j));
  }

  private aplicarSeleccionDefaultJornadaCrear(filtered: any[]) {
    const actual = this.modalCrearJornadaId();
    if (actual && filtered.some((j) => j._id === actual)) {
      this.sincronizarFechaClaseDesdeJornada(actual);
      return;
    }
    const desdeToolbar = this.jornadaSel();
    if (desdeToolbar && filtered.some((j) => j._id === desdeToolbar)) {
      this.onModalCrearJornadaChange(desdeToolbar);
      return;
    }
    if (filtered.length === 1) {
      this.onModalCrearJornadaChange(filtered[0]._id);
    }
  }

  cargarJornadasParaCrear() {
    if (this.operacionEspecialActiva()) {
      const idContrato = this.contratoSel();
      if (!idContrato) {
        this.jornadasParaCrear.set([]);
        return;
      }
      const locales = this.jornadas();
      const localesDelContrato =
        locales.length > 0 &&
        locales.every((j) => String(j.idContrato || '') === String(idContrato));
      if (localesDelContrato) {
        const filtered = this.filtrarJornadasParaCrear(locales);
        this.jornadasParaCrear.set(filtered);
        this.aplicarSeleccionDefaultJornadaCrear(filtered);
        return;
      }
      this.jornadaSvc.listarJornadas({ idContrato }).subscribe({
        next: (rows) => {
          const filtered = this.filtrarJornadasParaCrear(rows);
          this.jornadasParaCrear.set(filtered);
          this.aplicarSeleccionDefaultJornadaCrear(filtered);
        },
        error: () => this.jornadasParaCrear.set([]),
      });
      return;
    }

    this.jornadaSvc.listarJornadas().subscribe({
      next: (rows) => {
        const filtered = this.filtrarJornadasParaCrear(rows);
        this.jornadasParaCrear.set(filtered);
        this.aplicarSeleccionDefaultJornadaCrear(filtered);
      },
      error: () => this.jornadasParaCrear.set([]),
    });
  }

  /** Solo se permite crear clases para una jornada el día anterior o el mismo día. */
  jornadaEnVentanaCreacion(j: { fechaProgramacion?: string | Date }): boolean {
    if (!j?.fechaProgramacion) return false;
    const inicioDia = (d: Date) => {
      const r = new Date(d);
      r.setHours(0, 0, 0, 0);
      return r;
    };
    const prog = inicioDia(new Date(j.fechaProgramacion)).getTime();
    const hoy = inicioDia(new Date()).getTime();
    const dias = Math.round((prog - hoy) / (24 * 60 * 60 * 1000));
    return dias === 0 || dias === 1;
  }

  labelJornadaCorta(j: any): string {
    const cod = this.codContratoDe(j?.idContrato);
    const fecha = this.fmtFecha(j?.fechaProgramacion);
    const muni = j?.municipio ? ` · ${j.municipio}` : '';
    return `${cod ? cod + ' · ' : ''}${fecha}${muni}`;
  }

  cerrarModalCrearClase() {
    if (this.guardandoClase()) return;
    this.detenerCronometro();
    this.modalCrearClase.set(false);
    this.alumnoBusquedaOpen.set(false);
    this.limpiarMsgModal();
  }

  limpiarMsgModal() {
    this.modalMsg.set(null);
    this.modalMsgTitulo.set('');
  }

  mostrarMsgModal(texto: string, tipo: JorMsgTipo = 'info', titulo?: string) {
    this.modalMsg.set(texto);
    this.modalMsgTipo.set(tipo);
    this.modalMsgTitulo.set(titulo ?? tituloJorMsg(tipo));
  }

  private mensajeInscripcionOk(r: { inscripcionDuplicada?: boolean; yaExistia?: boolean; matricula?: { yaExistia?: boolean } }, nombre: string): string {
    if (r?.inscripcionDuplicada) return `${nombre} ya estaba inscrito en esta clase.`;
    const yaMatriculado = r?.yaExistia || r?.matricula?.yaExistia;
    if (yaMatriculado) return `${nombre} inscrito en la clase (ya estaba matriculado al programa).`;
    return `${nombre} matriculado e inscrito en la clase.`;
  }

  onAlumnoBusquedaInput(value: string) {
    this.alumnoBusqueda.set(value);
    this.alumnoBusquedaOpen.set(true);
    this.alumnoBusqueda$.next((value ?? '').trim());
  }

  focusAlumnoBusqueda() {
    this.alumnoBusquedaOpen.set(true);
    if (!this.alumnoBusqueda().trim()) this.alumnoBusqueda$.next('');
  }

  nombreAlumnoItem(a: AlumnoNombrable): string {
    if (a.nombreCompleto?.trim()) return a.nombreCompleto.trim();
    const n = [a.nombre1, a.nombre2, a.nombres].filter(Boolean).join(' ').trim();
    const ap = [a.apellido1, a.apellido2, a.apellidos].filter(Boolean).join(' ').trim();
    return `${n} ${ap}`.trim() || '—';
  }

  alumnoYaEnLista(a: AlumnoListItem): boolean {
    const doc = formatNumDoc(a.numDoc);
    if (this.modalModoClase() === 'editar') {
      return this.inscritos().some((x) => formatNumDoc(x.numDoc) === doc);
    }
    return this.alumnosMatricular().some((x) => formatNumDoc(x.numDoc) === doc);
  }

  agregarAlumnoMatricula(a: AlumnoListItem) {
    const idContrato = this.idContratoParaClaseModal();
    if (idContrato) {
      this.jornadaSvc.progresoCertificacion(a.numDoc, idContrato).subscribe({
        next: (p) => {
          if (p.certificado) {
            void this.certBloqueoSvc.mostrarAlumnoCertificado({
              nombreAlumno: this.nombreAlumnoItem(a),
              certificado: p.certificado,
            });
            return;
          }
          this.ejecutarAgregarAlumnoMatricula(a);
        },
        error: () => this.ejecutarAgregarAlumnoMatricula(a),
      });
      return;
    }
    this.ejecutarAgregarAlumnoMatricula(a);
  }

  private ejecutarAgregarAlumnoMatricula(a: AlumnoListItem) {
    if (this.modalModoClase() === 'editar' && this.claseSel()) {
      const yaInscrito = this.inscritos().some((x) => Number(x.numDoc) === Number(a.numDoc));
      if (yaInscrito) {
        this.mostrarMsg('El alumno ya está matriculado en esta clase.', 'info', 'Duplicado');
        return;
      }
      const idP = String(this.nuevaClaseProg() || '').trim();
      if (!idP) {
        this.mostrarMsg(
          'Elija el programa de la clase antes de agregar alumnos.',
          'error',
          'Error',
        );
        return;
      }
      const idC = this.claseSel();
      this.guardandoInscripcion.set(true);
      this.jornadaSvc
        .matricularAlumno({ numDoc: a.numDoc, idPrograma: idP, idClase: idC })
        .subscribe({
          next: (r: any) => {
            this.guardandoInscripcion.set(false);
            this.cargarInscritos(idC);
            if (!r?.inscripcionDuplicada) {
              this.metaAlumnosAlertSvc.notificarDesdeRespuesta(r?.metaJornada, {
                contratoLabel:
                  this.claseActiva()?.contratoLabel ||
                  this.claseActiva()?.codContrato ||
                  this.contratoActivo()?.codContrato,
              });
            }
            const nombre = this.nombreAlumnoItem(a);
            const msg = this.mensajeInscripcionOk(r, nombre);
            const tipo = r?.inscripcionDuplicada ? 'info' : 'ok';
            this.mostrarMsgModal(msg, tipo, 'Alumno inscrito');
            this.mostrarMsg(
              r?.inscripcionDuplicada
                ? msg
                : `${msg} Etiqueta QR en la ficha del alumno (Jornadas → Alumnos).`,
              tipo,
              'Alumno inscrito',
            );
          },
          error: (e) => {
            this.guardandoInscripcion.set(false);
            if (e?.status === 409 && e?.error?.codigo === 'ya_certificado_contrato') {
              void this.certBloqueoSvc.mostrarDesdeError(e.error, this.nombreAlumnoItem(a));
              return;
            }
            const err = e?.error?.message || 'No se pudo inscribir al alumno.';
            this.mostrarMsgModal(err, 'error', 'Error');
            this.mostrarMsg(err, 'error', 'Error');
          },
        });
      this.alumnoBusqueda.set('');
      this.alumnoBusquedaResults.set([]);
      this.alumnoBusquedaOpen.set(false);
      return;
    }

    if (this.alumnoYaEnLista(a)) {
      this.mostrarMsg('Ese alumno ya está en la lista de matrícula.', 'info', 'Duplicado');
      return;
    }
    this.alumnosMatricular.update((list) => [...list, a]);
    this.mostrarMsgModal(
      `${this.nombreAlumnoItem(a)} agregado. Se matriculará al guardar la clase.`,
      'ok',
      'Alumno agregado',
    );
    this.alumnoBusqueda.set('');
    this.alumnoBusquedaResults.set([]);
    this.alumnoBusquedaOpen.set(false);
  }

  imprimirCertificadoInscrito(a: {
    numDoc: number;
    nombreCompleto?: string;
    certificadoId?: string | null;
    certificadoCodigo?: string | null;
  }) {
    const id = String(a.certificadoId || '').trim();
    if (id) {
      this.certBloqueoSvc.imprimirCertificadoDirecto(id);
      return;
    }
    void this.certBloqueoSvc.mostrarAlumnoCertificado({
      nombreAlumno: a.nombreCompleto || String(a.numDoc),
      certificado: { codigoCert: a.certificadoCodigo || undefined },
    });
  }

  async quitarAlumnoMatricula(a: AlumnoListItem) {
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: `¿De verdad desea quitar a ${a.nombreCompleto || 'este alumno'} de la lista a matricular?`,
      variant: 'danger',
      confirmLabel: 'Sí, quitar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    const doc = formatNumDoc(a.numDoc);
    this.alumnosMatricular.update((list) =>
      list.filter((x) => formatNumDoc(x.numDoc) !== doc),
    );
  }

  @HostListener('document:click', ['$event'])
  cerrarBusquedaAlumnoFuera(ev: MouseEvent) {
    const t = ev.target as HTMLElement;
    if (!t.closest('.clase-alumno-buscar')) this.alumnoBusquedaOpen.set(false);
  }

  crearSupervisor() {
    const nombre = this.supNuevoNombre().trim();
    if (!nombre) return;
    this.jornadaSvc.crearSupervisor({ nombre }).subscribe({
      next: (s) => {
        this.supNuevoNombre.set('');
        this.cargarSupervisores();
        this.patchContrato('idSupervisor', s._id);
        this.patchContrato('supervisor', s.nombre);
      },
    });
  }

  crearSupervisorJornada() {
    const nombre = this.supNuevoNombreJornada().trim();
    if (!nombre) return;
    this.jornadaSvc.crearSupervisor({ nombre }).subscribe({
      next: (s) => {
        this.supNuevoNombreJornada.set('');
        this.cargarSupervisores();
        this.jornadaEditIdSupervisor.set(s._id);
        this.jornadaEditSupervisor.set(s.nombre);
      },
    });
  }

  onSupervisorChange(id: string) {
    this.patchContrato('idSupervisor', id || undefined);
    const sup = this.supervisores().find((s) => s._id === id);
    this.patchContrato('supervisor', sup?.nombre || '');
  }

  onSupervisorContratoPick(opt: EnumBuscarOption): void {
    this.onSupervisorChange(String(opt.value));
  }

  onSupervisorContratoLimpiar(): void {
    this.onSupervisorChange('');
  }

  onJornadaSupervisorChange(id: string) {
    this.jornadaEditIdSupervisor.set(id || '');
    const sup = this.supervisores().find((s) => s._id === id);
    this.jornadaEditSupervisor.set(sup?.nombre || '');
  }

  onSupervisorJornadaPick(opt: EnumBuscarOption): void {
    this.onJornadaSupervisorChange(String(opt.value));
  }

  onSupervisorJornadaLimpiar(): void {
    this.onJornadaSupervisorChange('');
  }

  onJornadaModalPick(opt: EnumBuscarOption): void {
    this.onModalCrearJornadaChange(String(opt.value));
  }

  onJornadaModalLimpiar(): void {
    this.onModalCrearJornadaChange('');
  }

  onUbicacionClasePick(opt: EnumBuscarOption): void {
    this.nuevaClaseUbic.set(String(opt.value));
  }

  onUbicacionClaseLimpiar(): void {
    this.nuevaClaseUbic.set('Carpa');
  }

  onInstructorModalPick(opt: EnumBuscarOption): void {
    this.onModalClaseInstructorChange(String(opt.value));
  }

  onInstructorModalLimpiar(): void {
    this.onModalClaseInstructorChange('');
  }

  onProgramaModalPick(opt: EnumBuscarOption): void {
    this.nuevaClaseProg.set(String(opt.value));
  }

  onProgramaModalLimpiar(): void {
    this.nuevaClaseProg.set('');
  }

  onMuniContrato(m: MunicipioDivipola) {
    this.ciudadContratoTexto.set(m.label);
    this.formContrato.update((f) => ({
      ...f,
      codMunicipio: m.codMunicipio,
      ciudad: m.nombreMunicipio,
      departamento: m.nombreDepto,
    }));
  }

  onMunicipioJornada(m: MunicipioDivipola) {
    this.jornadaEditMunicipioTexto.set(m.label);
    this.jornadaEditMunicipio.set(m.nombreMunicipio);
    this.jornadaEditDepto.set(m.nombreDepto);
    this.jornadaEditCodMunicipio.set(m.codMunicipio);
    this.jornadaEditDeteGeorefe.set('MANUAL');
  }

  private cargarTextoMunicipioJornada(j: JornadaCapDto) {
    const fallback =
      j.municipio && j.depto ? `${j.municipio} - ${j.depto}` : j.municipio || '';
    this.jornadaEditMunicipioTexto.set(fallback);
    if (j.codMunicipio) {
      this.catSvc.municipioPorCodigo(j.codMunicipio).subscribe({
        next: (m) => this.jornadaEditMunicipioTexto.set(m.label || fallback),
        error: () => this.jornadaEditMunicipioTexto.set(fallback),
      });
    }
  }

  recargarContratos() {
    this.jornadaSvc.listarContratos().subscribe({
      next: (r) => this.contratos.set(r || []),
    });
  }

  /** Refleja en listado y formulario contadores derivados (sin pisar metas de planificación). */
  aplicarContratoSync(partial: ContratoSyncDto | null | undefined) {
    if (!partial?._id) return;
    const id = String(partial._id);
    const patch: Partial<ContratacionDto> = {
      numeObjeJornada: partial.numeObjeJornada,
      jornadasGeneradas: partial.jornadasGeneradas,
      jornadasExistentes: partial.jornadasExistentes,
    };
    if (partial.numerojornadas != null && partial.numerojornadas > 0) {
      patch.numerojornadas = partial.numerojornadas;
    }
    if (partial.clasesPorJornada != null && partial.clasesPorJornada > 0) {
      patch.clasesPorJornada = partial.clasesPorJornada;
    }
    if (partial.jornadasPorDia != null && partial.jornadasPorDia > 0) {
      patch.jornadasPorDia = partial.jornadasPorDia;
    }
    this.contratos.update((arr) => arr.map((x) => (x._id === id ? { ...x, ...patch } : x)));
    if (this.formContrato()._id === id) {
      this.formContrato.update((f) => ({ ...f, ...patch }));
    }
  }

  cargarDatosFacturacionContrato(): void {
    this.clienteSvc.listar().subscribe({
      next: (rows) => {
        this.clientesFe.set(rows || []);
        const cli = this.clienteFeSeleccionado();
        if (cli) this.aplicarClienteAlContrato(cli);
      },
      error: () => this.clientesFe.set([]),
    });
    this.clienteSvc.catalogos().subscribe({
      next: (c) => this.tiposContrato.set(c.tiposContratoCap || []),
      error: () => this.tiposContrato.set([]),
    });
  }

  labelTipoContratoCap(id?: string | null): string {
    const t = this.tiposContrato().find((x) => x.id === id);
    return t?.label || id || '—';
  }

  clienteFeLabel(id?: string | null): string {
    if (!id) return '';
    const c = this.clientesFe().find((x) => x._id === id);
    return c ? `${c.nombre || c.razonSocial || ''} (${c.identificacion})` : '';
  }

  clienteFeSeleccionado(): Cliente | null {
    const id = this.formContrato().idClienteFacturacion;
    if (!id) return null;
    return this.clientesFe().find((x) => x._id === id) || null;
  }

  private tipoIdDesdeCliente(code?: string | null): string {
    const map: Record<string, string> = {
      '31': 'NIT',
      '13': 'CC',
      '22': 'CE',
      '12': 'TI',
      '41': 'PP',
    };
    const c = String(code || '').trim();
    return map[c] || c || 'NIT';
  }

  private contratoDtoConCliente(f: ContratacionDto, cli: Cliente): ContratacionDto {
    return {
      ...f,
      idClienteFacturacion: cli._id || f.idClienteFacturacion || null,
      razoSocial: (cli.razonSocial || cli.nombres || '').trim(),
      nombreComercial: (cli.nombreComercial || '').trim(),
      numeroIdentificacion: (cli.identificacion || '').trim(),
      tipoIdentificacion: this.tipoIdDesdeCliente(cli.identificationDocumentCode),
      email: cli.correo || f.email || '',
      telefono: cli.telefono || f.telefono || '',
    };
  }

  private aplicarClienteAlContrato(cli: Cliente | null): void {
    if (!cli?._id) {
      this.patchContrato('idClienteFacturacion', null);
      return;
    }
    this.formContrato.update((f) => this.contratoDtoConCliente(f, cli));
  }

  onClienteFacturacionChange(id: string): void {
    const c = this.clientesFe().find((x) => x._id === id) || null;
    this.aplicarClienteAlContrato(c);
    this.previewFacturaContrato.set(null);
  }

  onClienteContratoPick(opt: EnumBuscarOption): void {
    this.onClienteFacturacionChange(String(opt.value));
  }

  onClienteContratoLimpiar(): void {
    this.onClienteFacturacionChange('');
  }

  inicialesCliente(cli: Cliente): string {
    const base = (cli.razonSocial || cli.nombres || cli.nombreComercial || cli.nombre || '?').trim();
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  }

  nombreMostrarCliente(cli: Cliente): string {
    return (cli.razonSocial || cli.nombres || cli.nombre || cli.nombreComercial || '—').trim();
  }

  abrirCrearClienteFe(): void {
    window.open('/app/configuracion/clientes', '_blank', 'noopener');
  }

  recargarClientesFe(): void {
    this.clienteSvc.listar().subscribe({
      next: (rows) => {
        this.clientesFe.set(rows || []);
        const cli = this.clienteFeSeleccionado();
        if (cli) this.aplicarClienteAlContrato(cli);
        this.mostrarMsg('Lista de clientes actualizada.', 'ok', 'Clientes');
      },
      error: () => this.mostrarMsg('No se pudieron recargar los clientes.', 'error', 'Clientes'),
    });
  }

  cargarEstadoFacturaContrato(id?: string): void {
    if (!id) {
      this.estadoFacturaContrato.set(null);
      return;
    }
    this.feSvc.estadoFacturaContrato(id).subscribe({
      next: (r) => this.estadoFacturaContrato.set(r),
      error: () => this.estadoFacturaContrato.set(null),
    });
  }

  puedeVerFinanzasContrato(): boolean {
    return this.puedeFacturarContrato() || this.puedeGestionarCobroContrato();
  }

  cargarFinanzasContrato(): void {
    const id = this.formContrato()._id || this.contratoSel();
    if (!id) return;
    if (!this.formContrato()._id) {
      const c = this.buscarContratoPorId(id);
      if (c) this.editarContrato(c);
      return;
    }
    this.cargarEstadoFacturaContrato(id);
    this.cargarEstadoCobroContrato(id);
  }

  avanceCobroPct(): number {
    const ec = this.estadoCobroContrato();
    const v = Number(this.formContrato().valorContrato) || Number(ec?.valorContrato) || 0;
    if (!(v > 0)) return 0;
    const pagado = Number(ec?.totalPagado) || 0;
    return Math.min(100, Math.round((pagado / v) * 100));
  }

  puedeFacturarContrato(): boolean {
    return (
      this.permisoSvc.tiene('facturacion') || this.permisoSvc.tiene('alumnos.pagos')
    );
  }

  contratoYaFacturado(): boolean {
    return !!this.estadoFacturaContrato()?.facturado;
  }

  private guardarDatosFacturacionContrato(id: string) {
    const f = this.formContrato();
    return this.jornadaSvc.actualizarContrato(id, {
      idClienteFacturacion: f.idClienteFacturacion || null,
      valorContrato: f.valorContrato ?? 0,
    });
  }

  calcularPreviewFacturaContrato(): void {
    const id = this.formContrato()._id;
    if (!id) {
      this.mostrarMsg('Guarde el contrato antes de calcular la factura.', 'warn', 'Facturación');
      return;
    }
    if (!this.formContrato().idClienteFacturacion) {
      this.mostrarMsg('Seleccione el cliente de facturación.', 'warn', 'Facturación');
      return;
    }
    const valor = Number(this.formContrato().valorContrato) || 0;
    if (!(valor > 0)) {
      this.mostrarMsg('Indique el valor del contrato (mayor a cero).', 'warn', 'Facturación');
      return;
    }
    this.guardarDatosFacturacionContrato(id).subscribe({
      next: () => {
        this.feSvc.previewFacturaContrato(id).subscribe({
          next: (p) => {
            this.previewFacturaContrato.set(p);
            this.mostrarMsg('Resumen de factura calculado.', 'ok', 'Facturación');
          },
          error: (e) =>
            this.mostrarMsg(e?.error?.message || 'No se pudo calcular la factura', 'error', 'Facturación'),
        });
      },
      error: (e) =>
        this.mostrarMsg(e?.error?.message || 'No se pudo guardar valor/cliente del contrato', 'error', 'Facturación'),
    });
  }

  emitirFacturaContrato(): void {
    const id = this.formContrato()._id;
    if (!id) return;
    if (!this.previewFacturaContrato()) {
      this.mostrarMsg('Calcule la factura primero (botón «Calcular factura»).', 'warn', 'Facturación');
      return;
    }
    this.emitiendoFactura.set(true);
    this.guardarDatosFacturacionContrato(id).subscribe({
      next: () => {
        this.feSvc.emitirFacturaContrato(id).subscribe({
          next: (doc) => {
            this.emitiendoFactura.set(false);
            this.cargarEstadoFacturaContrato(id);
            this.previewFacturaContrato.set(null);
            this.mostrarMsg(
              `Factura ${doc.numeroFactura || ''} emitida para el contrato.`,
              'ok',
              'Factura electrónica',
            );
            if (doc.urlPdf) window.open(doc.urlPdf, '_blank', 'noopener');
            this.comprobanteAlertSvc.notificarDesdeFactura(doc as unknown as Record<string, unknown>, {
              nombreCompleto:
                (doc as { adquirente?: { nombre?: string } }).adquirente?.nombre || 'Contrato capacitación',
            });
          },
          error: (e) => {
            this.emitiendoFactura.set(false);
            this.mostrarMsg(e?.error?.message || 'Error al emitir factura', 'error', 'Facturación');
          },
        });
      },
      error: (e) => {
        this.emitiendoFactura.set(false);
        this.mostrarMsg(e?.error?.message || 'No se pudo guardar valor/cliente del contrato', 'error', 'Facturación');
      },
    });
  }

  fmtMoney(n?: number | null): string {
    return Number(n || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  etiquetaIvaServicioContrato(perfil?: {
    condicionIva?: string;
    porcentajeIva?: number;
  } | null): string {
    const c = String(perfil?.condicionIva || 'excluido').toLowerCase();
    const pct = Number(perfil?.porcentajeIva) || 0;
    if (c === 'gravado' && pct > 0) return `Gravado ${pct}%`;
    if (c === 'exento') return 'Exento';
    return 'Sin IVA';
  }

  sumaPlanCobro = computed(() =>
    (this.formContrato().planCobro || []).reduce((a, c) => a + (Number(c.valor) || 0), 0),
  );

  planCobroCuadrado = computed(() => {
    const total = Number(this.formContrato().valorContrato) || 0;
    if (!(total > 0)) return true;
    return Math.abs(this.sumaPlanCobro() - total) <= 1;
  });

  puedeGestionarCobroContrato(): boolean {
    return this.permisoSvc.tiene(['jornadas.gestionar', 'facturacion']);
  }

  private cargarCatalogosCobroContrato(): void {
    this.catSvc.list('catTipoPago', { refresh: true }).subscribe({
      next: (rows) => this.tiposPagoContrato.set(rows?.length ? rows : []),
    });
    this.catSvc.list('cuentasBancarias', { refresh: true }).subscribe({
      next: (rows) => this.cuentasBancariasContrato.set(rows || []),
    });
    this.cajaSvc.activa().subscribe({
      next: (r) => this.cajaAbiertaContrato.set(!!r.abierta),
    });
  }

  cargarEstadoCobroContrato(id?: string): void {
    const cid = id || this.formContrato()._id;
    if (!cid) {
      this.estadoCobroContrato.set(null);
      return;
    }
    this.jornadaSvc.estadoCobroContrato(cid).subscribe({
      next: (r) => {
        this.estadoCobroContrato.set(r);
        this.formContrato.update((f) => ({
          ...f,
          planCobro: r.planCobro || f.planCobro || [],
          comprobantesIngresoCaja: r.comprobantesIngresoCaja,
          cuentaCobroNumero: r.cuentaCobro?.numero || f.cuentaCobroNumero,
          cuentaCobroGeneradaAt: r.cuentaCobro?.generadaAt || f.cuentaCobroGeneradaAt,
        }));
      },
      error: () => this.estadoCobroContrato.set(null),
    });
  }

  private nuevaIdCuota(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  agregarCuotaPlan(): void {
    const n = (this.formContrato().planCobro || []).length + 1;
    const cuota: CuotaPlanCobroDto = {
      id: this.nuevaIdCuota(),
      etiqueta: `Cuota ${n}`,
      valor: 0,
      orden: n - 1,
    };
    this.formContrato.update((f) => ({
      ...f,
      planCobro: [...(f.planCobro || []), cuota],
    }));
  }

  async quitarCuotaPlan(id: string): Promise<void> {
    const cuota = (this.formContrato().planCobro || []).find((c) => c.id === id);
    if (cuota?.pagado || cuota?.idIngreso) {
      this.mostrarMsg('No puede quitar una cuota que ya tiene comprobante.', 'warn', 'Plan de cobro');
      return;
    }
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: `¿De verdad desea borrar la cuota «${cuota?.etiqueta || 'sin nombre'}» del plan de cobro?`,
      variant: 'danger',
      confirmLabel: 'Sí, borrar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    this.formContrato.update((f) => ({
      ...f,
      planCobro: (f.planCobro || []).filter((c) => c.id !== id),
    }));
  }

  patchCuotaPlan(id: string, patch: Partial<CuotaPlanCobroDto>): void {
    this.formContrato.update((f) => ({
      ...f,
      planCobro: (f.planCobro || []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  dividirPlanEnCuotasIguales(cantidad: number): void {
    const total = Number(this.formContrato().valorContrato) || 0;
    if (!(total > 0) || cantidad < 1) {
      this.mostrarMsg('Indique el valor del contrato primero.', 'warn', 'Plan de cobro');
      return;
    }
    const pagadas = (this.formContrato().planCobro || []).filter((c) => c.pagado || c.idIngreso);
    if (pagadas.length) {
      this.mostrarMsg('No puede redividir: hay cuotas con comprobante.', 'warn', 'Plan de cobro');
      return;
    }
    const base = Math.floor(total / cantidad);
    let resto = total - base * cantidad;
    const cuotas: CuotaPlanCobroDto[] = [];
    for (let i = 0; i < cantidad; i++) {
      const extra = resto > 0 ? 1 : 0;
      if (resto > 0) resto -= 1;
      cuotas.push({
        id: this.nuevaIdCuota(),
        etiqueta: cantidad === 1 ? 'Pago total' : `Cuota ${i + 1}`,
        valor: base + extra,
        orden: i,
      });
    }
    this.formContrato.update((f) => ({ ...f, planCobro: cuotas }));
  }

  async generarCuentaCobroContrato(): Promise<void> {
    const f = this.formContrato();
    const id = f._id;
    if (!id) {
      this.mostrarMsg('Guarde el contrato antes de generar la cuenta de cobro.', 'warn', 'Cuenta de cobro');
      return;
    }
    if (!(Number(f.valorContrato) > 0)) {
      this.mostrarMsg('Indique el valor del contrato.', 'warn', 'Cuenta de cobro');
      return;
    }
    const cli = this.clientesFe().find((x) => x._id === f.idClienteFacturacion);
    if (!cli) {
      this.mostrarMsg('Seleccione el cliente del contrato.', 'warn', 'Cuenta de cobro');
      return;
    }
    this.generandoCuentaCobro.set(true);
    this.jornadaSvc.actualizarContrato(id, this.contratoDtoConCliente(f, cli)).subscribe({
      next: (c) => {
        this.formContrato.set(c);
        this.jornadaSvc.generarCuentaCobroContrato(id).subscribe({
          next: (r) => {
            this.generandoCuentaCobro.set(false);
            this.formContrato.update((f) => ({
              ...f,
              cuentaCobroNumero: r.numero,
              cuentaCobroGeneradaAt: r.generadaAt,
            }));
            this.cargarEstadoCobroContrato(id);
            this.mostrarMsg(`Cuenta de cobro ${r.numero} generada.`, 'ok', 'Cuenta de cobro');
          },
          error: (e) => {
            this.generandoCuentaCobro.set(false);
            this.mostrarMsg(e?.error?.message || 'No se pudo generar la cuenta de cobro.', 'error', 'Error');
          },
        });
      },
      error: (e) => {
        this.generandoCuentaCobro.set(false);
        this.mostrarMsg(e?.error?.message || 'No se pudo guardar el contrato.', 'error', 'Error');
      },
    });
  }

  imprimirCuentaCobroContrato(): void {
    const id = this.formContrato()._id;
    if (!id || !this.formContrato().cuentaCobroNumero) {
      this.mostrarMsg('Genere primero la cuenta de cobro.', 'warn', 'Cuenta de cobro');
      return;
    }
    this.jornadaSvc.abrirHtmlCuentaCobroContrato(id, (msg) =>
      this.mostrarMsg(msg, 'error', 'Cuenta de cobro'),
    );
  }

  abrirModalComprobanteCuota(cuota: CuotaPlanCobroDto): void {
    if (cuota.pagado || cuota.idIngreso) return;
    this.cuotaComprobanteSel.set(cuota);
    this.comprobanteCuotaFecha.set(ymdLocal(new Date()));
    this.comprobanteCuotaTipoPago.set('');
    this.comprobanteCuotaCuenta.set('');
    this.comprobanteCuotaRef.set('');
    this.comprobanteCuotaObs.set('');
    this.quitarSoporteComprobanteCuota();
    this.comprobanteCuotaEntraCaja.set(!!this.formContrato().comprobantesIngresoCaja);
    this.cajaSvc.activa().subscribe({
      next: (r) => this.cajaAbiertaContrato.set(!!r.abierta),
    });
    this.modalComprobanteCuotaOpen.set(true);
  }

  cerrarModalComprobanteCuota(): void {
    if (this.generandoComprobanteCuota()) return;
    this.modalComprobanteCuotaOpen.set(false);
    this.cuotaComprobanteSel.set(null);
    this.quitarSoporteComprobanteCuota();
  }

  onComprobanteCuotaTipoPagoChange(id: string): void {
    this.comprobanteCuotaTipoPago.set(id);
    this.quitarSoporteComprobanteCuota();
  }

  quitarSoporteComprobanteCuota(): void {
    this.comprobanteCuotaArchivoSoporte.set(null);
    this.comprobanteCuotaPreviewSoporte.set(null);
  }

  onSoporteComprobanteCuota(file: File): void {
    const ok = leerImagenSoporte(
      file,
      (dataUrl) => {
        this.comprobanteCuotaArchivoSoporte.set(file);
        this.comprobanteCuotaPreviewSoporte.set(dataUrl);
      },
      (msg) => this.mostrarMsg(msg, 'warn', 'Soporte de pago'),
    );
    if (!ok) this.quitarSoporteComprobanteCuota();
  }

  comprobanteCuotaFormaPagoLabel(): string {
    const id = this.comprobanteCuotaTipoPago();
    const t = this.tiposPagoContrato().find((x) => this.tipoPagoValorContrato(x) === id);
    return t ? this.tipoPagoLabelContrato(t) : '';
  }

  comprobanteCuotaRequiereCuenta(): boolean {
    return this.comprobanteCuotaRequiereReferencia();
  }

  comprobanteCuotaRequiereReferencia(): boolean {
    const label = this.comprobanteCuotaFormaPagoLabel();
    return !!label && requiereReferenciaPago(label);
  }

  comprobanteCuotaRequiereSoporte(): boolean {
    const label = this.comprobanteCuotaFormaPagoLabel();
    return !!label && requiereSoportePago(label);
  }

  private inputPagoIntangibleComprobanteCuota() {
    return {
      esIntangible: this.comprobanteCuotaRequiereReferencia(),
      referencia: this.comprobanteCuotaRef(),
      archivo: this.comprobanteCuotaArchivoSoporte(),
    };
  }

  puedeRegistrarComprobanteCuota(): boolean {
    const cuota = this.cuotaComprobanteSel();
    if (!cuota || !(Number(cuota.valor) > 0) || !this.comprobanteCuotaTipoPago()) return false;
    if (this.comprobanteCuotaEntraCaja() && !this.cajaAbiertaContrato()) return false;
    if (this.comprobanteCuotaRequiereCuenta() && !this.comprobanteCuotaCuenta()) return false;
    return pagoIntangibleCompleto(this.inputPagoIntangibleComprobanteCuota());
  }

  tipoPagoValorContrato(t: Record<string, unknown>): string {
    const v = t['idTipoPago'] ?? t['codigo'] ?? t['_id'];
    return v != null ? String(v) : '';
  }

  tipoPagoLabelContrato(t: Record<string, unknown>): string {
    const d = t['descripcion'] ?? t['nombre'] ?? t['tipo'];
    return d ? String(d) : this.tipoPagoValorContrato(t);
  }

  cuentaValorContrato(c: Record<string, unknown>): string {
    const v = c['idCuentaBancaria'] ?? c['idCuenta'] ?? c['_id'];
    return v != null ? String(v) : '';
  }

  labelCuentaContrato(c: Record<string, unknown>): string {
    const b = String(c['banco'] || '').trim();
    const n = c['numCuenta'] ?? '';
    const t = String(c['tipo'] || '').trim();
    return [b, t, n].filter(Boolean).join(' — ');
  }

  registrarComprobanteCuota(): void {
    const id = this.formContrato()._id;
    const cuota = this.cuotaComprobanteSel();
    if (!id || !cuota) return;
    if (!this.planCobroCuadrado()) {
      this.mostrarMsg('Las cuotas deben sumar el valor del contrato. Guarde el plan primero.', 'warn', 'Plan de cobro');
      return;
    }
    this.generandoComprobanteCuota.set(true);
    const cli = this.clientesFe().find((x) => x._id === this.formContrato().idClienteFacturacion);
    const payload = cli ? this.contratoDtoConCliente(this.formContrato(), cli) : this.formContrato();
    this.jornadaSvc.actualizarContrato(id, payload).subscribe({
      next: (c) => {
        this.formContrato.set(c);
        this.jornadaSvc
          .generarComprobanteIngresoContrato(
            id,
            {
              idCuota: cuota.id,
              entraCaja: this.comprobanteCuotaEntraCaja(),
              fecha: this.comprobanteCuotaFecha(),
              idTipoPago: this.comprobanteCuotaTipoPago(),
              idCuentaBancaria: this.comprobanteCuotaCuenta() || undefined,
              numTransferencia: this.comprobanteCuotaRef() || undefined,
              observaciones: this.comprobanteCuotaObs() || undefined,
            },
            this.comprobanteCuotaArchivoSoporte(),
          )
          .subscribe({
            next: (r) => {
              this.generandoComprobanteCuota.set(false);
              this.estadoCobroContrato.set(r.cobro);
              this.formContrato.update((f) => ({ ...f, planCobro: r.cobro.planCobro }));
              this.cerrarModalComprobanteCuota();
              this.mostrarMsg(`Comprobante ${r.ingreso.numRecibo} registrado.`, 'ok', 'Ingreso contrato');
              this.comprobanteImpresion.abrirIngreso(r.ingreso._id);
            },
            error: (e) => {
              this.generandoComprobanteCuota.set(false);
              this.mostrarMsg(e?.error?.message || 'No se pudo registrar el comprobante.', 'error', 'Error');
            },
          });
      },
      error: (e) => {
        this.generandoComprobanteCuota.set(false);
        this.mostrarMsg(e?.error?.message || 'No se pudo guardar el plan de cobro.', 'error', 'Error');
      },
    });
  }

  imprimirComprobanteCuota(idIngreso?: string | null): void {
    if (!idIngreso) return;
    this.comprobanteImpresion.abrirIngreso(idIngreso);
  }

  puedeAnularComprobanteContrato(): boolean {
    return this.permisoSvc.tiene(['jornadas.gestionar', 'alumnos.pagos', 'facturacion']);
  }

  puedeAnularFacturaContrato(): boolean {
    const est = String(this.estadoFacturaContrato()?.factura?.estado || '').toLowerCase();
    return this.puedeFacturarContrato() && est !== 'anulada';
  }

  async anularComprobanteCuota(cuota: CuotaPlanCobroDto): Promise<void> {
    const idIngreso = cuota.idIngreso ? String(cuota.idIngreso) : '';
    if (!idIngreso || !this.puedeAnularComprobanteContrato()) return;
    const ok = await this.confirmSvc.open({
      title: 'Confirmar anulación',
      message: `¿De verdad desea anular el comprobante de «${cuota.etiqueta || 'cuota'}»?\n\nLa cuota quedará pendiente y se revertirá el servicio causado.`,
      confirmLabel: 'Sí, anular',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.ejecutarAnularComprobanteContrato(cuota, idIngreso);
  }

  private ejecutarAnularComprobanteContrato(
    cuota: CuotaPlanCobroDto,
    idIngreso: string,
    auth?: { autorizadoUsername: string; autorizadoPassword: string },
  ): void {
    this.ingresoSvc.eliminar(idIngreso, auth).subscribe({
      next: () => {
        this.cancelarAuthAnularIngresoContrato();
        const cid = this.formContrato()._id;
        if (cid) this.cargarEstadoCobroContrato(cid);
        this.mostrarMsg(`Comprobante de «${cuota.etiqueta || 'cuota'}» anulado.`, 'ok', 'Ingreso contrato');
      },
      error: (e) => {
        if (e?.error?.code === 'SUPERVISOR_AUTH_REQUIRED') {
          this.ingresoAnularContratoPendiente.set({ idIngreso, cuotaId: cuota.id });
          this.mostrarAuthAnularIngresoContrato.set(true);
          return;
        }
        this.mostrarMsg(e?.error?.message || 'No se pudo anular el comprobante.', 'error', 'Error');
      },
    });
  }

  confirmarAuthAnularIngresoContrato(): void {
    const pend = this.ingresoAnularContratoPendiente();
    if (!pend) return;
    const u = this.authAdminUserAnular().trim();
    const p = this.authAdminPassAnular();
    if (!u || !p) {
      this.mostrarMsg('Ingrese usuario y contraseña de administrador.', 'warn', 'Autorización');
      return;
    }
    const cuota = (this.formContrato().planCobro || []).find((c) => c.id === pend.cuotaId);
    if (!cuota) {
      this.mostrarMsg('Cuota no encontrada.', 'error', 'Error');
      return;
    }
    this.ejecutarAnularComprobanteContrato(cuota, pend.idIngreso, {
      autorizadoUsername: u,
      autorizadoPassword: p,
    });
  }

  cancelarAuthAnularIngresoContrato(): void {
    this.mostrarAuthAnularIngresoContrato.set(false);
    this.ingresoAnularContratoPendiente.set(null);
    this.authAdminUserAnular.set('');
    this.authAdminPassAnular.set('');
  }

  verFacturaContrato(): void {
    const id = this.estadoFacturaContrato()?.factura?._id;
    if (!id) return;
    this.feSvc.obtener(id).subscribe({
      next: (f) => this.feSvc.verFactura(f, (m) => this.mostrarMsg(m, 'error', 'Factura')),
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo abrir la factura.', 'error', 'Factura'),
    });
  }

  abrirAnularFacturaContrato(): void {
    const id = this.estadoFacturaContrato()?.factura?._id;
    if (!id || !this.puedeAnularFacturaContrato()) return;
    this.cargandoFacturaContratoNota.set(true);
    this.feSvc.obtener(id).subscribe({
      next: (f) => {
        this.cargandoFacturaContratoNota.set(false);
        this.facturaContratoNota.set(f);
      },
      error: (e) => {
        this.cargandoFacturaContratoNota.set(false);
        this.mostrarMsg(e?.error?.message || 'No se pudo cargar la factura.', 'error', 'Factura');
      },
    });
  }

  cerrarNotaCreditoFacturaContrato(): void {
    this.facturaContratoNota.set(null);
  }

  onNotaCreditoFacturaContratoEmitida(): void {
    this.facturaContratoNota.set(null);
    const cid = this.formContrato()._id;
    if (cid) {
      this.cargarEstadoFacturaContrato(cid);
      this.previewFacturaContrato.set(null);
    }
    this.mostrarMsg('Factura anulada con nota crédito. Puede emitir una nueva factura si lo requiere.', 'ok', 'Facturación');
  }

  guardarContrato() {
    if (this.contratoFormEjecutado()) {
      this.mostrarMsg(
        'El contrato está Ejecutado. No se pueden guardar cambios. Si necesita ajustar datos, reabra el contrato o cree uno nuevo.',
        'warn',
        'Contrato ejecutado',
      );
      return;
    }
    const f = this.formContrato();
    if (!f.idClienteFacturacion) {
      this.mostrarMsg(
        'Seleccione la empresa desde el catálogo de clientes.',
        'warn',
        'Datos del contrato',
      );
      return;
    }
    const cli = this.clientesFe().find((x) => x._id === f.idClienteFacturacion);
    if (!cli) {
      this.mostrarMsg(
        'Cliente no encontrado. Recargue la lista o créelo en Configuración → Clientes.',
        'warn',
        'Datos del contrato',
      );
      return;
    }
    if (this.normalizarTipoCertificadoContrato(f.tipoCertificado) === 'global') {
      if (!String(f.idProgramaCertificacion || '').trim()) {
        this.mostrarMsg(
          'En certificación global debe elegir el programa de certificación (sección Certificado).',
          'warn',
          'Datos del contrato',
        );
        return;
      }
    }
    const payload = this.contratoDtoConCliente(f, cli);
    this.loading.set(true);
    const req = payload._id
      ? this.jornadaSvc.actualizarContrato(payload._id, payload)
      : this.jornadaSvc.crearContrato(payload);
    req.subscribe({
      next: (c) => {
        this.loading.set(false);
        this.formContrato.set({
          ...c,
          tipoCertificado: this.normalizarTipoCertificadoContrato(c.tipoCertificado),
          idProgramas: [...(c.idProgramas || [])],
          planCobro: [...(c.planCobro || [])],
        });
        this.contratoSel.set(c._id || '');
        this.recargarContratos();
        this.cargarAvanceContrato(c._id);
        this.cargarEstadoCobroContrato(c._id);
        this.mostrarMsg('La contratación quedó registrada. Ya puede generar las jornadas.', 'ok', 'Contrato guardado');
      },
      error: (e) => {
        this.loading.set(false);
        this.mostrarMsg(e?.error?.message || 'Revise los datos e intente de nuevo.', 'error', 'No se guardó el contrato');
      },
    });
  }

  editarContrato(c: ContratacionDto) {
    this.editarContratoSinAvance(c);
  }

  /** Carga formulario del contrato sin disparar fetch duplicado de avance (lo hace el effect). */
  private editarContratoSinAvance(c: ContratacionDto) {
    this.formContrato.set({
      ...c,
      objetoContrato: c.objetoContrato || c.objeto || '',
      fechaInicJornadas: c.fechaInicJornadas ? ymdCalendario(c.fechaInicJornadas) : '',
      fechaFinJornadas: c.fechaFinJornadas ? ymdCalendario(c.fechaFinJornadas) : '',
      idProgramas: [...(c.idProgramas || [])],
      planCobro: [...(c.planCobro || [])],
      comprobantesIngresoCaja: !!c.comprobantesIngresoCaja,
      tipoCertificado: this.normalizarTipoCertificadoContrato(c.tipoCertificado),
      idProgramaCertificacion: String(c.idProgramaCertificacion || '').trim(),
    });
    this.cargarProgramasJornada();
    const cli = this.clientesFe().find((x) => x._id === c.idClienteFacturacion);
    if (cli) this.aplicarClienteAlContrato(cli);
    this.fechaFinalizacionContrato.set(
      c.fechaFinalizacion ? ymdCalendario(c.fechaFinalizacion) : ymdLocal(new Date()),
    );
    this.contratoSel.set(c._id || '');
    const label =
      c.ciudad && c.departamento
        ? `${c.ciudad} — ${c.departamento}`
        : c.ciudad || '';
    this.ciudadContratoTexto.set(label);
    this.previewFacturaContrato.set(null);
    this.cargarEstadoFacturaContrato(c._id);
    this.cargarEstadoCobroContrato(c._id);
    if (this.vistaContratoCal()) this.recargarClasesContratoCal();
    if (c.codMunicipio) {
      this.catSvc.municipioPorCodigo(c.codMunicipio).subscribe({
        next: (m) => this.ciudadContratoTexto.set(m.label || label),
        error: () => this.ciudadContratoTexto.set(label),
      });
    }
  }

  cargarAvanceContrato(_idContrato?: string) {
    if (!this.contratoAvanceId()) return;
    this.avanceRefreshTick.update((n) => n + 1);
  }

  generarJornadas() {
    if (this.contratoFormEjecutado()) {
      this.mostrarMsg(
        'El contrato está Ejecutado. No se pueden generar jornadas faltantes.',
        'warn',
        'Contrato ejecutado',
      );
      return;
    }
    const id = this.formContrato()._id || this.contratoSel();
    if (!id) {
      this.mostrarMsg('Primero guarde la contratación; después use «Generar faltantes».', 'warn', 'Contrato sin guardar');
      return;
    }
    const inicioTxt = this.formContrato().fechaInicJornadas
      ? this.fmtFecha(this.formContrato().fechaInicJornadas)
      : '';
    if (!inicioTxt || inicioTxt === '—') {
      this.mostrarMsg('Indique la fecha de inicio de jornadas en el contrato y guárdelo.', 'warn', 'Fecha requerida');
      return;
    }
    const finTxt = this.formContrato().fechaFinJornadas
      ? this.fmtFecha(this.formContrato().fechaFinJornadas)
      : '';
    if (!finTxt || finTxt === '—') {
      this.mostrarMsg(
        'Indique la fecha fin de jornadas en el contrato y guárdela (marco de programación).',
        'warn',
        'Fecha fin requerida',
      );
      return;
    }
    this.loading.set(true);
    this.jornadaSvc.generarJornadas(id).subscribe({
      next: (r) => {
        this.loading.set(false);
        const desde = r.fechaDesde ? this.fmtFecha(r.fechaDesde) : inicioTxt;
        const hasta = r.fechaFin ? this.fmtFecha(r.fechaFin) : finTxt;
        const notaClases =
          (r.clasesCreadas ?? 0) > 0
            ? ` Se autogeneraron ${r.clasesCreadas} clase(s) en ${r.jornadasProcesadasClases ?? 'las'} jornada(s).${
                (this.formContrato().idProgramas?.length ?? 0) > 0
                  ? ' Programas repartidos según la configuración del contrato.'
                  : ''
              }`
            : '';
        let cuerpo = '';
        if (r.count > 0) {
          const meta = r.metaJornadas ?? this.formContrato().numerojornadas ?? r.total;
          cuerpo = `Se crearon ${r.count} jornada(s) del ${desde} al ${hasta}. Total generadas: ${r.total ?? r.count} de ${meta} planificada(s).`;
        } else if (r.jornadasCompletas) {
          const meta = r.metaJornadas ?? this.formContrato().numerojornadas ?? r.total;
          cuerpo = `Las jornadas del contrato ya están completas (${r.total ?? '—'} de ${meta} planificada(s)).`;
        } else {
          cuerpo = 'No había fechas pendientes por programar.';
        }
        cuerpo += notaClases;
        const huboCambios = r.count > 0 || (r.clasesCreadas ?? 0) > 0;
        this.mostrarMsg(
          cuerpo,
          huboCambios ? 'ok' : 'info',
          huboCambios ? 'Programación actualizada' : 'Sin cambios',
        );
        this.aplicarContratoSync(r.contrato);
        this.recargarContratos();
        if (this.contratoSel() === id || this.formContrato()._id === id) {
          this.recargarVistaJornadas();
        }
        if (this.vistaContratoCal()) this.recargarClasesContratoCal();
        this.cargarAvanceContrato(id);
        if (r.count > 0) {
          this.setTab('jornadas');
        }
        if (r.count > 0) {
          this.liveSync.mostrarToastGeneracionJornadas(r.count);
          this.jornadaSvc.listarJornadas({ idContrato: id }).subscribe({
            next: (rows) => this.liveSync.marcarJornadasConocidas((rows || []).map((j) => j._id)),
          });
        }
      },
      error: (e) => {
        this.loading.set(false);
        this.mostrarMsg(e?.error?.message || 'No fue posible generar las jornadas.', 'error', 'Error de programación');
      },
    });
  }

  setVistaContratoCal(v: boolean) {
    this.vistaContratoCal.set(v);
    if (v) {
      const id = this.formContrato()._id;
      if (id && this.contratoSel() !== id) {
        this.contratoSel.set(id);
        this.recargarJornadas();
      }
      this.irSemanaHoy();
      this.recargarClasesContratoCal();
    }
  }

  recargarClasesContratoCal() {
    const id = this.formContrato()._id || this.contratoSel();
    if (!id) {
      this.clasesContratoCal.set([]);
      return;
    }
    this.loadingClasesContratoCal.set(true);
    this.jornadaSvc.listarClases({ idContrato: id }).subscribe({
      next: (r) => {
        this.clasesContratoCal.set(r || []);
        this.loadingClasesContratoCal.set(false);
      },
      error: () => {
        this.clasesContratoCal.set([]);
        this.loadingClasesContratoCal.set(false);
      },
    });
  }

  labelTipoCertificado(tipo?: string): string {
    return this.normalizarTipoCertificadoContrato(tipo) === 'por_clase'
      ? 'Por clase'
      : 'Global (contrato)';
  }

  setVistaJornadas(v: VistaAgenda) {
    this.vistaJornadas.set(v);
    this.recargarVistaJornadas();
  }

  setVistaClases(v: VistaAgenda) {
    this.vistaClases.set(v);
    if (v === 'calendario') this.recargarClases();
  }

  recargarVistaJornadas() {
    if (this.vistaJornadas() === 'calendario') {
      this.recargarJornadasCalendario();
      return;
    }
    this.recargarJornadas();
  }

  recargarJornadas() {
    const id = this.contratoSel();
    if (!id) {
      this.jornadas.set([]);
      return;
    }
    this.jornadaSvc.listarJornadas({ idContrato: id }).subscribe({
      next: (r) => {
        this.jornadas.set(r || []);
        this.liveSync.marcarJornadasConocidas((r || []).map((j) => j._id));
        const pend = this.jornadaPendienteQp();
        if (pend && (r || []).some((j) => j._id === pend)) {
          this.jornadaSel.set(pend);
          this.jornadaPendienteQp.set(null);
          const j = (r || []).find((x) => x._id === pend);
          if (this.tab() === 'clases') {
            if (this.clasePendienteQp()) {
              this.recargarClases();
            } else if (j) {
              this.abrirJornadaEnClases(j);
            }
          } else if (this.tab() === 'jornadas' && j) {
            this.vistaJornadas.set('lista');
            this.editarJornada(j);
          }
        } else {
          this.autoSeleccionarJornadaHoy();
        }
      },
    });
  }

  recargarJornadasCalendario() {
    const { desde, hasta } = rangoVisibleMes(this.calAnio(), this.calMes());
    const id = this.contratoSel();
    const params: { desde: string; hasta: string; idContrato?: string } = { desde, hasta };
    if (id) params.idContrato = id;
    this.loadingCalJornadas.set(true);
    this.jornadaSvc.listarJornadas(params).subscribe({
      next: (r) => {
        this.jornadasCalendario.set(r || []);
        this.liveSync.marcarJornadasConocidas((r || []).map((j) => j._id));
        this.loadingCalJornadas.set(false);
      },
      error: () => {
        this.jornadasCalendario.set([]);
        this.loadingCalJornadas.set(false);
      },
    });
  }

  mesAnterior() {
    let m = this.calMes() - 1;
    let a = this.calAnio();
    if (m < 0) {
      m = 11;
      a -= 1;
    }
    this.calMes.set(m);
    this.calAnio.set(a);
    this.calDiaExpandido.set(null);
    this.recargarJornadasCalendario();
  }

  mesSiguiente() {
    let m = this.calMes() + 1;
    let a = this.calAnio();
    if (m > 11) {
      m = 0;
      a += 1;
    }
    this.calMes.set(m);
    this.calAnio.set(a);
    this.calDiaExpandido.set(null);
    this.recargarJornadasCalendario();
  }

  irMesHoy() {
    const hoy = new Date();
    this.calMes.set(hoy.getMonth());
    this.calAnio.set(hoy.getFullYear());
    this.calDiaExpandido.set(null);
    this.recargarJornadasCalendario();
  }

  semanaAnterior() {
    const d = new Date(this.semanaInicio());
    d.setDate(d.getDate() - 7);
    this.semanaInicio.set(inicioSemana(d));
  }

  semanaSiguiente() {
    const d = new Date(this.semanaInicio());
    d.setDate(d.getDate() + 7);
    this.semanaInicio.set(inicioSemana(d));
  }

  irSemanaHoy() {
    this.semanaInicio.set(inicioSemana(new Date()));
  }

  jornadasEnDia(key: string): JornadaCapDto[] {
    if (!key) return [];
    return this.jornadasPorDia().get(key) ?? [];
  }

  jornadasEnDiaVisibles(key: string): JornadaCapDto[] {
    const all = this.jornadasEnDia(key);
    if (this.calDiaExpandido() === key) return all;
    return all.slice(0, this.calMaxEventosDia);
  }

  jornadasEnDiaOcultas(key: string): number {
    const all = this.jornadasEnDia(key);
    if (this.calDiaExpandido() === key) return 0;
    return Math.max(0, all.length - this.calMaxEventosDia);
  }

  toggleDiaCalExpandido(key: string, ev?: Event) {
    ev?.stopPropagation();
    this.calDiaExpandido.update((k) => (k === key ? null : key));
  }

  conteoClasesDia(key: string): number {
    return (this.clasesPorDiaSemanaFiltradas().get(key) ?? []).length;
  }

  clasesEnDia(key: string): any[] {
    return (this.clasesPorDiaSemanaFiltradas().get(key) ?? []).filter(
      (c) => !layoutHorarioClase(c.horaInicio, c.horaFin).sinHorario,
    );
  }

  layoutClase(c: { horaInicio?: string; horaFin?: string }) {
    return layoutHorarioClase(c.horaInicio, c.horaFin);
  }

  layoutsCalendarioDia(clases: { _id?: string; horaInicio?: string; horaFin?: string }[]) {
    return layoutsCalendarioDiaClase(
      clases.filter((c) => c._id).map((c) => ({ id: c._id!, horaInicio: c.horaInicio, horaFin: c.horaFin })),
    );
  }

  codContratoDe(idContrato?: string): string {
    if (!idContrato) return '';
    return (this.contratos().find((c) => c._id === idContrato)?.codContrato || '').trim();
  }

  chipJornadaCal(j: JornadaCapDto): string {
    const cod = this.codContratoDe(j.idContrato);
    const m = (j.municipio || '').trim();
    if (cod && m) return `${cod} · ${m}`;
    return cod || m || 'Jornada';
  }

  chipClaseCal(c: any): string {
    const prog = this.nombrePrograma(c.idPrograma);
    const inst = this.labelInstructorClase(c);
    const carpa = labelCarpaClase(c);
    const base = carpa ? `${prog} · ${carpa}` : prog;
    return inst && inst !== '—' ? `${base} · ${inst}` : base;
  }

  chipClaseCalCorto(c: any): string {
    const prog = this.nombrePrograma(c.idPrograma);
    return c.ubicacion ? `${prog} · ${c.ubicacion}` : prog;
  }

  fmtDiaCal(fecha: Date): string {
    return fmtDiaSemanaCorto(fecha);
  }

  semanaContiene(fechaIso?: string): boolean {
    if (!fechaIso) return false;
    const d = new Date(fechaIso);
    const ini = this.semanaInicio();
    const fin = finSemana(ini);
    return d >= ini && d <= fin;
  }

  private autoSeleccionarJornadaHoy() {
    if (this.tab() !== 'clases') return;
    const actual = this.jornadaSel();
    if (actual && this.jornadas().some((j) => j._id === actual)) return;
    const ops = this.jornadasOperablesHoy();
    if (ops.length === 1) {
      if (actual !== ops[0]._id) {
        this.jornadaSel.set(ops[0]._id!);
        this.recargarClases();
      }
      return;
    }
  }

  etiquetaJornadaFiltro(j: {
    fechaProgramacion?: string;
    municipio?: string;
    indiceEnDia?: number;
    estado?: string;
  }): string {
    const f = this.fmtFecha(j.fechaProgramacion);
    const turno =
      j.indiceEnDia != null && Number(j.indiceEnDia) > 1 ? ` · turno ${j.indiceEnDia}` : '';
    const m = j.municipio ? ` · ${j.municipio}` : '';
    const est = j.estado ? ` — ${j.estado}` : '';
    return `${f}${turno}${m}${est}`;
  }

  onContratoSelChange(id: string) {
    this.contratoSel.set(id);
    const c = this.buscarContratoPorId(id);
    if (c) this.editarContrato(c);
    this.jornadaSel.set('');
    this.claseSel.set('');
    this.claseActiva.set(null);
    this.certFiltroJornadaId.set('');
    this.certFiltroJornadaTexto.set('');
    this.certFiltroClaseId.set('');
    this.certFiltroClaseTexto.set('');
    this.certFiltroDesde.set('');
    this.certFiltroHasta.set('');
    this.certFiltroTexto.set('');
    this.recargarVistaJornadas();
    if (this.tab() === 'clases') {
      this.cargarProgramasJornada();
      this.cargarInstructores();
      this.recargarClases();
    }
    this.consultarProgresoPreview(this.numDocAsis());
    if (this.tab() === 'certificados') this.recargarCerts();
    if (this.tab() === 'finanzas') this.cargarFinanzasContrato();
  }

  onContratoToolbarPick(opt: EnumBuscarOption): void {
    this.onContratoSelChange(String(opt.value));
  }

  onContratoToolbarLimpiar(): void {
    this.onContratoSelChange('');
  }

  onJornadaSelChange(id: string) {
    this.jornadaSel.set(id);
    this.claseSel.set('');
    this.claseActiva.set(null);
    this.recargarClases();
  }

  onJornadaToolbarPick(opt: EnumBuscarOption): void {
    this.onJornadaSelChange(String(opt.value));
  }

  onJornadaToolbarLimpiar(): void {
    this.onJornadaSelChange('');
  }

  patchContrato(k: keyof ContratacionDto, v: unknown) {
    const valor =
      k === 'tipoCertificado' ? this.normalizarTipoCertificadoContrato(v) : v;
    this.formContrato.update((f) => ({ ...f, [k]: valor }));
  }

  jornadaSeleccionadaOperable(): boolean {
    if (this.operacionEspecialActiva()) return !!this.jornadaSel();
    const j = this.jornadas().find((x) => x._id === this.jornadaSel());
    return j?.estado === 'EN PROCESO';
  }

  /** ¿La clase seleccionada pertenece a una jornada operable? */
  claseSeleccionadaOperable(): boolean {
    const cl = this.claseActiva();
    if (!cl) return false;
    if (this.operacionEspecialActiva()) return true;
    if (cl.jornadaEstado === 'EN PROCESO') return true;
    const j = this.jornadas().find((x) => x._id === cl.idJornada);
    return j?.estado === 'EN PROCESO';
  }

  abrirJornadaEnClases(j: any) {
    if (!this.operacionEspecialActiva() && j.estado !== 'EN PROCESO') {
      this.mostrarMsg('Solo puede operar clases el día programado (estado EN PROCESO).', 'warn', 'Jornada no operable');
      return;
    }
    this.jornadaSel.set(j._id);
    this.setTab('clases');
  }

  recargarClases() {
    const idJ = this.jornadaSel();
    const idC = this.contratoSel();
    const opts = idJ ? { idJornada: idJ } : idC ? { idContrato: idC } : {};
    this.jornadaSvc.listarClases(opts).subscribe({
      next: (r) => {
        this.clases.set(this.filtrarClasesAdmin(r || []));
        this.liveSync.marcarClasesConocidas((r || []).map((c) => c._id));
        this.liveSync.sincronizarEstadosClases(r || []);
        const clasePend = this.clasePendienteQp();
        if (clasePend) {
          const cEdit = (r || []).find((x: any) => x._id === clasePend);
          if (cEdit) {
            this.abrirModalEditarClase(cEdit);
          }
          this.clasePendienteQp.set(null);
          return;
        }
        const act = this.claseSel();
        if (act) {
          const c = (r || []).find((x: any) => x._id === act);
          this.claseActiva.set(c || null);
          if (c) {
            this.cargarAsistencias(c._id);
            if (this.modalCrearClase() && this.modalModoClase() === 'editar') {
              // Solo refrescar el combo; no pisar alumnos ya cargados por selección manual.
              this.cargarClasesContratoParaCopiar(c, { syncAlumnos: false });
            }
          }
        }
      },
    });
  }

  private filtrarClasesAdmin(rows: any[]): any[] {
    const est = this.filtroAdminEstado();
    if (!est) return rows;
    return rows.filter((c) => String(c.estado || '').toUpperCase() === est.toUpperCase());
  }

  setModoClases(modo: 'operar' | 'admin') {
    if (modo === 'admin' && !this.puedeAsignarInstructor()) return;
    this.modoClases.set(modo);
    this.claseSel.set('');
    this.claseActiva.set(null);
    this.claseEditando.set(false);
    if (modo === 'admin') {
      this.vistaClases.set('lista');
      if (!this.contratos().length) this.recargarContratos();
      this.cargarProgramasJornada();
      this.cargarInstructores();
    }
    this.recargarClases();
  }

  labelContratoCortoClase(c: any): string {
    const id = c?.idContrato || this.jornadas().find((x) => x._id === c?.idJornada)?.idContrato;
    return this.labelContratoCorto(id);
  }

  onFiltroAdminEstadoChange(est: string) {
    this.filtroAdminEstado.set(est);
    this.recargarClases();
  }

  labelClienteContrato(c: ContratacionDto): string {
    const nom = (c.clienteNombre || c.nombreComercial || c.razoSocial || '').trim();
    const id = (c.clienteIdentificacion || c.numeroIdentificacion || '').trim();
    if (nom && id) return `${nom} (${id})`;
    return nom || id || '—';
  }

  labelContratoCorto(idContrato?: string): string {
    if (!idContrato) return '—';
    const c = this.contratos().find((x) => x._id === idContrato);
    if (!c) return '—';
    return (c.codContrato || c.clienteNombre || c.nombreComercial || c.razoSocial || '').trim() || '—';
  }

  labelContratoDeJornada(idJornada?: string): string {
    if (!idJornada) return '—';
    const j = this.jornadas().find((x) => x._id === idJornada);
    return j ? this.labelContratoCorto(j.idContrato) : '—';
  }

  guardarClaseConMatriculas() {
    const idJ = this.modalCrearJornadaId() || this.jornadaSel();
    const idP = this.nuevaClaseProg();
    if (!idJ) {
      this.mostrarMsg(
        this.operacionEspecialActiva()
          ? 'Seleccione la jornada del contrato en el formulario.'
          : 'Seleccione la jornada del día (EN PROCESO) en el formulario.',
        'warn',
        'Falta jornada',
      );
      return;
    }
    if (!idP) {
      this.mostrarMsg('Seleccione el programa de capacitación para la nueva clase.', 'warn', 'Falta programa');
      return;
    }
    this.guardandoClase.set(true);
    this.jornadaSvc
      .crearClase({
        idJornada: idJ,
        idPrograma: idP,
        ubicacion: this.nuevaClaseUbic(),
        ...(this.puedeAsignarInstructor() && this.modalClaseInstructorId()
          ? { idEmpleadoInstructor: Number(this.modalClaseInstructorId()) }
          : {}),
      })
      .pipe(
        switchMap((c) =>
          this.matricularAlumnosEnPrograma(idP, this.alumnosMatricular(), c._id).pipe(
            map((matResults) => ({ c, matResults })),
          ),
        ),
        finalize(() => this.guardandoClase.set(false)),
      )
      .subscribe({
        next: ({ c, matResults }) => {
          this.aplicarContratoSync(c.contrato);
          this.modalModoClase.set('editar');
          this.modalCrearClase.set(true);
          this.claseSel.set(c._id);
          this.claseActiva.set(c);
          this.alumnosMatricular.set([]);
          this.cargarInscritos(c._id);
          this.cargarClasesContratoParaCopiar(c);
          this.iniciarCronometroSiAplica();
          this.recargarClases();
          this.liveSync.registrarClaseLocal(c);
          this.liveSync.mostrarToastClase(c as unknown as Record<string, unknown>);
          const okRows = matResults.filter((r) => r.ok);
          const fail = matResults.filter((r) => !r.ok);
          let texto = 'Clase creada. Pulse ▶ Iniciar clase cuando la jornada esté EN PROCESO.';
          if (matResults.length) {
            texto += ` Inscritos: ${okRows.length}/${matResults.length}.`;
            if (fail.length) {
              texto += ` No inscritos: ${fail.map((f) => f.nombre).join(', ')}.`;
            }
          }
          if (okRows.length) {
            texto += ' Etiquetas QR en la ficha de cada alumno (Jornadas → Alumnos).';
          }
          this.mostrarMsg(texto, fail.length ? 'warn' : 'ok', 'Clase creada');
        },
        error: (e) =>
          this.mostrarMsg(e?.error?.message || 'No se pudo crear la clase.', 'error', 'Error'),
      });
  }

  private matricularAlumnosEnPrograma(
    idPrograma: string,
    alumnos: AlumnoNombrable[],
    idClase?: string,
  ) {
    if (!alumnos.length) return of([]);
    return forkJoin(
      alumnos.map((a) =>
        this.jornadaSvc.matricularAlumno({ numDoc: a.numDoc, idPrograma, idClase }).pipe(
          map((r: any) => {
            if (!r?.inscripcionDuplicada) {
              this.metaAlumnosAlertSvc.notificarDesdeRespuesta(r?.metaJornada, {
                contratoLabel: this.contratoActivo()?.codContrato,
              });
            }
            return {
              ok: true as const,
              nombre: this.nombreAlumnoItem(a),
              numDoc: a.numDoc,
            };
          }),
          catchError((e) =>
            of({
              ok: false as const,
              nombre: this.nombreAlumnoItem(a),
              numDoc: a.numDoc,
              error: e?.error?.message || 'Error al matricular',
            }),
          ),
        ),
      ),
    );
  }

  seleccionarClase(c: any) {
    this.claseSel.set(c._id);
    this.claseActiva.set(c);
    this.claseEditando.set(false);
    this.cargarAsistencias(c._id);
    this.consultarProgresoPreview(this.numDocAsis());
  }

  seleccionarClaseCalendario(c: any) {
    if (this.tab() === 'contratos') {
      if (c.idContrato) this.onContratoSelChange(c.idContrato);
      if (c.idJornada) this.jornadaSel.set(c.idJornada);
      this.setTab('clases');
      this.vistaClases.set('calendario');
    }
    this.seleccionarClase(c);
    queueMicrotask(() => {
      document.getElementById('clase-panel-ops')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  abrirJornadaCalendario(j: JornadaCapDto) {
    if (j.idContrato && j.idContrato !== this.contratoSel()) {
      this.onContratoSelChange(j.idContrato);
    }
    this.editarJornada(j);
    queueMicrotask(() => {
      document.getElementById('jornada-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  cerrarJornadaOperacion(j: JornadaCapDto, ev?: Event) {
    ev?.stopPropagation();
    if (!this.operacionEspecialActiva()) return;
    if (!j._id) return;
    this.jornadaSvc.cerrarJornadaOperacion(j._id).subscribe({
      next: () => {
        this.recargarVistaJornadas();
        this.mostrarMsg('Jornada cerrada (FINALIZADO).', 'ok', 'Jornada finalizada');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo cerrar la jornada.', 'error', 'Error'),
    });
  }

  reabrirJornadaOperacion(j: JornadaCapDto, ev?: Event) {
    ev?.stopPropagation();
    if (!this.operacionEspecialActiva()) return;
    if (!j._id) return;
    this.jornadaSvc.reabrirJornadaOperacion(j._id).subscribe({
      next: () => {
        this.recargarVistaJornadas();
        this.mostrarMsg('Jornada reabierta según su fecha programada.', 'ok', 'Jornada actualizada');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo reabrir la jornada.', 'error', 'Error'),
    });
  }

  labelContrato(c: ContratacionDto): string {
    const cod = (c.codContrato || '').trim();
    const nom = (c.clienteNombre || c.nombreComercial || c.razoSocial || '').trim();
    if (cod && nom) return `${cod} — ${nom}`;
    return cod || nom || '—';
  }

  labelJornada(j: { fechaProgramacion?: string; municipio?: string }) {
    const f = this.fmtFecha(j.fechaProgramacion);
    const m = j.municipio ? ` · ${j.municipio}` : '';
    return `${f}${m}`;
  }

  subtituloModalClase(): string {
    const id = this.modalCrearJornadaId();
    if (!id) return 'Seleccione la jornada EN PROCESO de hoy';
    const j =
      this.jornadasParaCrear().find((x) => x._id === id) ||
      this.jornadas().find((x) => x._id === id);
    return j ? this.labelJornada(j) : 'Jornada seleccionada';
  }

  editarJornada(j: JornadaCapDto, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    this.jornadaEditModo.set('edit');
    this.jornadaEditError.set(null);
    this.direccionAlertaActiva.set(false);
    this.jornadaEdit.set({ ...j });
    this.jornadaEditLat.set(j.lat != null ? String(j.lat) : '');
    this.jornadaEditLng.set(j.lng != null ? String(j.lng) : '');
    this.jornadaEditDeteGeorefe.set((j.deteGeorefe as DeteGeorefe) || '');
    this.jornadaEditDireccion.set(j.direccion || '');
    this.jornadaEditMunicipio.set(j.municipio || '');
    this.jornadaEditDepto.set(j.depto || '');
    this.jornadaEditCodMunicipio.set(j.codMunicipio || '');
    this.cargarTextoMunicipioJornada(j);
    this.jornadaEditSupervisor.set(j.supervisor || '');
    const supMatch = this.supervisores().find(
      (s) => s.nombre.trim().toLowerCase() === String(j.supervisor || '').trim().toLowerCase(),
    );
    this.jornadaEditIdSupervisor.set(supMatch?._id || '');
    this.supNuevoNombreJornada.set('');
    this.jornadaEditFecha.set(j.fechaProgramacion ? ymdCalendario(j.fechaProgramacion) : '');
    this.jornadaEditMapaAbierto.set(false);
    this.mostrarMsg(`Editando ${this.labelJornada(j)} — complete dirección y ubicación.`, 'info', 'Edición de jornada');
    if (j.lat != null && j.lng != null) {
      this.resolverMunicipioDesdeCoords(j.lat, j.lng);
    }
    queueMicrotask(() => {
      document.getElementById('jornada-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  abrirNuevaJornada(ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    const c = this.contratoActivo();
    const id = this.contratoSel();
    if (!id || !c) {
      this.mostrarMsg('Seleccione un contrato en el filtro superior.', 'warn', 'Sin contrato');
      return;
    }
    if ((c.estado || 'En Ejecución') === 'Ejecutado') {
      this.mostrarMsg('El contrato está ejecutado; no puede agregar jornadas.', 'warn', 'Contrato cerrado');
      return;
    }
    this.jornadaEditModo.set('nueva');
    this.jornadaEditGenerarClases.set((c.clasesPorJornada ?? 0) > 0);
    this.jornadaEditError.set(null);
    this.direccionAlertaActiva.set(false);
    this.jornadaEdit.set({ _id: '', idContrato: id, estado: 'INACTIVO' } as JornadaCapDto);
    this.jornadaEditDireccion.set(c.direccion || '');
    this.jornadaEditLat.set('');
    this.jornadaEditLng.set('');
    this.jornadaEditDeteGeorefe.set('');
    this.jornadaEditMunicipio.set(c.ciudad || '');
    this.jornadaEditDepto.set(c.departamento || '');
    this.jornadaEditCodMunicipio.set(c.codMunicipio || '');
    this.jornadaEditMunicipioTexto.set('');
    if (c.codMunicipio) {
      this.catSvc.municipioPorCodigo(c.codMunicipio).subscribe({
        next: (m) => this.jornadaEditMunicipioTexto.set(m.label || c.ciudad || ''),
        error: () => this.jornadaEditMunicipioTexto.set(c.ciudad || ''),
      });
    }
    this.jornadaEditSupervisor.set(c.supervisor || '');
    const supMatch = this.supervisores().find(
      (s) => s.nombre.trim().toLowerCase() === String(c.supervisor || '').trim().toLowerCase(),
    );
    this.jornadaEditIdSupervisor.set(supMatch?._id || c.idSupervisor || '');
    this.supNuevoNombreJornada.set('');
    this.jornadaEditFecha.set('');
    this.jornadaEditMapaAbierto.set(false);
    this.mostrarMsg(
      'Nueva jornada extra: el número de jornadas del contrato se actualizará al guardar.',
      'info',
      'Agregar jornada',
    );
    queueMicrotask(() => {
      document.getElementById('jornada-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  cancelarEdicionJornada() {
    this.cerrarEdicionJornada();
    this.mostrarMsg('Los cambios de la jornada no se guardaron.', 'info', 'Edición cancelada');
    this.scrollAListadoJornadas();
  }

  private cerrarEdicionJornada(): void {
    if (this.georefDebounce) {
      clearTimeout(this.georefDebounce);
      this.georefDebounce = null;
    }
    this.georefLoading.set(false);
    this.jornadaEdit.set(null);
    this.jornadaEditLat.set('');
    this.jornadaEditLng.set('');
    this.jornadaEditDeteGeorefe.set('');
    this.jornadaEditDireccion.set('');
    this.jornadaEditMunicipio.set('');
    this.jornadaEditDepto.set('');
    this.jornadaEditCodMunicipio.set('');
    this.jornadaEditMunicipioTexto.set('');
    this.jornadaEditSupervisor.set('');
    this.jornadaEditIdSupervisor.set('');
    this.supNuevoNombreJornada.set('');
    this.jornadaEditFecha.set('');
    this.jornadaEditMapaAbierto.set(false);
    this.direccionAlertaActiva.set(false);
    this.jornadaEditError.set(null);
    this.jornadaEditModo.set('edit');
    this.jornadaEditGenerarClases.set(true);
  }

  onDireccionJornadaChange(valor: string) {
    this.jornadaEditDireccion.set(valor);
    if (valor.trim()) {
      this.direccionAlertaActiva.set(false);
      if (this.jornadaEditError() === 'La dirección es obligatoria. Complete el campo Dirección antes de guardar.') {
        this.jornadaEditError.set(null);
      }
    }
  }

  private alertaDireccionObligatoria(): void {
    const texto = 'La dirección es obligatoria. Complete el campo Dirección antes de guardar.';
    this.jornadaEditError.set(texto);
    this.direccionAlertaActiva.set(true);
    this.mostrarMsg(texto, 'error', 'Dirección obligatoria');
    queueMicrotask(() => {
      document.getElementById('jornada-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const input = document.getElementById('jornada-edit-direccion') as HTMLInputElement | null;
      input?.focus();
    });
  }

  private scrollAListadoJornadas(): void {
    queueMicrotask(() => {
      document.getElementById('jornadas-listado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  mostrarMsg(texto: string, tipo: JorMsgTipo = 'info', titulo?: string) {
    this.msg.set(texto);
    this.msgTipo.set(tipo);
    this.msgTitulo.set(titulo ?? tituloJorMsg(tipo));
    this.msgEsError.set(tipo === 'error');
  }

  cerrarMsg() {
    this.msg.set(null);
    this.msgTitulo.set('');
    this.msgEsError.set(false);
  }

  guardarEdicionJornada(ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    this.jornadaEditError.set(null);
    this.direccionAlertaActiva.set(false);
    const j = this.jornadaEdit();
    if (!j) {
      this.jornadaEditError.set('No hay jornada en edición.');
      return;
    }
    if (this.jornadaEditModo() === 'nueva') {
      this.guardarNuevaJornada();
      return;
    }
    if (!j._id) {
      this.jornadaEditError.set('No hay jornada seleccionada para guardar.');
      return;
    }
    const direccion = this.jornadaEditDireccion().trim();
    if (!direccion) {
      this.alertaDireccionObligatoria();
      return;
    }
    const lat = this.parseCoordInput(this.jornadaEditLat());
    const lng = this.parseCoordInput(this.jornadaEditLng());
    let deteGeorefe = this.jornadaEditDeteGeorefe();
    if (lat != null && lng != null && !deteGeorefe) {
      deteGeorefe = 'MANUAL';
    }
    if (lat == null || lng == null) {
      deteGeorefe = '';
    }
    const codMuni = this.jornadaEditCodMunicipio().trim();
    const fechaProg = this.jornadaEditFecha().trim();
    if (!fechaProg) {
      this.jornadaEditError.set('La fecha de programación es obligatoria.');
      return;
    }
    this.loading.set(true);
    this.jornadaSvc
      .actualizarJornada(j._id, {
        fechaProgramacion: fechaProg,
        lat,
        lng,
        deteGeorefe: deteGeorefe || '',
        direccion,
        municipio: this.jornadaEditMunicipio().trim(),
        depto: this.jornadaEditDepto().trim(),
        codMunicipio: codMuni && codMuni !== '—' ? codMuni : '',
        supervisor: this.jornadaEditSupervisor().trim(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.cerrarEdicionJornada();
          this.recargarVistaJornadas();
          this.mostrarMsg('Ubicación y datos de la jornada actualizados.', 'ok', 'Jornada guardada');
          this.scrollAListadoJornadas();
        },
        error: (e) => {
          const texto =
            e?.error?.message ||
            (typeof e?.error === 'string' ? e.error : null) ||
            e?.message ||
            'Error al guardar jornada';
          this.jornadaEditError.set(texto);
          this.mostrarMsg(texto, 'error', 'No se guardó la jornada');
          document.getElementById('jornada-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });
  }

  private guardarNuevaJornada() {
    const idContrato = this.contratoSel();
    if (!idContrato) {
      this.jornadaEditError.set('Seleccione un contrato.');
      return;
    }
    const direccion = this.jornadaEditDireccion().trim();
    if (!direccion) {
      this.alertaDireccionObligatoria();
      return;
    }
    const lat = this.parseCoordInput(this.jornadaEditLat());
    const lng = this.parseCoordInput(this.jornadaEditLng());
    let deteGeorefe = this.jornadaEditDeteGeorefe();
    if (lat != null && lng != null && !deteGeorefe) {
      deteGeorefe = 'MANUAL';
    }
    if (lat == null || lng == null) {
      deteGeorefe = '';
    }
    const codMuni = this.jornadaEditCodMunicipio().trim();
    const fechaProg = this.jornadaEditFecha().trim();
    if (!fechaProg) {
      this.jornadaEditError.set('La fecha de programación es obligatoria.');
      return;
    }
    this.loading.set(true);
    this.jornadaSvc
      .crearJornadaContrato(idContrato, {
        fechaProgramacion: fechaProg,
        lat,
        lng,
        deteGeorefe: deteGeorefe || '',
        direccion,
        municipio: this.jornadaEditMunicipio().trim(),
        depto: this.jornadaEditDepto().trim(),
        codMunicipio: codMuni && codMuni !== '—' ? codMuni : '',
        supervisor: this.jornadaEditSupervisor().trim(),
        generarClases: this.jornadaEditGenerarClases(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.cerrarEdicionJornada();
          this.aplicarContratoSync(r.contrato);
          this.recargarVistaJornadas();
          if ((r.clasesCreadas ?? 0) > 0) this.recargarClases();
          let texto = `Jornada extra creada. Contrato: ${r.contrato?.numerojornadas ?? '—'} jornada(s), meta ${r.contrato?.numeObjeJornada ?? '—'} alumnos/jornada.`;
          if ((r.clasesCreadas ?? 0) > 0) {
            texto += ` Se autogeneraron ${r.clasesCreadas} clase(s).`;
          }
          this.mostrarMsg(texto, 'ok', 'Jornada agregada');
          this.scrollAListadoJornadas();
        },
        error: (e) => {
          const texto =
            e?.error?.message ||
            (typeof e?.error === 'string' ? e.error : null) ||
            'No se pudo crear la jornada.';
          this.jornadaEditError.set(texto);
        },
      });
  }

  async eliminarJornada(j: JornadaCapDto, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: `¿De verdad desea borrar esta jornada?\n\n${this.labelJornada(j)}\n\nTambién se borrarán sus clases sin asistencias. El número de jornadas del contrato se recalculará.`,
      variant: 'danger',
      confirmLabel: 'Sí, borrar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    this.jornadaSvc.eliminarJornada(j._id).subscribe({
      next: (r) => {
        if (this.jornadaEdit()?._id === j._id) this.cerrarEdicionJornada();
        if (this.jornadaSel() === j._id) {
          this.jornadaSel.set('');
          this.claseSel.set('');
          this.claseActiva.set(null);
        }
        this.aplicarContratoSync(r.contrato);
        this.recargarVistaJornadas();
        this.recargarClases();
        this.mostrarMsg(
          r.message ||
            `Jornada eliminada. Contrato actualizado: ${r.contrato?.numerojornadas ?? r.restantes ?? 0} jornada(s).`,
          'ok',
          'Jornada eliminada',
        );
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo eliminar la jornada.', 'error', 'Error'),
    });
  }

  jornadaEnEdicion(id?: string): boolean {
    return this.jornadaEditModo() === 'edit' && !!id && this.jornadaEdit()?._id === id;
  }

  parseCoordInput(raw: string): number | null {
    const t = raw.trim().replace(',', '.');
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  jornadaEditLatNum(): number | null {
    return this.parseCoordInput(this.jornadaEditLat());
  }

  jornadaEditLngNum(): number | null {
    return this.parseCoordInput(this.jornadaEditLng());
  }

  toggleMapaJornadaEdit(): void {
    this.jornadaEditMapaAbierto.update((v) => !v);
  }

  onMapaCoords(ev: CoordsGeorefEvent): void {
    this.jornadaEditLat.set(String(Math.round(ev.lat * 1e6) / 1e6));
    this.jornadaEditLng.set(String(Math.round(ev.lng * 1e6) / 1e6));
    this.jornadaEditDeteGeorefe.set(ev.deteGeorefe);
    this.resolverMunicipioDesdeCoords(ev.lat, ev.lng);
  }

  onCoordsManualChange(): void {
    const lat = this.parseCoordInput(this.jornadaEditLat());
    const lng = this.parseCoordInput(this.jornadaEditLng());
    if (lat == null || lng == null) {
      this.jornadaEditDeteGeorefe.set('');
      this.jornadaEditMunicipio.set('');
      this.jornadaEditDepto.set('');
      this.jornadaEditCodMunicipio.set('');
      this.jornadaEditMunicipioTexto.set('');
      return;
    }
    if (this.jornadaEditDeteGeorefe() !== 'MAPA' && this.jornadaEditDeteGeorefe() !== 'DISPOSITIVO_MOVIL') {
      this.jornadaEditDeteGeorefe.set('MANUAL');
    }
    this.resolverMunicipioDesdeCoords(lat, lng, 600);
  }

  private resolverMunicipioDesdeCoords(lat: number, lng: number, delayMs = 300): void {
    if (this.georefDebounce) clearTimeout(this.georefDebounce);
    this.georefDebounce = setTimeout(() => {
      this.georefDebounce = null;
      this.georefLoading.set(true);
      this.jornadaSvc.resolverMunicipioGeoref(lat, lng).subscribe({
        next: (geo) => {
          this.georefLoading.set(false);
          if (geo.municipio) this.jornadaEditMunicipio.set(geo.municipio);
          if (geo.depto) this.jornadaEditDepto.set(geo.depto);
          if (geo.codMunicipio) {
            this.jornadaEditCodMunicipio.set(geo.codMunicipio);
            this.catSvc.municipioPorCodigo(geo.codMunicipio).subscribe({
              next: (m) => this.jornadaEditMunicipioTexto.set(m.label),
              error: () => {
                this.jornadaEditMunicipioTexto.set(
                  geo.municipio && geo.depto ? `${geo.municipio} - ${geo.depto}` : geo.municipio || '',
                );
              },
            });
          } else if (geo.municipio) {
            this.jornadaEditMunicipioTexto.set(
              geo.depto ? `${geo.municipio} - ${geo.depto}` : geo.municipio,
            );
            this.jornadaEditCodMunicipio.set('');
          }
        },
        error: () => {
          this.georefLoading.set(false);
        },
      });
    }, delayMs);
  }

  nombrePrograma(idProg: string): string {
    const p = this.buscarProgramaEnLista(idProg);
    if (p) return String(p.nombreProg || p.codigoProg || idProg);
    return String(idProg);
  }

  iniciarEdicionClase(c: any) {
    this.claseSel.set(c._id);
    this.claseActiva.set(c);
    this.claseEditando.set(true);
    this.claseEditProg.set(String(c.idPrograma || ''));
    this.claseEditUbic.set(c.ubicacion || 'Carpa');
    this.claseEditInstructorId.set(c.idEmpleadoInstructor ?? '');
  }

  cancelarEdicionClase() {
    this.claseEditando.set(false);
  }

  guardarEdicionClase() {
    const id = this.claseSel();
    if (!id) return;
    const dto: { idPrograma?: string; ubicacion?: string; idEmpleadoInstructor?: number } = {
      idPrograma: this.claseEditProg(),
      ubicacion: this.claseEditUbic(),
    };
    if (this.puedeAsignarInstructor() && this.claseEditInstructorId()) {
      dto.idEmpleadoInstructor = Number(this.claseEditInstructorId());
    }
    this.jornadaSvc
      .actualizarClase(id, dto)
      .subscribe({
        next: (c) => {
          this.claseEditando.set(false);
          this.claseActiva.set(c);
          this.recargarClases();
          this.mostrarMsg('Programa, ubicación e instructor actualizados.', 'ok', 'Clase actualizada');
        },
        error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo crear la clase.', 'error', 'Error'),
      });
  }

  async eliminarClase(c: { _id: string; estado?: string }) {
    if (!this.puedeEliminarClase()) {
      this.mostrarMsg('Solo un administrador puede eliminar clases.', 'warn', 'Sin permiso');
      return;
    }
    const finalizada = String(c.estado || '').toUpperCase() === 'FINALIZADO';
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: finalizada
        ? '¿De verdad desea borrar esta clase finalizada?\n\nSe borrarán inscripciones y asistencias, y se anularán los certificados emitidos por esta clase.'
        : '¿De verdad desea borrar esta clase?\n\nTambién se borrarán las inscripciones y asistencias registradas (si las hay).',
      variant: 'danger',
      confirmLabel: 'Sí, borrar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    this.jornadaSvc.eliminarClase(c._id).subscribe({
      next: (r) => {
        this.aplicarContratoSync(r.contrato);
        if (this.claseSel() === c._id) {
          this.claseSel.set('');
          this.claseActiva.set(null);
          this.claseEditando.set(false);
        }
        if (this.modalCrearClase()) {
          this.cerrarModalCrearClase();
        }
        this.recargarClases();
        if (this.tab() === 'certificados') this.recargarCerts();
        const extraCerts =
          r.certificadosAnulados != null && r.certificadosAnulados > 0
            ? ` ${r.certificadosAnulados} certificado(s) anulado(s).`
            : '';
        const extra =
          r.contrato?.clasesPorJornada != null
            ? ` Contrato: máx. ${r.contrato.clasesPorJornada} clase(s) por jornada.`
            : '';
        this.mostrarMsg(`La clase fue eliminada.${extraCerts}${extra}`, 'ok', 'Clase eliminada');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo eliminar la clase.', 'error', 'Error'),
    });
  }

  onNumDocAsisChange(value: string) {
    this.numDocAsis.set(value);
    this.consultarProgresoPreview(value);
  }

  consultarProgresoPreview(raw: string) {
    if (this.progresoDebounce) clearTimeout(this.progresoDebounce);
    const nd = raw.trim();
    const idContrato = this.contratoSel();
    if (!nd || nd.length < 5 || !idContrato) {
      this.progresoPreview.set(null);
      this.nombreAlumnoPreview.set('');
      this.progresoPreviewLoading.set(false);
      return;
    }
    this.progresoPreviewLoading.set(true);
    this.progresoDebounce = setTimeout(() => {
      this.jornadaSvc.progresoCertificacion(nd, idContrato).subscribe({
        next: (p) => {
          this.progresoPreview.set(p);
          this.progresoPreviewLoading.set(false);
        },
        error: () => {
          this.progresoPreview.set(null);
          this.progresoPreviewLoading.set(false);
        },
      });
      this.jornadaSvc.buscarAlumnoDoc(nd).subscribe({
        next: (a: any) => {
          const nom = [a.nombre1, a.nombre2].filter(Boolean).join(' ').trim() || String(a.nombres || '').trim();
          const ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ').trim() || String(a.apellidos || '').trim();
          this.nombreAlumnoPreview.set(`${nom} ${ap}`.trim() || a.nombreCompleto || '');
        },
        error: () => this.nombreAlumnoPreview.set(''),
      });
    }, 400);
  }

  cargarAsistencias(idClase: string) {
    this.jornadaSvc.listarAsistencias(idClase).subscribe({
      next: (r) => this.asistencias.set(r || []),
    });
  }

  iniciarClase() {
    const id = this.claseSel();
    if (!id) return;
    this.jornadaSvc.iniciarClase(id).subscribe({
      next: (c) => {
        this.claseActiva.set(c);
        this.recargarClases();
        this.liveSync.notificarClaseIniciada(c as unknown as Record<string, unknown>);
      },
    });
  }

  finalizarClase() {
    const id = this.claseSel();
    if (!id) return;
    if (!this.validarHorarioAntesFinalizarEspecial()) return;
    this.jornadaSvc.finalizarClase(id, this.horarioPayloadFinalizarClase()).subscribe({
      next: (r: any) => {
        const c = r?.clase || { ...this.claseActiva(), estado: 'FINALIZADO' };
        this.claseActiva.set(c);
        this.recargarClases();
        this.liveSync.notificarClaseFinalizada(c as unknown as Record<string, unknown>);
        const nCert = this.contarCertificadosEmitidos(r);
        if (nCert > 0) {
          this.certAlertSvc.notificarVariosDesdeRespuesta(r?.certificadosEmitidos);
        }
        let msg = 'La clase quedó cerrada. Ya no admite nuevas asistencias.';
        if (nCert > 0) {
          msg += ` Certificados emitidos: ${nCert}.`;
        }
        this.mostrarMsg(msg, nCert > 0 ? 'ok' : 'info', 'Clase finalizada');
      },
    });
  }

  marcarAsistencia() {
    const id = this.claseSel();
    const nd = this.numDocAsis().trim();
    if (!id || !nd) return;
    const p = this.progresoPreview();
    if (p?.certificado) {
      void this.certBloqueoSvc.mostrarAlumnoCertificado({
        nombreAlumno: this.nombreAlumnoPreview() || nd,
        certificado: p.certificado,
      });
      return;
    }
    this.jornadaSvc.registrarAsistencia(id, nd).subscribe({
      next: (r: any) => {
        this.numDocAsis.set('');
        this.progresoPreview.set(null);
        this.nombreAlumnoPreview.set('');
        this.cargarAsistencias(id);
        this.mostrarResultadoAsistencia(r);
      },
      error: (e) => {
        const body = e?.error;
        if (e?.status === 409 && body?.codigo === 'ya_certificado_contrato') {
          const nombre = this.nombreAlumnoPreview() || nd;
          void this.certBloqueoSvc.mostrarDesdeError(body, nombre);
          return;
        }
        if (e?.status === 409 && body?.sesiones != null) {
          this.mostrarResultadoAsistencia(body);
          return;
        }
        this.mostrarMsg(body?.message || 'No se pudo registrar la asistencia.', 'error', 'Error');
      },
    });
  }

  private contarCertificadosEmitidos(r: {
    certificadosGenerados?: number;
    certificadosNuevos?: number;
    certificadosEmitidos?: unknown[];
  } | null | undefined): number {
    const porLista = Array.isArray(r?.certificadosEmitidos) ? r!.certificadosEmitidos!.length : 0;
    const porContador = Math.max(Number(r?.certificadosGenerados) || 0, Number(r?.certificadosNuevos) || 0);
    return Math.max(porLista, porContador);
  }

  private mostrarResultadoAsistencia(r: any) {
    this.metaAlumnosAlertSvc.notificarDesdeRespuesta(r?.metaJornada, {
      contratoLabel:
        this.claseActiva()?.contratoLabel ||
        this.claseActiva()?.codContrato ||
        this.contratoActivo()?.codContrato,
    });
    const ses = r.sesiones ?? 0;
    const req = r.numSesCert ?? this.contratoActivo()?.numSesCert ?? '?';
    if (r.certificadoGenerado && r.certificado) {
      this.certAlertSvc.notificarDesdeRespuesta(r.certificado, r.nombreAlumno);
      this.recargarCerts();
      this.mostrarMsg(
        `Certificado automático emitido (${ses}/${req} sesiones). Código: ${r.certificado.codigoCert || '—'}`,
        'ok',
        'Certificado emitido',
      );
      this.recargarCerts();
      return;
    }
    if (r.cumplioSesiones && r.motivoCertificado && r.motivoCertificado !== 'ya_certificado') {
      this.mostrarMsg(
        `${r.nombreAlumno || ''}: completó sesiones pero no se emitió certificado. ${r.message || r.motivoCertificado}`,
        'warn',
        'Certificado pendiente',
      );
      return;
    }
    if (r.cumplioSesiones && r.certificado) {
      void this.certBloqueoSvc.mostrarAlumnoCertificado({
        nombreAlumno: r.nombreAlumno || '',
        certificado: r.certificado,
      });
      return;
    }
    const faltan = r.faltan ?? Math.max(0, Number(req) - ses);
    this.mostrarMsg(
      `${r.message || 'Asistencia registrada'} — ${r.nombreAlumno || ''}: ${ses}/${req} sesiones (faltan ${faltan} para certificado).`,
      'ok',
      'Asistencia registrada',
    );
  }

  irInstructor() {
    const q: Record<string, string> = {};
    if (this.jornadaSel()) q['jornada'] = this.jornadaSel();
    const j = this.jornadas().find((x) => x._id === this.jornadaSel());
    if (j?.fechaProgramacion) q['fecha'] = String(j.fechaProgramacion).slice(0, 10);
    void this.router.navigate(['/app/jornadas/instructor'], { queryParams: q });
  }

  recargarCerts() {
    const id = this.contratoSel();
    if (!id) {
      this.certsGenerados.set([]);
      return;
    }
    this.jornadaSvc
      .listarCertificadosJornada({
        idContrato: id,
        idJornada: this.certFiltroJornadaId() || undefined,
        idClase: this.certFiltroClaseId() || undefined,
        desde: this.certFiltroDesde() || undefined,
        hasta: this.certFiltroHasta() || undefined,
      })
      .subscribe({
        next: (r) => this.certsGenerados.set(r || []),
        error: (e) =>
          this.mostrarMsg(e?.error?.message || 'No se pudieron cargar certificados.', 'error', 'Certificados'),
      });
  }

  limpiarFiltrosCerts() {
    this.certFiltroJornadaId.set('');
    this.certFiltroJornadaTexto.set('');
    this.certFiltroClaseId.set('');
    this.certFiltroClaseTexto.set('');
    this.certFiltroDesde.set('');
    this.certFiltroHasta.set('');
    this.certFiltroTexto.set('');
    this.recargarCerts();
  }

  onCertJornadaPick(opt: EnumBuscarOption): void {
    this.certFiltroJornadaId.set(String(opt.value));
    this.certFiltroJornadaTexto.set(opt.label);
    this.certFiltroClaseId.set('');
    this.certFiltroClaseTexto.set('');
    this.recargarCerts();
  }

  onCertJornadaLimpiar(): void {
    this.certFiltroJornadaId.set('');
    this.certFiltroJornadaTexto.set('');
    this.recargarCerts();
  }

  onCertClasePick(opt: EnumBuscarOption): void {
    this.certFiltroClaseId.set(String(opt.value));
    this.certFiltroClaseTexto.set(opt.label);
    this.recargarCerts();
  }

  onCertClaseLimpiar(): void {
    this.certFiltroClaseId.set('');
    this.certFiltroClaseTexto.set('');
    this.recargarCerts();
  }

  onCertDesdeChange(v: string): void {
    this.certFiltroDesde.set(v || '');
    this.recargarCerts();
  }

  onCertHastaChange(v: string): void {
    this.certFiltroHasta.set(v || '');
    this.recargarCerts();
  }

  filtrosCertZip() {
    return {
      idContrato: this.contratoSel() || undefined,
      idJornada: this.certFiltroJornadaId() || undefined,
      idClase: this.certFiltroClaseId() || undefined,
      desde: this.certFiltroDesde() || undefined,
      hasta: this.certFiltroHasta() || undefined,
    };
  }

  imprimirCert(c: { _id: string }) {
    this.jornadaSvc.imprimirCertificadoJornada(c._id, (m) => this.mostrarMsg(m, 'info', 'Certificado'));
  }

  editarCertDesdeHub(c: { _id: string }) {
    const q: Record<string, string> = { editar: c._id };
    if (this.contratoSel()) q['contrato'] = this.contratoSel();
    void this.router.navigate(['/app/jornadas/certificados'], { queryParams: q });
  }

  async eliminarCertDesdeHub(c: { _id: string; codigoCert?: string; nombreCompleto?: string }) {
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: `¿De verdad desea borrar este certificado?\n\n${c.codigoCert || c._id}${c.nombreCompleto ? ` · ${c.nombreCompleto}` : ''}`,
      variant: 'danger',
      confirmLabel: 'Sí, borrar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    this.jornadaSvc.eliminarCertificadoJornada(c._id).subscribe({
      next: () => {
        this.mostrarMsg('Certificado eliminado.', 'ok', 'Certificados');
        this.recargarCerts();
      },
      error: (e) =>
        this.mostrarMsg(e?.error?.message || 'No se pudo eliminar.', 'error', 'Certificados'),
    });
  }

  async descargarZipCertificadosContrato() {
    const idContrato = this.contratoSel();
    if (!idContrato) {
      this.mostrarMsg('Seleccione un contrato para descargar el ZIP.', 'warn', 'Certificados');
      return;
    }
    if (!this.certsGenerados().length) {
      this.mostrarMsg('No hay certificados con los filtros actuales.', 'warn', 'Certificados');
      return;
    }
    this.descargandoZipCerts.set(true);
    this.zipProgresoOpen.set(true);
    this.zipProgreso.set({
      status: 'running',
      fase: 'Iniciando…',
      hecho: 0,
      total: this.certsGenerados().length,
      porcentaje: 1,
    });
    try {
      await ejecutarExportZipCertificados(
        this.jornadaSvc,
        this.filtrosCertZip(),
        (p) => this.zipProgreso.set(p),
        `certificados-contrato_${new Date().toISOString().slice(0, 10)}.zip`,
      );
      this.zipProgresoOpen.set(false);
      this.mostrarMsg(
        `ZIP con PDFs descargado (${this.certsGenerados().length}). Abra 00-todos-imprimir.pdf para imprimir todos.`,
        'ok',
        'Certificados',
      );
    } catch (e: unknown) {
      const texto = e instanceof Error ? e.message : 'No se pudo generar el ZIP.';
      this.zipProgreso.update((p) => ({
        ...p,
        status: 'error',
        fase: 'Error',
        message: texto,
      }));
      this.mostrarMsg(texto, 'error', 'Certificados');
    } finally {
      this.descargandoZipCerts.set(false);
    }
  }

  cerrarZipProgreso(): void {
    this.zipProgresoOpen.set(false);
  }

  nuevoAlumnoJornada() {
    void this.router.navigate(['/app/jornadas/alumnos/nuevo']);
  }

  listaAlumnosJornada() {
    void this.router.navigate(['/app/jornadas/alumnos']);
  }

  fmtFecha(f?: string | Date) {
    return fmtFechaCalendario(f);
  }

  fmtHora(f?: string) {
    if (!f) return '—';
    return new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
