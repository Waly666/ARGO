import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, forkJoin, switchMap } from 'rxjs';

import { AlumnoListItem, AlumnoService } from '../../core/services/alumno.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import {
  ESTADOS_CIVIL_DEF,
  JORNADAS_DEF,
  buildCatalogoLabelMap,
  catalogoLabel,
  TIPO_JORNADAS_CAPACITACION,
} from './catalogo.helpers';
import { ModoAlumnos, rutasAlumnos } from './alumnos-rutas.helpers';
import {
  capCelular,
  capDoc,
  capEstadoCivil,
  capFecha,
  capJornada,
  capMunicipio,
} from '../../core/utils/capsule.util';
import { environment } from '../../../environments/environment';
import { formatNumDoc } from '../../core/utils/num-doc.helpers';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';

type VistaAlumnos = VistaLista;
const VISTA_STORAGE_KEY_GENERAL = 'argo-alumnos-vista';
const VISTA_STORAGE_KEY_JORNADA = 'argo-alumnos-jornada-vista';

@Component({
  selector: 'argo-alumnos-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos-lista.component.html',
  styleUrls: ['./alumnos-lista.component.scss'],
})
export class AlumnosListaComponent implements OnInit {
  private alumnoSvc = inject(AlumnoService);
  private catSvc = inject(CatalogoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** general = menú Alumnos; jornadas = solo tipo Jornadas de Capacitación */
  modo = signal<ModoAlumnos>('general');
  rutas = computed(() => rutasAlumnos(this.modo()));
  esJornadas = computed(() => this.modo() === 'jornadas');

  uploads = environment.uploadsUrl;

  private jornadaLabels = buildCatalogoLabelMap([], JORNADAS_DEF, ['idJornada', 'id', 'codigo']);
  private estadoCivilLabels = buildCatalogoLabelMap([], ESTADOS_CIVIL_DEF, ['idEstadoCivil', 'id', 'codigo']);
  catalogosReady = signal(0);

  query = signal('');
  page = signal(0);
  pageSize = 25;
  vista = signal<VistaAlumnos>('lista');

  loading = signal(false);
  items = signal<AlumnoListItem[]>([]);
  total = signal(0);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  pageLabel = computed(() => {
    const t = this.total();
    if (t === 0) return '0 registros';
    const from = this.page() * this.pageSize + 1;
    const to = Math.min((this.page() + 1) * this.pageSize, t);
    return `${from}–${to} de ${t}`;
  });

  private load$ = new Subject<{ q: string; page: number }>();

  ngOnInit(): void {
    const modo: ModoAlumnos =
      this.route.snapshot.data['modoAlumnos'] === 'jornadas' ? 'jornadas' : 'general';
    this.modo.set(modo);
    const vistaKey = modo === 'jornadas' ? VISTA_STORAGE_KEY_JORNADA : VISTA_STORAGE_KEY_GENERAL;
    this.vista.set(readVistaLista(vistaKey));

    forkJoin({
      jornada: this.catSvc.list<Record<string, unknown>>('jornada'),
      estadoCivil: this.catSvc.list<Record<string, unknown>>('estadoCivil'),
    }).subscribe({
      next: ({ jornada, estadoCivil }) => {
        this.jornadaLabels = buildCatalogoLabelMap(jornada, JORNADAS_DEF, ['idJornada', 'id', 'codigo']);
        this.estadoCivilLabels = buildCatalogoLabelMap(estadoCivil, ESTADOS_CIVIL_DEF, [
          'idEstadoCivil',
          'id',
          'codigo',
        ]);
        this.catalogosReady.update((n) => n + 1);
      },
      error: () => {
        this.jornadaLabels = buildCatalogoLabelMap([], JORNADAS_DEF, ['idJornada', 'id', 'codigo']);
        this.estadoCivilLabels = buildCatalogoLabelMap([], ESTADOS_CIVIL_DEF, ['idEstadoCivil', 'id', 'codigo']);
        this.catalogosReady.update((n) => n + 1);
      },
    });

    this.load$
      .pipe(
        debounceTime(280),
        switchMap(({ q, page }) => {
          this.loading.set(true);
          const opts: { q: string; limit: number; skip: number; tipoAlumno?: string } = {
            q,
            limit: this.pageSize,
            skip: page * this.pageSize,
          };
          if (this.modo() === 'jornadas') {
            opts.tipoAlumno = TIPO_JORNADAS_CAPACITACION;
          }
          return this.alumnoSvc.listar(opts);
        }),
      )
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.items.set(res.items || []);
          this.total.set(res.total ?? 0);
        },
        error: () => {
          this.loading.set(false);
          this.items.set([]);
          this.total.set(0);
        },
      });

    this.cargar();
  }

  cargar() {
    this.load$.next({ q: this.query().trim(), page: this.page() });
  }

  onBuscar(v: string) {
    this.query.set(v);
    this.page.set(0);
    this.cargar();
  }

  setVista(v: VistaAlumnos) {
    this.vista.set(v);
    const vistaKey =
      this.modo() === 'jornadas' ? VISTA_STORAGE_KEY_JORNADA : VISTA_STORAGE_KEY_GENERAL;
    saveVistaLista(vistaKey, v);
  }

  iniciales(r: AlumnoListItem): string {
    const a = (r.nombre1 || r.nombres || '?').charAt(0);
    const b = (r.apellido1 || r.apellidos || '').charAt(0);
    return `${a}${b}`.toUpperCase();
  }

  paginaAnterior() {
    if (this.page() <= 0) return;
    this.page.update((p) => p - 1);
    this.cargar();
  }

  paginaSiguiente() {
    if (this.page() >= this.totalPages() - 1) return;
    this.page.update((p) => p + 1);
    this.cargar();
  }

  nuevo() {
    void this.router.navigate([this.rutas().nuevo]);
  }

  abrir(item: AlumnoListItem) {
    const id = item?._id ? String(item._id) : '';
    if (!id) return;
    void this.router.navigate([this.rutas().ficha(id)]);
  }

  abrirTab(item: AlumnoListItem, tab: 'documentos' | 'pagos', ev: Event) {
    ev.stopPropagation();
    const id = item?._id ? String(item._id) : '';
    if (!id) return;
    void this.router.navigate([this.rutas().ficha(id)], { queryParams: { tab } });
  }

  irHubJornadas() {
    void this.router.navigate([this.rutas().hubJornadas]);
  }

  tieneAlarmas(r: AlumnoListItem): boolean {
    const i = r.indicadores;
    return !!(i && (i.docsPendientes > 0 || i.saldosPendientes > 0));
  }

  tituloDocs(r: AlumnoListItem): string {
    const n = r.indicadores?.docsPendientes ?? 0;
    return n ? `${n} documento(s) pendiente(s)` : '';
  }

  tituloSaldo(r: AlumnoListItem): string {
    const i = r.indicadores;
    if (!i?.saldosPendientes) return '';
    return `${i.saldosPendientes} saldo(s) pendiente(s) · ${this.fmtSaldo(i.saldoTotal)}`;
  }

  fmtSaldo(v: number): string {
    return (v || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  fotoUrl(f?: string): string | null {
    if (!f) return null;
    if (f.startsWith('http')) return f;
    return `${this.uploads}/${f}`;
  }

  capDoc = capDoc;
  formatNumDoc = formatNumDoc;
  capCelular = capCelular;
  capMunicipio = capMunicipio;
  capJornada = capJornada;
  capEstadoCivil = capEstadoCivil;
  capFecha = capFecha;

  nombreCompleto(r: AlumnoListItem): string {
    if (r.nombreCompleto) return r.nombreCompleto;
    return `${r.nombre1 || ''} ${r.nombre2 || ''} ${r.apellido1 || ''} ${r.apellido2 || ''}`.replace(/\s+/g, ' ').trim();
  }

  formatFecha(v?: string | Date | null): string {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  textoMunicipio(r: AlumnoListItem): string {
    if (r.munOrigenLabel) return r.munOrigenLabel;
    const cod = r.codMunicipio || r.munOrigen;
    return cod ? String(cod) : '—';
  }

  labelJornada(r: AlumnoListItem): string {
    this.catalogosReady();
    if (r.jornadaLabel) return r.jornadaLabel;
    const t = catalogoLabel(this.jornadaLabels, r.jornada);
    return t || '—';
  }

  labelEstadoCivil(r: AlumnoListItem): string {
    this.catalogosReady();
    if (r.estadoCivilLabel) return r.estadoCivilLabel;
    const t = catalogoLabel(this.estadoCivilLabels, r.estadoCivil);
    return t || '—';
  }
}
