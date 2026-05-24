import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import {
  CajaSesion,
  CajaSesionService,
  CierreCajaResponse,
  ResumenCaja,
} from '../../core/services/caja-sesion.service';

interface MetodoPagoCard {
  id: string;
  label: string;
  total: number;
  cantidad: number;
  tone: string;
  icon: string;
}

@Component({
  selector: 'argo-caja-cuadre',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, CurrencyPipe, DatePipe],
  templateUrl: './caja-cuadre.component.html',
  styleUrls: ['./caja-cuadre.component.scss'],
})
export class CajaCuadreComponent implements OnInit {
  private cajaSvc = inject(CajaSesionService);
  private catSvc = inject(CatalogoService);
  private auth = inject(AuthService);
  private router = inject(Router);

  isAdmin = signal(false);
  cajaAbierta = signal(false);
  sesion = signal<CajaSesion | null>(null);
  resumen = signal<ResumenCaja | null>(null);
  historial = signal<CajaSesion[]>([]);
  tiposPagoCat = signal<Record<string, unknown>[]>([]);
  loading = signal(false);
  msg = signal<string | null>(null);

  saldoInicialApertura = signal(0);
  obsApertura = signal('');
  efectivoContado = signal<number | null>(null);
  obsCierre = signal('');
  mostrarApertura = signal(false);
  ultimoCierre = signal<CierreCajaResponse | null>(null);

  ventasBrutas = computed(() => this.resumen()?.ventasBrutas ?? this.resumen()?.totalIngresos ?? 0);
  cantidadRecibos = computed(
    () => this.resumen()?.cantidadRecibos ?? this.resumen()?.cantidadIngresos ?? 0,
  );
  efectivoEsperado = computed(
    () => this.resumen()?.efectivoEsperado ?? 0,
  );
  ingresosEfectivo = computed(() => this.resumen()?.totalIngresosEfectivo ?? 0);
  egresosEfectivo = computed(() => this.resumen()?.totalEgresosEfectivo ?? 0);
  totalGastos = computed(() => this.resumen()?.totalGastos ?? this.resumen()?.totalEgresos ?? 0);
  totalRetiros = computed(() => this.resumen()?.totalRetiros ?? 0);
  saldoInicial = computed(() => this.resumen()?.saldoInicial ?? this.sesion()?.saldoInicial ?? 0);

  metodosPago = computed((): MetodoPagoCard[] => {
    const rows = this.resumen()?.ingresosPorTipo ?? [];
    const mapCat = new Map(
      this.tiposPagoCat().map((t) => {
        const id = String(t['idTipoPago'] ?? t['codigo'] ?? '');
        const label = String(t['descripcion'] ?? t['nombre'] ?? id);
        return [id, label];
      }),
    );
    const cards = rows.map((r) => {
      const label = r.descripcion || mapCat.get(String(r.idTipoPago)) || String(r.idTipoPago);
      return {
        id: String(r.idTipoPago),
        label,
        total: r.total,
        cantidad: r.cantidad,
        ...this.tonoMetodo(label),
      };
    });
    if (!cards.length && this.tiposPagoCat().length) {
      return this.tiposPagoCat().slice(0, 6).map((t) => {
        const label = String(t['descripcion'] ?? t['nombre'] ?? 'Pago');
        const id = String(t['idTipoPago'] ?? t['codigo'] ?? label);
        return { id, label, total: 0, cantidad: 0, ...this.tonoMetodo(label) };
      });
    }
    return cards;
  });

  ngOnInit(): void {
    const r = String(this.auth.user()?.rol || '').toLowerCase();
    this.isAdmin.set(r.includes('admin'));
    this.catSvc.list('catTipoPago', { refresh: true }).subscribe({
      next: (t) => this.tiposPagoCat.set(t || []),
    });
    this.refrescar();
    this.cargarHistorial();
  }

