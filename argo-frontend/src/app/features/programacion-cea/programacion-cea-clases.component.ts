import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PermisoService } from '../../core/services/permiso.service';
import {
  AlumnoElegibleCea,
  ClaseProgramadaCeaDto,
  CrearClaseCeaBody,
  InscripcionClaseCeaDto,
  ProgramaCeaDto,
  ProgramacionCeaService,
  RecursosProgramacionCea,
  TemaProgramaCeaDto,
  TipoClaseCea,
  fmtDuracionSegundos,
  labelOrigenHorasCea,
  labelTipoClaseCea,
} from '../../core/services/programacion-cea.service';
import {
  agruparPorFecha,
  ahoraLineaTopPct,
  diasSemana,
  esFinDeSemana,
  finSemana,
  fmtDiaSemanaCorto,
  fmtRangoSemana,
  horasSlots,
  inicioSemana,
  layoutHorarioHHmm,
  ymdCalendario,
  ymdLocal,
  type DiaSemana,
} from '../jornadas/jornada-calendario.util';
import { estadoClaseCalBlockClass } from '../jornadas/jornada-ui.util';

type VistaAgenda = 'lista' | 'calendario';

@Component({
  selector: 'argo-programacion-cea-clases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programacion-cea-clases.component.html',
  styleUrls: ['./programacion-cea-clases.component.scss'],
})
export class ProgramacionCeaClasesComponent implements OnInit, OnDestroy {
  private svc = inject(ProgramacionCeaService);
  private permisos = inject(PermisoService);

  @Input() programas: ProgramaCeaDto[] = [];
  @Input() claseSelId: string | null = null;
  @Input() fechaInicial: string | null = null;

  fecha = signal(ymdLocal(new Date()));
  vistaAgenda = signal<VistaAgenda>('lista');
  semanaInicio = signal(inicioSemana(new Date()));
  clases = signal<ClaseProgramadaCeaDto[]>([]);
  clasesSemana = signal<ClaseProgramadaCeaDto[]>([]);
  loadingSemana = signal(false);
  recursos = signal<RecursosProgramacionCea | null>(null);
  temasProg = signal<TemaProgramaCeaDto[]>([]);
  claseSel = signal<ClaseProgramadaCeaDto | null>(null);
  inscripciones = signal<InscripcionClaseCeaDto[]>([]);
  elegibles = signal<AlumnoElegibleCea[]>([]);

  saving = signal(false);
  msg = signal<string | null>(null);
  msgTipo = signal<'ok' | 'error' | 'warn'>('ok');
  conflictos = signal<{ tipo: string; mensaje: string }[]>([]);
  tick = signal(0);

  numDocInscribir = signal('');
  buscarAlumno = signal('');
  filtroTipo = signal<TipoClaseCea | ''>('');

  form = signal<CrearClaseCeaBody>({
    idProg: '',
    tipoClase: 'teoria',
    fechaClase: ymdLocal(new Date()),
    horaDesde: '08:00',
    horaHasta: '10:00',
    duracionHoras: 2,
    idTema: '',
    idAula: '',
    idTaller: '',
    idVehiculo: '',
    idEmpleadoInstructor: undefined,
    cupoMaximo: 25,
  });

  puedeGestionar = computed(() => this.permisos.tiene('programacion_cea.gestionar'));
  puedeOperar = computed(() => this.permisos.tiene(['programacion_cea.operar', 'programacion_cea.gestionar']));

  temasFiltrados = computed(() => {
    const tipo = this.form().tipoClase;
    const tipoTema = tipo === 'teoria' ? 'teoria' : tipo === 'taller' ? 'taller' : null;
    if (!tipoTema) return [];
    return this.temasProg().filter((t) => t.tipo === tipoTema && t.activo !== false);
  });

  clasesFiltradas = computed(() => {
    const t = this.filtroTipo();
    const rows = this.clases();
    return t ? rows.filter((c) => c.tipoClase === t) : rows;
  });

  hoyKey = computed(() => ymdLocal(new Date()));
  tituloSemanaCal = computed(() => fmtRangoSemana(this.semanaInicio()));
  diasSemanaCal = computed((): DiaSemana[] => diasSemana(this.semanaInicio()));
  horasCal = horasSlots();
  semanaIncluyeHoy = computed(() => this.diasSemanaCal().some((d) => d.key === this.hoyKey()));
  ahoraCalTopPct = computed(() => {
    this.diasSemanaCal();
    return ahoraLineaTopPct(new Date());
  });

