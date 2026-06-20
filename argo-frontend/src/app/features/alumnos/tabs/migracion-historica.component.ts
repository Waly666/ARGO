import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';

import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { LiquidacionItem, LiquidacionService } from '../../../core/services/liquidacion.service';
import { IngresoService } from '../../../core/services/ingreso.service';
import { MigracionMovimientosService } from '../../../core/services/migracion-movimientos.service';
import { ProgramaService } from '../../../core/services/programa.service';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { esTarifaVirtualMatricula } from '../catalogo.helpers';

const FORMAS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta debito', 'Tarjeta de Credito'];

@Component({
  selector: 'argo-migracion-historica',
  standalone: true,
  imports: [CommonModule, FormsModule, CatalogoEnumBuscarComponent],
  templateUrl: './migracion-historica.component.html',
  styleUrls: ['./migracion-historica.component.scss'],
})
export class MigracionHistoricaComponent {
  store = inject(AlumnoStore);
  private migSvc = inject(MigracionMovimientosService);
  private progSvc = inject(ProgramaService);
  private liqSvc = inject(LiquidacionService);
  private ingSvc = inject(IngresoService);

  estado = signal<{ puedeUsar: boolean; habilitado: boolean; prefijoRecibo: string } | null>(null);
  msg = signal<string | null>(null);
  msgEsError = signal(false);
  loading = signal(false);

  idProg = signal('');
  textoProgramaLabel = signal('');
  programaDetalle = signal<Record<string, unknown> | null>(null);
  serviciosMatriculaProg = signal<Record<string, unknown>[]>([]);
  tarifa: 1 | 2 | 3 | 4 = 1;
  valorHistorico: number | null = null;
  private valorHistoricoManual = false;
  fechaMat = '';
  semestreHasta: number | null = null;
  observacionesMat = '';

  liquidaciones = signal<LiquidacionItem[]>([]);
  idLiquidacionPago = signal('');
  valorPago: number | null = null;
  numRecibo = '';
  fechaPago = '';
  formaPago = 'Efectivo';
  observacionesPago = '';

  pagosMigracion = signal<Record<string, unknown>[]>([]);

  readonly formasPago = FORMAS_PAGO;

  usaSemestres = computed(() => {
    const s = Number(this.programaDetalle()?.['semestres']);
    return Number.isFinite(s) && s >= 1;
  });

  maxSemestres = computed(() => {
    const s = Number(this.programaDetalle()?.['semestres']);
    return Number.isFinite(s) && s >= 1 ? s : this.serviciosMatriculaProg().length || 1;
  });

  liquidacionesPendientes = computed(() =>
    this.liquidaciones().filter((l) => this.num(l.saldo) > 0.0001),
  );

  liquidacionSel = computed(() =>
    this.liquidacionesPendientes().find((l) => String(l._id) === this.idLiquidacionPago()) || null,
  );

  buscarProgramasRemoto = (q: string) =>
    this.progSvc.listar({ q: q.trim() || undefined, catalogo: true, limit: 40 }).pipe(
      map((rows) =>
        (rows || []).map((p) => ({
          value: String(p.idPrograma ?? p._id ?? p.codigoProg),
          label: [p.codigoProg, p.nombreProg || p.descripcion].filter(Boolean).join(' — '),
        })),
      ),
    );

  constructor() {
    this.migSvc.estado().subscribe({
      next: (st) =>
        this.estado.set({
          puedeUsar: st.puedeUsar,
          habilitado: st.habilitado,
          prefijoRecibo: st.prefijoRecibo || 'MIG-',
        }),
      error: () => this.estado.set({ puedeUsar: false, habilitado: false, prefijoRecibo: 'MIG-' }),
    });

    effect(() => {
      const nd = this.store.numDoc();
      if (nd == null) {
        this.liquidaciones.set([]);
        this.pagosMigracion.set([]);
        return;
      }
      this.recargar(nd);
    });

    effect(() => {
      const liq = this.liquidacionSel();
      if (liq && this.valorPago == null) {
        this.valorPago = this.num(liq.saldo);
      }
    });
  }

  textoPrograma(): string {
    return this.textoProgramaLabel();
  }

