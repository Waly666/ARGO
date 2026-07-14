import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';

import { ConfigRecibo, ConfigService } from '../../core/services/config.service';
import { ConfigPaginasInformesService } from '../../core/services/config-paginas-informes.service';
import {
  ClaseJornadaDto,
  ContratacionDto,
  InformesJornadaResp,
  JornadaCapDto,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import {
  abrirInformeJornadasPdf,
  buildJornadasInformeHtml,
  type ColumnaInformeJornada,
} from './jornadas-informe-document';
import { capEstadoClase, capEstadoJornadaColor } from './jornada-ui.util';

type TabInforme =
  | 'resumenContratos'
  | 'trazabilidad'
  | 'catalogoJornadas'
  | 'catalogoClases'
  | 'instructores'
  | 'alumnos'
  | 'certificados';

const TITULOS_TAB: Record<TabInforme, string> = {
  resumenContratos: 'Contratos',
  trazabilidad: 'Trazabilidad',
  catalogoJornadas: 'Jornadas',
  catalogoClases: 'Clases',
  instructores: 'Instructores',
  alumnos: 'Alumnos',
  certificados: 'Certificados',
};

function columnasDeTab(t: TabInforme): ColumnaInformeJornada[] {
  switch (t) {
    case 'resumenContratos':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'cliente', l: 'Cliente' },
        { k: 'estadoContrato', l: 'Estado' },
        { k: 'tipoCertificado', l: 'Certificación' },
        { k: 'jornadasRegistradas', l: 'Jornadas' },
        { k: 'clasesProgramadas', l: 'Clases' },
        { k: 'primeraJornada', l: 'Primera jornada' },
        { k: 'ultimaJornada', l: 'Última jornada' },
        { k: 'alumnosUnicos', l: 'Alumnos' },
        { k: 'alumnosAsistieron', l: 'Asistieron' },
        { k: 'certificadosEmitidos', l: 'Certificados' },
        { k: 'municipios', l: 'Municipios' },
        { k: 'instructores', l: 'Instructores' },
      ];
    case 'trazabilidad':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'fechaJornada', l: 'Fecha jornada' },
        { k: 'idJornadaCorto', l: 'ID jornada' },
        { k: 'municipio', l: 'Municipio' },
        { k: 'numDoc', l: 'Documento' },
        { k: 'nombreAlumno', l: 'Alumno' },
        { k: 'empresaNombre', l: 'Empresa' },
        { k: 'clasesInscrito', l: 'Inscrito' },
        { k: 'clasesAsistidas', l: 'Asistió' },
        { k: 'instructores', l: 'Instructores' },
        { k: 'programas', l: 'Programas' },
        { k: 'detalleClases', l: 'Detalle clases' },
        { k: 'certificado', l: 'Certificado' },
        { k: 'certificadoCodigo', l: 'Código cert.' },
      ];
    case 'catalogoJornadas':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'fechaJornada', l: 'Fecha' },
        { k: 'idJornadaCorto', l: 'ID jornada' },
        { k: 'municipio', l: 'Municipio' },
        { k: 'estadoJornada', l: 'Estado' },
        { k: 'numClases', l: 'Clases' },
        { k: 'clasesFinalizadas', l: 'Finalizadas' },
        { k: 'alumnosInscritos', l: 'Inscritos' },
        { k: 'alumnosAsistieron', l: 'Asistieron' },
        { k: 'instructores', l: 'Instructores' },
        { k: 'programas', l: 'Programas' },
        { k: 'certificadosEmitidos', l: 'Certificados' },
      ];
    case 'catalogoClases':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'fechaJornada', l: 'Fecha jornada' },
        { k: 'idJornadaCorto', l: 'ID jornada' },
        { k: 'municipio', l: 'Municipio' },
        { k: 'idClaseCorto', l: 'ID clase' },
        { k: 'indiceClaseEnJornada', l: 'Nº' },
        { k: 'programa', l: 'Programa' },
        { k: 'carpa', l: 'Carpa' },
        { k: 'estadoClase', l: 'Estado' },
        { k: 'instructor', l: 'Instructor' },
        { k: 'horaInicio', l: 'Inicio' },
        { k: 'horaFin', l: 'Fin' },
        { k: 'alumnosInscritos', l: 'Inscritos' },
        { k: 'alumnosAsistieron', l: 'Asistieron' },
        { k: 'certificadosEmitidos', l: 'Certificados' },
      ];
    case 'instructores':
      return [
        { k: 'instructor', l: 'Instructor' },
        { k: 'codContrato', l: 'Contrato' },
        { k: 'fechaJornada', l: 'Fecha jornada' },
        { k: 'municipio', l: 'Municipio' },
        { k: 'idClaseCorto', l: 'ID clase' },
        { k: 'programa', l: 'Programa' },
        { k: 'carpa', l: 'Carpa' },
        { k: 'estadoClase', l: 'Estado' },
        { k: 'horaInicio', l: 'Inicio' },
        { k: 'horaFin', l: 'Fin' },
        { k: 'alumnosInscritos', l: 'Inscritos' },
        { k: 'alumnosAsistieron', l: 'Asistieron' },
      ];
    case 'alumnos':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'numDoc', l: 'Documento' },
        { k: 'nombreAlumno', l: 'Alumno' },
        { k: 'empresaNombre', l: 'Empresa' },
        { k: 'telefono', l: 'Teléfono' },
        { k: 'email', l: 'Email' },
        { k: 'numJornadas', l: 'Jornadas' },
        { k: 'fechasJornada', l: 'Fechas' },
        { k: 'clasesInscrito', l: 'Clases insc.' },
        { k: 'clasesAsistidas', l: 'Clases asist.' },
        { k: 'programas', l: 'Programas' },
        { k: 'certificado', l: 'Certificado' },
        { k: 'certificadoCodigo', l: 'Código cert.' },
      ];
    case 'certificados':
      return [
        { k: 'codigoCert', l: 'Código' },
        { k: 'encabezado', l: 'Encabezado' },
        { k: 'fechaEmision', l: 'Emisión' },
        { k: 'estado', l: 'Estado' },
        { k: 'numDoc', l: 'Documento' },
        { k: 'nombreAlumno', l: 'Alumno' },
        { k: 'empresaNombre', l: 'Empresa' },
        { k: 'codContrato', l: 'Contrato' },
        { k: 'idJornadaCorto', l: 'ID jornada' },
        { k: 'fechaJornada', l: 'Fecha jornada' },
        { k: 'municipio', l: 'Municipio' },
      ];
  }
}

