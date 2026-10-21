import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PesvNavComponent } from './pesv-nav.component';

import { PesvService, PesvSugerenciasFlota } from '../../core/services/pesv.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';

type TabId = 'siniestros' | 'administrativo' | 'funcionamiento' | 'vehiculos';

@Component({
  selector: 'argo-pesv-fase2',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PesvNavComponent],
  templateUrl: './pesv-fase2.component.html',
  styleUrls: ['./pesv-shared.scss'],
})
export class PesvFase2Component implements OnInit {
  private pesv = inject(PesvService);
  private route = inject(ActivatedRoute);
  accionPerm = inject(AccionPermisoService);

  vigencia = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth() + 1);
  tab = signal<TabId>('funcionamiento');
  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);

  payload = signal<any>(null);
  catalogo = signal<any>(null);
  mesesCarga = signal<Record<string, boolean>>({});
  sugerencias = signal<PesvSugerenciasFlota | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const m = Number(q.get('mes'));
      if (m >= 1 && m <= 12) this.mes.set(m);
    });
    this.pesv.config().subscribe({
      next: (c) => {
        if (c.vigenciaActiva) this.vigencia.set(c.vigenciaActiva);
        this.cargar();
      },
      error: () => this.cargar(),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.pesv.fase2(this.vigencia(), this.mes()).subscribe({
      next: (r: any) => {
        this.payload.set(r.registro);
        this.catalogo.set(r.catalogo);
        this.mesesCarga.set(r.mesesCarga || {});
        this.sugerencias.set(r.sugerenciasFlota || null);
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar Fase 2');
        this.loading.set(false);
      },
    });
  }

  obligado(): boolean {
    return this.payload()?.obligado !== false;
  }

  setObligado(v: boolean): void {
    const p = { ...this.payload(), obligado: v };
    this.payload.set(p);
  }

  enviadoSt(): boolean {
    return this.payload()?.estado === 'enviado_st';
  }

  setEnviadoSt(marcado: boolean): void {
    const p = { ...this.payload() };
    p.estado = marcado ? 'enviado_st' : 'borrador';
    this.payload.set(p);
  }

  patchAdminId(index: number, id: string): void {
    const rows = this.adminVars().map((r, j) => (j === index ? { ...r, id } : r));
    this.setAdminVars(rows);
  }

  patchAdminValor(index: number, valor: string): void {
    const rows = this.adminVars().map((r, j) => (j === index ? { ...r, valor } : r));
    this.setAdminVars(rows);
  }

  varFunc(id: string): number {
    return Number(this.payload()?.funcionamiento?.variables?.[id] ?? 0);
  }

  setVarFunc(id: string, val: number): void {
    const p = { ...this.payload() };
    p.funcionamiento = p.funcionamiento || { variables: {}, evidencias: [] };
    p.funcionamiento.variables = { ...p.funcionamiento.variables, [id]: val };
    this.payload.set(p);
  }

  varVeh(id: string): number {
    return Number(this.payload()?.vehiculos?.variables?.[id] ?? 0);
  }

  setVarVeh(id: string, val: number): void {
    const p = { ...this.payload() };
    p.vehiculos = p.vehiculos || { variables: {}, evidencias: [] };
    p.vehiculos.variables = { ...p.vehiculos.variables, [id]: val };
    this.payload.set(p);
  }

  evVehEntero(id: string): number {
    const ev = (this.payload()?.vehiculos?.evidencias || []).find((e: { id: string }) => e.id === id);
    return Number(ev?.valorEntero ?? 0);
  }

  setEvVehEntero(id: string, val: number): void {
    const p = { ...this.payload() };
    p.vehiculos = p.vehiculos || { variables: {}, evidencias: [] };
    const evs = [...(p.vehiculos.evidencias || [])];
    const idx = evs.findIndex((e: { id: string }) => e.id === id);
    const row = { id, tipo: 'entero', valorEntero: val, adjuntoRuta: null, adjuntoNombre: null };
    if (idx >= 0) evs[idx] = { ...evs[idx], ...row };
    else evs.push(row);
    p.vehiculos.evidencias = evs;
    this.payload.set(p);
  }

  adjuntoEvidencia(tab: 'funcionamiento' | 'vehiculos', id: string): string | null {
    const ev = (this.payload()?.[tab]?.evidencias || []).find((e: { id: string }) => e.id === id);
    return this.pesv.urlUploads(ev?.adjuntoRuta);
  }

  nombreEvidencia(tab: 'funcionamiento' | 'vehiculos', id: string): string | null {
    const ev = (this.payload()?.[tab]?.evidencias || []).find((e: { id: string }) => e.id === id);
    return ev?.adjuntoNombre || null;
  }

  adminVars(): { id: string; valor: string }[] {
    return this.payload()?.administrativo?.variables || [];
  }

  setAdminVars(rows: { id: string; valor: string }[]): void {
    const p = { ...this.payload() };
    p.administrativo = { variables: rows };
    this.payload.set(p);
  }

  addAdminVar(): void {
    this.setAdminVars([...this.adminVars(), { id: '', valor: '' }]);
  }

  guardar(): void {
    if (!this.accionPerm.tiene('pesv', 'editar')) {
      this.msg.set('Sin permiso');
      return;
    }
    this.saving.set(true);
    const body = { ...this.payload(), vigencia: this.vigencia(), mes: this.mes() };
    this.pesv.guardarFase2(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.msg.set('Periodo guardado');
      },
      error: () => {
        this.saving.set(false);
        this.msg.set('Error al guardar');
      },
    });
  }

  aplicarSugerenciasFlota(): void {
    const s = this.sugerencias()?.sugerido;
    if (!s) return;
    for (const id of ['7.1', '7.2', '9.1', '9.2']) {
      if (s[id] != null) this.setVarVeh(id, Number(s[id]));
    }
    this.msg.set('Sugerencias aplicadas en pestaña D (revise antes de guardar).');
  }

  onUpload(tab: string, evidenciaId: string, ev: Event, acceptPdf = true): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.accionPerm.tiene('pesv', 'editar')) {
      this.msg.set('Sin permiso');
      return;
    }
    this.pesv.subirAdjuntoFase2(this.vigencia(), this.mes(), tab, evidenciaId, file).subscribe({
      next: () => {
        this.msg.set('Archivo cargado');
        this.cargar();
      },
      error: () => this.msg.set('Error al subir archivo'),
    });
    input.value = '';
  }

  urlSiniestros(): string | null {
    return this.pesv.urlUploads(this.payload()?.siniestros?.adjuntoRuta);
  }

  mesPermite(tab: TabId): boolean {
    return !!this.mesesCarga()[tab];
  }

  acceptForTipo(tipo: string): string {
    if (tipo === 'xlsx') return '.xlsx';
    if (tipo === 'pdf') return '.pdf';
    return '.pdf,.xlsx';
  }
}
