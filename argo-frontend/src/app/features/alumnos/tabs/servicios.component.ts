import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { AlumnoService } from '../../../core/services/alumno.service';
import type { DocumentoPendienteRes } from '../../../core/services/config-requisitos-documentos.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { IngresoService } from '../../../core/services/ingreso.service';
import { LiquidacionItem, LiquidacionResumen, LiquidacionService } from '../../../core/services/liquidacion.service';
import { MatriculaService } from '../../../core/services/matricula.service';
import { ReciboService, idIngreso } from '../../../core/services/recibo.service';
import { ServicioCatalogoService } from '../../../core/services/servicio-catalogo.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { etiquetaSaldoCorta, tituloSaldoItem } from '../../../core/utils/saldo-alerta.helpers';

@Component({
  selector: 'argo-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss'],
})
export class ServiciosComponent {
  store = inject(AlumnoStore);
  private router = inject(Router);
  private alumnoSvc = inject(AlumnoService);
  private catSvc = inject(CatalogoService);
  private servCatSvc = inject(ServicioCatalogoService);
  private matSvc = inject(MatriculaService);
  private liqSvc = inject(LiquidacionService);
  private ingSvc = inject(IngresoService);
  private reciboSvc = inject(ReciboService);
  private confirmSvc = inject(ConfirmDialogService);

  programas = signal<any[]>([]);
  servicios = signal<any[]>([]);

  // form matrícula
  idProg = signal<string>('');
  tarifa = signal<1 | 2 | 3>(1);

  // form servicio adicional
  idServ = signal<string>('');
  servDescripcion = signal<string>('');
  servValor = signal<number>(0);
  servCantidad = signal<number>(1);

  liquidacion = signal<LiquidacionResumen>({ items: [], totales: { valor: 0, abonado: 0, saldo: 0 } });
  comprobantes = signal<any[]>([]);
  itemRecibosAbierto = signal<string | null>(null);
  loading = signal(false);
  msg = signal<string | null>(null);
  msgEsError = signal(false);
  docsPendientesMat = signal<DocumentoPendienteRes[]>([]);

  itemsConSaldo = computed(() =>
    this.liquidacion()
      .items.filter((i) => this.num(i.saldo) > 0.0001)
      .sort((a, b) =>
        String(a.descripcion || '').localeCompare(String(b.descripcion || ''), 'es'),
      ),
  );

  etiquetaSaldo = etiquetaSaldoCorta;
  tituloSaldoItem = tituloSaldoItem;

  comprobantesPorItem = (idLiq: string) =>
    this.comprobantes().filter((p) => String(p.idLiquidacion) === String(idLiq));

  descrComprobante(p: { idLiquidacion?: string; liquidacionDescr?: string }): string {
    if (p.liquidacionDescr) return p.liquidacionDescr;
    const it = this.liquidacion().items.find((i) => String(i._id) === String(p.idLiquidacion));
    return it?.descripcion || '—';
  }

  tipoAbonoLabel(p: { tipoAbono?: string; tipoAbonoDescr?: string }): string {
    if (p.tipoAbonoDescr) return p.tipoAbonoDescr;
    if (p.tipoAbono === 'total') return 'Total';
    if (p.tipoAbono === 'abono') return 'Abono';
    return '—';
  }

  tipoAbonoClass(p: { tipoAbono?: string }): string {
    if (p.tipoAbono === 'total') return 'ok';
    if (p.tipoAbono === 'abono') return 'warn';
    return '';
  }