function idCorto(id?: string | null): string {
  const s = String(id || '').trim();
  return s ? s.slice(-6).toUpperCase() : '—';
}

@Component({
  selector: 'argo-jornadas-informes',
  standalone: true,
  imports: [CommonModule, FormsModule, ArgoDateInputComponent, CatalogoEnumBuscarComponent],
  templateUrl: './jornadas-informes.component.html',
  styleUrls: ['./jornadas-informes.component.scss'],
})
export class JornadasInformesComponent implements OnInit {
  private jornadaSvc = inject(JornadaCapService);
  private configSvc = inject(ConfigService);
  private paginasSvc = inject(ConfigPaginasInformesService);
  private destroyRef = inject(DestroyRef);
  private recarga$ = new Subject<void>();

  desde = signal('');
  hasta = signal('');
  idContrato = signal('');
  idJornada = signal('');
  idClase = signal('');
  filtroAlumno = signal('');

  contratos = signal<ContratacionDto[]>([]);
  jornadas = signal<JornadaCapDto[]>([]);
  clases = signal<ClaseJornadaDto[]>([]);
  empresa = signal<ConfigRecibo | null>(null);
  tab = signal<TabInforme>('resumenContratos');
  loading = signal(false);
  exportando = signal(false);
  msg = signal<string | null>(null);
  data = signal<InformesJornadaResp | null>(null);

  tituloTabActual = computed(() => TITULOS_TAB[this.tab()]);

  opcionesContrato = computed<EnumBuscarOption[]>(() =>
    this.contratos()
      .filter((c): c is ContratacionDto & { _id: string } => !!c._id)
      .map((c) => ({
        value: c._id,
        label: `${c.codContrato || '—'} — ${c.nombreComercial || c.razoSocial || 'Contrato'}`,
      })),
  );

