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
import { AuthService } from '../../core/services/auth.service';
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
  private auth = inject(AuthService);
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
  editandoKey = signal<string | null>(null);
  borradorClases = signal<ProgresoAlumnoVirtualClase[]>([]);
  borradorPctCurso = signal<number>(0);
  borradorIntentos = signal<ProgresoAlumnoVirtualIntento[]>([]);
  borradorAprobado = signal<boolean | null>(null);

  puedeGestionar(): boolean {
    if (this.auth.isAdmin()) return true;
    if (this.permisos.tiene('*')) return true;
    return this.permisos.tiene(['aula_virtual.gestionar', 'alumnos.gestionar']);
  }

  abrirGestion(row: ProgresoAlumnoVirtualItem, ev?: Event): void {
    ev?.stopPropagation();
    const key = this.trackRow(row);
    this.expandido.set(key);
    this.iniciarEdicion(row);
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
    if (this.expandido() === key) {
      this.expandido.set(null);
      this.editandoKey.set(null);
      return;
    }
    this.expandido.set(key);
    if (this.puedeGestionar()) this.iniciarEdicion(row);
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

  estaEditando(row: ProgresoAlumnoVirtualItem): boolean {
    return this.editandoKey() === this.trackRow(row);
  }

  iniciarEdicion(row: ProgresoAlumnoVirtualItem, ev?: Event): void {
    ev?.stopPropagation();
    if (!this.puedeGestionar()) return;
    const key = this.trackRow(row);
    this.editandoKey.set(key);
    this.borradorClases.set(this.clasesDetalle(row).map((c) => ({ ...c })));
    this.borradorPctCurso.set(this.pct(row));
    this.borradorIntentos.set(this.intentosDe(row).map((i) => ({ ...i })));
    this.borradorAprobado.set(row.progreso?.aprobado ? true : false);
  }

  cancelarEdicion(ev?: Event): void {
    ev?.stopPropagation();
    this.editandoKey.set(null);
  }

  clasesEnEdicion(row: ProgresoAlumnoVirtualItem): ProgresoAlumnoVirtualClase[] {
    return this.estaEditando(row) ? this.borradorClases() : this.clasesDetalle(row);
  }

  intentosEnEdicion(row: ProgresoAlumnoVirtualItem): ProgresoAlumnoVirtualIntento[] {
    return this.estaEditando(row) ? this.borradorIntentos() : this.intentosDe(row);
  }

  actualizarPctClase(row: ProgresoAlumnoVirtualItem, numero: number, raw: string): void {
    if (!this.estaEditando(row)) return;
    const n = Math.min(100, Math.max(0, Number(raw) || 0));
    this.borradorClases.update((list) =>
      list.map((c) =>
        c.numero === numero ? { ...c, pct: n, aprobada: n >= this.notaClaseAprobada() } : c,
      ),
    );
    this.recalcBorradorPctDesdeClases(row);
  }

  /** Calcula avance global como promedio de todas las lecciones del curso. */
  recalcBorradorPctDesdeClases(row: ProgresoAlumnoVirtualItem): void {
    const clases = this.borradorClases();
    const total = Math.max(
      row.progreso?.totalClases ?? 0,
      ...clases.map((c) => c.numero),
      clases.length ? 0 : 7,
    );
    let suma = 0;
    for (let i = 1; i <= total; i++) {
      suma += clases.find((c) => c.numero === i)?.pct ?? 0;
    }
    this.borradorPctCurso.set(Math.round(suma / total));
  }

  actualizarNotaIntento(row: ProgresoAlumnoVirtualItem, numero: number, raw: string): void {
    if (!this.estaEditando(row)) return;
    const n = Math.min(100, Math.max(0, Number(raw) || 0));
    this.borradorIntentos.update((list) =>
      list.map((it) => (it.numero === numero ? { ...it, nota: n } : it)),
    );
  }

  actualizarAvanceIntento(row: ProgresoAlumnoVirtualItem, numero: number, raw: string): void {
    if (!this.estaEditando(row)) return;
    const n = Math.min(100, Math.max(0, Number(raw) || 0));
    this.borradorIntentos.update((list) =>
      list.map((it) => (it.numero === numero ? { ...it, pctCompletitud: n } : it)),
    );
  }

  agregarIntentoEval(row: ProgresoAlumnoVirtualItem, ev?: Event): void {
    ev?.stopPropagation();
    if (!this.estaEditando(row)) return;
    const list = this.borradorIntentos();
    const max = this.intentosMaxEval(row);
    if (list.length >= max) {
      this.msgAccionError.set(true);
      this.msgAccion.set(
        `El curso permite ${max} intento(s). Puede quitar uno o aumentar el límite en la config del curso.`,
      );
      return;
    }
    const numero = list.length + 1;
    this.borradorIntentos.update((l) => [
      ...l,
      {
        numero,
        nota: 0,
        pctCompletitud: this.borradorPctCurso(),
        aprobado: false,
        fecha: new Date().toISOString(),
      },
    ]);
    this.msgAccion.set(null);
  }

  quitarIntentoBorrador(row: ProgresoAlumnoVirtualItem, numero: number, ev?: Event): void {
    ev?.stopPropagation();
    if (!this.estaEditando(row)) return;
    this.borradorIntentos.update((list) =>
      list.filter((it) => it.numero !== numero).map((it, idx) => ({ ...it, numero: idx + 1 })),
    );
  }

  async guardarEdicion(row: ProgresoAlumnoVirtualItem, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    if (!this.puedeGestionar() || !this.estaEditando(row) || this.estaAccionando(row)) return;
    const nd = this.docFila(row);
    const idProg = this.idCursoFila(row);
    if (!nd || !idProg) return;

    const key = this.trackRow(row);
    this.accionando.set(key);
    this.msgAccion.set(null);

    const clases = this.borradorClases().map((c) => ({
      numero: c.numero,
      pct: c.pct,
      aprobada: c.aprobada,
    }));
    const intentos = this.borradorIntentos().map((it) => ({
      nota: it.nota,
      pctCompletitud: it.pctCompletitud ?? undefined,
      aprobado: it.aprobado,
      fecha: it.fecha ?? undefined,
    }));

    this.svc
      .actualizarProgresoAlumnoCurso(nd, idProg, {
        clases,
        intentos,
        pctCompletitud: this.borradorPctCurso(),
        aprobado: this.borradorAprobado() ?? undefined,
      })
      .subscribe({
        next: (r) => {
          this.accionando.set(null);
          this.editandoKey.set(null);
          this.msgAccionError.set(false);
          this.msgAccion.set(r.message || 'Progreso guardado.');
          this.cargar();
        },
        error: (e) => {
          this.accionando.set(null);
          this.msgAccionError.set(true);
          this.msgAccion.set(e?.error?.message || 'No se pudo guardar el progreso.');
        },
      });
  }

  private reiniciarConAlcance(
    row: ProgresoAlumnoVirtualItem,
    alcance: 'completo' | 'evaluaciones' | 'lecciones',
    titulo: string,
    mensaje: string,
    ev?: Event,
  ): void {
    ev?.stopPropagation();
    if (!this.puedeGestionar() || this.estaAccionando(row)) return;
    const nd = this.docFila(row);
    const idProg = this.idCursoFila(row);
    if (!nd || !idProg) return;

    void this.confirm
      .open({
        title: titulo,
        message: mensaje + this.avisoCertificado(row) + ' ¿Continuar?',
        variant: 'danger',
        confirmLabel: 'Sí, continuar',
      })
      .then((ok) => {
        if (!ok) return;
        const key = this.trackRow(row);
        this.accionando.set(key);
        this.msgAccion.set(null);
        this.editandoKey.set(null);
        this.svc.reiniciarProgresoAlumnoCurso(nd, idProg, { alcance }).subscribe({
          next: (r) => {
            this.accionando.set(null);
            this.msgAccionError.set(false);
            this.msgAccion.set(r.message || 'Listo.');
            this.cargar();
          },
          error: (e) => {
            this.accionando.set(null);
            this.msgAccionError.set(true);
            this.msgAccion.set(e?.error?.message || 'No se pudo completar la acción.');
          },
        });
      });
  }

  reiniciarProgreso(row: ProgresoAlumnoVirtualItem, ev?: Event): void {
    this.reiniciarConAlcance(
      row,
      'completo',
      'Reiniciar todo el curso',
      `Se borrará por completo el avance, lecciones e intentos de «${this.nombreCursoFila(row)}» para ${this.fmtDoc(this.docFila(row))}. La matrícula y el saldo se conservan.`,
      ev,
    );
  }

  borrarEvaluaciones(row: ProgresoAlumnoVirtualItem, ev?: Event): void {
    this.reiniciarConAlcance(
      row,
      'evaluaciones',
      'Borrar evaluaciones / pruebas',
      `Se eliminarán todos los intentos de la evaluación final de «${this.nombreCursoFila(row)}». El avance por lección se mantiene.`,
      ev,
    );
  }

  borrarLecciones(row: ProgresoAlumnoVirtualItem, ev?: Event): void {
    this.reiniciarConAlcance(
      row,
      'lecciones',
      'Borrar avance de lecciones',
      `Se pondrá en cero el avance por lección de «${this.nombreCursoFila(row)}». Los intentos de evaluación se conservan.`,
      ev,
    );
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