  programaSel = computed(() =>
    this.programas().find((p) => String(p.idPrograma ?? p.idProg ?? p._id) === this.idProg()),
  );
  valorMatCalculado = computed(() => {
    const p = this.programaSel();
    if (!p) return 0;
    const t = this.tarifa();
    const idP = String(p.idPrograma ?? p.idProg);
    const sem = Number(p.semestres);
    const porProg = this.servicios().filter(
      (s) => String(s.idProg) === idP && !this.esHoraPractica(s),
    );
    if (Number.isFinite(sem) && sem >= 1 && porProg.length > 0) {
      return porProg.reduce((acc, s) => {
        const v = s[`tarifa${t}`];
        if (v != null && v !== '') return acc + this.num(v);
        return acc + this.num(s.tarifa1);
      }, 0);
    }
    const serv = porProg[0] || this.servicios().find((s) => String(s.idServ) === String(p.idServ));
    if (serv) {
      const v = serv[`tarifa${t}`];
      if (v != null && v !== '') return this.num(v);
    }
    return this.num(p.valorMatricula);
  });

  servicioSel = computed(() => this.buscarServicio(this.idServ()));

  serviciosAdicionales = computed(() =>
    this.servicios().filter((s) => !this.esServicioMatriculaPrograma(s)),
  );

  servicioUsaCantidad = computed(() => {
    if (!this.idServ()) return false;
    return this.permiteCantidad(this.servicioSel());
  });

  cantidadLabel = computed(() =>
    this.esHoraPractica(this.servicioSel()) ? 'Cantidad (horas)' : 'Cantidad',
  );

  tarifaUnitariaLabel = computed(() =>
    this.esHoraPractica(this.servicioSel()) ? 'Tarifa / hora' : 'Tarifa unitaria',
  );

  servValorTotal = computed(() => {
    if (this.servicioUsaCantidad()) {
      const unit = this.num(this.servicioSel()?.tarifa1);
      const cant = Math.max(1, Math.floor(this.servCantidad()));
      return unit * cant;
    }
    return this.servValor();
  });

  constructor() {
    this.catSvc.list('programas').subscribe((d) => this.programas.set(d || []));
    this.cargarServicios();

    effect(() => {
      const nd = this.store.numDoc();
      const prog = this.idProg();
      const id = this.store.alumno()?._id;
      const _docTouch = this.store.alumno()?.fechaMod;
      if (nd) this.recargar(nd);
      else {
        this.liquidacion.set({ items: [], totales: { valor: 0, abonado: 0, saldo: 0 } });
        this.comprobantes.set([]);
      }
      if (id && prog) this.revisarDocsMatricula(id, prog);
      else this.docsPendientesMat.set([]);
    });
  }

  cargarServicios() {
    this.servCatSvc.listar().subscribe({
      next: (d) => this.servicios.set(d || []),
      error: () => {
        this.catSvc.list('servicios').subscribe((rows) => this.servicios.set(rows || []));
      },
    });
  }

  revisarDocsMatricula(alumnoId: string, idPrograma: string) {
    this.alumnoSvc.validarDocumentos(alumnoId, idPrograma).subscribe({
      next: (v) => this.docsPendientesMat.set(v.ok ? [] : v.pendientes || []),
      error: () => this.docsPendientesMat.set([]),
    });
  }

  irDocumentos() {
    this.router.navigate([], { queryParams: { tab: 'documentos' }, queryParamsHandling: 'merge' });
  }

  irPagosItem(_idLiq?: string) {
    void _idLiq;
    this.router.navigate([], { queryParams: { tab: 'pagos' }, queryParamsHandling: 'merge' });
  }