  opcionesJornada = computed<EnumBuscarOption[]>(() =>
    this.jornadas()
      .filter((j): j is JornadaCapDto & { _id: string } => !!j._id)
      .map((j) => {
        const contrato = this.contratos().find((c) => c._id === j.idContrato);
        const cod = contrato?.codContrato || j.codContrato || '—';
        const fecha = j.fechaProgramacion
          ? new Date(j.fechaProgramacion).toLocaleDateString('es-CO')
          : '';
        const id = idCorto(j._id);
        return {
          value: j._id,
          label: `${cod} · ${id}${fecha ? ` · ${fecha}` : ''}${j.municipio ? ` · ${j.municipio}` : ''}`,
        };
      }),
  );

  opcionesClase = computed<EnumBuscarOption[]>(() =>
    this.clases()
      .filter((c): c is ClaseJornadaDto & { _id: string } => !!c._id)
      .map((c) => ({
        value: c._id,
        label: `${idCorto(c._id)} · ${c.programaNombre || c.idPrograma || 'Sin programa'}${c.carpaNombre ? ` · ${c.carpaNombre}` : ''}`,
      })),
  );

  textoContrato = computed(() => {
    const id = this.idContrato();
    if (!id) return '';
    const c = this.contratos().find((x) => x._id === id);
    if (!c) return '';
    return `${c.codContrato || '—'} — ${c.nombreComercial || c.razoSocial || 'Contrato'}`;
  });

  codigoContratoFiltro = computed(() => {
    const id = this.idContrato();
    if (!id) return '';
    const c = this.contratos().find((x) => x._id === id);
    return String(c?.codContrato || '').trim();
  });

  textoJornada = computed(() => {
    const id = this.idJornada();
    if (!id) return '';
    return this.opcionesJornada().find((o) => String(o.value) === id)?.label || idCorto(id);
  });

  idJornadaCortoFiltro = computed(() => (this.idJornada() ? idCorto(this.idJornada()) : ''));

  fechaJornadaFiltro = computed(() => {
    const j = this.jornadas().find((x) => x._id === this.idJornada());
    if (!j?.fechaProgramacion) return '';
    return new Date(j.fechaProgramacion).toLocaleDateString('es-CO');
  });

  textoClase = computed(() => {
    const id = this.idClase();
    if (!id) return '';
    return this.opcionesClase().find((o) => String(o.value) === id)?.label || idCorto(id);
  });

  idClaseCortoFiltro = computed(() => (this.idClase() ? idCorto(this.idClase()) : ''));

  /** Filas de la pestaña activa (con filtro local de alumno si aplica). */
  filasActivas = computed(() => {
    let filas = this.dataFiltradaPorTab(this.tab());
    const q = this.filtroAlumno().trim().toLowerCase();
    if (this.tab() === 'alumnos' && q) {
      filas = filas.filter((r) => {
        const nombre = String(r['nombreAlumno'] || '').toLowerCase();
        const doc = String(r['numDoc'] ?? '');
        const empresa = String(r['empresaNombre'] || '').toLowerCase();
        return nombre.includes(q) || doc.includes(q) || empresa.includes(q);
      });
    }
    return filas;
  });