  num(v: unknown): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && v !== null && '$numberDecimal' in v) {
      return Number((v as { $numberDecimal: string }).$numberDecimal) || 0;
    }
    return Number(v) || 0;
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      n || 0,
    );
  }

  fechaFmt(v: unknown): string {
    if (!v) return '—';
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO');
  }

  recargar(numDoc: number | string) {
    this.liqSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => this.liquidaciones.set(r.items || []),
      error: () => this.liquidaciones.set([]),
    });
    this.ingSvc.listarPorAlumno(numDoc).subscribe({
      next: (rows) =>
        this.pagosMigracion.set(
          (rows || []).filter(
            (p) =>
              p['origenMigracion'] === true ||
              String(p['tipoIngreso'] || '').toUpperCase() === 'MIGRACION' ||
              String(p['idTipoPago'] || '').toUpperCase() === 'MIGRACION',
          ),
        ),
      error: () => this.pagosMigracion.set([]),
    });
  }

  setMsg(text: string | null, err = false) {
    this.msg.set(text);
    this.msgEsError.set(err);
  }

  valorCatalogoReferencia(): number {
    const servs = this.serviciosMatriculaProg();
    if (!servs.length) return 0;
    const t = this.tarifa;
    const nSem = this.usaSemestres()
      ? Math.min(
          Math.max(1, Math.round(Number(this.semestreHasta) || servs.length)),
          servs.length,
        )
      : 1;
    const slice = this.usaSemestres() ? servs.slice(0, nSem) : servs.slice(0, 1);
    if (esTarifaVirtualMatricula(t)) {
      return slice.reduce((acc, s) => acc + this.num(s['tarifaVirtual']), 0);
    }
    return slice.reduce((acc, s) => {
      const v = s[`tarifa${t}`];
      if (v != null && v !== '') return acc + this.num(v);
      return acc + this.num(s['tarifa1']);
    }, 0);
  }

  private sincronizarValorHistorico(): void {
    if (this.valorHistoricoManual) return;
    this.valorHistorico = this.valorCatalogoReferencia();
  }

  onTarifaChange(): void {
    this.sincronizarValorHistorico();
  }

  onSemestreHastaChange(): void {
    this.sincronizarValorHistorico();
  }

  onValorHistoricoChange(): void {
    this.valorHistoricoManual = true;
  }

  onProgramaPick(opt: EnumBuscarOption): void {
    const id = String(opt.value);
    this.textoProgramaLabel.set(opt.label);
    this.idProg.set(id);
    this.programaDetalle.set(null);
    this.serviciosMatriculaProg.set([]);
    this.semestreHasta = null;
    this.valorHistorico = null;
    this.valorHistoricoManual = false;
    this.progSvc.obtener(id).subscribe({
      next: (det) => {
        this.programaDetalle.set(det.programa as unknown as Record<string, unknown>);
        const servs = det.servicios?.length ? det.servicios : det.servicio ? [det.servicio] : [];
        this.serviciosMatriculaProg.set(servs as Record<string, unknown>[]);
        const sem = Number(det.programa?.semestres);
        if (Number.isFinite(sem) && sem >= 1) this.semestreHasta = sem;
        this.sincronizarValorHistorico();
      },
      error: () => this.setMsg('No se pudo cargar el programa.', true),
    });
  }

  onProgramaLimpiar(): void {
    this.idProg.set('');
    this.textoProgramaLabel.set('');
    this.programaDetalle.set(null);
    this.serviciosMatriculaProg.set([]);
    this.semestreHasta = null;
    this.valorHistorico = null;
    this.valorHistoricoManual = false;
  }

  crearMatriculaHistorica(): void {
    const nd = this.store.numDoc();
    if (nd == null) {
      this.setMsg('Seleccione un alumno.', true);
      return;
    }
    if (!this.idProg()) {
      this.setMsg('Seleccione un programa actual de ARGO.', true);
      return;
    }
    if (!this.fechaMat) {
      this.setMsg('Indique la fecha histórica de matrícula.', true);
      return;
    }
    const valorHist = Math.round(Number(this.valorHistorico));
    if (!Number.isFinite(valorHist) || valorHist < 0) {
      this.setMsg('Indique el valor histórico de la matrícula.', true);
      return;
    }
    this.loading.set(true);
    this.setMsg(null, false);
    this.migSvc
      .matriculaHistorica({
        numDoc: nd,
        idPrograma: this.idProg(),
        tarifa: this.tarifa,
        valorHistorico: valorHist,
        fechaMat: this.fechaMat,
        semestreHasta: this.usaSemestres() ? this.semestreHasta ?? undefined : undefined,
        observaciones: this.observacionesMat.trim() || 'Matrícula histórica (migración)',
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.onProgramaLimpiar();
          this.observacionesMat = '';
          this.store.touchLiquidacion();
          this.recargar(nd);
          const n = res.liquidaciones?.length ?? 1;
          this.setMsg(`Matrícula histórica creada con ${n} liquidación(es). Registre los recibos de migración abajo.`);
        },
        error: (e) => {
          this.loading.set(false);
          this.setMsg(e?.error?.message || 'No se pudo crear la matrícula histórica.', true);
        },
      });
  }

  registrarPago(): void {
    const nd = this.store.numDoc();
    const idLiq = this.idLiquidacionPago();
    const valor = Number(this.valorPago);
    if (nd == null) {
      this.setMsg('Seleccione un alumno.', true);
      return;
    }
    if (!idLiq) {
      this.setMsg('Seleccione la liquidación a pagar.', true);
      return;
    }
    if (!(valor > 0)) {
      this.setMsg('Indique un valor válido.', true);
      return;
    }
    if (!this.fechaPago) {
      this.setMsg('Indique la fecha histórica del recibo.', true);
      return;
    }
    this.loading.set(true);
    this.setMsg(null, false);
    this.migSvc
      .pagoMigracion({
        numDoc: nd,
        idLiquidacion: idLiq,
        valor,
        numRecibo: this.numRecibo.trim() || undefined,
        fecha: this.fechaPago,
        formaPago: this.formaPago,
        observaciones: this.observacionesPago.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.idLiquidacionPago.set('');
          this.valorPago = null;
          this.numRecibo = '';
          this.observacionesPago = '';
          this.store.touchLiquidacion();
          this.recargar(nd);
          this.setMsg(`Recibo de migración #${res.numRecibo} registrado por ${this.fmt(res.total)}.`);
        },
        error: (e) => {
          this.loading.set(false);
          this.setMsg(e?.error?.message || 'No se pudo registrar el pago.', true);
        },
      });
  }

  onLiquidacionChange(id: string): void {
    this.idLiquidacionPago.set(id);
    const liq = this.liquidacionesPendientes().find((l) => String(l._id) === id);
    this.valorPago = liq ? this.num(liq.saldo) : null;
  }
}
