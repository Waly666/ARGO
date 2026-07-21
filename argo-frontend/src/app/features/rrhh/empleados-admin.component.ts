import { CommonModule } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  Empleado,
  EmpleadoDto,
  EmpleadoService,
  ModoAccesoEmpleado,
  normalizarEstadoEmpleado,
} from '../../core/services/empleado.service';
import { RrhhCatalogService } from '../../core/services/rrhh-catalog.service';
import { Usuario, UsuarioService } from '../../core/services/usuario.service';
import { loginMostrable } from '../../core/utils/usuario-login.helpers';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { AuthService } from '../../core/services/auth.service';
import { SedeDto, SedeService } from '../../core/services/sede.service';
import { ConfigService } from '../../core/services/config.service';
import { inicialesNombre, readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import { environment } from '../../../environments/environment';
import { EmpleadoDocumentosPanelComponent } from './empleado-documentos-panel.component';
import { EmpleadoEvaluacionesPanelComponent } from './empleado-evaluaciones-panel.component';
import { EmpleadoAnotacionesPanelComponent } from './empleado-anotaciones-panel.component';
import { CelularInputComponent } from '../../shared/celular-input/celular-input.component';
import { mensajeErrorCelularAlmacenado } from '../../core/utils/celular.util';
import { MunicipioBuscarComponent } from '../alumnos/municipio-buscar.component';
import { CatalogoEnumBuscarComponent, EnumBuscarOption } from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { CatalogoService, MunicipioDivipola } from '../../core/services/catalogo.service';
import { abrirHojaVidaEmpleadoPdf, buildHojaVidaEmpleadoHtml } from './hoja-vida-empleado-print';
import {
  GENEROS_DEF,
  TIPO_SANGRE_DEF,
  ESTADOS_CIVIL_DEF,
  ESTRATOS_DEF,
  REGIMEN_SALUD_DEF,
  NIVEL_FORMACION_DEF,
  OCUPACIONES_DEF,
  DISCAPACIDADES_DEF,
  MULTICULTURALIDAD_DEF,
  catValor,
  catEtiqueta,
  normalizarEnum,
  normalizarGenero,
} from '../alumnos/catalogo.helpers';

type FormSeccion = 'datos' | 'documentos' | 'evaluaciones' | 'anotaciones';

function mapOpcionesCatalogo(items: Record<string, unknown>[]): EnumBuscarOption[] {
  return items.map((item) => ({ value: catValor(item), label: catEtiqueta(item) }));
}

function etiquetaDeCatalogo(items: Record<string, unknown>[], valor?: string | null): string {
  const v = String(valor ?? '').trim();
  if (!v) return '';
  const norm = normalizarEnum(v);
  const hit = items.find((i) => {
    const cv = catValor(i);
    return cv === v || cv === norm || catEtiqueta(i).toUpperCase() === v.toUpperCase();
  });
  return hit ? catEtiqueta(hit) : v;
}

function sexoDesdeGenero(genero?: string | null): string {
  const g = normalizarGenero(genero || '');
  if (g === 'M') return 'Masculino';
  if (g === 'F') return 'Femenino';
  return '';
}

const NIVELES_EDUCATIVOS: EnumBuscarOption[] = [
  { value: 'Bachiller', label: 'Bachiller' },
  { value: 'Técnico', label: 'Técnico' },
  { value: 'Tecnólogo', label: 'Tecnólogo' },
  { value: 'Universitario', label: 'Universitario' },
  { value: 'Maestría', label: 'Maestría' },
  { value: 'Doctorado', label: 'Doctorado' },
];

@Component({
  selector: 'argo-empleados-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EmpleadoDocumentosPanelComponent,
    EmpleadoEvaluacionesPanelComponent,
    EmpleadoAnotacionesPanelComponent,
    ArgoDateInputComponent,
    CelularInputComponent,
    MunicipioBuscarComponent,
    CatalogoEnumBuscarComponent,
  ],
  templateUrl: './empleados-admin.component.html',
  styleUrls: ['./empleados-admin.component.scss', './rrhh-catalog-admin.component.scss', './rrhh-shared.scss'],
})
export class EmpleadosAdminComponent implements OnInit {
  private svc = inject(EmpleadoService);
  private cat = inject(RrhhCatalogService);
  private catDivipola = inject(CatalogoService);
  private usuarioSvc = inject(UsuarioService);
  private confirm = inject(ConfirmDialogService);
  private auth = inject(AuthService);
  private sedeSvc = inject(SedeService);
  private route = inject(ActivatedRoute);
  private cfgSvc = inject(ConfigService);