  clasesSemanaFiltradas = computed(() => {
    const t = this.filtroTipo();
    const keys = new Set(this.diasSemanaCal().map((d) => d.key));
    return this.clasesSemana().filter((c) => {
      const key = ymdCalendario(c.fechaClase);
      if (!keys.has(key)) return false;
      return !t || c.tipoClase === t;
    });
  });

  clasesPorDiaSemana = computed(() =>
    agruparPorFecha(this.clasesSemanaFiltradas(), (c) => ymdCalendario(c.fechaClase)),
  );

  clasesSinHorarioSemana = computed(() => {
    const keys = new Set(this.diasSemanaCal().map((d) => d.key));
    return this.clasesSemanaFiltradas().filter((c) => {
      if (!keys.has(ymdCalendario(c.fechaClase))) return false;
      return layoutHorarioHHmm(c.horaDesde, c.horaHasta).sinHorario;
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
      else if (e !== 'CANCELADA') programada++;
    }
    return { total: items.length, programada, proceso, finalizado };
  });

  cronometroSeg = computed(() => {
    this.tick();
    const c = this.claseSel();
    if (!c || c.estado !== 'EN PROCESO' || !c.horaInicio) return null;
    const ini = new Date(c.horaInicio).getTime();
    return Math.max(0, Math.floor((Date.now() - ini) / 1000));
  });

  duracionMostrar = computed(() => {
    const c = this.claseSel();
    if (!c) return '—';
    if (c.estado === 'EN PROCESO' && this.cronometroSeg() != null) {
      return fmtDuracionSegundos(this.cronometroSeg());
    }
    if (c.duracionSegundos) return fmtDuracionSegundos(c.duracionSegundos);
    return '—';
  });

  labelTipoClase = labelTipoClaseCea;
  labelOrigen = labelOrigenHorasCea;
  estadoClaseCalBlockClass = estadoClaseCalBlockClass;
  esFinDeSemana = esFinDeSemana;
  ymdCalendario = ymdCalendario;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const id = this.claseSelId;
      if (id && this.clases().length) {
        const c = this.clases().find((x) => x._id === id);
        if (c) this.seleccionarClase(c);
      }
    });
  }

  ngOnInit(): void {
    if (this.fechaInicial) {
      this.fecha.set(this.fechaInicial);
      this.patchForm({ fechaClase: this.fechaInicial });
      this.semanaInicio.set(inicioSemana(new Date(this.fechaInicial + 'T12:00:00')));
    }
    if (this.programas.length && !this.form().idProg) {
      this.patchForm({ idProg: this.programas[0].idProg, fechaClase: this.fecha() });
    }
    this.cargarRecursos();
    this.cargarClases();
    this.timer = setInterval(() => {
      if (this.claseSel()?.estado === 'EN PROCESO') this.tick.update((n) => n + 1);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  patchForm(p: Partial<CrearClaseCeaBody>) {
    this.form.update((f) => ({ ...f, ...p }));
    if (p.idProg) this.cargarTemas(String(p.idProg));
  }

  onFechaAgenda(f: string) {
    this.fecha.set(f);
    this.patchForm({ fechaClase: f });
    this.cargarClases();
  }

  irHoy() {
    this.onFechaAgenda(ymdLocal(new Date()));
  }

  setVistaAgenda(v: VistaAgenda) {
    this.vistaAgenda.set(v);
    if (v === 'calendario') {
      const f = this.fecha();
      if (f) this.semanaInicio.set(inicioSemana(new Date(f + 'T12:00:00')));
      this.cargarSemana();
    }
  }

  semanaAnterior() {
    const d = new Date(this.semanaInicio());
    d.setDate(d.getDate() - 7);
    this.semanaInicio.set(inicioSemana(d));
    this.cargarSemana();
  }

  semanaSiguiente() {
    const d = new Date(this.semanaInicio());
    d.setDate(d.getDate() + 7);
    this.semanaInicio.set(inicioSemana(d));
    this.cargarSemana();
  }

  irSemanaHoy() {
    this.semanaInicio.set(inicioSemana(new Date()));
    this.cargarSemana();
  }

  conteoClasesDia(key: string): number {
    return (this.clasesPorDiaSemana().get(key) ?? []).length;
  }

  clasesEnDia(key: string): ClaseProgramadaCeaDto[] {
    return (this.clasesPorDiaSemana().get(key) ?? []).filter(
      (c) => !layoutHorarioHHmm(c.horaDesde, c.horaHasta).sinHorario,
    );
  }

  layoutClaseCea(c: ClaseProgramadaCeaDto) {
    return layoutHorarioHHmm(c.horaDesde, c.horaHasta);
  }

  fmtDiaCal(fecha: Date): string {
    return fmtDiaSemanaCorto(fecha);
  }

  chipClaseCal(c: ClaseProgramadaCeaDto): string {
    const base = `${this.labelTipoClase(c.tipoClase)} · ${c.programaLabel || c.idProg}`;
    const extra = c.temaNombre || this.ubicacionClase(c);
    const inst = (c.instructorNombre || '').trim();
    const mid = extra ? `${base} · ${extra}` : base;
    return inst && inst !== '—' ? `${mid} · ${inst}` : mid;
  }

  chipClaseCalCorto(c: ClaseProgramadaCeaDto): string {
    const extra = c.temaNombre || this.ubicacionClase(c);
    return extra
      ? `${this.labelTipoClase(c.tipoClase)} · ${extra}`
      : `${this.labelTipoClase(c.tipoClase)} · ${c.programaLabel || c.idProg}`;
  }

  seleccionarClaseCalendario(c: ClaseProgramadaCeaDto) {
    const f = ymdCalendario(c.fechaClase);
    this.fecha.set(f);
    this.patchForm({ fechaClase: f });
    this.vistaAgenda.set('lista');
    this.svc.listarClases({ fecha: f }).subscribe({
      next: (rows) => {
        this.clases.set(rows || []);
        const found = (rows || []).find((x) => x._id === c._id);
        this.seleccionarClase(found || c);
      },
      error: () => this.seleccionarClase(c),
    });
  }

  cargarSemana() {
    const ini = this.semanaInicio();
    const fin = finSemana(ini);
    this.loadingSemana.set(true);
    this.svc
      .listarClases({ desde: ymdLocal(ini), hasta: ymdLocal(fin) })
      .subscribe({
        next: (rows) => {
          this.clasesSemana.set(rows || []);
          this.loadingSemana.set(false);
        },
        error: (e) => {
          this.loadingSemana.set(false);
          this.flash(e?.error?.message || 'No se pudo cargar la semana', 'error');
        },
      });
  }

  onTipoClaseChange(t: TipoClaseCea) {
    const dur = t === 'practica' ? 2 : undefined;
    const cupo = t === 'practica' ? 1 : t === 'taller' ? 20 : 25;
    this.patchForm({ tipoClase: t, duracionHoras: dur, cupoMaximo: cupo, idTema: '', idAula: '', idTaller: '', idVehiculo: '' });
  }

  cargarRecursos() {
    this.svc.recursos().subscribe({
      next: (r) => this.recursos.set(r),
      error: () => undefined,
    });
  }

  cargarTemas(idProg: string) {
    if (!idProg) return;
    this.svc.listarTemas(idProg).subscribe({
      next: (rows) => this.temasProg.set(rows || []),
      error: () => this.temasProg.set([]),
    });
  }

  cargarClases() {
    this.svc.listarClases({ fecha: this.fecha() }).subscribe({
      next: (rows) => {
        this.clases.set(rows || []);
        const sel = this.claseSel()?._id;
        if (sel) {
          const c = (rows || []).find((x) => x._id === sel);
          if (c) this.claseSel.set(c);
        }
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudieron cargar las clases', 'error'),
    });
  }

  seleccionarClase(c: ClaseProgramadaCeaDto) {
    this.claseSel.set(c);
    this.conflictos.set([]);
    this.cargarInscripciones(c._id);
    this.cargarElegibles(c._id);
  }

  cargarInscripciones(idClase: string) {
    this.svc.listarInscripciones(idClase).subscribe({
      next: (rows) => this.inscripciones.set(rows || []),
      error: () => this.inscripciones.set([]),
    });
  }

  cargarElegibles(idClase: string) {
    this.svc.alumnosElegibles(idClase, this.buscarAlumno()).subscribe({
      next: (rows) => this.elegibles.set(rows || []),
      error: () => this.elegibles.set([]),
    });
  }

  verificarYProgramar() {
    if (!this.puedeGestionar()) return;
    const body = this.form();
    if (!body.idProg || !body.fechaClase || !body.horaDesde) {
      this.flash('Complete programa, fecha y hora de inicio', 'error');
      return;
    }
    this.saving.set(true);
    this.conflictos.set([]);
    this.svc.verificarConflictos(body).subscribe({
      next: (v) => {
        if (!v.ok && v.conflictos?.length) {
          this.conflictos.set(v.conflictos);
          this.flash(v.message || 'Hay conflictos de horario', 'warn');
          this.saving.set(false);
          return;
        }
        this.svc.crearClase(body).subscribe({
          next: (c) => {
            this.flash('Clase programada correctamente', 'ok');
            this.saving.set(false);
            this.cargarClases();
            this.seleccionarClase(c);
          },
          error: (e) => {
            this.conflictos.set(e?.error?.conflictos || []);
            this.flash(e?.error?.message || 'No se pudo programar', 'error');
            this.saving.set(false);
          },
        });
      },
      error: (e) => {
        this.conflictos.set(e?.error?.conflictos || []);
        this.flash(e?.error?.message || 'Validación fallida', 'error');
        this.saving.set(false);
      },
    });
  }

  cancelarClaseSel() {
    const c = this.claseSel();
    if (!c || !this.puedeGestionar()) return;
    this.svc.cancelarClase(c._id).subscribe({
      next: () => {
        this.flash('Clase cancelada', 'ok');
        this.claseSel.set(null);
        this.cargarClases();
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudo cancelar', 'error'),
    });
  }

  iniciarClase() {
    const c = this.claseSel();
    if (!c || !this.puedeOperar()) return;
    this.svc.iniciarClase(c._id).subscribe({
      next: (doc) => {
        this.claseSel.set(doc);
        this.cargarClases();
        this.flash('Clase iniciada', 'ok');
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudo iniciar', 'error'),
    });
  }

  finalizarClase() {
    const c = this.claseSel();
    if (!c || !this.puedeOperar()) return;
    this.svc.finalizarClase(c._id).subscribe({
      next: (doc) => {
        this.claseSel.set(doc);
        this.cargarClases();
        this.cargarInscripciones(doc._id);
        this.flash('Clase finalizada — horas registradas', 'ok');
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudo finalizar', 'error'),
    });
  }

  inscribirPorDoc() {
    const c = this.claseSel();
    const doc = this.numDocInscribir().trim();
    if (!c || !doc || !this.puedeOperar()) return;
    this.svc.inscribirAlumno(c._id, { numDoc: doc }).subscribe({
      next: (r) => {
        this.claseSel.set(r.clase);
        this.numDocInscribir.set('');
        this.cargarInscripciones(c._id);
        this.cargarElegibles(c._id);
        this.cargarClases();
        this.flash('Alumno inscrito', 'ok');
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudo inscribir', 'error'),
    });
  }

  inscribirElegible(a: AlumnoElegibleCea) {
    const c = this.claseSel();
    if (!c || !this.puedeOperar()) return;
    this.svc.inscribirAlumno(c._id, { numDoc: a.numDoc, origenHoras: a.origenHoras }).subscribe({
      next: (r) => {
        this.claseSel.set(r.clase);
        this.cargarInscripciones(c._id);
        this.cargarElegibles(c._id);
        this.cargarClases();
        this.flash(`${a.alumnoNombre} inscrito`, 'ok');
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudo inscribir', 'error'),
    });
  }

  quitarInscripcion(ins: InscripcionClaseCeaDto) {
    const c = this.claseSel();
    if (!c || !this.puedeOperar()) return;
    this.svc.quitarInscripcion(c._id, ins.numDoc).subscribe({
      next: (r) => {
        this.claseSel.set(r.clase);
        this.cargarInscripciones(c._id);
        this.cargarElegibles(c._id);
        this.cargarClases();
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudo quitar', 'error'),
    });
  }

  estadoClass(estado: string): string {
    if (estado === 'EN PROCESO') return 'estado-proceso';
    if (estado === 'FINALIZADO') return 'estado-ok';
    if (estado === 'CANCELADA') return 'estado-cancel';
    return 'estado-prog';
  }

  ubicacionClase(c: ClaseProgramadaCeaDto): string {
    if (c.tipoClase === 'teoria') return c.aulaNombre || c.idAula || '—';
    if (c.tipoClase === 'taller') return c.tallerNombre || c.idTaller || '—';
    return c.idVehiculo || '—';
  }

  private flash(texto: string, tipo: 'ok' | 'error' | 'warn') {
    this.msg.set(texto);
    this.msgTipo.set(tipo);
    window.setTimeout(() => this.msg.set(null), 5000);
  }
}
