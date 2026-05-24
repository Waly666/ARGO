import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AlumnoService } from '../../core/services/alumno.service';
import { AlumnoStore } from '../../core/services/alumno-store.service';
import { LiquidacionItem, LiquidacionService } from '../../core/services/liquidacion.service';
import type { DocumentoPendienteRes } from '../../core/services/config-requisitos-documentos.service';
import { DatosPrincipalesComponent } from './tabs/datos-principales.component';
import { ServiciosComponent } from './tabs/servicios.component';
import { PagosComponent } from './tabs/pagos.component';
import { CertificadosComponent } from './tabs/certificados.component';
import { DocumentosComponent } from './tabs/documentos.component';
import { environment } from '../../../environments/environment';
import { etiquetaSaldoCorta, tituloSaldoItem } from '../../core/utils/saldo-alerta.helpers';

type TabKey = 'datos' | 'servicios' | 'pagos' | 'certificados' | 'documentos';

@Component({
  selector: 'argo-alumno-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatosPrincipalesComponent,
    ServiciosComponent,
    PagosComponent,
    CertificadosComponent,
    DocumentosComponent,
  ],
  templateUrl: './alumno-detalle.component.html',
  styleUrls: ['./alumno-detalle.component.scss'],
})
export class AlumnoDetalleComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alumnoSvc = inject(AlumnoService);
  private liqSvc = inject(LiquidacionService);
  store = inject(AlumnoStore);

  tab = signal<TabKey>('datos');
  loading = signal(false);
  esNuevo = signal(false);
  uploads = environment.uploadsUrl;

  alumno = computed(() => this.store.alumno());
  nombreCompleto = computed(() => this.store.nombreCompleto());
  tituloPagina = computed(() => {
    if (this.esNuevo()) return 'Nuevo alumno';
    const n = this.nombreCompleto();
    return n || 'Ficha del alumno';
  });

  tabs: { key: TabKey; label: string }[] = [
    { key: 'datos',        label: 'Datos Principales' },
    { key: 'servicios',    label: 'Servicios' },
    { key: 'pagos',        label: 'Pagos' },
    { key: 'certificados', label: 'Certificados' },
    { key: 'documentos',   label: 'Documentos' },
  ];

  docsPendientes = signal<DocumentoPendienteRes[]>([]);

  docsPendientesCount = computed(() => this.docsPendientes().length);

  docsPendientesTitulo = computed(() => {
    const list = this.docsPendientes();
    if (!list.length) return '';
    return `Documentos pendientes: ${list.map((p) => p.nombre).join(', ')}`;
  });

  saldosPendientes = signal<LiquidacionItem[]>([]);

  saldosPendientesCount = computed(() => this.saldosPendientes().length);

  saldoTotalPendiente = computed(() =>
    this.saldosPendientes().reduce((acc, it) => acc + this.num(it.saldo), 0),
  );

  saldosPendientesTitulo = computed(() => {
    const list = this.saldosPendientes();
    if (!list.length) return '';
    return list
      .map((it) => tituloSaldoItem(it.descripcion, this.fmtSaldo(it.saldo)))
      .join(' · ');
  });

  etiquetaSaldo = etiquetaSaldoCorta;
  tituloSaldoItem = tituloSaldoItem;

  constructor() {
    effect(() => {
      const id = this.store.alumno()?._id;
      const _docTouch = this.store.alumno()?.fechaMod;
      const _liqTouch = this.store.liqTick();
      if (this.esNuevo() || !id) {
        this.docsPendientes.set([]);
        return;
      }
      void _liqTouch;
      this.revisarDocumentosPendientes(id);
    });

    effect(() => {
      const nd = this.store.numDoc();
      const _liqTouch = this.store.liqTick();
      if (this.esNuevo() || nd == null) {
        this.saldosPendientes.set([]);
        return;
      }
      this.revisarSaldosPendientes(nd);
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const t = q.get('tab') as TabKey | null;
      if (t && this.tabs.some((x) => x.key === t) && (!this.esNuevo() || t === 'datos')) {
        this.tab.set(t);
      }
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id || id === 'nuevo') {
        this.esNuevo.set(true);
        this.store.clear();
        this.tab.set('datos');
        return;
      }
      this.esNuevo.set(false);
      this.cargarAlumno(id);
    });
  }

  errorMsg = signal<string | null>(null);

  ngOnDestroy(): void {
    this.store.clear();
  }

  revisarDocumentosPendientes(alumnoId: string) {
    this.alumnoSvc.validarDocumentos(alumnoId).subscribe({
      next: (v) => this.docsPendientes.set(v.ok ? [] : v.pendientes || []),
      error: () => this.docsPendientes.set([]),
    });
  }

  irDocumentos() {
    this.setTab('documentos');
  }

  irPagos() {
    this.setTab('pagos');
  }

  revisarSaldosPendientes(numDoc: number | string) {
    this.liqSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => {
        const pendientes = (r.items || [])
          .filter((it) => this.num(it.saldo) > 0.0001)
          .sort((a, b) =>
            String(a.descripcion || '').localeCompare(String(b.descripcion || ''), 'es'),
          );
        this.saldosPendientes.set(pendientes);
      },
      error: () => this.saldosPendientes.set([]),
    });
  }

  num(v: unknown): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v) || 0;
    if (typeof v === 'object' && v !== null && '$numberDecimal' in v) {
      return Number((v as { $numberDecimal: string }).$numberDecimal) || 0;
    }
    return Number(v) || 0;
  }

  fmtSaldo(v: unknown): string {
    return this.num(v).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  cargarAlumno(id: string) {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.docsPendientes.set([]);
    this.saldosPendientes.set([]);
    this.alumnoSvc.porId(id).subscribe({
      next: (a) => {
        this.store.setAlumno(a);
        this.loading.set(false);
        this.tab.set('datos');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message || 'No se pudo cargar el alumno.');
      },
    });
  }

  setTab(t: TabKey) {
    if (this.esNuevo() && t !== 'datos') {
      this.store.pulseSaveAlarm();
      return;
    }
    if (t !== 'datos' && this.store.datosSinGuardar()) {
      this.store.pulseSaveAlarm();
      this.tab.set('datos');
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: 'datos' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }
    this.tab.set(t);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: t },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  volver() {
    this.router.navigate(['/app/alumnos']);
  }

  fotoUrl(): string | null {
    const a = this.alumno() as Record<string, unknown> | null;
    const f = (a?.['urlFoto'] || a?.['foto']) as string | undefined;
    if (!f) return null;
    if (f.startsWith('http')) return f;
    return `${this.uploads}/${f}`;
  }
}