  uploads = environment.uploadsUrl;
  fotoFile = signal<File | null>(null);
  fotoPreview = signal<string | null>(null);
  exportandoHv = signal(false);

  empleados = signal<Empleado[]>([]);
  cargos = signal<any[]>([]);
  departamentos = signal<any[]>([]);
  eps = signal<any[]>([]);
  afp = signal<any[]>([]);
  arl = signal<any[]>([]);
  cajas = signal<any[]>([]);
  sedes = signal<SedeDto[]>([]);
  usuarios = signal<Usuario[]>([]);

  modoAcceso = signal<ModoAccesoEmpleado>('auto');
  idUsuarioVincular = signal('');

  cargoSeleccionado = computed(() => {
    const id = this.form().cargoId;
    if (!id) return null;
    return this.cargos().find((c) => Number(c.idCargo) === Number(id)) ?? null;
  });

  cargoSugiereAcceso = computed(() => {
    const n = String(this.cargoSeleccionado()?.nombre || '').toLowerCase();
    return /\bcajer/i.test(n) || /\binstructor/i.test(n);
  });

  /** Usuarios que se pueden vincular: sin empleado activo o ya ligados al empleado en edición. */
  usuariosDisponibles = computed(() => {
    const ed = this.editando();
    const edId = ed?.idEmpleado != null ? Number(ed.idEmpleado) : null;
    return this.usuarios().filter((u) => {
      const uid = this.usuarioId(u);
      const empVinculado = this.empleados().find(
        (e) =>
          (uid && String(e.idUsuario || '') === uid) ||
          (u.idEmpleado != null && Number(u.idEmpleado) === Number(e.idEmpleado)),
      );
      if (!empVinculado) return true;
      return edId != null && Number(empVinculado.idEmpleado) === edId;
    });
  });

  esAdmin = computed(() => this.auth.isAdmin());

  vinculoActual = computed(() => {
    const e = this.editando();
    if (!e?.usuarioLogin) return null;
    return { login: e.usuarioLogin, rol: e.usuarioRol || null };
  });

  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  busqueda = signal('');
  /** Por defecto se listan todos; el alta también valida contra retirados. */
  soloActivos = signal(false);
  vista = signal<VistaLista>(readVistaLista('argo-empleados-vista'));
  editando = signal<Empleado | null>(null);
  mostrarForm = signal(false);
  formSeccion = signal<FormSeccion>('datos');

  readonly tiposDocumento = ['CC', 'CE', 'TI', 'PAS'];
  readonly estados = ['activo', 'retirado', 'suspendido'];
  readonly tiposContrato = ['indefinido', 'fijo', 'obra labor', 'aprendizaje'];
  readonly nivelesEducativos = NIVELES_EDUCATIVOS;

  readonly generosDef = GENEROS_DEF as unknown as Record<string, unknown>[];
  readonly tiposSangreDef = TIPO_SANGRE_DEF as unknown as Record<string, unknown>[];
  readonly estadosCivilDef = ESTADOS_CIVIL_DEF as unknown as Record<string, unknown>[];
  readonly estratosDef = ESTRATOS_DEF as unknown as Record<string, unknown>[];
  readonly regimenesSaludDef = REGIMEN_SALUD_DEF as unknown as Record<string, unknown>[];
  readonly nivelesFormacionDef = NIVEL_FORMACION_DEF as unknown as Record<string, unknown>[];
  readonly ocupacionesDef = OCUPACIONES_DEF as unknown as Record<string, unknown>[];
  readonly discapacidadesDef = DISCAPACIDADES_DEF as unknown as Record<string, unknown>[];
  readonly multiCulturalidadesDef = MULTICULTURALIDAD_DEF as unknown as Record<string, unknown>[];

