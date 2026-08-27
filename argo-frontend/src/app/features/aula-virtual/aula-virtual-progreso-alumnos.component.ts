import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AulaVirtualAdminService,
  ProgresoAlumnoVirtualClase,
  ProgresoAlumnoVirtualIntento,
  ProgresoAlumnoVirtualItem,
} from '../../core/services/aula-virtual-admin.service';
import { formatNumDoc } from '../../core/utils/num-doc.helpers';
import { PermisoService } from '../../core/services/permiso.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

type ReglasCurso = {
  modoCertificado: string;
  pctMinCompletitud: number;
  pctMinEvaluaciones: number;
  intentosMaxEval: number;
};

@Component({
  selector: 'argo-aula-virtual-progreso-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './aula-virtual-progreso-alumnos.component.html',
  styleUrls: ['./aula-virtual-progreso-alumnos.component.scss'],
})
export class AulaVirtualProgresoAlumnosComponent implements OnChanges {
  private svc = inject(AulaVirtualAdminService);
  private permisos = inject(PermisoService);
  private confirm = inject(ConfirmDialogService);

  /** Curso concreto (vista desde ficha del curso). */
  @Input() idPrograma?: string;
  /** Alumno concreto (vista desde ficha del alumno). */
  @Input() numDoc?: number | string | null;
  /** true = listar cursos del alumno en lugar de alumnos del curso. */
  @Input() modoAlumno = false;
  @Input() reloadTick = 0;

  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<ProgresoAlumnoVirtualItem[]>([]);
  reglas = signal<ReglasCurso | null>(null);
  total = signal(0);
  skip = signal(0);
  readonly limit = 20;

  buscar = '';
  filtro = '';
  expandido = signal<string | null>(null);
  accionando = signal<string | null>(null);
  msgAccion = signal<string | null>(null);
  msgAccionError = signal(false);

