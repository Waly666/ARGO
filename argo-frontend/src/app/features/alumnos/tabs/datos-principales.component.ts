import { CommonModule } from '@angular/common';

import { ArgoDateInputComponent } from '../../../shared/argo-date-input/argo-date-input.component';
import {
  Component,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { firstValueFrom, catchError, map, of } from 'rxjs';



import { AlumnoDto, AlumnoService } from '../../../core/services/alumno.service';

import { AlumnoStore } from '../../../core/services/alumno-store.service';

import {
  CatalogoService,
  ColegioDivipola,
  EstamentoPublico,
} from '../../../core/services/catalogo.service';

import { ConfigRecibo, ConfigService } from '../../../core/services/config.service';

import { ClienteService } from '../../../core/services/cliente.service';

import { GestorService } from '../../../core/services/gestor.service';

import { ConfigGestoresEmpresasService } from '../../../core/services/config-gestores-empresas.service';

import { ArgoSwitchComponent } from '../../../shared/argo-switch/argo-switch.component';

import { JornadaCapService } from '../../../core/services/jornada-cap.service';

import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

import { environment } from '../../../../environments/environment';

import { MunicipioBuscarComponent } from '../municipio-buscar.component';

import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';

import {

  DISCAPACIDADES_DEF,

  ESTADOS_CIVIL_DEF,

  ESTRATOS_DEF,

  GENEROS_DEF,

  JORNADAS_DEF,

  MULTICULTURALIDAD_DEF,

  NIVEL_FORMACION_DEF,

  OCUPACIONES_DEF,

  REGIMEN_SALUD_DEF,

  TIPOS_ALUMNO_DEF,

  TIPO_JORNADAS_CAPACITACION,

  TIPOS_DOC_DEF,

  TIPO_SANGRE_DEF,

  ORIGEN_SISTEMA,

  etiquetaOrigenAlumno,

  normalizarOrigenAlumno,

  normalizarTipoAlumno,

  catEtiqueta,
  catalogoConEtiquetas,
  catValor,

  fechaHoraDisplay,

  fechaInput,

  normalizarEnum,
  normalizarGenero,
  normalizarTipoSangre,
  nombreEnMayusculas,
  aMayusculas,
  CAMPOS_FORMULARIO_SIN_MAYUSCULAS,

} from '../catalogo.helpers';

import {
  formatNumDoc,
  NUM_DOC_MAX_DIGITS,
  numDocValidationHint,
  parseNumDocForApi,
  sanitizeNumDocInput,
} from '../../../core/utils/num-doc.helpers';

import {
  aplicarPlantillaMensaje,
  nombreCompletoAlumno,
} from '../../../core/utils/mensaje-plantilla.helpers';
import { ModoAlumnos, rutasAlumnos } from '../alumnos-rutas.helpers';
import { AlumnoJornadaQrPanelComponent } from '../alumno-jornada-qr-panel.component';
import { CelularInputComponent } from '../../../shared/celular-input/celular-input.component';
import { mensajeErrorCelularAlmacenado } from '../../../core/utils/celular.util';
import { CedulaPdf417ScannerComponent } from '../cedula-pdf417-scanner.component';
import { CedulaMrzScannerComponent } from '../cedula-mrz-scanner.component';
import {
  CedulaPdf417Data,
  parseCedulaColombianaPdf417,
} from '../cedula-pdf417.util';
import type { CedulaMrzData } from '../cedula-mrz.util';

@Component({

  selector: 'argo-datos-principales',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MunicipioBuscarComponent,
    CatalogoEnumBuscarComponent,
    ArgoDateInputComponent,
    AlumnoJornadaQrPanelComponent,
    CelularInputComponent,
    ArgoSwitchComponent,
    CedulaPdf417ScannerComponent,
    CedulaMrzScannerComponent,
  ],

  templateUrl: './datos-principales.component.html',

  styleUrls: ['./datos-principales.component.scss'],

})

export class DatosPrincipalesComponent implements OnInit, OnDestroy {

  /** Alumno cargado por la ficha (input desde alumno-detalle). */
  alumno = input<AlumnoDto | null>(null);

  /** general | jornadas — define lista y rutas de vuelta */
  modo = input<ModoAlumnos>('general');

  private rutasAlumno = computed(() => rutasAlumnos(this.modo()));

  private alumnoSvc = inject(AlumnoService);

  private catSvc = inject(CatalogoService);

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private confirm = inject(ConfirmDialogService);

  private configSvc = inject(ConfigService);

  store = inject(AlumnoStore);

  readonly numDocMaxLength = NUM_DOC_MAX_DIGITS;
  readonly numDocHint = numDocValidationHint();

  private configRecibo = signal<ConfigRecibo | null>(null);



  uploads = environment.uploadsUrl;



  form = signal<AlumnoDto>(this.emptyForm());

  fotoFile = signal<File | null>(null);

  fotoPreview = signal<string | null>(null);



  readonly tiposAlumno = TIPOS_ALUMNO_DEF;
  readonly normalizarTipoAlumno = normalizarTipoAlumno;
  readonly etiquetaOrigenAlumno = etiquetaOrigenAlumno;

  tiposDoc = signal<Record<string, unknown>[]>(TIPOS_DOC_DEF);

  generos = signal<Record<string, unknown>[]>(GENEROS_DEF);

  tiposSangre = signal<Record<string, unknown>[]>(TIPO_SANGRE_DEF);

  jornadas = signal<Record<string, unknown>[]>(JORNADAS_DEF);

  estadosCiviles = signal<Record<string, unknown>[]>(ESTADOS_CIVIL_DEF);

  estratos = signal<Record<string, unknown>[]>(ESTRATOS_DEF);

  regimenesSalud = signal<Record<string, unknown>[]>(REGIMEN_SALUD_DEF);

  nivelesFormacion = signal<Record<string, unknown>[]>(NIVEL_FORMACION_DEF);

  ocupaciones = signal<Record<string, unknown>[]>(OCUPACIONES_DEF);

  discapacidades = signal<Record<string, unknown>[]>(DISCAPACIDADES_DEF);

  multiCulturalidades = signal<Record<string, unknown>[]>(MULTICULTURALIDAD_DEF);