  refrescar(): void {
    this.loading.set(true);
    this.cajaSvc.activa().subscribe({
      next: (r) => {
        this.cajaAbierta.set(!!r.abierta);
        this.sesion.set(r.sesion);
        this.resumen.set(r.resumenParcial ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.cajaAbierta.set(false);
        this.loading.set(false);
      },
    });
  }

  cargarHistorial(): void {
    const hoy = new Date().toISOString().slice(0, 10);
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);
    this.cajaSvc
      .listar({
        estado: 'cerrada',
        desde: desde.toISOString().slice(0, 10),
        hasta: hoy,
        limit: 40,
        todas: this.isAdmin(),
      })
      .subscribe({
        next: (rows) => this.historial.set(rows || []),
      });
  }

  abrirCaja(): void {
    this.saldoInicialApertura.set(0);
    this.obsApertura.set('');
    this.mostrarApertura.set(true);
  }

  confirmarApertura(): void {
    this.loading.set(true);
    this.cajaSvc.abrir(this.saldoInicialApertura(), this.obsApertura() || undefined).subscribe({
      next: () => {
        this.mostrarApertura.set(false);
        this.loading.set(false);
        this.msg.set('Caja abierta');
        this.refrescar();
      },
      error: (e) => {
        this.loading.set(false);
        this.msg.set(e?.error?.message || 'No se pudo abrir la caja');
      },
    });
  }

  cerrarCaja(): void {
    const id = this.sesion()?.idSesion;
    if (!id) return;
    const contado = this.efectivoContado();
    if (contado == null || !Number.isFinite(contado)) {
      this.msg.set('Indique el efectivo contado en caja');
      return;
    }
    this.loading.set(true);
    this.cajaSvc
      .cerrar(id, {
        efectivoContado: contado,
        observaciones: this.obsCierre() || undefined,
      })
      .subscribe({
        next: (r) => {
          this.ultimoCierre.set(r);
          this.cajaAbierta.set(false);
          this.sesion.set(null);
          this.resumen.set(null);
          this.efectivoContado.set(null);
          this.obsCierre.set('');
          this.loading.set(false);
          this.cargarHistorial();
          setTimeout(() => window.print(), 400);
        },
        error: (e) => {
          this.loading.set(false);
          this.msg.set(e?.error?.message || 'No se pudo cerrar la caja');
        },
      });
  }

  verResumenSesion(s: CajaSesion): void {
    if (!s.idSesion) return;
    this.cajaSvc.resumen(s.idSesion).subscribe({
      next: (r) => {
        this.ultimoCierre.set({ sesion: r.sesion, resumen: r.resumen });
        setTimeout(() => window.print(), 300);
      },
    });
  }

  ventasHistorial(s: CajaSesion): number {
    const r = s.resumen as ResumenCaja | undefined;
    return r?.ventasBrutas ?? r?.totalIngresos ?? 0;
  }

  esperadoHistorial(s: CajaSesion): number {
    const r = s.resumen as ResumenCaja | undefined;
    return r?.efectivoEsperado ?? s.saldoFinal ?? 0;
  }

  contadoHistorial(s: CajaSesion): number | null {
    if (s.efectivoContado != null) return s.efectivoContado;
    const r = s.resumen as ResumenCaja | undefined;
    return r?.efectivoContado ?? null;
  }

  diferenciaHistorial(s: CajaSesion): number | null {
    if (s.diferencia != null) return s.diferencia;
    const c = this.contadoHistorial(s);
    if (c == null) return null;
    return c - this.esperadoHistorial(s);
  }

  private tonoMetodo(label: string): { tone: string; icon: string } {
    const t = label.toLowerCase();
    if (t.includes('efect')) return { tone: 'emerald', icon: '💵' };
    if (t.includes('nequi')) return { tone: 'pink', icon: '📱' };
    if (t.includes('davi')) return { tone: 'red', icon: '📲' };
    if (t.includes('transf')) return { tone: 'blue', icon: '🏦' };
    if (t.includes('tarj')) return { tone: 'purple', icon: '💳' };
    return { tone: 'cyan', icon: '◎' };
  }
}