  gruposPorJornada = computed(() => {
    if (this.tab() !== 'trazabilidad') return [];
    const filas = this.filasActivas();
    const map = new Map<
      string,
      {
        key: string;
        codContrato: string;
        idJornadaCorto: string;
        fechaJornada: string;
        municipio: string;
        filas: Record<string, unknown>[];
      }
    >();
    for (const row of filas) {
      const idJ = String(row['idJornada'] || row['idJornadaCorto'] || '');
      const cod = String(row['codContrato'] || '—');
      const key = `${cod}|${idJ}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          codContrato: cod,
          idJornadaCorto: String(row['idJornadaCorto'] || idCorto(idJ)),
          fechaJornada: String(row['fechaJornada'] || ''),
          municipio: String(row['municipio'] || ''),
          filas: [],
        };
        map.set(key, g);
      }
      g.filas.push(row);
    }
    return [...map.values()];
  });

  columnasActivas = computed<ColumnaInformeJornada[]>(() => columnasDeTab(this.tab()));

  readonly tabsNav: { id: TabInforme; label: string; icon: string; tone: string }[] = [
    { id: 'resumenContratos', label: 'Contratos', icon: '📋', tone: 'indigo' },
    { id: 'trazabilidad', label: 'Trazabilidad', icon: '🔗', tone: 'cyan' },
    { id: 'catalogoJornadas', label: 'Jornadas', icon: '📅', tone: 'amber' },
    { id: 'catalogoClases', label: 'Clases', icon: '🎓', tone: 'blue' },
    { id: 'instructores', label: 'Instructores', icon: '👨‍🏫', tone: 'orange' },
    { id: 'alumnos', label: 'Alumnos', icon: '👥', tone: 'teal' },
    { id: 'certificados', label: 'Certificados', icon: '🏅', tone: 'emerald' },
  ];

  statsCards = computed(() => {
    const d = this.data();
    if (!d) return [];
    const r = d.resumen;
    return [
      { icon: '👥', label: 'Alumnos únicos', value: r.alumnosUnicos, tone: 'blue' },
      { icon: '📚', label: 'Registros clase', value: r.totalFilasClase, tone: 'indigo' },
      { icon: '✓', label: 'Asistencias', value: r.registrosAsistencia, tone: 'emerald' },
      { icon: '📝', label: 'Inscripciones', value: r.registrosInscripcion, tone: 'cyan' },
      { icon: '🏅', label: 'Certificados', value: r.certificados, tone: 'violet' },
      { icon: '📋', label: 'Contratos', value: r.contratos ?? 0, tone: 'amber' },
      { icon: '📅', label: 'Jornadas', value: r.jornadas ?? 0, tone: 'teal' },
      { icon: '👨‍🏫', label: 'Instructores', value: r.instructores ?? 0, tone: 'orange' },
    ];
  });

  filtrosActivos = computed(() => {
    const chips: { icon: string; label: string; value: string }[] = [];
    if (this.textoContrato()) chips.push({ icon: '📋', label: 'Contrato', value: this.textoContrato() });
    if (this.textoJornada()) chips.push({ icon: '📅', label: 'Jornada', value: this.textoJornada() });
    if (this.textoClase()) chips.push({ icon: '🎓', label: 'Clase', value: this.textoClase() });
    if (this.desde() || this.hasta()) {
      chips.push({
        icon: '🗓️',
        label: 'Periodo',
        value: `${this.desde() || '…'} — ${this.hasta() || '…'}`,
      });
    }
    return chips;
  });

  hayFiltrosActivos = computed(
    () =>
      !!(
        this.idContrato() ||
        this.idJornada() ||
        this.idClase() ||
        this.desde() ||
        this.hasta() ||
        this.filtroAlumno().trim()
      ),
  );

  ngOnInit(): void {
    this.configSvc.obtenerReciboEncabezado().subscribe({
      next: (c) => this.empresa.set(c),
      error: () => this.empresa.set(null),
    });
    this.jornadaSvc.listarContratos().subscribe({
      next: (rows) => this.contratos.set(rows || []),
      error: () => this.contratos.set([]),
    });
    this.configurarRecargaReactiva();
    this.cargarOpcionesJornada();
    this.programarRecarga();
  }

  private configurarRecargaReactiva(): void {
    this.recarga$
      .pipe(
        debounceTime(350),
        switchMap(() => {
          this.loading.set(true);
          this.msg.set(null);
          if (this.idJornada()) this.cargarOpcionesClase();
          return this.jornadaSvc.informesJornada(this.paramsFiltro()).pipe(
            catchError((e) => {
              this.msg.set(e?.error?.message || 'No se pudieron cargar los informes.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((d) => {
        this.loading.set(false);
        this.data.set(d);
      });
  }

  private programarRecarga(): void {
    this.recarga$.next();
  }

  onDesdeChange(v: string): void {
    this.desde.set(v || '');
    this.cargarOpcionesJornada();
    this.programarRecarga();
  }

  onHastaChange(v: string): void {
    this.hasta.set(v || '');
    this.cargarOpcionesJornada();
    this.programarRecarga();
  }

  onFiltroAlumnoChange(v: string): void {
    this.filtroAlumno.set(v || '');
  }

  limpiarFiltros(): void {
    this.idContrato.set('');
    this.idJornada.set('');
    this.idClase.set('');
    this.desde.set('');
    this.hasta.set('');
    this.filtroAlumno.set('');
    this.clases.set([]);
    this.cargarOpcionesJornada();
    this.programarRecarga();
  }

  onContratoPick(opt: EnumBuscarOption): void {
    this.idContrato.set(String(opt.value || ''));
    this.idJornada.set('');
    this.idClase.set('');
    this.clases.set([]);
    this.cargarOpcionesJornada();
    this.programarRecarga();
  }

  onContratoLimpiar(): void {
    this.idContrato.set('');
    this.idJornada.set('');
    this.idClase.set('');
    this.clases.set([]);
    this.cargarOpcionesJornada();
    this.programarRecarga();
  }

  onJornadaPick(opt: EnumBuscarOption): void {
    this.idJornada.set(String(opt.value || ''));
    this.idClase.set('');
    this.cargarOpcionesClase();
    this.programarRecarga();
  }

  onJornadaLimpiar(): void {
    this.idJornada.set('');
    this.idClase.set('');
    this.clases.set([]);
    this.programarRecarga();
  }

  onClasePick(opt: EnumBuscarOption): void {
    this.idClase.set(String(opt.value || ''));
    this.programarRecarga();
  }

  onClaseLimpiar(): void {
    this.idClase.set('');
    this.programarRecarga();
  }

  setTab(t: TabInforme): void {
    if (t !== 'alumnos') this.filtroAlumno.set('');
    this.tab.set(t);
  }

  cargarOpcionesJornada(): void {
    this.jornadaSvc
      .listarJornadas({
        idContrato: this.idContrato() || undefined,
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
      })
      .subscribe({
        next: (rows) => this.jornadas.set(rows || []),
        error: () => this.jornadas.set([]),
      });
  }

  cargarOpcionesClase(): void {
    if (!this.idJornada()) {
      this.clases.set([]);
      return;
    }
    this.jornadaSvc.listarClases({ idJornada: this.idJornada() }).subscribe({
      next: (rows) => this.clases.set(rows || []),
      error: () => this.clases.set([]),
    });
  }

  paramsFiltro() {
    return {
      idContrato: this.idContrato() || undefined,
      idJornada: this.idJornada() || undefined,
      idClase: this.idClase() || undefined,
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };
  }

  /**
   * Recorte local de seguridad: el PDF usa exactamente estas filas.
   */
  private dataFiltradaPorTab(tab: TabInforme): Record<string, unknown>[] {
    const d = this.data();
    if (!d) return [];

    const idC = this.idContrato();
    const cod = this.codigoContratoFiltro();
    const idJ = this.idJornada();
    const idCl = this.idClase();
    const docs = this.docsFiltradosPorDetalle();

    const filtrarContrato = (filas: Record<string, unknown>[]) => {
      if (!idC && !cod) return filas;
      return filas.filter(
        (r) =>
          (idC && String(r['idContrato'] || '') === idC) ||
          (cod && String(r['codContrato'] || '') === cod),
      );
    };

    const filtrarJornada = (filas: Record<string, unknown>[]) => {
      if (!idJ) return filas;
      const idJCorto = idCorto(idJ);
      return filas.filter(
        (r) =>
          String(r['idJornada'] || '') === idJ ||
          String(r['idJornadaCorto'] || '') === idJCorto,
      );
    };

    const filtrarClase = (filas: Record<string, unknown>[]) => {
      if (!idCl) return filas;
      const idClCorto = idCorto(idCl);
      return filas.filter(
        (r) =>
          String(r['idClase'] || '') === idCl ||
          String(r['idClaseCorto'] || '') === idClCorto,
      );
    };

    const filtrarAlumno = (filas: Record<string, unknown>[]) => {
      if (!docs) return filas;
      return filas.filter((r) => docs.has(String(r['numDoc'])));
    };

    switch (tab) {
      case 'resumenContratos':
        return filtrarContrato((d.resumenContratos || []) as Record<string, unknown>[]);
      case 'catalogoJornadas':
        return filtrarJornada(filtrarContrato((d.catalogoJornadas || []) as Record<string, unknown>[]));
      case 'catalogoClases':
        return filtrarClase(
          filtrarJornada(filtrarContrato((d.catalogoClases || []) as Record<string, unknown>[])),
        );
      case 'instructores': {
        let filas = (d.instructores || []) as Record<string, unknown>[];
        filas = filtrarContrato(filas);
        filas = filtrarJornada(filas);
        filas = filtrarClase(filas);
        return filas;
      }
      case 'trazabilidad': {
        let filas = (d.trazabilidad || []) as Record<string, unknown>[];
        filas = filtrarContrato(filas);
        filas = filtrarJornada(filas);
        filas = filtrarAlumno(filas);
        return filas;
      }
      case 'alumnos': {
        let filas = (d.alumnos || []) as Record<string, unknown>[];
        filas = filtrarContrato(filas);
        filas = filtrarAlumno(filas);
        return filas;
      }
      case 'certificados': {
        let filas = (d.certificados || []) as Record<string, unknown>[];
        filas = filtrarContrato(filas);
        filas = filtrarJornada(filas);
        filas = filtrarAlumno(filas);
        return filas;
      }
    }
  }

  /** Documentos que pasan filtros de jornada/clase (detalle alumno×clase). */
  private docsFiltradosPorDetalle(): Set<string> | null {
    const d = this.data();
    if (!d || (!this.idJornada() && !this.idClase())) return null;

    let porClase = (d.porClase || []) as Record<string, unknown>[];
    const idC = this.idContrato();
    const cod = this.codigoContratoFiltro();
    if (idC || cod) {
      porClase = porClase.filter(
        (r) =>
          (idC && String(r['idContrato'] || '') === idC) ||
          (cod && String(r['codContrato'] || '') === cod),
      );
    }
    if (this.idJornada()) {
      porClase = porClase.filter((r) => String(r['idJornada'] || '') === this.idJornada());
    }
    if (this.idClase()) {
      porClase = porClase.filter((r) => String(r['idClase'] || '') === this.idClase());
    }
    return new Set(porClase.map((r) => String(r['numDoc'])));
  }

  celda(row: Record<string, unknown>, k: string): string {
    const v = row[k];
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (v == null || v === '') return '—';
    return String(v);
  }

  esSiNo(k: string): boolean {
    return k === 'inscrito' || k === 'asistio' || k === 'certificado';
  }

  esEstado(k: string): boolean {
    return k === 'estadoClase' || k === 'estadoJornada' || k === 'estadoContrato' || k === 'estado';
  }

  esCertCodigo(k: string): boolean {
    return k === 'certificadoCodigo' || k === 'codigoCert';
  }

  esMono(k: string): boolean {
    return [
      'numDoc',
      'idJornadaCorto',
      'idClaseCorto',
      'codigoCert',
      'certificadoCodigo',
      'codContrato',
    ].includes(k);
  }

  esNumeroDestacado(k: string): boolean {
    return [
      'clasesInscrito',
      'clasesAsistidas',
      'clasesInscritos',
      'clasesAsistieron',
      'alumnosUnicos',
      'alumnosAsistieron',
      'certificadosEmitidos',
      'numJornadas',
      'numClases',
      'clasesFinalizadas',
      'alumnosInscritos',
      'alumnosAsistieron',
      'jornadasRegistradas',
      'clasesProgramadas',
      'indiceClaseEnJornada',
    ].includes(k);
  }

  capSiNo(row: Record<string, unknown>, k: string): string {
    const v = row[k];
    const yes = v === true || v === 'Sí';
    return yes ? 'cap cap-emerald cap-sm cap-text' : 'cap cap-slate cap-sm cap-text';
  }

  capEstado(val: unknown): string {
    const t = String(val ?? '').toUpperCase();
    if (t.includes('PROCESO') || t.includes('EJECU')) {
      return `cap cap-emerald cap-sm cap-text`;
    }
    if (t.includes('FINAL') || t.includes('EJECUT')) {
      return `cap cap-slate cap-sm cap-text`;
    }
    if (t.includes('VENC')) return `cap cap-amber cap-sm cap-text`;
    if (t.includes('VIGEN') || t.includes('ACTIV')) return `cap cap-emerald cap-sm cap-text`;
    if (t.includes('CREAD')) return `cap cap-amber cap-sm cap-text`;
    return `cap cap-indigo cap-sm cap-text`;
  }

  capEstadoClase = capEstadoClase;

  capEstadoJornada(val: unknown): string {
    return `cap ${capEstadoJornadaColor(String(val ?? ''))} cap-sm cap-text`;
  }

  capCert(val: unknown): string {
    const t = String(val ?? '').trim();
    if (!t || t === '—' || t === 'No') return 'cap cap-slate cap-sm cap-text';
    return 'cap cap-violet cap-sm cap-text';
  }

  capCarpa(val: unknown): string {
    const t = String(val ?? '').trim();
    return t && t !== '—' ? 'cap cap-pink cap-sm cap-text' : 'cap cap-slate cap-sm cap-text';
  }

  iconoSiNo(row: Record<string, unknown>, k: string): string {
    const v = row[k];
    return v === true || v === 'Sí' ? '✓' : '—';
  }

  exportar(
    tipo:
      | 'completo'
      | 'contratos'
      | 'trazabilidad'
      | 'jornadas'
      | 'clases'
      | 'alumnos'
      | 'instructores'
      | 'certificados'
      | 'resumen-contratos'
      | 'catalogo-jornadas'
      | 'catalogo-clases',
  ): void {
    this.exportando.set(true);
    this.msg.set(null);
    this.jornadaSvc.exportarInformesJornada({ ...this.paramsFiltro(), tipo }).subscribe({
      next: (blob) => {
        this.exportando.set(false);
        const fecha = new Date().toISOString().slice(0, 10);
        this.descargar(blob, `informes-jornadas-${tipo}-${fecha}.xlsx`);
      },
      error: (e) => {
        this.exportando.set(false);
        this.msg.set(e?.error?.message || 'No se pudo exportar el Excel.');
      },
    });
  }

  exportarTabActual(): void {
    const map: Record<
      TabInforme,
      | 'contratos'
      | 'trazabilidad'
      | 'jornadas'
      | 'clases'
      | 'alumnos'
      | 'instructores'
      | 'certificados'
    > = {
      resumenContratos: 'contratos',
      trazabilidad: 'trazabilidad',
      catalogoJornadas: 'jornadas',
      catalogoClases: 'clases',
      instructores: 'instructores',
      alumnos: 'alumnos',
      certificados: 'certificados',
    };
    this.exportar(map[this.tab()]);
  }

  imprimirTabActual(): void {
    if (!this.data()) {
      this.msg.set('Consulte primero los informes.');
      return;
    }
    const t = this.tab();
    const filas = this.filasActivas();
    this.paginasSvc.ensureAndAtPageCss('informe_jornadas_listado').subscribe({
      next: (atPageCss) => {
        const html = buildJornadasInformeHtml({
          titulo: TITULOS_TAB[t],
          subtitulo: 'Informe de jornadas de capacitación',
          filtros: this.filtrosDoc(),
          codigoContratoDestacado: this.codigoContratoParaPdf(filas),
          idJornadaDestacado: this.idJornadaCortoParaPdf(filas),
          fechaJornadaDestacada: this.fechaJornadaParaPdf(filas),
          idClaseDestacado: this.idClaseCortoFiltro() || undefined,
          resumen: this.resumenDeFilas(filas, t),
          secciones:
            t === 'trazabilidad'
              ? this.seccionesPdfPorJornada(filas)
              : [
                  {
                    titulo: TITULOS_TAB[t],
                    columnas: this.columnasActivas(),
                    filas,
                  },
                ],
          empresa: this.empresa(),
          atPageCss,
        });
        if (!abrirInformeJornadasPdf(html)) {
          this.msg.set('Permita ventanas emergentes para ver e imprimir el PDF.');
        }
      },
    });
  }

  imprimirTodo(): void {
    if (!this.data()) {
      this.msg.set('Consulte primero los informes.');
      return;
    }
    const tabs: TabInforme[] = [
      'resumenContratos',
      'trazabilidad',
      'catalogoJornadas',
      'catalogoClases',
      'instructores',
      'alumnos',
      'certificados',
    ];
    const secciones = tabs.flatMap((t) => {
      const filas = this.dataFiltradaPorTab(t);
      if (t === 'trazabilidad') return this.seccionesPdfPorJornada(filas);
      return [
        {
          titulo: TITULOS_TAB[t],
          columnas: columnasDeTab(t),
          filas,
        },
      ];
    });
    const filasRef = this.dataFiltradaPorTab('alumnos');
    this.paginasSvc.ensureAndAtPageCss('informe_jornadas_listado').subscribe({
      next: (atPageCss) => {
        const html = buildJornadasInformeHtml({
          titulo: 'Informes de jornadas de capacitación',
          subtitulo: 'Consolidado de contratos, jornadas, clases, alumnos y certificados',
          filtros: this.filtrosDoc(),
          codigoContratoDestacado: this.codigoContratoParaPdf(filasRef),
          idJornadaDestacado: this.idJornadaCortoParaPdf(filasRef),
          fechaJornadaDestacada: this.fechaJornadaParaPdf(filasRef),
          idClaseDestacado: this.idClaseCortoFiltro() || undefined,
          resumen: this.resumenDeFilas(filasRef, 'alumnos'),
          secciones,
          empresa: this.empresa(),
          atPageCss,
        });
        if (!abrirInformeJornadasPdf(html)) {
          this.msg.set('Permita ventanas emergentes para ver e imprimir el PDF.');
        }
      },
    });
  }

  private codigoContratoParaPdf(filas: Record<string, unknown>[]): string | undefined {
    if (this.codigoContratoFiltro()) return this.codigoContratoFiltro();
    const cods = [...new Set(filas.map((r) => String(r['codContrato'] || '').trim()).filter(Boolean))];
    return cods.length === 1 ? cods[0] : undefined;
  }

  private idJornadaCortoParaPdf(filas: Record<string, unknown>[]): string | undefined {
    if (this.idJornadaCortoFiltro()) return this.idJornadaCortoFiltro();
    const ids = [...new Set(filas.map((r) => String(r['idJornadaCorto'] || '').trim()).filter(Boolean))];
    return ids.length === 1 ? ids[0] : undefined;
  }

  private fechaJornadaParaPdf(filas: Record<string, unknown>[]): string | undefined {
    if (this.fechaJornadaFiltro()) return this.fechaJornadaFiltro();
    const fechas = [...new Set(filas.map((r) => String(r['fechaJornada'] || '').trim()).filter(Boolean))];
    return fechas.length === 1 ? fechas[0] : undefined;
  }

  private resumenDeFilas(filas: Record<string, unknown>[], tab: TabInforme) {
    const alumnos = new Set(filas.map((r) => r['numDoc']).filter((x) => x != null && x !== ''));
    const asist = filas.filter((r) => r['asistio'] === true || r['asistio'] === 'Sí').length;
    const insc = filas.filter((r) => r['inscrito'] === true || r['inscrito'] === 'Sí').length;
    const certs =
      tab === 'certificados'
        ? filas.length
        : filas.filter((r) => r['certificadoCodigo'] || r['codigoCert'] || r['certificado'] === 'Sí')
            .length;
    return {
      alumnosUnicos: alumnos.size,
      totalFilasClase: tab === 'catalogoClases' ? filas.length : alumnos.size,
      registrosAsistencia: asist,
      registrosInscripcion: insc,
      certificados: certs,
    };
  }

  private seccionesPdfPorJornada(filas: Record<string, unknown>[]) {
    const cols = columnasDeTab('trazabilidad').filter(
      (c) => c.k !== 'codContrato' && c.k !== 'idJornadaCorto',
    );
    const map = new Map<string, { titulo: string; filas: Record<string, unknown>[] }>();
    for (const row of filas) {
      const cod = String(row['codContrato'] || '—');
      const idJ = String(row['idJornadaCorto'] || idCorto(String(row['idJornada'] || '')));
      const fecha = String(row['fechaJornada'] || '');
      const key = `${cod}|${idJ}`;
      let g = map.get(key);
      if (!g) {
        g = {
          titulo: `Contrato ${cod}  ·  Jornada ${idJ}${fecha ? `  ·  ${fecha}` : ''}`,
          filas: [],
        };
        map.set(key, g);
      }
      g.filas.push(row);
    }
    return [...map.values()].map((g) => ({
      titulo: g.titulo,
      tituloGrande: true as const,
      columnas: cols,
      filas: g.filas,
    }));
  }

  private filtrosDoc(): {
    contrato?: string;
    jornada?: string;
    clase?: string;
    desde?: string;
    hasta?: string;
  } {
    return {
      contrato: this.textoContrato() || (this.codigoContratoFiltro() ? this.codigoContratoFiltro() : 'Todos los contratos'),
      jornada: this.textoJornada() || undefined,
      clase: this.textoClase() || undefined,
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}