  opcionesTipoAlumno = computed<EnumBuscarOption[]>(() =>
    this.tiposAlumno.map((t) => ({ value: t, label: t })),
  );
  opcionesTiposDoc = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.tiposDoc()));
  opcionesGeneros = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.generos()));
  opcionesTiposSangre = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.tiposSangre()));
  opcionesJornadas = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.jornadas()));
  opcionesEstadosCivil = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.estadosCiviles()));
  opcionesEstratos = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.estratos()));
  opcionesRegimenSalud = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.regimenesSalud()));
  opcionesNivelFormacion = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.nivelesFormacion()));
  opcionesOcupaciones = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.ocupaciones()));
  opcionesDiscapacidades = computed<EnumBuscarOption[]>(() => this.mapOpcionesCatalogo(this.discapacidades()));
  opcionesMultiCulturalidad = computed<EnumBuscarOption[]>(() =>
    this.mapOpcionesCatalogo(this.multiCulturalidades()),
  );



  expedidaTexto = signal('');

  munOrigenTexto = signal('');
  /** Texto visible del departamento de origen (campo separado). */
  deptoOrigenTexto = signal('');
  opcionesDepartamentos = signal<EnumBuscarOption[]>([]);

  saving = signal(false);

  message = signal<string | null>(null);
  camposObligatoriosInvalidos = signal<string[]>([]);

  docDuplicado = signal<{ _id: string; nombreCompleto?: string } | null>(null);

  /** Escaneo OCR de cédula (solo nuevo alumno o relleno manual) */
  scanVisible = signal(true);
  scanPreview = signal<string | null>(null);
  scanFile = signal<File | null>(null);
  scanning = signal(false);
  scanWarnings = signal<string[]>([]);
  scanApplied = signal(false);
  scanMode = signal<'imagen' | 'pdf417' | 'mrz'>('imagen');
  private numDocScannerBuffer = '';
  private numDocScannerTimer: ReturnType<typeof setTimeout> | null = null;
  private numDocScannerLastKeyAt = 0;
  private numDocScannerRapidKeys = 0;
  private numDocScannerActivo = false;

  /** Empresa — mismo campo para regular, virtual y jornadas (catálogo clientes). */
  private clienteSvc = inject(ClienteService);
  private gestorSvc = inject(GestorService);
  private configGestoresEmpresasSvc = inject(ConfigGestoresEmpresasService);
  private jornadaCapSvc = inject(JornadaCapService);

  gestoresEmpresasActivo = signal(false);

  buscarEmpresasRemoto = (q: string) =>
    this.clienteSvc.listar(q.trim()).pipe(
      map((rows) =>
        rows.map((c) => {
          const label =
            c.razonSocial?.trim() ||
            c.nombreComercial?.trim() ||
            c.nombres?.trim() ||
            c.identificacion ||
            '—';
          return {
            value: String(c._id || ''),
            label,
            hint: c.identificacion ? `NIT ${c.identificacion}` : undefined,
          } satisfies EnumBuscarOption;
        }),
      ),
    );

  onEmpresaPick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('empresaId');
    this.form.update((f) => ({
      ...f,
      empresaId: String(opt.value || '').trim() || null,
      empresaNombre: String(opt.label || '').trim() || null,
    }));
    this.formDirty.set(true);
    this.lastContratoResolverKey = '';
  }

  onEmpresaLimpiar(): void {
    this.form.update((f) => ({ ...f, empresaId: null, empresaNombre: null }));
    this.formDirty.set(true);
    this.lastContratoResolverKey = '';
  }

  buscarGestoresRemoto = (q: string) =>
    this.gestorSvc.listar(q.trim()).pipe(
      map((rows) =>
        (rows || []).map((g) => {
          const nombre = g.nombreCompleto || [g.nombres, g.apellidos].filter(Boolean).join(' ').trim();
          const label = g.seudonimo || nombre || g.numero || '—';
          const tipo = (g.tipoGestor || 'persona_natural') === 'empresa' ? 'Empresa' : 'Persona natural';
          return {
            value: String(g._id || ''),
            label,
            hint: g.numero ? `${tipo} · Doc: ${g.numero}` : tipo,
          } satisfies EnumBuscarOption;
        }),
      ),
    );

  onManejoGestorEmpresaChange(activo: boolean): void {
    this.form.update((f) => ({
      ...f,
      manejoGestorEmpresa: activo,
      ...(activo
        ? {}
        : {
            tipoReferidorComercial: null,
            gestorId: null,
            gestorNombre: null,
            referidorEmpresaId: null,
            referidorEmpresaNombre: null,
          }),
    }));
    this.formDirty.set(true);
  }

  setTipoReferidorComercial(tipo: 'gestor' | 'empresa'): void {
    this.form.update((f) => ({
      ...f,
      tipoReferidorComercial: tipo,
      ...(tipo === 'gestor'
        ? { referidorEmpresaId: null, referidorEmpresaNombre: null }
        : { gestorId: null, gestorNombre: null }),
    }));
    this.limpiarCampoObligatorio('tipoReferidorComercial');
    this.limpiarCampoObligatorio('gestorId');
    this.limpiarCampoObligatorio('referidorEmpresaId');
    this.formDirty.set(true);
  }

  onGestorPick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('gestorId');
    this.form.update((f) => ({
      ...f,
      gestorId: String(opt.value || '').trim() || null,
      gestorNombre: String(opt.label || '').trim() || null,
    }));
    this.formDirty.set(true);
  }

  onGestorLimpiar(): void {
    this.form.update((f) => ({ ...f, gestorId: null, gestorNombre: null }));
    this.formDirty.set(true);
  }

  onReferidorEmpresaPick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('referidorEmpresaId');
    this.form.update((f) => ({
      ...f,
      referidorEmpresaId: String(opt.value || '').trim() || null,
      referidorEmpresaNombre: String(opt.label || '').trim() || null,
    }));
    this.formDirty.set(true);
  }

  onReferidorEmpresaLimpiar(): void {
    this.form.update((f) => ({ ...f, referidorEmpresaId: null, referidorEmpresaNombre: null }));
    this.formDirty.set(true);
  }

  /** Firma del último estado guardado (o vacío en alumno nuevo) */
  private lineaBase = signal('');

  saveAlarmFlash = signal(false);

  /** Evita que el effect de sincronización pise ediciones locales (p. ej. tipo de alumno). */
  private formDirty = signal(false);

  /** Evita re-sincronizar / re-consultar API con el mismo alumno o contrato. */
  private lastAlumnoSyncKey = '';
  private lastContratoResolverKey = '';
  private munOrigenCodResuelto = '';

  formSinGuardar = computed(() => {
    if (this.formDirty()) return true;
    const base = this.lineaBase();
    const cur = this.firmaEstadoActual();
    if (!base) return this.tieneDatosDigitados();
    return cur !== base;
  });

  saveAlarmVisible = computed(() => this.formSinGuardar() && !this.saving());

  saveAlarmTexto = computed(() =>
    this.isEdit() ? 'Cambios sin guardar' : 'Guarde con Crear para continuar',
  );

  isEdit = computed(() => !!this.form()._id);

  /** Nombre para etiqueta QR (ficha jornadas). */
  nombreParaQr = computed(() => nombreCompletoAlumno(this.form()) || '');

  /** Empresa en etiqueta: la del alumno o la de la institución (config recibo). */
  empresaParaQr = computed(() => {
    const empAlumno = String(this.form().empresaNombre || '').trim();
    if (empAlumno) return empAlumno;
    return String(this.configRecibo()?.nombreEmpresa || '').trim();
  });

  /** Código contrato (query lista/jornada) para la etiqueta QR. */
  private qpCodContrato = signal('');
  /** id de contrato en query (?contrato=). */
  private qpIdContrato = signal('');
  /** Código resuelto (query o contrato de la empresa del alumno). */
  private codContratoResuelto = signal('');

  /** Fecha jornada (query lista) para la etiqueta QR. */
  private qpFechaJornada = signal('');

  codContratoParaQr = computed(() => this.codContratoResuelto() || this.qpCodContrato());

  fechaJornadaParaQr = computed(() => this.qpFechaJornada());

  /** Alta desde Jornadas Cap. (query esJornadaCap / tipoAlumno). */
  private altaJornadaCap = signal(
    DatosPrincipalesComponent.esJornadaDesdeQuery(inject(ActivatedRoute).snapshot.queryParamMap),
  );

  esAlumnoJornada = computed(
    () =>
      this.modo() === 'jornadas' ||
      this.altaJornadaCap() ||
      normalizarTipoAlumno(this.form().tipoAlumno) === TIPO_JORNADAS_CAPACITACION,
  );

  /** Opciones de origen del participante (≠ origen inscripción SISTEMA|WEB). */
  readonly origenesJornadaUi: Array<{
    key: 'colegio' | 'estamento' | 'empresa' | 'operativo';
    label: string;
  }> = [
    { key: 'colegio', label: 'Institución educativa' },
    { key: 'estamento', label: 'Estamento público' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'operativo', label: 'Operativo / calle' },
  ];

  readonly perfilesInstitucionUi: Array<{ key: 'estudiante' | 'profesor'; label: string }> = [
    { key: 'estudiante', label: 'Estudiante' },
    { key: 'profesor', label: 'Profesor' },
  ];

  opcionesTipoInstitucion = (): EnumBuscarOption[] => [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnica', label: 'Técnica' },
    { value: 'tecnologica', label: 'Tecnológica' },
    { value: 'universidad', label: 'Universidad' },
  ];

  normalizarNivelInstitucionUi(raw: string | null | undefined): string {
    const t = String(raw || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (['primaria', 'secundaria', 'tecnica', 'tecnologica', 'universidad'].includes(t)) return t;
    if (t === 'colegio') return 'secundaria';
    if (t === 'instituto') return 'tecnica';
    return t || 'secundaria';
  }

  labelCursoGrado = computed(() =>
    this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa) === 'primaria'
      ? 'Curso *'
      : 'Grado *',
  );

  esNivelBasicaMediaUi = computed(() => {
    const t = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    return t === 'primaria' || t === 'secundaria';
  });

  esNivelSuperiorUi = computed(() => {
    const t = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    return t === 'tecnica' || t === 'tecnologica' || t === 'universidad';
  });

  nivelInstitucionUi = computed(() =>
    this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa),
  );

  /** Cambia con el nivel o el municipio: obliga a recargar el listado de instituciones. */
  claveBusquedaInstitucion = computed(
    () =>
      `${this.nivelInstitucionUi()}|${String(
        this.form().codMunicipio || this.form().munOrigen || '',
      )}`,
  );

  opcionesGradoColegio = (): EnumBuscarOption[] => {
    const t = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    if (t === 'primaria') {
      return Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        return { value: String(n), label: `Curso ${n}` };
      });
    }
    // secundaria (default)
    return Array.from({ length: 6 }, (_, i) => {
      const n = i + 6;
      return { value: String(n), label: `Grado ${n}` };
    });
  };

  opcionesSemestreInstitucion = (): EnumBuscarOption[] =>
    Array.from({ length: 12 }, (_, i) => {
      const n = i + 1;
      return { value: String(n), label: `Semestre ${n}` };
    });

  opcionesAreaImparte = (): EnumBuscarOption[] => [
    { value: 'matematicas', label: 'Matemáticas' },
    { value: 'lengua_castellana', label: 'Lengua castellana' },
    { value: 'ingles', label: 'Inglés' },
    { value: 'ciencias_naturales', label: 'Ciencias naturales' },
    { value: 'ciencias_sociales', label: 'Ciencias sociales' },
    { value: 'educacion_fisica', label: 'Educación física' },
    { value: 'educacion_artistica', label: 'Educación artística' },
    { value: 'tecnologia_informatica', label: 'Tecnología e informática' },
    { value: 'etica_valores', label: 'Ética y valores' },
    { value: 'religion', label: 'Religión' },
    { value: 'filosofia', label: 'Filosofía' },
    { value: 'quimica', label: 'Química' },
    { value: 'fisica', label: 'Física' },
    { value: 'biologia', label: 'Biología' },
    { value: 'orientacion_escolar', label: 'Orientación escolar' },
    { value: 'coordinacion', label: 'Coordinación académica' },
    { value: 'directivo', label: 'Directivo / rectoría' },
    { value: 'otra', label: 'Otra área' },
  ];

  textoOrigenJornadaCap = computed(() => {
    const k = String(this.form().origenJornadaCap || '').trim();
    return this.origenesJornadaUi.find((o) => o.key === k)?.label || '';
  });

  textoTipoInstitucion = computed(() => {
    const k = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    return this.opcionesTipoInstitucion().find((o) => o.value === k)?.label || '';
  });

  textoGradoColegio = computed(() => {
    const g = this.form().gradoColegio;
    if (g == null || !Number.isFinite(Number(g))) return '';
    const t = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    if (t === 'primaria') return `Curso ${g}`;
    return `Grado ${g}`;
  });

  textoSemestreInstitucion = computed(() => {
    const s = this.form().semestreInstitucion;
    if (s == null || !Number.isFinite(Number(s))) return '';
    return `Semestre ${s}`;
  });

  textoAreaImparte = computed(() => {
    const k = String(this.form().areaImparteColegio || '').trim();
    return this.opcionesAreaImparte().find((o) => o.value === k)?.label || '';
  });

  esProfesorInstitucion = computed(() => {
    if (String(this.form().origenJornadaCap || '') !== 'colegio') return false;
    return String(this.form().perfilInstitucionEducativa || 'estudiante') === 'profesor';
  });

  perfilInstitucionActivo = computed((): 'estudiante' | 'profesor' => {
    const p = String(this.form().perfilInstitucionEducativa || '').trim();
    return p === 'profesor' ? 'profesor' : 'estudiante';
  });

  labelInstitucionBuscar = computed(() => {
    const t = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    if (t === 'primaria' || t === 'secundaria') return 'Institución *';
    if (t === 'tecnica') return 'Institución técnica *';
    if (t === 'tecnologica') return 'Institución tecnológica *';
    return 'Universidad / IES *';
  });

  buscarColegiosRemoto = (q: string) => {
    const cod = String(this.form().codMunicipio || this.form().munOrigen || '').trim();
    const nivel = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    const superior = ['tecnica', 'tecnologica', 'universidad'].includes(nivel);
    // IES: listar el catálogo completo (~300+); colegios MEN: tope menor.
    const limit = superior ? 500 : 60;
    return this.catSvc.buscarColegios(cod, q, limit, nivel).pipe(
      map((rows: ColegioDivipola[]) =>
        rows.map((r) => {
          const nombre = String(r.nombreEstablecimiento || r.label || '').trim();
          const muni = String(r.nombreMunicipio || '').trim();
          const depto = String(r.nombreDepartamento || '').trim();
          const ubi = r.hint || [muni, depto].filter(Boolean).join(' · ');
          return {
            value: r.codigoEstablecimiento,
            label: nombre,
            hint: ubi || undefined,
          };
        }),
      ),
      catchError(() => of([])),
    );
  };

  buscarTitulacionesRemoto = (q: string) => {
    const nivel = this.normalizarNivelInstitucionUi(this.form().tipoInstitucionEducativa);
    return this.catSvc.buscarTitulaciones(nivel, q, 80).pipe(
      map((rows) =>
        rows.map((r) => ({
          value: r.codigo,
          label: r.nombre || r.label,
          hint: r.hint,
        })),
      ),
      catchError(() => of([])),
    );
  };

  buscarEstamentosRemoto = (q: string) => {
    const cod = String(this.form().codMunicipio || this.form().munOrigen || '').trim();
    return this.catSvc.buscarEstamentosPublicos(cod, q, 40).pipe(
      map((rows: EstamentoPublico[]) =>
        rows.map((r) => ({
          value: r.idEstamento,
          label: r.label || r.nombre,
        })),
      ),
    );
  };

  catValor = catValor;

  catEtiqueta = catEtiqueta;

  fechaHoraDisplay = fechaHoraDisplay;



  private static esJornadaDesdeQuery(q: { get: (k: string) => string | null }): boolean {
    const flag = q.get('esJornadaCap');
    if (flag === 'true' || flag === '1') return true;
    return normalizarTipoAlumno(q.get('tipoAlumno')) === TIPO_JORNADAS_CAPACITACION;
  }

  /** Query `origen` / `origenJornadaCap` = participante jornada (no SISTEMA|WEB). */
  private static normalizarOrigenJornadaQuery(raw: string | null): string {
    const v = String(raw || '')
      .trim()
      .toLowerCase();
    if (v === 'colegio' || v === 'estudiante' || v === 'institucion' || v === 'institución') {
      return 'colegio';
    }
    if (v === 'estamento' || v === 'estamento_publico' || v === 'estamento-publico') {
      return 'estamento';
    }
    if (v === 'empresa') return 'empresa';
    if (v === 'operativo' || v === 'calle' || v === 'operativo_calle') return 'operativo';
    return '';
  }

  constructor() {
    afterNextRender(() => this.sincronizarDesdeAlumno());

    effect(() => {
      if (this.formDirty()) return;
      const a = this.alumno() ?? this.store.alumno();
      const key = a?._id
        ? `${String(a._id)}|${String(a.fechaMod ?? '')}`
        : a?.numDoc != null
          ? `doc:${String(a.numDoc)}`
          : 'vacío';
      if (key === this.lastAlumnoSyncKey) return;
      this.lastAlumnoSyncKey = key;
      this.sincronizarDesdeAlumno(a);
    });

    effect(() => {
      this.store.setDatosSinGuardar(this.formSinGuardar());
    });

    effect(() => {
      const tick = this.store.saveAlarmTick();
      if (!tick) return;
      this.saveAlarmFlash.set(true);
      const t = setTimeout(() => this.saveAlarmFlash.set(false), 3200);
      return () => clearTimeout(t);
    });

    effect(() => {
      const qpCod = this.qpCodContrato();
      const idContrato = this.qpIdContrato();
      const empresaId = String(this.form().empresaId || '').trim();
      const key = `${qpCod}|${idContrato}|${empresaId}`;
      if (key === this.lastContratoResolverKey) return;
      this.lastContratoResolverKey = key;
      void this.resolverCodContratoEtiqueta(qpCod, idContrato, empresaId);
    });

  }



  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const esJ = DatosPrincipalesComponent.esJornadaDesdeQuery(q);
      this.altaJornadaCap.set(esJ);
      this.qpCodContrato.set((q.get('codContrato') || q.get('contratoCod') || '').trim());
      this.qpIdContrato.set((q.get('contrato') || q.get('idContrato') || '').trim());
      this.qpFechaJornada.set((q.get('fechaJornada') || q.get('fecha') || '').trim());
      this.lastContratoResolverKey = '';
      if (esJ && !this.isEdit()) {
        const origenJ =
          DatosPrincipalesComponent.normalizarOrigenJornadaQuery(
            q.get('origenJornadaCap') || q.get('origen'),
          ) || 'operativo';
        this.form.update((f) => ({
          ...f,
          tipoAlumno: TIPO_JORNADAS_CAPACITACION,
          origenJornadaCap: origenJ,
        }));
        this.lineaBase.set(
          this.firmaEstadoActual({
            ...this.form(),
            tipoAlumno: TIPO_JORNADAS_CAPACITACION,
            origenJornadaCap: origenJ,
          }),
        );
      }
    });

    this.cargarCatalogo('catTipoDoc', this.tiposDoc, TIPOS_DOC_DEF);
    this.cargarCatalogo('genero', this.generos, GENEROS_DEF);
    this.cargarCatalogo('tipoSangre', this.tiposSangre, TIPO_SANGRE_DEF);
    this.cargarCatalogo('jornada', this.jornadas, JORNADAS_DEF);
    this.cargarCatalogo('estadoCivil', this.estadosCiviles, ESTADOS_CIVIL_DEF);
    this.cargarCatalogo('estrato', this.estratos, ESTRATOS_DEF);
    this.cargarCatalogo('catRegimenSalud', this.regimenesSalud, REGIMEN_SALUD_DEF);
    this.cargarCatalogo('nivelFormacion', this.nivelesFormacion, NIVEL_FORMACION_DEF);
    this.cargarCatalogo('ocupacion', this.ocupaciones, OCUPACIONES_DEF);
    this.cargarCatalogo('discapacidad', this.discapacidades, DISCAPACIDADES_DEF);
    this.cargarCatalogo('multiCulturalidad', this.multiCulturalidades, MULTICULTURALIDAD_DEF);

    this.catSvc.departamentos().subscribe({
      next: (rows) => {
        this.opcionesDepartamentos.set(
          (rows || []).map((d: { codDepto?: string; nombreDepto?: string }) => ({
            value: String(d.codDepto || '').padStart(2, '0'),
            label: String(d.nombreDepto || '').trim(),
          })),
        );
        this.sincronizarTextoDeptoOrigen();
      },
      error: () => this.opcionesDepartamentos.set([]),
    });

    this.configSvc.obtenerRecibo().subscribe({
      next: (c) => this.configRecibo.set(c),
      error: () => this.configRecibo.set(null),
    });

    this.configGestoresEmpresasSvc.obtener().subscribe({
      next: (c) => this.gestoresEmpresasActivo.set(!!c?.activo),
      error: () => this.gestoresEmpresasActivo.set(false),
    });

  }

  ngOnDestroy(): void {
    if (this.numDocScannerTimer) clearTimeout(this.numDocScannerTimer);
    if (!this.formDirty()) {
      this.store.setDatosSinGuardar(false);
    }
  }

  /** Prefiere query; si no, contrato por id; si no, contrato de la empresa del alumno. */
  private async resolverCodContratoEtiqueta(
    qpCod: string,
    idContrato: string,
    empresaId: string,
  ): Promise<void> {
    if (qpCod) {
      this.codContratoResuelto.set(qpCod);
      return;
    }
    if (!idContrato && !empresaId) {
      this.codContratoResuelto.set('');
      return;
    }
    try {
      const rows = await firstValueFrom(this.jornadaCapSvc.listarContratos());
      if (idContrato) {
        const c = rows.find((x) => String(x._id || '') === idContrato);
        const cod = String(c?.codContrato || '').trim();
        if (cod) {
          this.codContratoResuelto.set(cod);
          return;
        }
      }
      if (!empresaId) {
        this.codContratoResuelto.set('');
        return;
      }
      const deEmpresa = rows.filter(
        (c) => String(c.idClienteFacturacion || '') === empresaId && String(c.codContrato || '').trim(),
      );
      const enEjec = deEmpresa.filter((c) => c.estado === 'En Ejecución');
      const pool = enEjec.length ? enEjec : deEmpresa;
      this.codContratoResuelto.set(String(pool[0]?.codContrato || '').trim());
    } catch {
      this.codContratoResuelto.set('');
    }
  }



  private actualizarLineaBaseTrasEnriquecimientoAsync(): void {
    if (this.formDirty()) return;
    this.lineaBase.set(this.firmaEstadoActual(undefined, false));
    this.store.setDatosSinGuardar(false);
  }

  private resolverTextoMunOrigen(cod?: string) {
    const c = String(cod || '').trim();
    if (!c) {
      this.munOrigenTexto.set('');
      this.munOrigenCodResuelto = '';
      return;
    }
    if (c === this.munOrigenCodResuelto) return;

    this.munOrigenCodResuelto = c;
    this.catSvc.municipioPorCodigo(c).subscribe({
      next: (m) => {
        if (this.munOrigenCodResuelto !== c) return;
        this.munOrigenTexto.set(aMayusculas(m.nombreMunicipio || m.label));
        if (this.formDirty()) return;
        const codDep = String(m.codDepto || '').padStart(2, '0');
        if (codDep && codDep !== '00') {
          this.form.update((f) => ({
            ...f,
            codDepartamento: f.codDepartamento || codDep,
            nombreDepartamento: f.nombreDepartamento || m.nombreDepto || '',
            nombreMunicipio: m.nombreMunicipio || f.nombreMunicipio || '',
          }));
          this.sincronizarTextoDeptoOrigen();
        }
        this.actualizarLineaBaseTrasEnriquecimientoAsync();
      },

      error: () => {
        if (this.munOrigenCodResuelto === c) this.munOrigenTexto.set(c);
      },

    });
  }

  private sincronizarTextoDeptoOrigen(): void {
    const cod = String(this.form().codDepartamento || '').padStart(2, '0');
    if (!cod || cod === '00') {
      this.deptoOrigenTexto.set(String(this.form().nombreDepartamento || '').trim());
      return;
    }
    const hit = this.opcionesDepartamentos().find((d) => d.value === cod);
    this.deptoOrigenTexto.set(
      hit?.label || String(this.form().nombreDepartamento || '').trim() || cod,
    );
  }

  onDeptoOrigenPick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('codDepartamento');
    const cod = String(opt.value || '').padStart(2, '0');
    this.deptoOrigenTexto.set(opt.label || '');
    this.munOrigenTexto.set('');
    this.form.update((f) => ({
      ...f,
      codDepartamento: cod,
      nombreDepartamento: opt.label || '',
      munOrigen: '',
      codMunicipio: '',
      nombreMunicipio: '',
    }));
    this.formDirty.set(true);
  }

  onDeptoOrigenLimpiar(): void {
    this.deptoOrigenTexto.set('');
    this.munOrigenTexto.set('');
    this.form.update((f) => ({
      ...f,
      codDepartamento: '',
      nombreDepartamento: '',
      munOrigen: '',
      codMunicipio: '',
      nombreMunicipio: '',
    }));
    this.formDirty.set(true);
  }

  onExpedidaSel(m: { nombreMunicipio: string; label: string }) {

    this.expedidaTexto.set(aMayusculas(m.label));

    this.patch('expedida', m.nombreMunicipio);

  }

  onExpedidaLimpiar(): void {
    this.expedidaTexto.set('');
    this.patch('expedida', '');
  }

  onExpedidaTexto(v: string): void {
    const up = aMayusculas(v);
    this.expedidaTexto.set(up);
    this.patch('expedida', up);
  }



  onMunOrigenSel(m: {
    codMunicipio: string;
    label: string;
    nombreMunicipio?: string;
    codDepto?: string;
    nombreDepto?: string;
  }) {
    this.limpiarCampoObligatorio('munOrigen');
    this.munOrigenTexto.set(aMayusculas(m.nombreMunicipio || m.label));
    const cod = m.codMunicipio;
    this.munOrigenCodResuelto = cod;
    const codDep = String(m.codDepto || this.form().codDepartamento || '').padStart(2, '0');
    this.form.update((f) => ({
      ...f,
      munOrigen: cod,
      codMunicipio: cod,
      nombreMunicipio: m.nombreMunicipio || '',
      codDepartamento: codDep !== '00' ? codDep : f.codDepartamento,
      nombreDepartamento: m.nombreDepto || f.nombreDepartamento || '',
    }));
    this.formDirty.set(true);
  }

  onMunOrigenLimpiar(): void {
    this.munOrigenTexto.set('');
    this.form.update((f) => ({
      ...f,
      munOrigen: '',
      codMunicipio: '',
      nombreMunicipio: '',
    }));
    this.formDirty.set(true);
  }

  mapOpcionesCatalogo(items: Record<string, unknown>[]): EnumBuscarOption[] {
    return items.map((item) => ({ value: catValor(item), label: catEtiqueta(item) }));
  }

  etiquetaCatalogo(items: Record<string, unknown>[], valor?: string | null): string {
    const v = String(valor ?? '').trim();
    if (!v) return '';
    const norm = normalizarEnum(v);
    const hit = items.find((i) => {
      const cv = catValor(i);
      const cod = String(i['codigo'] ?? '').trim();
      return (
        cv === v
        || cv === norm
        || (cod && (cod === v || cod.toUpperCase() === v.toUpperCase()))
        || catEtiqueta(i).toUpperCase() === v.toUpperCase()
      );
    });
    return hit ? catEtiqueta(hit) : v;
  }

  onCatalogoPick<K extends keyof AlumnoDto>(campo: K, opt: EnumBuscarOption): void {
    this.patch(campo, String(opt.value) as AlumnoDto[K]);
  }

  onCatalogoLimpiar<K extends keyof AlumnoDto>(campo: K, valorVacio: AlumnoDto[K] = '' as AlumnoDto[K]): void {
    this.patch(campo, valorVacio);
  }

  onTipoAlumnoPick(opt: EnumBuscarOption): void {
    const tipo = normalizarTipoAlumno(String(opt.value));
    this.patch('tipoAlumno', tipo);
    this.formDirty.set(true);
  }

  onTipoAlumnoLimpiar(): void {
    // En ruta de jornadas el tipo queda fijo; en /app/alumnos se puede cambiar.
    if (this.modo() === 'jornadas') return;
    this.patch('tipoAlumno', normalizarTipoAlumno(undefined));
    this.formDirty.set(true);
  }

  setOrigenJornadaCap(key: 'colegio' | 'estamento' | 'empresa' | 'operativo'): void {
    this.limpiarCampoObligatorio('origenJornadaCap');
    this.form.update((f) => ({
      ...f,
      origenJornadaCap: key,
      ...(key !== 'colegio'
        ? {
            tipoInstitucionEducativa: null,
            perfilInstitucionEducativa: null,
            colegioCodigo: null,
            colegioNombre: null,
            gradoColegio: null,
            semestreInstitucion: null,
            titulacionCodigo: null,
            areaImparteColegio: null,
            programaInstitucion: null,
          }
        : {
            tipoInstitucionEducativa:
              this.normalizarNivelInstitucionUi(f.tipoInstitucionEducativa) || 'secundaria',
            perfilInstitucionEducativa: f.perfilInstitucionEducativa || 'estudiante',
          }),
      ...(key !== 'estamento'
        ? {
            estamentoId: null,
            estamentoNombre: null,
            cargoEstamento: null,
            dependenciaEstamento: null,
          }
        : {}),
      ...(key !== 'empresa' ? { empresaId: null, empresaNombre: null } : {}),
    }));
    this.formDirty.set(true);
  }

  setPerfilInstitucion(perfil: 'estudiante' | 'profesor'): void {
    this.limpiarCampoObligatorio('perfilInstitucionEducativa');
    this.limpiarCampoObligatorio('gradoColegio');
    this.limpiarCampoObligatorio('semestreInstitucion');
    this.limpiarCampoObligatorio('titulacionCodigo');
    this.limpiarCampoObligatorio('areaImparteColegio');
    this.limpiarCampoObligatorio('programaInstitucion');
    this.form.update((f) => ({
      ...f,
      perfilInstitucionEducativa: perfil,
      ...(perfil === 'profesor'
        ? {
            gradoColegio: null,
            semestreInstitucion: null,
            titulacionCodigo: null,
            programaInstitucion: null,
          }
        : { areaImparteColegio: null }),
    }));
    this.formDirty.set(true);
  }

  onTipoInstitucionPick(opt: EnumBuscarOption): void {
    const tipo = this.normalizarNivelInstitucionUi(String(opt.value || 'secundaria'));
    this.limpiarCampoObligatorio('tipoInstitucionEducativa');
    this.form.update((f) => ({
      ...f,
      tipoInstitucionEducativa: tipo,
      colegioCodigo: null,
      colegioNombre: null,
      gradoColegio: null,
      semestreInstitucion: null,
      titulacionCodigo: null,
      programaInstitucion: null,
    }));
    this.formDirty.set(true);
  }

  onTipoInstitucionLimpiar(): void {
    this.form.update((f) => ({
      ...f,
      tipoInstitucionEducativa: null,
      colegioCodigo: null,
      colegioNombre: null,
      gradoColegio: null,
      semestreInstitucion: null,
      titulacionCodigo: null,
      programaInstitucion: null,
      areaImparteColegio: null,
    }));
    this.formDirty.set(true);
  }

  onColegioPick(opt: EnumBuscarOption): void {
    this.form.update((f) => ({
      ...f,
      colegioCodigo: String(opt.value || '').trim() || null,
      colegioNombre: String(opt.label || '').trim() || null,
    }));
    this.formDirty.set(true);
  }

  onColegioLimpiar(): void {
    this.form.update((f) => ({ ...f, colegioCodigo: null, colegioNombre: null }));
    this.formDirty.set(true);
  }

  onGradoColegioPick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('gradoColegio');
    const n = parseInt(String(opt.value), 10);
    this.patch('gradoColegio', Number.isFinite(n) ? n : null);
  }

  onGradoColegioLimpiar(): void {
    this.patch('gradoColegio', null);
  }

  onSemestreInstitucionPick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('semestreInstitucion');
    const n = parseInt(String(opt.value), 10);
    this.patch('semestreInstitucion', Number.isFinite(n) ? n : null);
  }

  onSemestreInstitucionLimpiar(): void {
    this.patch('semestreInstitucion', null);
  }

  onTitulacionPick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('titulacionCodigo');
    this.limpiarCampoObligatorio('programaInstitucion');
    this.form.update((f) => ({
      ...f,
      titulacionCodigo: String(opt.value || '').trim() || null,
      programaInstitucion: String(opt.label || '').trim() || null,
    }));
    this.formDirty.set(true);
  }

  onTitulacionLimpiar(): void {
    this.form.update((f) => ({
      ...f,
      titulacionCodigo: null,
      programaInstitucion: null,
    }));
    this.formDirty.set(true);
  }

  onAreaImpartePick(opt: EnumBuscarOption): void {
    this.limpiarCampoObligatorio('areaImparteColegio');
    this.patch('areaImparteColegio', String(opt.value || '').trim() || null);
  }

  onAreaImparteLimpiar(): void {
    this.patch('areaImparteColegio', null);
  }

  onEstamentoPick(opt: EnumBuscarOption): void {
    this.form.update((f) => ({
      ...f,
      estamentoId: String(opt.value || '').trim() || null,
      estamentoNombre: String(opt.label || '').trim() || null,
    }));
    this.formDirty.set(true);
  }

  onEstamentoLimpiar(): void {
    this.form.update((f) => ({ ...f, estamentoId: null, estamentoNombre: null }));
    this.formDirty.set(true);
  }

  campoObligatorioInvalido(campo: string): boolean {
    return this.camposObligatoriosInvalidos().includes(campo);
  }

  private limpiarCampoObligatorio(campo: string): void {
    this.camposObligatoriosInvalidos.update((campos) => campos.filter((x) => x !== campo));
  }



  private cargarCatalogo(

    nombre: string,

    target: ReturnType<typeof signal<Record<string, unknown>[]>>,

    fallback: Record<string, unknown>[],

  ) {

    this.catSvc.list(nombre, { refresh: true }).subscribe((d) => {
      target.set(catalogoConEtiquetas(d || [], fallback));
    });

  }



  patch<K extends keyof AlumnoDto>(k: K, v: AlumnoDto[K]) {
    this.limpiarCampoObligatorio(String(k));
    let valor = v;
    if (k === 'apellido1' || k === 'apellido2' || k === 'nombre1' || k === 'nombre2') {
      valor = aMayusculas(String(v ?? '')) as AlumnoDto[K];
    } else if (typeof v === 'string' && !CAMPOS_FORMULARIO_SIN_MAYUSCULAS.has(String(k))) {
      valor = aMayusculas(v) as AlumnoDto[K];
    }
    if (k === 'numDoc') {
      valor = sanitizeNumDocInput(v) as AlumnoDto[K];
    }
    if (k === 'tipoAlumno') {
      valor = normalizarTipoAlumno(String(v ?? '')) as AlumnoDto[K];
    }
    if (k === 'alertaPagoFrecuencia' && !v) {
      this.form.update((f) => ({ ...f, alertaPagoFrecuencia: '', alertaPago: null }));
      this.formDirty.set(true);
      return;
    }
    this.form.update((f) => ({ ...f, [k]: valor }));
    this.formDirty.set(true);
    if (k === 'empresaId') {
      this.lastContratoResolverKey = '';
    }

    if (k === 'numDoc' && !this.numDocScannerActivo) this.verificarDoc();
  }

  onNumDocScannerKeydown(event: KeyboardEvent): void {
    if (this.isEdit()) return;
    const now = performance.now();
    if (now - this.numDocScannerLastKeyAt > 90) {
      this.numDocScannerBuffer = '';
      this.numDocScannerRapidKeys = 0;
      this.numDocScannerActivo = false;
    }
    const gap = now - this.numDocScannerLastKeyAt;
    this.numDocScannerLastKeyAt = now;

    if (event.key === 'Enter' || event.key === 'Tab') {
      if (/PubDSK_/i.test(this.numDocScannerBuffer)) {
        event.preventDefault();
        void this.finalizarLecturaNumDocScanner();
      }
      return;
    }

    let char = '';
    if (event.key.length === 1) char = event.key;
    else if (event.key === 'Unidentified') char = '\u0000';
    if (!char || event.ctrlKey || event.altKey || event.metaKey) return;

    this.numDocScannerBuffer += char;
    this.numDocScannerRapidKeys = gap > 0 && gap < 55 ? this.numDocScannerRapidKeys + 1 : 1;
    if (this.numDocScannerRapidKeys >= 4) this.numDocScannerActivo = true;

    if (
      this.numDocScannerActivo &&
      (!/^\d$/.test(char) || /PubDSK_/i.test(this.numDocScannerBuffer))
    ) {
      event.preventDefault();
    }

    if (this.numDocScannerTimer) clearTimeout(this.numDocScannerTimer);
    this.numDocScannerTimer = setTimeout(() => {
      void this.finalizarLecturaNumDocScanner();
    }, 220);
  }

  onNumDocScannerPaste(event: ClipboardEvent): void {
    if (this.isEdit()) return;
    const raw = event.clipboardData?.getData('text') || '';
    if (!/PubDSK_/i.test(raw)) return;
    event.preventDefault();
    this.numDocScannerBuffer = raw;
    this.numDocScannerActivo = true;
    void this.finalizarLecturaNumDocScanner();
  }

  private async finalizarLecturaNumDocScanner(): Promise<void> {
    if (this.numDocScannerTimer) {
      clearTimeout(this.numDocScannerTimer);
      this.numDocScannerTimer = null;
    }
    const raw = this.numDocScannerBuffer;
    const pareciaPdf417 = /PubDSK_/i.test(raw);
    this.numDocScannerBuffer = '';
    this.numDocScannerRapidKeys = 0;
    this.numDocScannerActivo = false;
    if (!pareciaPdf417) return;

    const parsed = parseCedulaColombianaPdf417(raw);
    if (!parsed) {
      this.message.set(
        'El lector detectó un PDF417, pero la lectura llegó incompleta. Vuelva a accionar el lector.',
      );
      return;
    }
    await this.onCedulaPdf417Scanned(parsed);
  }



  verificarDoc() {
    const nd = parseNumDocForApi(this.form().numDoc);
    if (nd == null) {
      this.docDuplicado.set(null);
      return;
    }
    this.alumnoSvc.verificarDocumento(nd, this.form()._id).subscribe({
      next: (r) => {
        if (r.existe && r._id && String(r._id) !== String(this.form()._id || '')) {
          this.docDuplicado.set({ _id: String(r._id), nombreCompleto: r.nombreCompleto });
          if (!this.isEdit()) {
            this.message.set(
              `El documento ${formatNumDoc(nd)} ya está registrado. Abra el alumno existente o use otro número.`,
            );
          }
        } else {
          this.docDuplicado.set(null);
        }
      },
    });
  }



  irAlDuplicado() {

    const d = this.docDuplicado();

    if (d?._id) void this.router.navigate([this.rutasAlumno().ficha(d._id)]);

  }



  onFoto(ev: Event) {

    const file = (ev.target as HTMLInputElement).files?.[0];

    if (!file) return;
    this.limpiarCampoObligatorio('foto');

    this.fotoFile.set(file);

    const r = new FileReader();

    r.onload = () => this.fotoPreview.set(r.result as string);

    r.readAsDataURL(file);

  }

  onCedulaScan(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.scanFile.set(file);
    this.scanApplied.set(false);
    this.scanWarnings.set([]);
    const r = new FileReader();
    r.onload = () => this.scanPreview.set(r.result as string);
    r.readAsDataURL(file);
  }

  seleccionarScanMode(mode: 'imagen' | 'pdf417' | 'mrz'): void {
    this.scanMode.set(mode);
    this.scanWarnings.set([]);
    this.message.set(null);
  }

  async onCedulaMrzScanned(data: CedulaMrzData): Promise<void> {
    await this.onCedulaCodigoScanned(data, 'MRZ');
  }

  async onCedulaPdf417Scanned(data: CedulaPdf417Data): Promise<void> {
    await this.onCedulaCodigoScanned(data, 'PDF417');
  }

  private async onCedulaCodigoScanned(
    data: CedulaPdf417Data | CedulaMrzData,
    origen: 'PDF417' | 'MRZ',
  ): Promise<void> {
    this.aplicarSugeridoOcr(data, false);
    this.scanApplied.set(true);
    this.scanVisible.set(false);
    this.scanWarnings.set([]);
    const nd = parseNumDocForApi(data.numDoc);
    if (nd == null) {
      this.message.set(`El ${origen} no entregó un número de documento válido.`);
      return;
    }
    try {
      const existente = await firstValueFrom(
        this.alumnoSvc.verificarDocumento(nd, this.form()._id),
      );
      if (
        existente.existe &&
        existente._id &&
        String(existente._id) !== String(this.form()._id || '')
      ) {
        const id = String(existente._id);
        this.docDuplicado.set({ _id: id, nombreCompleto: existente.nombreCompleto });
        await this.confirm.open({
          title: 'Alumno ya registrado',
          message: `${existente.nombreCompleto || `Documento ${formatNumDoc(nd)}`} ya está registrado. Se abrirá su ficha existente.`,
          confirmLabel: 'Abrir registro',
          hideCancel: true,
          variant: 'warn',
        });
        await this.router.navigate([this.rutasAlumno().ficha(id)]);
        return;
      }
      this.docDuplicado.set(null);
      this.message.set(`Datos leídos desde el ${origen}. Revise y corrija antes de guardar.`);
    } catch {
      this.message.set(
        'Los datos fueron leídos, pero no fue posible verificar si el alumno ya existe.',
      );
    }
  }

  omitirEscaneo() {
    this.scanVisible.set(false);
    this.scanPreview.set(null);
    this.scanFile.set(null);
    this.scanWarnings.set([]);
  }

  volverEscaneo() {
    this.scanVisible.set(true);
    this.scanApplied.set(false);
    this.scanWarnings.set([]);
  }

  escanearCedula() {
    const file = this.scanFile();
    if (!file) {
      this.message.set('Seleccione una imagen del frente de la cédula.');
      return;
    }
    this.scanning.set(true);
    this.message.set(null);
    this.alumnoSvc.escanearCedula(file).subscribe({
      next: (res) => {
        this.scanning.set(false);
        this.aplicarSugeridoOcr(res.sugerido);
        this.scanWarnings.set(res.meta?.advertencias || []);
        this.scanApplied.set(true);
        this.scanVisible.set(false);
        this.message.set('Datos sugeridos aplicados. Revise y corrija antes de guardar.');
      },
      error: (err) => {
        this.scanning.set(false);
        this.message.set(err?.error?.message || 'No se pudo leer la cédula. Intente otra foto o digite manualmente.');
      },
    });
  }

  private aplicarSugeridoOcr(s: Partial<AlumnoDto>, verificarDocumento = true) {
    const genero = normalizarGenero(s.genero);
    const tipoSangre = normalizarTipoSangre(s.tipoSangre);
    this.form.update((f) => ({
      ...f,
      tipoDoc: s.tipoDoc || f.tipoDoc || '1',
      numDoc: s.numDoc != null ? formatNumDoc(s.numDoc) : f.numDoc,
      expedida: s.expedida?.trim() || f.expedida,
      apellido1: nombreEnMayusculas(s.apellido1 || f.apellido1),
      apellido2: nombreEnMayusculas(s.apellido2 || f.apellido2),
      nombre1: nombreEnMayusculas(s.nombre1 || f.nombre1),
      nombre2: nombreEnMayusculas(s.nombre2 || f.nombre2),
      fechaNac: s.fechaNac || f.fechaNac,
      genero: genero || f.genero,
      tipoSangre: tipoSangre || f.tipoSangre,
    }));
    if (s.expedida?.trim()) this.expedidaTexto.set(s.expedida.trim());
    if (verificarDocumento && formatNumDoc(s.numDoc)) this.verificarDoc();
  }

  private validarSeccionesObligatorias(f: AlumnoDto): string | null {
    const vacio = (value: unknown) => value == null || String(value).trim() === '';
    const faltantes: Array<{ seccion: string; campos: string[] }> = [];
    const identificacion: string[] = [];
    const personales: string[] = [];
    const contacto: string[] = [];
    const invalidos: string[] = [];
    const falta = (condicion: boolean, id: string, etiqueta: string, grupo: string[]) => {
      if (!condicion) return;
      invalidos.push(id);
      grupo.push(etiqueta);
    };

    falta(vacio(f.tipoAlumno), 'tipoAlumno', 'tipo de alumno', identificacion);
    falta(vacio(f.tipoDoc), 'tipoDoc', 'tipo de documento', identificacion);
    falta(
      parseNumDocForApi(f.numDoc) == null,
      'numDoc',
      `número de documento válido (${this.numDocHint})`,
      identificacion,
    );
    falta(vacio(f.expedida), 'expedida', 'lugar de expedición', identificacion);
    falta(vacio(f.apellido1), 'apellido1', 'primer apellido', identificacion);
    falta(vacio(f.apellido2), 'apellido2', 'segundo apellido', identificacion);
    falta(vacio(f.nombre1), 'nombre1', 'primer nombre', identificacion);
    falta(vacio(f.nombre2), 'nombre2', 'segundo nombre', identificacion);
    falta(vacio(f.fechaNac), 'fechaNac', 'fecha de nacimiento', identificacion);

    falta(vacio(f.genero), 'genero', 'género', personales);
    falta(vacio(f.tipoSangre), 'tipoSangre', 'tipo de sangre', personales);
    falta(vacio(f.jornada), 'jornada', 'jornada', personales);
    falta(vacio(f.estadoCivil), 'estadoCivil', 'estado civil', personales);
    falta(vacio(f.estrato), 'estrato', 'estrato', personales);
    falta(vacio(f.regimenSalud), 'regimenSalud', 'régimen de salud', personales);
    falta(vacio(f.nivelFormacion), 'nivelFormacion', 'nivel de formación', personales);
    falta(vacio(f.ocupacion), 'ocupacion', 'ocupación', personales);

    falta(vacio(f.correo), 'correo', 'correo', contacto);
    falta(vacio(f.celular), 'celular', 'celular', contacto);
    falta(vacio(f.direccion), 'direccion', 'dirección', contacto);
    falta(vacio(f.codDepartamento), 'codDepartamento', 'departamento de origen', contacto);
    falta(
      vacio(f.codMunicipio) && vacio(f.munOrigen),
      'munOrigen',
      'municipio de origen',
      contacto,
    );

    const diversidad: string[] = [];
    falta(vacio(f.discapacidad), 'discapacidad', 'discapacidad', diversidad);
    falta(vacio(f.multiCulturalidad), 'multiCulturalidad', 'multiculturalidad', diversidad);

    const jornadaOrigen: string[] = [];
    if (this.esAlumnoJornada()) {
      const oj = String(f.origenJornadaCap || '').trim();
      falta(!oj, 'origenJornadaCap', 'origen en jornada', jornadaOrigen);
      if (oj === 'colegio') {
        const tipoInst = this.normalizarNivelInstitucionUi(f.tipoInstitucionEducativa);
        const perfil =
          String(f.perfilInstitucionEducativa || '').trim() === 'profesor'
            ? 'profesor'
            : 'estudiante';
        falta(!tipoInst, 'tipoInstitucionEducativa', 'nivel (primaria…universidad)', jornadaOrigen);
        falta(vacio(f.colegioNombre), 'colegioNombre', 'institución educativa', jornadaOrigen);
        falta(!perfil, 'perfilInstitucionEducativa', 'perfil (estudiante o profesor)', jornadaOrigen);
        if (perfil === 'profesor') {
          falta(vacio(f.areaImparteColegio), 'areaImparteColegio', 'área que imparte', jornadaOrigen);
        } else if (tipoInst === 'primaria' || tipoInst === 'secundaria') {
          const g = Number(f.gradoColegio);
          const minG = tipoInst === 'primaria' ? 1 : 6;
          const maxG = tipoInst === 'primaria' ? 5 : 11;
          falta(
            !Number.isFinite(g) || g < minG || g > maxG,
            'gradoColegio',
            tipoInst === 'primaria' ? 'curso (1–5)' : 'grado (6–11)',
            jornadaOrigen,
          );
        } else {
          const s = Number(f.semestreInstitucion);
          falta(
            !Number.isFinite(s) || s < 1 || s > 12,
            'semestreInstitucion',
            'semestre (1–12)',
            jornadaOrigen,
          );
          falta(
            vacio(f.programaInstitucion) && vacio(f.titulacionCodigo),
            'programaInstitucion',
            'titulación / programa',
            jornadaOrigen,
          );
        }
      } else if (oj === 'estamento') {
        falta(vacio(f.estamentoId) && vacio(f.estamentoNombre), 'estamentoId', 'estamento público', jornadaOrigen);
        falta(vacio(f.cargoEstamento), 'cargoEstamento', 'cargo', jornadaOrigen);
        falta(vacio(f.dependenciaEstamento), 'dependenciaEstamento', 'dependencia', jornadaOrigen);
      } else if (oj === 'empresa') {
        falta(vacio(f.empresaId), 'empresaId', 'empresa', jornadaOrigen);
      }
    }

    if (this.gestoresEmpresasActivo() && !this.esAlumnoJornada() && f.manejoGestorEmpresa) {
      const ref: string[] = [];
      const tipo = String(f.tipoReferidorComercial || '').trim();
      falta(tipo !== 'gestor' && tipo !== 'empresa', 'tipoReferidorComercial', 'tipo (gestor o empresa)', ref);
      if (tipo === 'gestor') {
        falta(vacio(f.gestorId), 'gestorId', 'gestor', ref);
      } else if (tipo === 'empresa') {
        falta(vacio(f.referidorEmpresaId), 'referidorEmpresaId', 'empresa referidora', ref);
      }
      if (ref.length) {
        faltantes.push({ seccion: 'Gestor / empresa', campos: ref });
      }
    }

    if (identificacion.length) faltantes.push({ seccion: 'Identificación', campos: identificacion });
    if (personales.length) faltantes.push({ seccion: 'Datos personales', campos: personales });
    if (contacto.length) faltantes.push({ seccion: 'Contacto y ubicación', campos: contacto });
    if (diversidad.length) faltantes.push({ seccion: 'Origen y diversidad', campos: diversidad });
    if (jornadaOrigen.length) {
      faltantes.push({ seccion: 'Origen en jornada', campos: jornadaOrigen });
    }
    if (faltantes.length) {
      this.camposObligatoriosInvalidos.set(invalidos);
      return `Complete todos los campos obligatorios. ${faltantes
        .map((grupo) => `${grupo.seccion}: ${grupo.campos.join(', ')}`)
        .join(' · ')}`;
    }

    const correo = String(f.correo || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(correo)) {
      this.camposObligatoriosInvalidos.set(['correo']);
      return 'Ingrese un correo electrónico válido.';
    }
    const errCel = mensajeErrorCelularAlmacenado(f.celular);
    if (errCel) {
      this.camposObligatoriosInvalidos.set(['celular']);
      return errCel;
    }
    this.camposObligatoriosInvalidos.set([]);
    return null;
  }

  guardar() {
    const tipoForm = normalizarTipoAlumno(this.form().tipoAlumno);
    const tipoBd = normalizarTipoAlumno(this.store.alumno()?.tipoAlumno);
    const cambioTipo = this.isEdit() && tipoForm !== tipoBd;

    const f = { ...this.form(), tipoAlumno: tipoForm };
    if (!f.expedida?.trim() && this.expedidaTexto().trim()) {
      f.expedida = this.expedidaTexto().trim();
    }
    const errorObligatorios = this.validarSeccionesObligatorias(f);
    if (errorObligatorios) {
      this.dispararAlertaGuardar(errorObligatorios);
      return;
    }
    if (this.isEdit() && !this.formSinGuardar() && !cambioTipo) {
      this.dispararAlertaGuardar('No hay cambios pendientes por guardar.');
      return;
    }
    const nd = parseNumDocForApi(f.numDoc);
    if (nd == null) return;

    if (this.isEdit()) {
      this.ejecutarGuardado(f);
      return;
    }

    this.saving.set(true);
    this.message.set(null);
    this.alumnoSvc.verificarDocumento(nd).subscribe({
      next: (r) => {
        if (r.existe && r._id) {
          this.saving.set(false);
          this.docDuplicado.set({
            _id: String(r._id),
            nombreCompleto: r.nombreCompleto,
          });
          this.message.set(
            `No se puede crear: el documento ${formatNumDoc(nd)} ya pertenece a otro alumno. Use «Abrir registro».`,
          );
          return;
        }
        this.docDuplicado.set(null);
        this.ejecutarGuardado(f);
      },
      error: () => {
        this.saving.set(false);
        this.message.set('No se pudo verificar el documento. Intente de nuevo.');
      },
    });
  }

  private ejecutarGuardado(f: AlumnoDto) {
    this.saving.set(true);
    this.message.set(null);
    const files = { foto: this.fotoFile() || undefined };
    const payload = this.toPayload(f);
    const creando = !this.isEdit();
    const obs = creando
      ? this.alumnoSvc.crear(payload, files)
      : this.alumnoSvc.actualizar(f._id!, payload, files);

    obs.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.store.setAlumno(saved);
        if (creando) {
          void this.confirmarCreacionAlumno(saved).then(() => {
            void this.mostrarPortalAccesoSiAplica(saved);
            if (saved._id) {
              void this.router.navigate([this.rutasAlumno().ficha(String(saved._id))], {
                replaceUrl: true,
              });
            }
          });
          return;
        }
        const mapped = this.mapDesdeBd(saved as AlumnoDto & Record<string, unknown>);
        this.form.set(mapped);
        this.formDirty.set(false);
        this.lastAlumnoSyncKey = `${String(saved._id)}|${String(saved.fechaMod ?? '')}`;
        this.munOrigenCodResuelto = String(mapped.codMunicipio || mapped.munOrigen || '').trim();
        this.lineaBase.set(this.firmaEstadoActual(mapped, false));
        this.fotoFile.set(null);
        this.store.setDatosSinGuardar(false);
        this.message.set('Datos guardados correctamente.');
        void this.mostrarPortalAccesoSiAplica(saved);
      },
      error: (err) => {
        this.saving.set(false);
        const body = err?.error;
        if (err?.status === 409 && body?.existingId) {
          this.docDuplicado.set({
            _id: String(body.existingId),
            nombreCompleto: body.nombreCompleto,
          });
          this.message.set(body.message || 'Ese número de documento ya está registrado.');
          return;
        }
        this.message.set(body?.message || 'Error al guardar.');
      },
    });
  }

  private async mostrarPortalAccesoSiAplica(saved: AlumnoDto) {
    const pa = saved.portalAcceso;
    if (!pa) return;

    if (pa.creado && pa.password && pa.email) {
      const correoLinea = pa.correoEnviado
        ? `También se envió un correo a ${pa.email} con estos datos.`
        : pa.correoError
          ? `No se pudo enviar el correo (${pa.correoError}). Anote la clave.`
          : `No hay SMTP configurado: anote la clave y entréguesela al alumno.`;
      await this.confirm.open({
        title: 'Acceso al aula virtual creado',
        message:
          `Usuario (correo): ${pa.email}\n` +
          `Contraseña temporal: ${pa.password}\n\n` +
          `${correoLinea}`,
        variant: 'success',
        confirmLabel: 'Entendido',
        cancelLabel: 'Cerrar',
      });
      this.message.set(pa.message || 'Acceso al aula virtual creado.');
      return;
    }

    if (pa.pendienteCorreo || pa.conflicto) {
      await this.confirm.open({
        title: 'Acceso al portal',
        message: pa.message || 'Revise el correo del alumno o Usuarios portal.',
        variant: 'warn',
        confirmLabel: 'Entendido',
        cancelLabel: 'Cerrar',
      });
      this.message.set(pa.message || null);
    }
  }

  private dispararAlertaGuardar(texto: string) {
    this.message.set(texto);
    this.saveAlarmFlash.set(true);
    setTimeout(() => this.saveAlarmFlash.set(false), 3200);
  }

  private firmaEstadoActual(f?: AlumnoDto, fotoNueva = !!this.fotoFile()): string {
    const src = f ?? this.form();
    const payload = this.toPayload({
      ...src,
      expedida: src.expedida?.trim() || this.expedidaTexto().trim() || '',
      munOrigen: src.munOrigen || src.codMunicipio || '',
      codMunicipio: src.codMunicipio || src.munOrigen || '',
      codDepartamento: src.codDepartamento || '',
      nombreDepartamento: src.nombreDepartamento || '',
      nombreMunicipio: src.nombreMunicipio || '',
    });
    return JSON.stringify({ ...payload, fotoNueva });
  }

  private tieneDatosDigitados(): boolean {
    const f = this.form();
    if (parseNumDocForApi(f.numDoc) != null) return true;
    if (String(f.nombre1 || '').trim()) return true;
    if (String(f.apellido1 || '').trim()) return true;
    if (String(f.nombre2 || '').trim()) return true;
    if (String(f.apellido2 || '').trim()) return true;
    if (String(f.correo || '').trim()) return true;
    if (String(f.celular || '').trim()) return true;
    if (String(f.direccion || '').trim()) return true;
    if (this.fotoFile()) return true;
    if (this.scanFile()) return true;
    return false;
  }

  private async confirmarCreacionAlumno(saved: AlumnoDto) {
    let cfg = this.configRecibo();
    if (!cfg) {
      try {
        cfg = await firstValueFrom(this.configSvc.obtenerRecibo());
        this.configRecibo.set(cfg);
      } catch {
        cfg = {};
      }
    }

    const nombre = nombreCompletoAlumno(saved);
    const numDoc = formatNumDoc(saved.numDoc);
    const empresa = cfg?.nombreEmpresa?.trim() || 'ARGO';
    const sloganRaw = cfg?.slogan1?.trim() || '';
    const slogan = sloganRaw ? `\n\n${sloganRaw}` : '';
    const vars = {
      nombre,
      numDoc,
      empresa,
      slogan,
      ciudad: cfg?.ciudad?.trim() || '',
      telefono: cfg?.telefono?.trim() || '',
    };

    const tituloDefault = '¡Alumno registrado!';
    const mensajeDefault =
      'Se registró correctamente a {nombre} con documento {numDoc}.\n\nBienvenido(a) a {empresa}.{slogan}';

    const title = aplicarPlantillaMensaje(
      cfg?.mensajeCreacionAlumnoTitulo?.trim() || tituloDefault,
      vars,
    );
    const message = aplicarPlantillaMensaje(
      cfg?.mensajeCreacionAlumno?.trim() || mensajeDefault,
      vars,
    );

    await this.confirm.open({
      title,
      message,
      variant: 'success',
      icon: 'check',
      confirmLabel: 'Aceptar',
      hideCancel: true,
    });
  }



  /** Solo campos del esquema datosAlumnos (sin auditoría de solo lectura) */

  private toPayload(f: AlumnoDto): AlumnoDto & { esJornadaCap?: string } {

    const esJornada = this.esAlumnoJornada();

    return {

      ...(esJornada && !this.isEdit() ? { esJornadaCap: 'true' } : {}),

      tipoAlumno: this.isEdit()
        ? normalizarTipoAlumno(f.tipoAlumno)
        : esJornada
          ? TIPO_JORNADAS_CAPACITACION
          : normalizarTipoAlumno(undefined),

      tipoDoc: f.tipoDoc,

      numDoc: parseNumDocForApi(f.numDoc) ?? f.numDoc,

      expedida: nombreEnMayusculas(f.expedida),

      apellido1: nombreEnMayusculas(f.apellido1),

      apellido2: nombreEnMayusculas(f.apellido2),

      nombre1: nombreEnMayusculas(f.nombre1),

      nombre2: nombreEnMayusculas(f.nombre2),

      fechaNac: f.fechaNac,

      observaciones: nombreEnMayusculas(f.observaciones),

      genero: f.genero,

      tipoSangre: f.tipoSangre,

      jornada: f.jornada,

      estadoCivil: f.estadoCivil,

      estrato: f.estrato,

      regimenSalud: f.regimenSalud,

      nivelFormacion: f.nivelFormacion,

      ocupacion: f.ocupacion,

      discapacidad: f.discapacidad,
      munOrigen: f.munOrigen || f.codMunicipio,
      codMunicipio: f.codMunicipio || f.munOrigen,
      codDepartamento: f.codDepartamento || '',
      nombreDepartamento: f.nombreDepartamento || '',
      nombreMunicipio: f.nombreMunicipio || '',
      correo: nombreEnMayusculas(f.correo),
      direccion: nombreEnMayusculas(f.direccion),
      celular: f.celular,
      multiCulturalidad: f.multiCulturalidad,

      urlFoto: f.urlFoto,

      empresaId: f.empresaId ?? null,

      ...(!esJornada
        ? {
            manejoGestorEmpresa: f.manejoGestorEmpresa === true,
            tipoReferidorComercial:
              f.manejoGestorEmpresa && f.tipoReferidorComercial ? f.tipoReferidorComercial : null,
            gestorId:
              f.manejoGestorEmpresa && f.tipoReferidorComercial === 'gestor' ? f.gestorId ?? null : null,
            gestorNombre:
              f.manejoGestorEmpresa && f.tipoReferidorComercial === 'gestor'
                ? f.gestorNombre ?? null
                : null,
            referidorEmpresaId:
              f.manejoGestorEmpresa && f.tipoReferidorComercial === 'empresa'
                ? f.referidorEmpresaId ?? null
                : null,
            referidorEmpresaNombre:
              f.manejoGestorEmpresa && f.tipoReferidorComercial === 'empresa'
                ? f.referidorEmpresaNombre ?? null
                : null,
          }
        : {}),

      alertaPagoFrecuencia: f.alertaPagoFrecuencia || '',
      alertaPago: f.alertaPago || '',

      ...(esJornada
        ? {
            origenJornadaCap: f.origenJornadaCap || 'operativo',
            ...(f.origenJornadaCap === 'colegio'
              ? {
                  tipoInstitucionEducativa:
                    this.normalizarNivelInstitucionUi(f.tipoInstitucionEducativa) || 'secundaria',
                  perfilInstitucionEducativa:
                    f.perfilInstitucionEducativa === 'profesor' ? 'profesor' : 'estudiante',
                  colegioCodigo: f.colegioCodigo || null,
                  colegioNombre: f.colegioNombre || null,
                  ...(f.perfilInstitucionEducativa === 'profesor'
                    ? { areaImparteColegio: f.areaImparteColegio || null }
                    : this.esNivelBasicaMediaUi()
                      ? { gradoColegio: f.gradoColegio ?? null }
                      : {
                          semestreInstitucion: f.semestreInstitucion ?? null,
                          titulacionCodigo: f.titulacionCodigo || null,
                          programaInstitucion: f.programaInstitucion || null,
                        }),
                }
              : {}),
            ...(f.origenJornadaCap === 'estamento'
              ? {
                  estamentoId: f.estamentoId || null,
                  estamentoNombre: f.estamentoNombre || null,
                  cargoEstamento: f.cargoEstamento || null,
                  dependenciaEstamento: f.dependenciaEstamento || null,
                }
              : {}),
          }
        : {}),

    };

  }



  toUrl(name: string) {

    if (!name) return '';

    if (name.startsWith('http')) return name;

    return `${this.uploads}/${name}`;

  }



  private sincronizarDesdeAlumno(src?: AlumnoDto | null): void {
    // No sobrescribir mientras el usuario edita (p. ej. cambio de tipo de alumno).
    if (this.formDirty()) return;

    const a = src !== undefined ? src : this.alumno() ?? this.store.alumno();
    if (a?._id || (a?.numDoc != null && String(a.numDoc).trim() !== '')) {
      this.aplicarAlumnoEnForm(a as AlumnoDto & Record<string, unknown>);
    } else if (!a) {
      this.form.set(this.emptyForm());
      this.expedidaTexto.set('');
      this.munOrigenTexto.set('');
      this.deptoOrigenTexto.set('');
      this.fotoPreview.set(null);
      this.scanVisible.set(true);
      this.scanApplied.set(false);
      this.scanPreview.set(null);
      this.scanFile.set(null);
      this.scanWarnings.set([]);
      this.lineaBase.set('');
      this.formDirty.set(false);
    }
    this.store.setDatosSinGuardar(this.formDirty());
  }

  private aplicarAlumnoEnForm(raw: AlumnoDto & Record<string, unknown>): void {
    const mapped = this.mapDesdeBd(raw);
    this.form.set(mapped);
    this.expedidaTexto.set(mapped.expedida || '');
    this.sincronizarTextoDeptoOrigen();
    this.resolverTextoMunOrigen(mapped.codMunicipio || mapped.munOrigen);
    this.fotoPreview.set(mapped.urlFoto ? this.toUrl(mapped.urlFoto) : null);
    this.fotoFile.set(null);
    this.docDuplicado.set(null);
    this.scanVisible.set(false);
    this.scanApplied.set(false);
    this.scanPreview.set(null);
    this.scanFile.set(null);
    this.scanWarnings.set([]);
    this.formDirty.set(false);
    this.lineaBase.set(this.firmaEstadoActual(mapped, false));
  }

  /** Campos legacy nombres/apellidos (un solo string) → nombre1/nombre2, apellido1/apellido2 */
  private partirNombreLegacy(s: string): { p1: string; p2: string } {
    const partes = String(s || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!partes.length) return { p1: '', p2: '' };
    return { p1: partes[0], p2: partes.slice(1).join(' ') };
  }

  private mapDesdeBd(raw: AlumnoDto & Record<string, unknown>): AlumnoDto {
    let nombre1 = String(raw.nombre1 || '');
    let nombre2 = String(raw.nombre2 || '');
    if (!nombre1.trim() && raw['nombres']) {
      const n = this.partirNombreLegacy(String(raw['nombres']));
      nombre1 = n.p1;
      nombre2 = n.p2 || nombre2;
    }
    let apellido1 = String(raw.apellido1 || '');
    let apellido2 = String(raw.apellido2 || '');
    if (!apellido1.trim() && raw['apellidos']) {
      const ap = this.partirNombreLegacy(String(raw['apellidos']));
      apellido1 = ap.p1;
      apellido2 = ap.p2 || apellido2;
    }

    return {

      _id:
        raw._id != null
          ? String(raw._id)
          : raw['id'] != null
            ? String(raw['id'])
            : raw['idAlumno'] != null
              ? String(raw['idAlumno'])
              : undefined,

      fechaReg: raw.fechaReg as string,

      tipoAlumno: normalizarTipoAlumno(String(raw.tipoAlumno || '')),

      origen: normalizarOrigenAlumno(String(raw.origen || '')),

      tipoDoc: normalizarEnum(String(raw.tipoDoc || '1')),

      numDoc: formatNumDoc(raw.numDoc),

      expedida: nombreEnMayusculas(String(raw.expedida || '')),

      apellido1: nombreEnMayusculas(apellido1),

      apellido2: nombreEnMayusculas(apellido2),

      nombre1: nombreEnMayusculas(nombre1),

      nombre2: nombreEnMayusculas(nombre2),

      fechaNac: fechaInput(raw.fechaNac as string),

      observaciones: nombreEnMayusculas(String(raw.observaciones || '')),

      genero: String(raw.genero || '').toUpperCase(),

      tipoSangre: String(raw.tipoSangre || '').toUpperCase(),

      jornada: normalizarEnum(String(raw.jornada || '')),

      estadoCivil: normalizarEnum(String(raw.estadoCivil || '')),

      estrato: normalizarEnum(String(raw.estrato || '')),

      regimenSalud: normalizarEnum(String(raw.regimenSalud || '')),

      nivelFormacion: normalizarEnum(String(raw.nivelFormacion || '')),

      ocupacion: normalizarEnum(String(raw.ocupacion || '')),

      discapacidad: normalizarEnum(String(raw.discapacidad || '9')),
      munOrigen: String(raw.munOrigen || raw.codMunicipio || ''),
      codMunicipio: String(raw.codMunicipio || raw.munOrigen || ''),
      codDepartamento: String(raw.codDepartamento || raw['codDepto'] || '')
        .replace(/\D/g, '')
        .padStart(2, '0')
        .replace(/^00$/, ''),
      nombreDepartamento: String(
        raw.nombreDepartamento || raw['nombreDepto'] || '',
      ).trim(),
      nombreMunicipio: String(raw.nombreMunicipio || '').trim(),
      correo: nombreEnMayusculas(String(raw.correo || '')),
      direccion: nombreEnMayusculas(String(raw.direccion || '')),
      celular: String(raw.celular || ''),
      multiCulturalidad: String(raw.multiCulturalidad || 'NO_APLICA').toUpperCase(),

      urlFoto: String(raw.urlFoto || (raw['foto'] as string) || ''),

      fechaAudi: raw.fechaAudi as string,

      userAddReg: String(raw.userAddReg || ''),

      userChangeRecord: String(raw.userChangeRecord || ''),

      fechaMod: raw.fechaMod as string,

      empresaId: raw['empresaId'] ? String(raw['empresaId']) : null,
      empresaNombre: raw['empresaNombre'] ? String(raw['empresaNombre']) : null,
      manejoGestorEmpresa: raw['manejoGestorEmpresa'] === true,
      tipoReferidorComercial:
        raw['tipoReferidorComercial'] === 'gestor' || raw['tipoReferidorComercial'] === 'empresa'
          ? raw['tipoReferidorComercial']
          : null,
      gestorId: raw['gestorId'] ? String(raw['gestorId']) : null,
      gestorNombre: raw['gestorNombre'] ? String(raw['gestorNombre']) : null,
      referidorEmpresaId: raw['referidorEmpresaId'] ? String(raw['referidorEmpresaId']) : null,
      referidorEmpresaNombre: raw['referidorEmpresaNombre']
        ? String(raw['referidorEmpresaNombre'])
        : null,

      origenJornadaCap: raw['origenJornadaCap']
        ? String(raw['origenJornadaCap']).trim().toLowerCase()
        : null,
      tipoInstitucionEducativa: raw['tipoInstitucionEducativa']
        ? this.normalizarNivelInstitucionUi(String(raw['tipoInstitucionEducativa']))
        : null,
      perfilInstitucionEducativa:
        String(raw['perfilInstitucionEducativa'] || '')
          .trim()
          .toLowerCase() === 'profesor'
          ? 'profesor'
          : raw['origenJornadaCap']
            ? 'estudiante'
            : null,
      colegioCodigo: raw['colegioCodigo'] ? String(raw['colegioCodigo']) : null,
      colegioNombre: raw['colegioNombre'] ? String(raw['colegioNombre']) : null,
      gradoColegio:
        raw['gradoColegio'] != null && String(raw['gradoColegio']).trim() !== ''
          ? Number(raw['gradoColegio'])
          : null,
      semestreInstitucion:
        raw['semestreInstitucion'] != null && String(raw['semestreInstitucion']).trim() !== ''
          ? Number(raw['semestreInstitucion'])
          : null,
      titulacionCodigo: raw['titulacionCodigo'] ? String(raw['titulacionCodigo']) : null,
      areaImparteColegio: raw['areaImparteColegio']
        ? String(raw['areaImparteColegio']).trim().toLowerCase()
        : null,
      programaInstitucion: raw['programaInstitucion'] ? String(raw['programaInstitucion']) : null,
      estamentoId: raw['estamentoId'] ? String(raw['estamentoId']) : null,
      estamentoNombre: raw['estamentoNombre'] ? String(raw['estamentoNombre']) : null,
      cargoEstamento: raw['cargoEstamento'] ? String(raw['cargoEstamento']) : null,
      dependenciaEstamento: raw['dependenciaEstamento']
        ? String(raw['dependenciaEstamento'])
        : null,

      alertaPagoFrecuencia:
        raw['alertaPagoFrecuencia'] === 'quincenal' || raw['alertaPagoFrecuencia'] === 'mensual'
          ? raw['alertaPagoFrecuencia']
          : '',
      alertaPago: raw['alertaPago'] ? String(raw['alertaPago']).slice(0, 10) : null,

    };

  }



  private emptyForm(): AlumnoDto {
    const esJornada =
      this.modo() === 'jornadas' ||
      DatosPrincipalesComponent.esJornadaDesdeQuery(this.route.snapshot.queryParamMap);
    const origenJ = esJornada
      ? DatosPrincipalesComponent.normalizarOrigenJornadaQuery(
          this.route.snapshot.queryParamMap.get('origenJornadaCap') ||
            this.route.snapshot.queryParamMap.get('origen'),
        ) || 'operativo'
      : null;

    return {

      tipoAlumno: esJornada ? TIPO_JORNADAS_CAPACITACION : normalizarTipoAlumno(undefined),

      origen: ORIGEN_SISTEMA,

      origenJornadaCap: origenJ,

      tipoInstitucionEducativa: origenJ === 'colegio' ? 'secundaria' : null,
      perfilInstitucionEducativa: origenJ === 'colegio' ? 'estudiante' : null,
      colegioCodigo: null,
      colegioNombre: null,
      gradoColegio: null,
      semestreInstitucion: null,
      titulacionCodigo: null,
      areaImparteColegio: null,
      programaInstitucion: null,
      estamentoId: null,
      estamentoNombre: null,
      cargoEstamento: null,
      dependenciaEstamento: null,

      tipoDoc: '1',

      numDoc: '',

      expedida: '',

      apellido1: '',

      apellido2: '',

      nombre1: '',

      nombre2: '',

      fechaNac: '',

      observaciones: '',

      genero: '',

      tipoSangre: '',

      jornada: '',

      estadoCivil: '',

      estrato: '',

      regimenSalud: '',

      nivelFormacion: '',

      ocupacion: '',

      discapacidad: '',
      munOrigen: '',
      codMunicipio: '',
      codDepartamento: '',
      nombreDepartamento: '',
      nombreMunicipio: '',
      correo: '',
      direccion: '',
      celular: '',
      multiCulturalidad: '',

      urlFoto: '',

      alertaPagoFrecuencia: '',
      alertaPago: null,

      manejoGestorEmpresa: false,
      tipoReferidorComercial: null,
      gestorId: null,
      gestorNombre: null,
      referidorEmpresaId: null,
      referidorEmpresaNombre: null,

    };

  }

}