  opcionesGenero = mapOpcionesCatalogo(this.generosDef);
  opcionesTipoSangre = mapOpcionesCatalogo(this.tiposSangreDef);
  opcionesEstadoCivil = mapOpcionesCatalogo(this.estadosCivilDef);
  opcionesEstrato = mapOpcionesCatalogo(this.estratosDef);
  opcionesRegimenSalud = mapOpcionesCatalogo(this.regimenesSaludDef);
  opcionesNivelFormacion = mapOpcionesCatalogo(this.nivelesFormacionDef);
  opcionesOcupacion = mapOpcionesCatalogo(this.ocupacionesDef);
  opcionesDiscapacidad = mapOpcionesCatalogo(this.discapacidadesDef);
  opcionesMultiCulturalidad = mapOpcionesCatalogo(this.multiCulturalidadesDef);

  form = signal<EmpleadoDto>(this.formVacio());
  /** Texto visible del municipio Divipola (ciudad + depto). */
  munResidenciaTexto = signal('');
  nivelEducativoTexto = signal('');

  etiquetaCatalogo = etiquetaDeCatalogo;

  puedeTituloProfesional = computed(() => {
    const n = String(this.form().nivelEducativo || '');
    return ['Técnico', 'Tecnólogo', 'Universitario', 'Maestría', 'Doctorado'].includes(n);
  });

  puedeEspecializacion = computed(() => {
    const n = String(this.form().nivelEducativo || '');
    return ['Universitario', 'Maestría', 'Doctorado'].includes(n);
  });

  puedeMaestria = computed(() => {
    const n = String(this.form().nivelEducativo || '');
    return n === 'Maestría' || n === 'Doctorado';
  });

