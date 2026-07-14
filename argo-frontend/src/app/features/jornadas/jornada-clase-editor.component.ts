import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { AlumnoListItem } from '../../core/services/alumno.service';
import { AuthService } from '../../core/services/auth.service';
import { CertificadoJornadaAlertService } from '../../core/services/certificado-jornada-alert.service';
import { MetaAlumnosJornadaAlertService } from '../../core/services/meta-alumnos-jornada-alert.service';
import { CertificadoJornadaBloqueoService } from '../../core/services/certificado-jornada-bloqueo.service';
import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import {
  AlumnoClaseAnteriorItem,
  ClaseAnteriorResumenDto,
  ClaseJornadaDto,
  InstructorJornadaDto,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import { PermisoService } from '../../core/services/permiso.service';
import { formatNumDoc } from '../../core/utils/num-doc.helpers';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { FormModalComponent } from '../../shared/form-modal/form-modal.component';
import { Hora12InputComponent } from '../../shared/hora-12-input/hora-12-input.component';
import { environment } from '../../../environments/environment';
import { AsistenteContextoService } from '../../core/services/asistente-contexto.service';
import { tipFormulario } from '../../core/utils/asistente-formulario.util';
import { JornadasOperacionConfigService } from '../../core/services/jornadas-operacion-config.service';
import { duracionSegundosDesdeHHmm, esFechaHoy, fmtFechaCalendario } from './jornada-calendario.util';
import { JornadaEtiquetaQrService } from './jornada-etiqueta-qr.service';
import {
  JorMsgTipo,
  capAlumnoNombre,
  capDocAsis,
  capEstadoClase,
  capFechaJor,
  capInstructor,
  capPrograma,
  capUbicacionClase,
  capCarpa,
  labelCarpaClase,
  claseJornadaSePuedeEliminar,
  estadoClaseLiveClass,
  iconoJorMsg,
  isoAHoraInput,
  tituloJorMsg,
  validarHoraInput,
  labelInstructorClase,
  claseTieneInstructor,
} from './jornada-ui.util';

/** Alumno con datos mínimos para mostrar nombre y matricular. */
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
  selector: 'argo-jornada-clase-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormModalComponent,
    CatalogoEnumBuscarComponent,
    Hora12InputComponent,
  ],
  templateUrl: './jornada-clase-editor.component.html',
  styleUrls: ['./jornada-clase-editor.component.scss'],
})
export class JornadaClaseEditorComponent implements OnInit, OnDestroy {
  private jornadaSvc = inject(JornadaCapService);
  private auth = inject(AuthService);
  private permisoSvc = inject(PermisoService);
  private certAlertSvc = inject(CertificadoJornadaAlertService);
  private metaAlumnosAlertSvc = inject(MetaAlumnosJornadaAlertService);
  private liveSync = inject(JornadaLiveSyncService);
  private certBloqueoSvc = inject(CertificadoJornadaBloqueoService);
  private etiquetaQrSvc = inject(JornadaEtiquetaQrService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private confirmSvc = inject(ConfirmDialogService);
  private asistente = inject(AsistenteContextoService);
  operacionCfg = inject(JornadasOperacionConfigService);
  operacionEspecialActiva = this.operacionCfg.puedeOperarFueraDeDia;

  constructor() {
    effect(() => {
      if (this.modalOpen()) {
        const sub = this.subtituloModalClase();
        if (sub) {
          this.asistente.setTipsPrepend([tipFormulario('Esta clase', sub, 'jor-ed-clase-ctx')]);
        }
      } else {
        this.asistente.clearTipsPrepend();
      }
    });
  }

  @Input() editorHost = false;
  @Output() claseGuardada = new EventEmitter<void>();

  modalOpen = signal(false);
  claseSel = signal('');
  claseActiva = signal<ClaseJornadaDto | null>(null);
  programasJornada = signal<any[]>([]);
  instructores = signal<InstructorJornadaDto[]>([]);

  nuevaClaseProg = signal('');
  nuevaClaseUbic = signal('Carpa');
  modalHoraInicio = signal('');
  modalHoraFin = signal('');
  modalClaseInstructorId = signal<number | ''>('');
  modalFechaClase = signal('');
  modalCrearJornadaId = signal('');

  subiendoFotoEvidencia = signal(false);
  guardandoClase = signal(false);
  alumnoBusqueda = signal('');
  alumnoBusquedaOpen = signal(false);
  alumnoBusquedaLoading = signal(false);
  alumnoBusquedaResults = signal<AlumnoListItem[]>([]);
  guardandoAsistencia = signal<number | null>(null);
  guardandoInscripcion = signal(false);
  cronometroDisplay = signal('00:00:00');

  /** Utilidad «Copiar alumnos de la clase anterior de la misma jornada». */
  claseAnteriorInfo = signal<ClaseAnteriorResumenDto | null>(null);
  alumnosClaseAnterior = signal<AlumnoClaseAnteriorItem[]>([]);
  cargandoAlumnosClaseAnterior = signal(false);
  /** Evita que una respuesta auto/atrasada pise una selección manual. */
  private reqAlumnosClaseAnteriorSeq = 0;
  alumnosClaseAnteriorSeleccion = signal<Set<number>>(new Set());
  matriculandoDesdeAnterior = signal(false);

  modalMsg = signal<string | null>(null);
  modalMsgTipo = signal<JorMsgTipo>('info');
  modalMsgTitulo = signal('');

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

  private cronometroTimer: ReturnType<typeof setInterval> | null = null;
  private alumnoBusqueda$ = new Subject<string>();

  readonly ubicaciones = ['Carpa', 'Domo', 'Empresa', 'Colegio', 'Auditorio', 'Coliseo', 'Estadio', 'Otro'];

  iconoJorMsg = iconoJorMsg;
  capEstadoClase = capEstadoClase;
  capUbicacionClase = capUbicacionClase;
  capCarpa = capCarpa;
  labelCarpaClase = labelCarpaClase;
  capFechaJor = capFechaJor;
  capDocAsis = capDocAsis;
  capAlumnoNombre = capAlumnoNombre;
  capPrograma = capPrograma;
  capInstructor = capInstructor;
  labelInstructorClase = labelInstructorClase;
  claseTieneInstructor = claseTieneInstructor;
  estadoClaseLiveClass = estadoClaseLiveClass;
  claseJornadaSePuedeEliminar = claseJornadaSePuedeEliminar;

  puedeOperarJornada = computed(() =>
    this.permisoSvc.tiene(['jornadas.operar', 'jornadas.gestionar']),
  );
  puedeAsignarInstructor = computed(() => this.permisoSvc.tiene('jornadas.gestionar'));
  puedeEditarHorarioClase = computed(() =>
    this.permisoSvc.tiene(['jornadas.gestionar', 'jornadas.operar']),
  );
  puedeEliminarClase = computed(() => this.permisoSvc.tiene('jornadas.gestionar'));
  puedeEliminarClaseActiva = computed(
    () => this.puedeEliminarClase() && claseJornadaSePuedeEliminar(this.claseActiva()?.estado),
  );

  instructorSesionNombre = computed(
    () => this.auth.user()?.empleado?.nombreCompleto || this.auth.user()?.username || '—',
  );

  inscritosConAsistencia = computed(() => this.inscritos().filter((i) => i.tieneAsistencia).length);
  inscritosPendientesAsistencia = computed(() =>
    this.inscritos().filter((i) => !i.tieneAsistencia && !i.yaCertificadoContrato),
  );
  inscritosSinAsistencia = computed(() => this.inscritosPendientesAsistencia().length);
  inscritosCertificadosContrato = computed(() =>
    this.inscritos().filter((i) => i.yaCertificadoContrato).length,
  );
  /** Otras clases del mismo contrato (para combo manual). */
  clasesContratoCopiar = signal<any[]>([]);
  idClaseFuenteCopiar = signal('');
  textoClaseFuenteCopiar = signal('');

  /** Alumnos de la clase anterior que aún no están matriculados en la clase actual. */
  alumnosClaseAnteriorDisponibles = computed(() => {
    const inscritosDocs = new Set(this.inscritos().map((i) => Number(i.numDoc)));
    return this.alumnosClaseAnterior().filter((a) => !inscritosDocs.has(Number(a.numDoc)));
  });
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
  totalAlumnosMatriculadosModal = computed(() => this.inscritos().length);

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

  textoProgramaModalCombo = computed(() => {
    const v = this.nuevaClaseProg();
    if (!v) return '';
    return this.etiquetaProgramaModal();
  });

  textoJornadaModal = computed(() => {
    const cl = this.claseActiva();
    if (!cl) return '';
    const base = cl.contratoLabel || cl.codContrato || 'Jornada';
    const estado = cl.jornadaEstado || '';
    return estado ? `${base} — ${estado}` : base;
  });

  opcionesJornadaModal = computed<EnumBuscarOption[]>(() => {
    const id = this.modalCrearJornadaId();
    if (!id) return [];
    return [{ value: id, label: this.textoJornadaModal() || id }];
  });

  subtituloModalClase = computed(() => {
    const cl = this.claseActiva();
    if (!cl) return '';
    return this.labelJornadaClase(cl);
  });

  ngOnInit(): void {
    this.operacionCfg.cargar();
    this.cargarProgramasJornada();
    this.cargarInstructores();
    this.alumnoBusqueda$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((q) => {
          this.alumnoBusquedaLoading.set(true);
          return this.jornadaSvc.buscarAlumnos(q, 12);
        }),
        takeUntilDestroyed(this.destroyRef),
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

  ngOnDestroy(): void {
    this.detenerCronometro();
  }

  abrirClaseDesdeHost(claseOrId: ClaseJornadaDto | string, idJornadaHint?: string): void {
    const abrir = (c: ClaseJornadaDto) => {
      if (!this.puedeOperarJornada()) {
        this.mostrarMsg('No tiene permiso para operar clases de jornada.', 'error', 'Sin permiso');
        return;
      }
      this.abrirModalEditarClase(c);
    };

    if (typeof claseOrId !== 'string') {
      abrir(claseOrId);
      return;
    }

    this.jornadaSvc.obtenerClase(claseOrId).subscribe({
      next: abrir,
      error: () => {
        const opts = idJornadaHint ? { idJornada: idJornadaHint } : {};
        this.jornadaSvc.listarClases(opts).subscribe({
          next: (rows) => {
            const hit = (rows || []).find((x) => x._id === claseOrId);
            if (hit) abrir(hit);
            else this.mostrarMsg('No se encontró la clase.', 'error', 'Error');
          },
          error: (e) =>
            this.mostrarMsg(e?.error?.message || 'No se pudo cargar la clase.', 'error', 'Error'),
        });
      },
    });
  }

  private abrirModalEditarClase(c: ClaseJornadaDto): void {
    this.claseSel.set(c._id);
    this.claseActiva.set(c);
    this.modalCrearJornadaId.set(String(c.idJornada || ''));
    this.modalFechaClase.set(
      c.fechaClase ? String(c.fechaClase) : c.fechaJornada ? String(c.fechaJornada) : '',
    );
    this.nuevaClaseProg.set(String(c.idPrograma || ''));
    this.nuevaClaseUbic.set(c.ubicacion || 'Carpa');
    this.modalClaseInstructorId.set(c.idEmpleadoInstructor ?? '');
    this.modalHoraInicio.set(isoAHoraInput(c.horaInicio));
    this.modalHoraFin.set(isoAHoraInput(c.horaFin));
    this.alumnoBusqueda.set('');
    this.alumnoBusquedaResults.set([]);
    this.alumnoBusquedaOpen.set(false);
    this.inscritos.set([]);
    this.alumnosClaseAnteriorSeleccion.set(new Set());
    this.idClaseFuenteCopiar.set('');
    this.textoClaseFuenteCopiar.set('');
    this.claseAnteriorInfo.set(null);
    this.alumnosClaseAnterior.set([]);
    this.claseAnteriorSinPrevia.set(false);
    this.limpiarMsgModal();
    this.sincronizarProgramaModal(String(c.idPrograma || ''));
    this.cargarProgramasJornada();
    this.cargarInscritos(c._id);
    this.cargarClasesContratoParaCopiar(c);
    this.modalOpen.set(true);
    this.iniciarCronometroSiAplica();
  }

  labelClaseCopiar(c: any): string {
    const fecha = this.fmtFecha(c.fechaJornada || c.fechaClase);
    const prog = c.programaNombre || String(c.idPrograma || 'Sin programa');
    const carpa = labelCarpaClase(c);
    const idx = c.indiceClaseEnJornada != null ? `#${c.indiceClaseEnJornada}` : '';
    return [fecha, prog, carpa, idx].filter(Boolean).join(' · ');
  }

  cargarClasesContratoParaCopiar(
    claseActual?: ClaseJornadaDto | any,
    opts?: { syncAlumnos?: boolean },
  ): void {
    const idContrato = String(
      claseActual?.idContrato || this.claseActiva()?.idContrato || '',
    ).trim();
    const syncAlumnos = opts?.syncAlumnos !== false;
    if (!idContrato) {
      this.clasesContratoCopiar.set([]);
      if (syncAlumnos) {
        this.cargarAlumnosClaseAnterior(claseActual?._id || this.claseSel());
      }
      return;
    }
    this.jornadaSvc.listarClases({ idContrato }).subscribe({
      next: (rows) => {
        this.clasesContratoCopiar.set(rows || []);
        if (!syncAlumnos) return;
        const idActual = String(claseActual?._id || this.claseSel() || '');
        const idFuente = String(this.idClaseFuenteCopiar() || '').trim();
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
        this.mostrarMsg(
          e?.error?.message || 'No se pudieron cargar los alumnos de la clase elegida.',
          'warn',
          'Copiar alumnos',
        );
      },
    });
  }

  cargarAlumnosClaseAnterior(
    idClase: string,
    opts?: { autoSeleccionar?: boolean },
  ): void {
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
          this.mostrarMsg(
            e?.error?.message ||
              'No se pudo consultar alumnos de la clase anterior. Verifique que el servidor esté actualizado.',
            'warn',
            'Clase anterior',
          );
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
      this.mostrarMsg(
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
        this.alumnosClaseAnteriorSeleccion.set(new Set());
        let texto = `Matriculados ${okRows.length}/${results.length} desde la clase anterior.`;
        if (fail.length) texto += ` No matriculados: ${fail.map((f) => f.nombre).join(', ')}.`;
        this.mostrarMsg(texto, fail.length ? 'warn' : 'ok', 'Matrícula desde clase anterior');
        this.emitClaseGuardada();
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
                contratoLabel:
                  this.claseActiva()?.contratoLabel ||
                  this.claseActiva()?.codContrato ||
                  undefined,
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

  cerrarModal(): void {
    if (this.guardandoClase()) return;
    this.detenerCronometro();
    this.modalOpen.set(false);
    this.alumnoBusquedaOpen.set(false);
    this.limpiarMsgModal();
    this.emitClaseGuardada();
  }

  private emitClaseGuardada(): void {
    this.claseGuardada.emit();
  }

  cargarProgramasJornada(): void {
    this.jornadaSvc.programasJornadaCap().subscribe({
      next: (p) => {
        this.programasJornada.set(p || []);
        const idRaw = this.nuevaClaseProg() || this.claseActiva()?.idPrograma;
        if (idRaw) this.sincronizarProgramaModal(String(idRaw));
      },
      error: () => this.programasJornada.set([]),
    });
  }

  cargarInstructores(): void {
    this.jornadaSvc.listarInstructores().subscribe({
      next: (r) => this.instructores.set(r || []),
      error: () => this.instructores.set([]),
    });
  }

  cargarInscritos(idClase: string): void {
    this.jornadaSvc.inscritosClase(idClase).subscribe({
      next: (rows) => this.inscritos.set(rows || []),
      error: () => this.inscritos.set([]),
    });
  }

  programaOptionValue(p: { idPrograma?: unknown; _id?: unknown; idProg?: unknown }): string {
    if (p?.idPrograma != null && String(p.idPrograma).trim() !== '') return String(p.idPrograma);
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

  sincronizarProgramaModal(idProgRaw?: string | null): void {
    const id = String(idProgRaw ?? '').trim();
    if (!id) {
      this.nuevaClaseProg.set('');
      return;
    }
    const hit = this.buscarProgramaEnLista(id);
    this.nuevaClaseProg.set(hit ? this.programaOptionValue(hit) : id);
  }

  etiquetaProgramaModal(): string {
    const v = this.nuevaClaseProg();
    if (!v) return '';
    const p = this.buscarProgramaEnLista(v);
    if (p) return String(p.nombreProg || p.codigoProg || v);
    const cl = this.claseActiva();
    return String(cl?.programaNombre || v);
  }

  labelJornadaClase(cl: ClaseJornadaDto): string {
    const f = this.fmtFecha(cl.fechaClase || cl.fechaJornada);
    const m = cl.municipioJornada ? ` · ${cl.municipioJornada}` : '';
    return `${f}${m}`;
  }

  claseEsHoy(cl?: ClaseJornadaDto | null): boolean {
    if (!cl) return false;
    return esFechaHoy(cl.fechaClase || cl.fechaJornada);
  }

  jornadaClaseModalOperable(): boolean {
    const cl = this.claseActiva();
    if (!cl) return false;
    if (this.operacionEspecialActiva()) return true;
    if (!this.claseEsHoy(cl)) return false;
    return cl.jornadaEstado === 'EN PROCESO';
  }

  claseModalIniciable(): boolean {
    const cl = this.claseActiva();
    if (!cl || cl.estado === 'FINALIZADO') return false;
    if (cl.estado === 'EN PROCESO' && cl.horaInicio) return false;
    return this.jornadaClaseModalOperable();
  }

  tituloBotonIniciarClase(): string {
    const cl = this.claseActiva();
    if (cl && !this.operacionEspecialActiva() && !this.claseEsHoy(cl)) {
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

  puedeMarcarAsistenciaInscrito(): boolean {
    if (this.claseModalEnProceso()) return true;
    if (this.operacionEspecialActiva() && this.claseActiva()?.estado !== 'FINALIZADO') return true;
    return this.puedeEliminarClase() && this.claseActiva()?.estado === 'FINALIZADO';
  }

  puedeMarcarAsistenciaAlumno(a: { yaCertificadoContrato?: boolean; tieneAsistencia?: boolean }): boolean {
    if (a.yaCertificadoContrato && !a.tieneAsistencia) return false;
    return this.puedeMarcarAsistenciaInscrito();
  }

  puedeBorrarAsistenciaDeClase(): boolean {
    if (this.puedeEliminarClase()) return true;
    return this.claseModalEnProceso();
  }

  puedeQuitarInscritoDeClase(): boolean {
    if (this.puedeEliminarClase()) return true;
    return this.claseActiva()?.estado !== 'FINALIZADO';
  }

  idContratoParaClaseModal(): string {
    return this.claseActiva()?.idContrato || '';
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

  fmtFecha(f?: string | Date): string {
    return fmtFechaCalendario(f);
  }

  modalClaseSubtitle(): string {
    const cl = this.claseActiva();
    if (!cl) return 'Datos, horario, instructor y alumnos';
    const partes = [
      cl.fechaJornada || cl.fechaClase ? this.fmtFecha(cl.fechaJornada || cl.fechaClase) : '',
      this.textoProgramaModalCombo() || '',
      cl.ubicacion || '',
    ].filter(Boolean);
    return partes.length ? partes.join(' · ') : 'Datos, horario, instructor y alumnos';
  }

  fmtHora(f?: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  urlFotoEvidencia(path?: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${environment.uploadsUrl}/${path.replace(/^\/+/, '')}`;
  }

  limpiarMsgModal(): void {
    this.modalMsg.set(null);
    this.modalMsgTitulo.set('');
  }

  mostrarMsg(texto: string, tipo: JorMsgTipo = 'info', titulo?: string): void {
    this.modalMsg.set(texto);
    this.modalMsgTipo.set(tipo);
    this.modalMsgTitulo.set(titulo ?? tituloJorMsg(tipo));
  }

  mostrarMsgModal(texto: string, tipo: JorMsgTipo = 'info', titulo?: string): void {
    this.mostrarMsg(texto, tipo, titulo);
  }

  guardarCambiosClaseModal(): void {
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
        this.cargarInscritos(id);
        const nCert = this.contarCertificadosEmitidos(r);
        if (nCert > 0) {
          this.certAlertSvc.notificarVariosDesdeRespuesta(r?.certificadosEmitidos);
        }
        let msg = r?.message || 'Cambios guardados.';
        this.mostrarMsg(msg, nCert > 0 ? 'ok' : 'info', 'Clase actualizada');
        this.mostrarMsgModal(msg, nCert > 0 ? 'ok' : 'info', 'Clase actualizada');
        this.emitClaseGuardada();
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo guardar la clase.', 'error', 'Error'),
    });
  }

  iniciarClaseModal(): void {
    const id = this.claseSel();
    if (!id || !this.claseModalIniciable()) return;
    this.jornadaSvc.iniciarClase(id).subscribe({
      next: (c) => {
        this.claseActiva.set(c);
        this.iniciarCronometroSiAplica();
        this.cargarInscritos(id);
        this.liveSync.notificarClaseIniciada(c as unknown as Record<string, unknown>);
        this.mostrarMsg('Clase iniciada. El cronómetro está activo.', 'ok', 'Clase iniciada');
        this.emitClaseGuardada();
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo iniciar la clase.', 'error', 'Error'),
    });
  }

  finalizarClaseModal(): void {
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
        this.emitClaseGuardada();
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo finalizar la clase.', 'error', 'Error'),
    });
  }

  async eliminarClase(c: { _id: string; estado?: string }): Promise<void> {
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
        this.detenerCronometro();
        this.claseSel.set('');
        this.claseActiva.set(null);
        this.modalOpen.set(false);
        this.limpiarMsgModal();
        const extraCerts =
          r.certificadosAnulados != null && r.certificadosAnulados > 0
            ? ` ${r.certificadosAnulados} certificado(s) anulado(s).`
            : '';
        this.mostrarMsg(`La clase fue eliminada.${extraCerts}`, 'ok', 'Clase eliminada');
        this.claseGuardada.emit();
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo eliminar la clase.', 'error', 'Error'),
    });
  }

  sincronizarAsistenciasClaseModal(): void {
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
        const nCert = this.contarCertificadosEmitidos(r);
        if (nCert > 0) {
          this.certAlertSvc.notificarVariosDesdeRespuesta(r.certificadosEmitidos);
        }
        const msg = r.message || 'Asistencias sincronizadas.';
        const tipo = nCert > 0 ? 'ok' : 'info';
        this.mostrarMsgModal(msg, tipo, 'Asistencia');
        this.emitClaseGuardada();
      },
      error: (e) => {
        const err = e?.error?.message || 'No se pudo registrar la asistencia.';
        this.mostrarMsgModal(err, 'error', 'Error');
      },
    });
  }

  onFotoEvidenciaSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.claseSel();
    if (!file || !id) return;
    this.subiendoFotoEvidencia.set(true);
    this.jornadaSvc.subirFotoEvidenciaClase(id, file).subscribe({
      next: (c) => {
        this.claseActiva.set(c);
        this.subiendoFotoEvidencia.set(false);
        this.mostrarMsg('Foto de evidencia guardada.', 'ok', 'Evidencia');
        this.emitClaseGuardada();
      },
      error: (e) => {
        this.subiendoFotoEvidencia.set(false);
        this.mostrarMsg(e?.error?.message || 'No se pudo subir la foto.', 'error', 'Error');
      },
    });
    input.value = '';
  }

  onAlumnoBusquedaInput(value: string): void {
    this.alumnoBusqueda.set(value);
    this.alumnoBusquedaOpen.set(true);
    this.alumnoBusqueda$.next((value ?? '').trim());
  }

  focusAlumnoBusqueda(): void {
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
    return this.inscritos().some((x) => formatNumDoc(x.numDoc) === doc);
  }

  agregarAlumnoMatricula(a: AlumnoListItem): void {
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

  private ejecutarAgregarAlumnoMatricula(a: AlumnoListItem): void {
    const idC = this.claseSel();
    if (!idC) return;
    const yaInscrito = this.inscritos().some((x) => Number(x.numDoc) === Number(a.numDoc));
    if (yaInscrito) {
      this.mostrarMsg('El alumno ya está matriculado en esta clase.', 'info', 'Duplicado');
      return;
    }
    const idP = this.nuevaClaseProg();
    if (!idP) {
      this.mostrarMsg('La clase no tiene programa.', 'error', 'Error');
      return;
    }
    this.guardandoInscripcion.set(true);
    this.jornadaSvc.matricularAlumno({ numDoc: a.numDoc, idPrograma: idP, idClase: idC }).subscribe({
      next: (r: any) => {
        this.guardandoInscripcion.set(false);
        this.cargarInscritos(idC);
        if (!r?.inscripcionDuplicada) {
          this.metaAlumnosAlertSvc.notificarDesdeRespuesta(r?.metaJornada, {
            contratoLabel: this.claseActiva()?.contratoLabel || this.claseActiva()?.codContrato,
          });
        }
        const nombre = this.nombreAlumnoItem(a);
        const msg = this.mensajeInscripcionOk(r, nombre);
        const tipo = r?.inscripcionDuplicada ? 'info' : 'ok';
        this.mostrarMsgModal(
          r?.inscripcionDuplicada
            ? msg
            : `${msg} Etiqueta QR en la ficha del alumno (Jornadas → Alumnos).`,
          tipo,
          'Alumno inscrito',
        );
        this.emitClaseGuardada();
      },
      error: (e) => {
        this.guardandoInscripcion.set(false);
        if (e?.status === 409 && e?.error?.codigo === 'ya_certificado_contrato') {
          void this.certBloqueoSvc.mostrarDesdeError(e.error, this.nombreAlumnoItem(a));
          return;
        }
        const err = e?.error?.message || 'No se pudo inscribir al alumno.';
        this.mostrarMsgModal(err, 'error', 'Error');
      },
    });
    this.alumnoBusqueda.set('');
    this.alumnoBusquedaResults.set([]);
    this.alumnoBusquedaOpen.set(false);
  }

  private mensajeInscripcionOk(
    r: { inscripcionDuplicada?: boolean; yaExistia?: boolean; matricula?: { yaExistia?: boolean } },
    nombre: string,
  ): string {
    if (r?.inscripcionDuplicada) return `${nombre} ya estaba inscrito en esta clase.`;
    const yaMatriculado = r?.yaExistia || r?.matricula?.yaExistia;
    if (yaMatriculado) return `${nombre} inscrito en la clase (ya estaba matriculado al programa).`;
    return `${nombre} matriculado e inscrito en la clase.`;
  }

  marcarAsistenciaInscrito(numDoc: number): void {
    const id = this.claseSel();
    if (!id) return;
    this.guardandoAsistencia.set(numDoc);
    this.jornadaSvc.registrarAsistencia(id, numDoc).subscribe({
      next: (r: any) => {
        this.guardandoAsistencia.set(null);
        this.cargarInscritos(id);
        this.mostrarResultadoAsistencia(r);
        this.emitClaseGuardada();
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
          this.emitClaseGuardada();
          return;
        }
        this.mostrarMsg(body?.message || 'No se pudo registrar la asistencia.', 'error', 'Error');
      },
    });
  }

  async borrarAsistenciaInscrito(numDoc: number, nombre?: string): Promise<void> {
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
        this.mostrarMsg('Asistencia eliminada.', 'ok', 'Asistencia borrada');
        this.emitClaseGuardada();
      },
      error: (e) => {
        this.guardandoAsistencia.set(null);
        this.mostrarMsg(e?.error?.message || 'No se pudo borrar la asistencia.', 'error', 'Error');
      },
    });
  }

  async quitarInscritoDeClase(
    numDoc: number,
    nombre?: string,
    opts?: { tieneAsistencia?: boolean },
  ): Promise<void> {
    const id = this.claseSel();
    if (!id) return;
    const extraAsist = opts?.tieneAsistencia ? ' También se eliminará su asistencia en esta clase.' : '';
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
        this.mostrarMsg('Alumno retirado de la clase.', 'ok', 'Inscripción eliminada');
        this.emitClaseGuardada();
      },
      error: (e) => {
        this.guardandoAsistencia.set(null);
        this.mostrarMsg(e?.error?.message || 'No se pudo quitar al alumno.', 'error', 'Error');
      },
    });
  }

  imprimirCertificadoInscrito(a: {
    numDoc: number;
    nombreCompleto?: string;
    certificadoId?: string | null;
    certificadoCodigo?: string | null;
  }): void {
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

  /** Etiqueta QR para escanear en la app móvil del instructor. */
  imprimirEtiquetaQrInscrito(a: { numDoc: number; nombreCompleto?: string }): void {
    void this.imprimirEtiquetaQrInscritoAsync(a);
  }

  private async imprimirEtiquetaQrInscritoAsync(a: {
    numDoc: number;
    nombreCompleto?: string;
  }): Promise<void> {
    const c = this.claseActiva();
    const fromLabel = String(c?.contratoLabel || '').split(/[—–]/)[0]?.trim() || '';
    let codContrato = String(c?.codContrato || '').trim() || fromLabel;
    const idContrato = String(c?.idContrato || '').trim();
    if (!codContrato && idContrato) {
      try {
        const rows = await firstValueFrom(this.jornadaSvc.listarContratos());
        const found = rows.find((x) => String(x._id || '') === idContrato);
        codContrato = String(found?.codContrato || '').trim();
      } catch {
        /* ignore */
      }
    }
    const empresa = String(c?.clienteNombre || '').trim() || undefined;
    const fechaJornada =
      String(c?.fechaClase || c?.fechaJornada || '').trim() || undefined;
    try {
      await this.etiquetaQrSvc.imprimirUna(a.numDoc, a.nombreCompleto || String(a.numDoc), {
        empresa,
        codContrato: codContrato || undefined,
        fechaJornada,
      });
    } catch (err) {
      this.mostrarMsgModal(
        err instanceof Error ? err.message : 'No se pudo abrir la etiqueta QR.',
        'warn',
        'Etiqueta QR',
      );
    }
  }

  nuevoAlumnoJornada(): void {
    void this.router.navigate(['/app/jornadas/alumnos/nuevo']);
  }

  onModalClaseInstructorChange(id: string): void {
    this.modalClaseInstructorId.set(id ? Number(id) : '');
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

  @HostListener('document:click', ['$event'])
  cerrarBusquedaAlumnoFuera(ev: MouseEvent): void {
    const t = ev.target as HTMLElement;
    if (!t.closest('.clase-alumno-buscar')) this.alumnoBusquedaOpen.set(false);
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

  private mostrarResultadoAsistencia(r: any): void {
    this.metaAlumnosAlertSvc.notificarDesdeRespuesta(r?.metaJornada, {
      contratoLabel: this.claseActiva()?.contratoLabel || this.claseActiva()?.codContrato,
    });
    const ses = r.sesiones ?? 0;
    const req = r.numSesCert ?? '?';
    if (r.certificadoGenerado && r.certificado) {
      this.certAlertSvc.notificarDesdeRespuesta(r.certificado, r.nombreAlumno);
      this.mostrarMsg(
        `Certificado automático emitido (${ses}/${req} sesiones). Código: ${r.certificado.codigoCert || '—'}`,
        'ok',
        'Certificado emitido',
      );
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

  private actualizarCronometroDisplay(): void {
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

  private detenerCronometro(): void {
    if (this.cronometroTimer) {
      clearInterval(this.cronometroTimer);
      this.cronometroTimer = null;
    }
  }

  private iniciarCronometroSiAplica(): void {
    this.detenerCronometro();
    this.actualizarCronometroDisplay();
    const cl = this.claseActiva();
    if (cl?.estado === 'EN PROCESO' && cl.horaInicio && !cl.horaFin) {
      this.cronometroTimer = setInterval(() => this.actualizarCronometroDisplay(), 1000);
    }
  }
}