  recargar(numDoc: number | string) {
    this.loading.set(true);
    this.liqSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => {
        this.liquidacion.set(r);
        this.store.touchLiquidacion();
      },
      error: () => this.loading.set(false),
    });
    this.ingSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => {
        this.comprobantes.set(r || []);
        this.loading.set(false);
        this.store.touchLiquidacion();
      },
      error: () => this.loading.set(false),
    });
  }

  setTarifa(v: number | string) {
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) this.tarifa.set(n);
  }

  crearMatricula() {
    const nd = this.store.numDoc();
    const alumnoId = this.store.alumno()?._id;
    if (!nd) { this.setMsg('Selecciona o crea un alumno primero.', true); return; }
    if (!this.idProg()) { this.setMsg('Selecciona un programa.', true); return; }
    const prog = this.programaSel();
    this.setMsg(null, false);
    this.matSvc.crear({ numDoc: nd, idPrograma: this.idProg(), tarifa: this.tarifa() }).subscribe({
      next: () => {
        this.idProg.set('');
        this.tarifa.set(1);
        this.docsPendientesMat.set([]);
        this.recargar(nd);
        const avisoCea = this.esProgramaCea(prog)
          ? ' Debe programar las horas CEA (teoría, taller y práctica) en Programación CEA.'
          : '';
        this.setMsg(`Matrícula creada. Se generaron los ítems de liquidación del programa.${avisoCea}`, false);
      },
      error: (e) => this.setMsg(e?.error?.message || 'Error creando matrícula.', true),
    });
  }

  onServicioChange(id: string) {
    this.idServ.set(id);
    const s = this.buscarServicio(id);
    if (!s) return;
    const base = String(s.descrServicio || s.descripcion || s.nombre || '');
    this.servCantidad.set(1);
    if (this.permiteCantidad(s)) {
      this.servDescripcion.set(this.descrConCantidad(base, 1));
      this.servValor.set(this.num(s.tarifa1));
    } else {
      this.servDescripcion.set(base);
      const sugerido = this.num(s.tarifa1);
      this.servValor.set(sugerido > 0 ? sugerido : 0);
    }
  }

  onCantidadChange(v: number) {
    const cant = Math.max(1, Math.floor(Number(v) || 1));
    this.servCantidad.set(cant);
    const s = this.servicioSel();
    if (this.permiteCantidad(s)) {
      const base = String(s?.descrServicio || s?.descripcion || this.servDescripcion() || '');
      this.servDescripcion.set(this.descrConCantidad(base, cant));
      this.servValor.set(this.num(s?.tarifa1) * cant);
    }
  }

  private descrConCantidad(base: string, cant: number): string {
    const limpio = base
      .replace(/\s+x\s*\d+\s*$/i, '')
      .replace(/\s*\(\s*\d+\s*h\s*\)\s*$/i, '')
      .replace(/\s*\(\s*cant\.\s*\d+\s*\)\s*$/i, '')
      .trim();
    return `${limpio} x ${cant}`;
  }

  crearServicioAdicional() {
    const nd = this.store.numDoc();
    if (!nd) { this.msg.set('Selecciona un alumno primero.'); return; }
    if (!this.idServ()) { this.msg.set('Selecciona un servicio.'); return; }
    const usaCant = this.servicioUsaCantidad();
    const cant = usaCant ? Math.max(1, Math.floor(this.servCantidad())) : undefined;
    const v = this.servValorTotal();
    if (!v || v <= 0) {
      this.msg.set(
        usaCant
          ? 'Indique cantidad y verifique que el servicio tenga tarifa unitaria.'
          : 'Indique el valor del servicio (mayor a 0).',
      );
      return;
    }
    const servicio = this.servicioSel();
    this.msg.set(null);
    this.liqSvc
      .crear({
        numDoc: nd,
        idServ: String(this.idServ()),
        descripcion:
          String(this.servDescripcion() || this.servicioSel()?.descrServicio || '').trim() || undefined,
        valor: v,
        cantidad: cant,
      })
      .subscribe({
        next: () => {
          this.idServ.set('');
          this.servDescripcion.set('');
          this.servValor.set(0);
          this.servCantidad.set(1);
          this.cargarServicios();
          this.recargar(nd);
          const avisoPractica = this.esHoraPractica(servicio)
            ? ' Programe estas horas prácticas en Programación CEA.'
            : '';
          this.msg.set(`Servicio adicional agregado.${avisoPractica}`);
        },
        error: (e) => this.msg.set(e?.error?.message || 'Error agregando servicio.'),
      });
  }

  async eliminarItem(item: LiquidacionItem) {
    const nd = this.store.numDoc();
    if (!nd) return;
    if (item.abonado > 0) {
      this.msg.set('No se puede eliminar un ítem con pagos.');
      return;
    }
    const descr = item.descripcion || 'este ítem';
    const ok = await this.confirmSvc.open({
      title: '¿Eliminar este ítem?',
      message: `Se eliminará «${descr}» de la liquidación. Esta acción no se puede deshacer.`,
      variant: 'danger',
      icon: 'delete',
      confirmLabel: 'Sí, eliminar',
    });
    if (!ok) return;
    this.liqSvc.eliminar(item._id).subscribe({
      next: () => this.recargar(nd),
      error: (e) => this.msg.set(e?.error?.message || 'Error eliminando.'),
    });
  }

  num(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v) || 0;
    if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
    return Number(v) || 0;
  }

  fmt(v: any): string {
    const n = this.num(v);
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  estadoClass(it: LiquidacionItem): string {
    const s = this.num(it.saldo);
    if (s <= 0) return 'ok';
    if (this.num(it.abonado) > 0) return 'warn';
    return 'err';
  }

  toggleRecibosItem(it: LiquidacionItem) {
    const id = it._id;
    this.itemRecibosAbierto.set(this.itemRecibosAbierto() === id ? null : id);
  }

  imprimirRecibo(idIngreso: string) {
    this.reciboSvc.abrirHtml(idIngreso, (m) => this.msg.set(m));
  }

  verRecibo(idIngreso: string) {
    if (!idIngreso) return;
    const url = this.router.serializeUrl(this.router.createUrlTree(['/recibo', idIngreso]));
    const w = window.open(url, '_blank', 'width=420,height=720');
    if (!w) this.msg.set('Permita ventanas emergentes para ver el comprobante.');
  }

  tiempoFmt(f?: string): string {
    if (!f) return '';
    const d = new Date(f);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  private buscarServicio(id: string | number | null | undefined) {
    if (id == null || id === '') return undefined;
    return this.servicios().find((s) => String(s.idServ ?? s._id) === String(id));
  }

  private tieneIdProg(s: { idProg?: string | number | null } | null | undefined): boolean {
    return s?.idProg != null && String(s.idProg).trim() !== '';
  }

  private esServicioMatriculaPrograma(s: { idProg?: string | number | null; rolServicio?: string; descrServicio?: string; descripcion?: string } | null | undefined): boolean {
    return this.tieneIdProg(s) && !this.esHoraPractica(s);
  }

  private permiteCantidad(s: {
    idProg?: string | number | null;
    rolServicio?: string;
    usaCantidad?: boolean;
    valorVariable?: boolean;
    permiteCantidad?: boolean;
    tarifa1?: number;
    descrServicio?: string;
    descripcion?: string;
  } | null | undefined): boolean {
    if (!s) return false;
    if (s.permiteCantidad === true) return this.num(s.tarifa1) > 0;
    if (s.permiteCantidad === false) return false;
    if (s.valorVariable === true) return false;
    if (s.usaCantidad === false) return false;
    if (this.esServicioMatriculaPrograma(s)) return false;
    if (this.num(s.tarifa1) <= 0) return false;
    if (this.esHoraPractica(s)) return true;
    if (s.usaCantidad === true) return true;
    return false;
  }

  private esHoraPractica(s: { rolServicio?: string; descrServicio?: string; descripcion?: string } | null | undefined): boolean {
    if (!s) return false;
    if (s.rolServicio === 'hora_practica') return true;
    return /\bhoras?\b.*\bpractic/i.test(String(s.descrServicio || s.descripcion || ''));
  }

  private esProgramaCea(p: {
    horasTeoria?: unknown;
    horasPractica?: unknown;
    horasTaller?: unknown;
  } | null | undefined): boolean {
    if (!p) return false;
    return this.num(p.horasTeoria) + this.num(p.horasPractica) + this.num(p.horasTaller) > 0;
  }

  private setMsg(text: string | null, isErr: boolean) {
    this.msg.set(text);
    this.msgEsError.set(isErr);
  }

  idIngreso = idIngreso;
}