  puedeGestionar(): boolean {
    return this.permisos.tiene('aula_virtual.gestionar');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idPrograma'] || changes['numDoc'] || changes['modoAlumno'] || changes['reloadTick']) {
      this.skip.set(0);
      this.cargar();
    }
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);

    if (this.modoAlumno || this.numDoc != null) {
      const nd = this.numDoc;
      if (nd == null || nd === '') {
        this.items.set([]);
        this.total.set(0);
        this.loading.set(false);
        return;
      }
      this.svc
        .listarProgresoAlumno(nd, {
          filtro: this.filtro || undefined,
          skip: this.skip(),
          limit: this.limit,
        })
        .subscribe({
          next: (r) => {
            this.items.set(r.items || []);
            this.total.set(r.total || 0);
            this.reglas.set(null);
            this.loading.set(false);
          },
          error: (e) => {
            this.error.set(e?.error?.message || 'No se pudo cargar el progreso virtual');
            this.loading.set(false);
          },
        });
      return;
    }

    if (!this.idPrograma) {
      this.loading.set(false);
      return;
    }
    this.svc
      .listarProgresoAlumnos(this.idPrograma, {
        q: this.buscar.trim() || undefined,
        filtro: this.filtro || undefined,
        skip: this.skip(),
        limit: this.limit,
      })
      .subscribe({
        next: (r) => {
          this.items.set(r.items || []);
          this.total.set(r.total || 0);
          this.reglas.set(r.reglas);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(e?.error?.message || 'No se pudo cargar el progreso');
          this.loading.set(false);
        },
      });
  }

  buscarAlumnos(): void {
    this.skip.set(0);
    this.cargar();
  }

  cambiarFiltro(f: string): void {
    this.filtro = f;
    this.skip.set(0);
    this.cargar();
  }

  paginaAnterior(): void {
    const s = Math.max(0, this.skip() - this.limit);
    if (s === this.skip()) return;
    this.skip.set(s);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.skip() + this.limit >= this.total()) return;
    this.skip.set(this.skip() + this.limit);
    this.cargar();
  }

  fmtDoc(n: number | string): string {
    return formatNumDoc(n);
  }

  fmtFecha(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  fmtFechaMat(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }

  claseConexion(codigo: string): string {
    if (codigo === 'en_linea') return 'av-score-conn--live';
    if (codigo === 'reciente') return 'av-score-conn--recent';
    if (codigo === 'desconectado') return 'av-score-conn--off';
    return 'av-score-conn--none';
  }

  fichaLink(row: ProgresoAlumnoVirtualItem): string[] | null {
    if (this.modoAlumno) return null;
    return row.alumnoId ? ['/app/alumnos', row.alumnoId] : null;
  }

  cursoLink(row: ProgresoAlumnoVirtualItem): string[] | null {
    if (!this.modoAlumno || !row.idPrograma) return null;
    return ['/app/aula-virtual/cursos', String(row.idPrograma)];
  }

  cursoQuery(row: ProgresoAlumnoVirtualItem): { tab: string } {
    return { tab: 'alumnos' };
  }

  trackRow(row: ProgresoAlumnoVirtualItem): string {
    if (this.modoAlumno && row.idPrograma) return String(row.idPrograma);
    return String(row.numDoc);
  }

  tituloTarjeta(row: ProgresoAlumnoVirtualItem): string {
    if (this.modoAlumno) return row.nombrePrograma || 'Curso virtual';
    return row.nombreCompleto || '—';
  }

  subtituloTarjeta(row: ProgresoAlumnoVirtualItem): string {
    if (this.modoAlumno) {
      return `Matriculado ${this.fmtFechaMat(row.fechaMat)}`;
    }
    return `CC ${this.fmtDoc(row.numDoc)} · Matriculado ${this.fmtFechaMat(row.fechaMat)}`;
  }

  private reglasItem(row?: ProgresoAlumnoVirtualItem | null): ReglasCurso {
    if (row?.reglas) return row.reglas;
    if (this.reglas()) return this.reglas()!;
    return {
      modoCertificado: 'al_pagar',
      pctMinCompletitud: 80,
      pctMinEvaluaciones: 60,
      intentosMaxEval: 3,
    };
  }

  toggleExpand(row: ProgresoAlumnoVirtualItem): void {
    const key = this.trackRow(row);
    this.expandido.update((v) => (v === key ? null : key));
  }

  estaExpandido(row: ProgresoAlumnoVirtualItem): boolean {
    return this.expandido() === this.trackRow(row);
  }

  pctMinCompletitud(row?: ProgresoAlumnoVirtualItem): number {
    return this.reglasItem(row).pctMinCompletitud;
  }

  notaMinima(row?: ProgresoAlumnoVirtualItem): number {
    return this.reglasItem(row).pctMinEvaluaciones;
  }

  intentosMaxEval(row?: ProgresoAlumnoVirtualItem): number {
    return this.reglasItem(row).intentosMaxEval;
  }

  pct(row: ProgresoAlumnoVirtualItem): number {
    return row.progreso?.pctCompletitud ?? 0;
  }

  clasesDetalle(row: ProgresoAlumnoVirtualItem): ProgresoAlumnoVirtualClase[] {
    const clases = row.progreso?.clases || [];
    const total = Math.max(
      row.progreso?.totalClases ?? 0,
      ...clases.map((c) => c.numero),
      clases.length ? 0 : 7,
    );
    const map = new Map(clases.map((c) => [c.numero, c]));
    const out: ProgresoAlumnoVirtualClase[] = [];
    for (let i = 1; i <= total; i++) {
      out.push(map.get(i) ?? { numero: i, pct: 0, aprobada: false });
    }
    return out;
  }

  leccionesConNotaCount(row: ProgresoAlumnoVirtualItem): number {
    return this.clasesDetalle(row).filter((c) => c.pct > 0).length;
  }

  promedioLecciones(row: ProgresoAlumnoVirtualItem): number | null {
    const p = row.progreso?.promedioClases;
    return p != null ? p : null;
  }

  sumaPuntajesLecciones(row: ProgresoAlumnoVirtualItem): number {
    return this.clasesDetalle(row).reduce((acc, c) => acc + c.pct, 0);
  }

  intentosDe(row: ProgresoAlumnoVirtualItem): ProgresoAlumnoVirtualIntento[] {
    return row.progreso?.intentos || [];
  }

  intentosRestantes(row: ProgresoAlumnoVirtualItem): number {
    return (
      row.progreso?.intentosRestantes ??
      Math.max(0, this.intentosMaxEval(row) - (row.progreso?.intentosEval ?? 0))
    );
  }

  puedeReintentar(row: ProgresoAlumnoVirtualItem): boolean {
    return this.intentosRestantes(row) > 0 && !this.cumpleRequisitosCurso(row);
  }

  cumpleRequisitosCurso(row: ProgresoAlumnoVirtualItem): boolean {
    if (row.progreso?.aprobado) return true;
    return this.cumpleCompletitud(row) && this.cumpleNotaEval(row);
  }

  mejorNota(row: ProgresoAlumnoVirtualItem): number | null {
    const p = row.progreso;
    if (p?.mejorNotaEval != null) return p.mejorNotaEval;
    const intentos = this.intentosDe(row);
    if (!intentos.length) return null;
    return Math.max(...intentos.map((i) => i.nota));
  }

  ultimaNotaEval(row: ProgresoAlumnoVirtualItem): number | null {
    const p = row.progreso;
    if (p?.ultimaNotaEval != null && p.ultimaNotaEval > 0) return p.ultimaNotaEval;
    const intentos = this.intentosDe(row);
    if (!intentos.length) return null;
    return intentos[intentos.length - 1].nota;
  }

  cumpleCompletitud(row: ProgresoAlumnoVirtualItem): boolean {
    if (row.progreso?.cumpleCompletitud != null) return row.progreso.cumpleCompletitud;
    return this.pct(row) >= this.pctMinCompletitud(row);
  }

  cumpleNotaEval(row: ProgresoAlumnoVirtualItem): boolean {
    if (row.progreso?.cumpleNota != null) return row.progreso.cumpleNota;
    const mn = this.mejorNota(row);
    return mn != null && mn >= this.notaMinima(row);
  }

  estadoAlumno(row: ProgresoAlumnoVirtualItem): string {
    if (row.progreso?.certificadoEmitido) return 'Certificado emitido';
    if (row.progreso?.aprobado) return 'Aprobado';
    if (row.progreso?.sinIniciar) return 'Sin iniciar';
    if (this.pct(row) > 0 || this.leccionesConNotaCount(row) > 0 || this.intentosDe(row).length) {
      return 'En progreso';
    }
    return 'Sin iniciar';
  }

  tonoEstado(row: ProgresoAlumnoVirtualItem): string {
    if (row.progreso?.certificadoEmitido) return 'cyan';
    if (row.progreso?.aprobado) return 'green';
    if (row.progreso?.sinIniciar && this.pct(row) <= 0) return 'soft';
    return 'amber';
  }

  notaClaseAprobada(): number {
    return 70;
  }

  claseNotaTone(pct: number): 'ok' | 'mid' | 'low' {
    if (pct >= this.notaClaseAprobada()) return 'ok';
    if (pct >= 50) return 'mid';
    return 'low';
  }

  notaTone(nota: number, min?: number): 'ok' | 'mid' | 'low' {
    const m = min ?? this.notaMinima();
    if (nota >= m) return 'ok';
    if (nota >= m - 15) return 'mid';
    return 'low';
  }

  labelResultadoIntento(it: ProgresoAlumnoVirtualIntento, row: ProgresoAlumnoVirtualItem): string {
    if (it.aprobado) return 'Aprobó';
    if (it.motivoNoAprobado === 'avance_insuficiente') return 'Avance insuficiente';
    if (it.motivoNoAprobado === 'nota_insuficiente') return 'Nota insuficiente';
    if (it.motivoNoAprobado === 'nota_y_avance') return 'Nota y avance bajos';
    const minNota = this.notaMinima(row);
    const minAvance = this.pctMinCompletitud(row);
    const pctAvance = it.pctCompletitud ?? 0;
    if (it.nota >= minNota && pctAvance < minAvance) return 'Avance insuficiente';
    return 'No aprobó';
  }

  tonoResultadoIntento(it: ProgresoAlumnoVirtualIntento, row: ProgresoAlumnoVirtualItem): 'ok' | 'warn' | 'bad' {
    if (it.aprobado) return 'ok';
    if (this.labelResultadoIntento(it, row) === 'Avance insuficiente') return 'warn';
    return 'bad';
  }

  alumnoInactivo(row: ProgresoAlumnoVirtualItem): boolean {
    return !!(row.progreso?.sinIniciar && this.pct(row) <= 0);
  }

  docFila(row: ProgresoAlumnoVirtualItem): string {
    return String(row.numDoc ?? this.numDoc ?? '');
  }

  idCursoFila(row: ProgresoAlumnoVirtualItem): string {
    return String(row.idPrograma ?? this.idPrograma ?? '');
  }

  nombreCursoFila(row: ProgresoAlumnoVirtualItem): string {
    return row.nombrePrograma || this.idCursoFila(row) || 'curso virtual';
  }

  estaAccionando(row: ProgresoAlumnoVirtualItem): boolean {
    return this.accionando() === this.trackRow(row);
  }

  private avisoCertificado(row: ProgresoAlumnoVirtualItem): string {
    if (!row.progreso?.certificadoEmitido && !row.certificado?.codigoCert) return '';
    const cod = row.certificado?.codigoCert ? ` (${row.certificado.codigoCert})` : '';
    return ` Este alumno ya tiene certificado emitido${cod}; el documento en archivo no se borra automáticamente.`;
  }

  async reiniciarProgreso(row: ProgresoAlumnoVirtualItem, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    if (!this.puedeGestionar() || this.estaAccionando(row)) return;

    const nd = this.docFila(row);
    const idProg = this.idCursoFila(row);
    if (!nd || !idProg) return;

    const ok = await this.confirm.open({
      title: 'Reiniciar progreso',
      message:
        `Se borrará el avance, notas e intentos de «${this.nombreCursoFila(row)}» para el documento ${this.fmtDoc(nd)}. ` +
        'La matrícula y el saldo (si existe) se conservan.' +
        this.avisoCertificado(row) +
        ' ¿Continuar?',
      variant: 'danger',
      confirmLabel: 'Sí, reiniciar progreso',
    });
    if (!ok) return;

    const key = this.trackRow(row);
    this.accionando.set(key);
    this.msgAccion.set(null);
    this.svc.reiniciarProgresoAlumnoCurso(nd, idProg).subscribe({
      next: (r) => {
        this.accionando.set(null);
        this.msgAccionError.set(false);
        this.msgAccion.set(r.message || 'Progreso reiniciado.');
        this.cargar();
      },
      error: (e) => {
        this.accionando.set(null);
        this.msgAccionError.set(true);
        this.msgAccion.set(e?.error?.message || 'No se pudo reiniciar el progreso.');
      },
    });
  }

  async anularMatricula(row: ProgresoAlumnoVirtualItem, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    if (!this.puedeGestionar() || this.estaAccionando(row)) return;

    const nd = this.docFila(row);
    const idProg = this.idCursoFila(row);
    if (!nd || !idProg) return;

    const ok = await this.confirm.open({
      title: 'Anular matrícula virtual',
      message:
        `Se anulará la matrícula en «${this.nombreCursoFila(row)}» para el documento ${this.fmtDoc(nd)}. ` +
        'El alumno dejará de ver el curso en el portal y se borrará su progreso.' +
        (row.pago?.pagado ? ' El pago registrado se conserva en contabilidad.' : '') +
        this.avisoCertificado(row) +
        ' ¿Continuar?',
      variant: 'danger',
      confirmLabel: 'Sí, anular matrícula',
    });
    if (!ok) return;

    const key = this.trackRow(row);
    this.accionando.set(key);
    this.msgAccion.set(null);
    this.svc.anularMatriculaAlumnoCurso(nd, idProg).subscribe({
      next: (r) => {
        this.accionando.set(null);
        this.msgAccionError.set(false);
        this.msgAccion.set(r.message || 'Matrícula anulada.');
        this.cargar();
      },
      error: (e) => {
        this.accionando.set(null);
        this.msgAccionError.set(true);
        this.msgAccion.set(e?.error?.message || 'No se pudo anular la matrícula.');
      },
    });
  }
}