  puedeDoctorado = computed(() => String(this.form().nivelEducativo || '') === 'Doctorado');

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarSedes();
    if (this.esAdmin()) this.cargarUsuarios();
    this.route.queryParamMap.subscribe(() => this.aplicarQueryEmpleado());
    this.cargar();
  }

  cargarUsuarios() {
    if (!this.esAdmin()) {
      this.usuarios.set([]);
      return;
    }
    this.usuarioSvc.listar().subscribe({
      next: (r) => this.usuarios.set(r || []),
      error: () => this.usuarios.set([]),
    });
  }

  formVacio(): EmpleadoDto {
    const principal = this.sedes().find((s) => s.esPrincipal) || this.sedes()[0];
    return {
      tipoDocumento: 'CC',
      numeroDocumento: '',
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      genero: '',
      tipoSangre: '',
      estadoCivil: '',
      estrato: '',
      regimenSalud: '',
      nivelFormacion: '',
      ocupacion: '',
      discapacidad: '9',
      multiCulturalidad: 'NO_APLICA',
      observaciones: '',
      estado: 'activo',
      idSede: principal?.idSede,
    };
  }

  cargarSedes() {
    this.sedeSvc.listar().subscribe({
      next: (r) => this.sedes.set((r || []).filter((s) => s.activa !== false)),
      error: () => {
        this.sedeSvc.listarMias().subscribe({
          next: (r) => this.sedes.set(r || []),
          error: () => this.sedes.set([]),
        });
      },
    });
  }

  cargarCatalogos() {
    this.cat.listar('cargos').subscribe({ next: (r) => this.cargos.set(r || []) });
    this.cat.listar('departamentos').subscribe({ next: (r) => this.departamentos.set(r || []) });
    this.cat.listar('eps').subscribe({ next: (r) => this.eps.set(r || []) });
    this.cat.listar('afp').subscribe({ next: (r) => this.afp.set(r || []) });
    this.cat.listar('arl').subscribe({ next: (r) => this.arl.set(r || []) });
    this.cat.listar('cajas-compensacion').subscribe({ next: (r) => this.cajas.set(r || []) });
  }

  cargar() {
    this.loading.set(true);
    const q = this.busqueda().trim();
    this.svc
      .listar({
        ...(q.length >= 2 ? { q } : {}),
        activos: this.soloActivos(),
      })
      .subscribe({
      next: (r) => {
        this.empleados.set(r || []);
        this.loading.set(false);
        this.aplicarQueryEmpleado();
      },
      error: (e) => {
        this.loading.set(false);
        this.inform(e?.error?.message || 'Error cargando empleados', true);
      },
    });
  }

  setVista(v: VistaLista) {
    this.vista.set(v);
    saveVistaLista('argo-empleados-vista', v);
  }

  iniciales(e: Empleado): string {
    return inicialesNombre(e.primerNombre, e.primerApellido);
  }

  fotoUrl(f?: string): string | null {
    if (!f) return null;
    if (f.startsWith('http')) return f;
    return `${this.uploads}/${f}`;
  }

  /** Genera PDF / impresión de la hoja de vida completa (datos + evaluaciones). */
  exportarHojaVida(empleadoOrId?: Empleado | number | null): void {
    const fromEdit = this.editando()?.idEmpleado;
    const id =
      typeof empleadoOrId === 'number'
        ? empleadoOrId
        : empleadoOrId?.idEmpleado ?? fromEdit;
    if (id == null) {
      this.inform('Abra la ficha de un empleado para generar la hoja de vida.', true);
      return;
    }
    this.exportandoHv.set(true);
    this.inform(null);
    const puedeEval = this.auth.tienePermiso(['rrhh.evaluaciones.ver', 'rrhh.evaluaciones.gestionar', 'rrhh', '*']);
    const puedeAnot = this.auth.tienePermiso(['rrhh.anotaciones.ver', 'rrhh.anotaciones.gestionar', 'rrhh', '*']);
    forkJoin({
      empleado: this.svc.obtener(id),
      documentos: this.svc.listarDocumentos(id).pipe(catchError(() => of([]))),
      evaluaciones: puedeEval
        ? this.svc.listarEvaluaciones(id).pipe(catchError(() => of([])))
        : of([]),
      anotaciones: puedeAnot
        ? this.svc.listarAnotaciones(id).pipe(catchError(() => of([])))
        : of([]),
      empresa: this.cfgSvc.obtenerReciboEncabezado().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ empleado, documentos, evaluaciones, anotaciones, empresa }) => {
        this.exportandoHv.set(false);
        const html = buildHojaVidaEmpleadoHtml({
          empleado,
          documentos: documentos || [],
          evaluaciones: evaluaciones || [],
          anotaciones: anotaciones || [],
          empresa,
          fotoUrl: this.fotoUrl(empleado.urlFoto),
        });
        if (!abrirHojaVidaEmpleadoPdf(html)) {
          this.inform('El navegador bloqueó la ventana de impresión/PDF. Permita pop-ups.', true);
        }
      },
      error: (e) => {
        this.exportandoHv.set(false);
        this.inform(e?.error?.message || 'No se pudo generar la hoja de vida.', true);
      },
    });
  }

  onFoto(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoFile.set(file);
    const r = new FileReader();
    r.onload = () => this.fotoPreview.set(r.result as string);
    r.readAsDataURL(file);
  }

  nuevo() {
    this.editando.set(null);
    this.formSeccion.set('datos');
    this.form.set(this.formVacio());
    this.munResidenciaTexto.set('');
    this.nivelEducativoTexto.set('');
    this.modoAcceso.set('auto');
    this.idUsuarioVincular.set('');
    if (this.esAdmin()) this.cargarUsuarios();
    this.fotoFile.set(null);
    this.fotoPreview.set(null);
    this.mostrarForm.set(true);
    this.inform(null);
  }

  editar(e: Empleado, seccion: FormSeccion = 'datos') {
    this.editando.set(e);
    this.formSeccion.set(seccion);
    if (this.esAdmin()) this.cargarUsuarios();
    this.form.set({
      tipoDocumento: e.tipoDocumento || 'CC',
      numeroDocumento: e.numeroDocumento || '',
      primerNombre: e.primerNombre || '',
      segundoNombre: e.segundoNombre || '',
      primerApellido: e.primerApellido || '',
      segundoApellido: e.segundoApellido || '',
      fechaNacimiento: e.fechaNacimiento ? String(e.fechaNacimiento).slice(0, 10) : '',
      sexo: e.sexo || '',
      genero: e.genero || normalizarGenero(e.sexo) || '',
      tipoSangre: e.tipoSangre || '',
      correoPersonal: e.correoPersonal || '',
      correoCorporativo: e.correoCorporativo || '',
      telefono: e.telefono || '',
      celular: e.celular || '',
      direccion: e.direccion || '',
      ciudad: e.ciudad || '',
      departamento: e.departamento || '',
      estadoCivil: e.estadoCivil || '',
      estrato: e.estrato || '',
      regimenSalud: e.regimenSalud || '',
      nivelFormacion: e.nivelFormacion || '',
      ocupacion: e.ocupacion || '',
      discapacidad: e.discapacidad || '9',
      multiCulturalidad: e.multiCulturalidad || 'NO_APLICA',
      observaciones: e.observaciones || '',
      nivelEducativo: e.nivelEducativo || '',
      tituloProfesional: e.tituloProfesional || '',
      especializacion: e.especializacion || '',
      maestria: e.maestria || '',
      doctorado: e.doctorado || '',
      fechaIngreso: e.fechaIngreso ? String(e.fechaIngreso).slice(0, 10) : '',
      fechaRetiro: e.fechaRetiro ? String(e.fechaRetiro).slice(0, 10) : '',
      tipoContrato: e.tipoContrato || '',
      salario: e.salario,
      epsId: e.epsId,
      afpId: e.afpId,
      arlId: e.arlId,
      cajaCompensacionId: e.cajaCompensacionId,
      cargoId: e.cargoId,
      departamentoId: e.departamentoId,
      idSede: e.idSede || undefined,
      estado: normalizarEstadoEmpleado(e.estado),
    });
    this.nivelEducativoTexto.set(e.nivelEducativo || '');
    this.syncMunResidenciaTexto(e.ciudad, e.departamento);
    if (e.idUsuario) {
      this.modoAcceso.set('vincular');
      this.idUsuarioVincular.set(String(e.idUsuario));
    } else {
      this.modoAcceso.set('ninguno');
      this.idUsuarioVincular.set('');
    }
    this.fotoFile.set(null);
    this.fotoPreview.set(e.urlFoto ? this.fotoUrl(e.urlFoto) : null);
    this.mostrarForm.set(true);
    this.inform(null);
  }

  onMunResidenciaSel(m: MunicipioDivipola): void {
    this.munResidenciaTexto.set(m.label);
    this.form.update((f) => ({
      ...f,
      ciudad: m.nombreMunicipio,
      departamento: m.nombreDepto,
    }));
  }

  onMunResidenciaLimpiar(): void {
    this.munResidenciaTexto.set('');
    this.form.update((f) => ({ ...f, ciudad: '', departamento: '' }));
  }

  private syncMunResidenciaTexto(ciudad?: string | null, departamento?: string | null): void {
    const c = String(ciudad || '').trim();
    const d = String(departamento || '').trim();
    if (!c && !d) {
      this.munResidenciaTexto.set('');
      return;
    }
    const label = d ? `${c} - ${d}` : c;
    this.munResidenciaTexto.set(label);
    if (!c) return;
    this.catDivipola.buscarMunicipios(c, 12).subscribe({
      next: (rows) => {
        const hit =
          rows.find(
            (r) =>
              r.nombreMunicipio.toUpperCase() === c.toUpperCase() &&
              (!d || r.nombreDepto.toUpperCase() === d.toUpperCase()),
          ) || rows.find((r) => r.nombreMunicipio.toUpperCase() === c.toUpperCase());
        if (hit) this.munResidenciaTexto.set(hit.label);
      },
    });
  }

  private aplicarQueryEmpleado(): void {
    const idRaw = this.route.snapshot.queryParamMap.get('empleado');
    if (!idRaw) return;
    const emp = this.empleados().find((e) => String(e.idEmpleado) === idRaw);
    if (!emp) return;
    const seccionRaw = this.route.snapshot.queryParamMap.get('seccion');
    const seccion: FormSeccion =
      seccionRaw === 'documentos'
        ? 'documentos'
        : seccionRaw === 'evaluaciones'
          ? 'evaluaciones'
          : seccionRaw === 'anotaciones'
            ? 'anotaciones'
            : 'datos';
    this.editar(emp, seccion);
  }

  onCargoChange(raw: number | null | undefined) {
    const id = raw == null || Number.isNaN(Number(raw)) ? undefined : Number(raw);
    this.patch('cargoId', id);
    if (!this.editando()?.idUsuario && this.modoAcceso() !== 'vincular') {
      this.modoAcceso.set(this.cargoSugiereAcceso() ? 'auto' : 'ninguno');
    }
  }

  usuarioId(u: Usuario): string {
    return String(u._id ?? '');
  }

  labelUsuario(u: Usuario): string {
    const nom = [u.nombres, u.apellidos].filter(Boolean).join(' ').trim();
    const login = loginMostrable(u);
    const rol = u.rol ? ` · ${u.rol}` : '';
    return nom ? `${login} — ${nom}${rol}` : `${login}${rol}`;
  }

  setModoAcceso(m: ModoAccesoEmpleado) {
    if (m === 'vincular' && !this.esAdmin()) return;
    this.modoAcceso.set(m);
    if (m !== 'vincular') this.idUsuarioVincular.set('');
  }

  cancelar() {
    this.mostrarForm.set(false);
    this.editando.set(null);
    this.formSeccion.set('datos');
    this.munResidenciaTexto.set('');
    this.nivelEducativoTexto.set('');
  }

  onNivelEducativoSel(opt: EnumBuscarOption): void {
    const nivel = String(opt.value || '');
    this.nivelEducativoTexto.set(opt.label || nivel);
    this.form.update((f) => {
      const next: EmpleadoDto = { ...f, nivelEducativo: nivel };
      if (!['Técnico', 'Tecnólogo', 'Universitario', 'Maestría', 'Doctorado'].includes(nivel)) {
        next.tituloProfesional = '';
      }
      if (!['Universitario', 'Maestría', 'Doctorado'].includes(nivel)) {
        next.especializacion = '';
      }
      if (nivel !== 'Maestría' && nivel !== 'Doctorado') {
        next.maestria = '';
      }
      if (nivel !== 'Doctorado') {
        next.doctorado = '';
      }
      return next;
    });
  }

  onNivelEducativoLimpiar(): void {
    this.nivelEducativoTexto.set('');
    this.form.update((f) => ({
      ...f,
      nivelEducativo: '',
      tituloProfesional: '',
      especializacion: '',
      maestria: '',
      doctorado: '',
    }));
  }

  setFormSeccion(sec: FormSeccion): void {
    if (
      (sec === 'documentos' || sec === 'evaluaciones' || sec === 'anotaciones') &&
      !this.editando()?.idEmpleado
    ) {
      return;
    }
    this.formSeccion.set(sec);
  }

  puedeDocumentos = computed(() => !!this.editando()?.idEmpleado);
  puedeVerEvaluaciones = computed(() =>
    this.auth.tienePermiso([
      'rrhh.evaluaciones.ver',
      'rrhh.evaluaciones.gestionar',
      'rrhh',
      '*',
    ]),
  );
  puedeVerAnotaciones = computed(() =>
    this.auth.tienePermiso([
      'rrhh.anotaciones.ver',
      'rrhh.anotaciones.gestionar',
      'rrhh',
      '*',
    ]),
  );

  patch<K extends keyof EmpleadoDto>(k: K, v: EmpleadoDto[K]) {
    this.form.update((f) => ({ ...f, [k]: v }));
  }

  onCatalogoPick<K extends keyof EmpleadoDto>(campo: K, opt: EnumBuscarOption): void {
    const valor = String(opt.value) as EmpleadoDto[K];
    if (campo === 'genero') {
      this.form.update((f) => ({
        ...f,
        genero: String(opt.value),
        sexo: sexoDesdeGenero(String(opt.value)) || f.sexo,
      }));
      return;
    }
    this.patch(campo, valor);
  }

  onCatalogoLimpiar<K extends keyof EmpleadoDto>(
    campo: K,
    valorVacio: EmpleadoDto[K] = '' as EmpleadoDto[K],
  ): void {
    if (campo === 'genero') {
      this.form.update((f) => ({ ...f, genero: '', sexo: '' }));
      return;
    }
    this.patch(campo, valorVacio);
  }

  guardar() {
    const f = this.form();
    if (!f.primerNombre?.trim() || !f.primerApellido?.trim()) {
      this.inform('Primer nombre y primer apellido son obligatorios.', true);
      return;
    }
    if (!f.numeroDocumento?.trim()) {
      this.inform('numeroDocumento es obligatorio (enlace con egresos).', true);
      return;
    }
    if (!f.idSede?.trim()) {
      this.inform('Seleccione la sede del empleado.', true);
      return;
    }
    const personalesObligatorios: { key: keyof EmpleadoDto; label: string }[] = [
      { key: 'genero', label: 'Género' },
      { key: 'tipoSangre', label: 'Tipo de sangre' },
      { key: 'estadoCivil', label: 'Estado civil' },
      { key: 'estrato', label: 'Estrato' },
      { key: 'regimenSalud', label: 'Régimen de salud' },
      { key: 'nivelFormacion', label: 'Nivel de formación' },
      { key: 'ocupacion', label: 'Ocupación' },
    ];
    for (const c of personalesObligatorios) {
      if (!String(f[c.key] ?? '').trim()) {
        this.inform(`${c.label} es obligatorio.`, true);
        return;
      }
    }
    let modo = this.modoAcceso();
    const ed = this.editando();
    let idUsuarioExistente =
      modo === 'vincular' ? this.idUsuarioVincular().trim() : undefined;
    // Si el select de vínculo se vació pero la ficha ya tenía usuario, conservar el enlace.
    if (modo === 'vincular' && !idUsuarioExistente && ed?.idUsuario) {
      idUsuarioExistente = String(ed.idUsuario);
      this.idUsuarioVincular.set(idUsuarioExistente);
    }
    if (modo === 'vincular' && !idUsuarioExistente) {
      this.inform('Seleccione el usuario existente a vincular.', true);
      return;
    }
    const errCel = mensajeErrorCelularAlmacenado(f.celular, 'celular');
    if (errCel) {
      this.inform(errCel, true);
      return;
    }
    this.saving.set(true);
    const files = this.fotoFile() ? { foto: this.fotoFile()! } : undefined;
    const payload: EmpleadoDto = {
      ...f,
      estado: normalizarEstadoEmpleado(f.estado),
      modoAcceso: modo,
      idUsuarioExistente,
    };
    const req = ed ? this.svc.actualizar(ed.idEmpleado, payload, files) : this.svc.crear(payload, files);
    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.fotoFile.set(null);
        this.mostrarForm.set(false);
        this.editando.set(null);
        this.cargar();
        this.cargarUsuarios();
        let txt = ed ? 'Empleado actualizado.' : 'Empleado creado.';
        const ug = res?.usuarioGenerado;
        if (ug?.username) {
          if (ug.vinculado) {
            txt += ` Usuario vinculado — login: ${ug.username} (${ug.rol}).`;
          } else if (ug.existente) {
            txt += ` Usuario ya existía — login: ${ug.username} (${ug.rol}).`;
          } else {
            txt += ` Usuario creado — login: ${ug.username} (mismo número de documento, ${ug.rol}).`;
            if (ug.passwordInicial) {
              txt += ` Contraseña inicial: ${ug.passwordInicial}.`;
            }
          }
        } else if (modo === 'ninguno') {
          txt += ' Sin usuario de acceso vinculado.';
        }
        if (res?.avisoUsuario) {
          txt += ` Aviso acceso: ${res.avisoUsuario}`;
        }
        this.inform(txt, !!res?.avisoUsuario);
      },
      error: async (e) => {
        this.saving.set(false);
        const body = e?.error;
        const existingId = body?.existingId;
        if (e?.status === 409 && existingId != null) {
          this.inform(body?.message || 'Ya existe un empleado con ese documento.', true);
          const abrir = await this.confirm.open({
            title: 'Documento ya registrado',
            message:
              body?.message ||
              'Ese número de documento ya pertenece a un empleado. ¿Abrir la ficha para editarla o reactivarla?',
            confirmLabel: 'Abrir ficha',
            cancelLabel: 'Cerrar',
          });
          if (!abrir) return;
          this.svc.obtener(existingId).subscribe({
            next: (emp) => this.editar(emp),
            error: () => this.inform('No se pudo cargar el empleado existente.', true),
          });
          return;
        }
        this.inform(body?.message || 'Error al guardar', true);
      },
    });
  }

  async eliminar(e: Empleado) {
    const ok = await this.confirm.open({
      title: 'Eliminar empleado',
      message: `¿Eliminar a ${e.nombreCompleto}?`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    this.svc.eliminar(e.idEmpleado).subscribe({
      next: () => {
        this.cargar();
        this.inform('Empleado eliminado.');
      },
      error: (err) => this.inform(err?.error?.message || 'No se pudo eliminar', true),
    });
  }

  private inform(text: string | null, isErr = false): void {
    this.msg.set(text);
    this.msgError.set(isErr);
  }
}
