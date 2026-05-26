import { CommonModule } from '@angular/common';
import { Component, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ORIENTACIONES_CERTIFICADO,
  TIPOS_CERTIFICADO_PRINCIPALES,
  TipoCertificadoId,
  OrientacionCertificado,
  labelTipoCert,
  labelOrientacion,
} from '../../core/constants/tipos-certificado';
import { LayoutPorTipoCert } from '../../core/constants/certificado-campos-layout';
import {
  ConfigCertificado,
  ConfigCertificadoService,
  PlantillaCertificado,
  PlantillaPorTipoSlot,
  QR_POSICIONES_CERT,
} from '../../core/services/config-certificado.service';
import { CertificadoLayoutEditorComponent } from './certificado-layout-editor.component';

@Component({
  selector: 'argo-config-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule, CertificadoLayoutEditorComponent],
  templateUrl: './config-certificados.component.html',
  styleUrls: ['./config-certificados.component.scss'],
})
export class ConfigCertificadosComponent implements OnInit {
  private cfgSvc = inject(ConfigCertificadoService);

  @ViewChildren(CertificadoLayoutEditorComponent)
  private layoutEditors?: QueryList<CertificadoLayoutEditorComponent>;

  tiposPrincipales = TIPOS_CERTIFICADO_PRINCIPALES;
  orientaciones = ORIENTACIONES_CERTIFICADO;
  qrPosiciones = QR_POSICIONES_CERT;
  labelTipo = labelTipoCert;
  labelOrientacion = labelOrientacion;

  form = signal<ConfigCertificado>({
    plantillaPorTipo: {},
    layoutPorTipo: {},
    mostrarQr: true,
    qrPosicion: 'inferior_izquierda',
    qrTamanoPx: 72,
  });
  plantillas = signal<PlantillaCertificado[]>([]);
  saving = signal(false);
  msg = signal<string | null>(null);
  subiendo = signal<TipoCertificadoId | null>(null);

  ngOnInit(): void {
    this.cfgSvc.obtener().subscribe({
      next: (c) =>
        this.form.set({
          ...c,
          plantillaPorTipo: { ...(c.plantillaPorTipo || {}) },
          layoutPorTipo: { ...(c.layoutPorTipo || {}) },
        }),
    });
    this.cargarPlantillas();
  }

  cargarPlantillas() {
    this.cfgSvc.listarPlantillasTodas().subscribe({
      next: (r) => {
        this.plantillas.set(r || []);
        this.syncOrientacionConPlantilla();
      },
    });
  }

  /** Alinea la orientación del slot con la plantilla PNG real (la que usa la impresión). */
  private syncOrientacionConPlantilla() {
    const ppt = { ...(this.form().plantillaPorTipo || {}) };
    let changed = false;
    for (const t of [...this.tiposPrincipales, { id: 'mercancias_peligrosas' as TipoCertificadoId }]) {
      const slot = ppt[t.id];
      if (!slot?.id) continue;
      const p = this.plantillaDoc(slot.id);
      if (p && (p.orientacion === 'vertical' || p.orientacion === 'horizontal') && slot.orientacion !== p.orientacion) {
        ppt[t.id] = { ...slot, orientacion: p.orientacion };
        changed = true;
      }
    }
    if (changed) this.patch('plantillaPorTipo', ppt);
  }

  patch<K extends keyof ConfigCertificado>(k: K, v: ConfigCertificado[K]) {
    this.form.update((f) => ({ ...f, [k]: v }));
  }

  slotTipo(tipo: TipoCertificadoId): PlantillaPorTipoSlot {
    const s = this.form().plantillaPorTipo?.[tipo];
    return {
      orientacion: s?.orientacion === 'horizontal' ? 'horizontal' : 'vertical',
      id: s?.id || null,
    };
  }

  plantillaDoc(id?: string | null): PlantillaCertificado | undefined {
    if (!id) return undefined;
    return this.plantillas().find((p) => p._id === id);
  }

  private patchSlot(tipo: TipoCertificadoId, slot: Partial<PlantillaPorTipoSlot>) {
    const ppt = { ...(this.form().plantillaPorTipo || {}) };
    ppt[tipo] = { ...this.slotTipo(tipo), ...slot };
    this.patch('plantillaPorTipo', ppt);
  }

  onOrientacionTipo(tipo: TipoCertificadoId, orientacion: OrientacionCertificado) {
    const actual = this.plantillaDoc(this.slotTipo(tipo).id);
    let id = this.slotTipo(tipo).id;
    if (actual && actual.orientacion !== orientacion) {
      const otra = this.plantillas().find(
        (p) => p.tipoCertificado === tipo && p.orientacion === orientacion && p.activa !== false,
      );
      id = otra?._id || null;
    }
    this.patchSlot(tipo, { orientacion, id });
  }

  onFormatoFondo(tipo: TipoCertificadoId, ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const slot = this.slotTipo(tipo);
    this.subiendo.set(tipo);
    this.msg.set(null);

    const existente = this.plantillaDoc(slot.id);
    const nombre = `${this.labelTipo(tipo)} (${this.labelOrientacion(slot.orientacion)})`;
    const fd = new FormData();
    fd.append('nombre', nombre);
    fd.append('tipoCertificado', tipo);
    fd.append('orientacion', slot.orientacion);
    fd.append('fondo', file);

    const req =
      existente?._id && existente.orientacion === slot.orientacion
        ? this.cfgSvc.actualizarPlantilla(existente._id, fd)
        : this.cfgSvc.crearPlantilla(fd);

    req.subscribe({
      next: (p) => {
        this.subiendo.set(null);
        (ev.target as HTMLInputElement).value = '';
        this.cargarPlantillas();
        this.patchSlot(tipo, { id: p._id, orientacion: slot.orientacion });
        this.persistirSlotPlantilla(tipo);
      },
      error: (e) => {
        this.subiendo.set(null);
        this.msg.set(e?.error?.message || 'Error subiendo formato.');
      },
    });
  }

  private persistirSlotPlantilla(tipo: TipoCertificadoId) {
    const ppt = { ...(this.form().plantillaPorTipo || {}) };
    this.cfgSvc.guardar({ plantillaPorTipo: ppt }).subscribe({
      next: (c) => {
        this.form.update((f) => ({
          ...f,
          plantillaPorTipo: { ...(c.plantillaPorTipo || {}) },
        }));
        this.msg.set(`Formato «${this.labelTipo(tipo)}» guardado. Ajuste el paso 2 si hace falta y pulse Guardar.`);
      },
      error: (e) => this.msg.set(e?.error?.message || 'Formato subido pero no se pudo guardar en la configuración.'),
    });
  }

  quitarFormato(tipo: TipoCertificadoId) {
    const slot = this.slotTipo(tipo);
    if (!slot.id) return;
    if (!confirm(`¿Quitar el formato de «${this.labelTipo(tipo)}»?`)) return;
    this.cfgSvc.eliminarPlantilla(slot.id).subscribe({
      next: () => {
        this.patchSlot(tipo, { id: null });
        this.cargarPlantillas();
        this.msg.set('Formato quitado. Guarde la configuración.');
      },
      error: (e) => this.msg.set(e?.error?.message || 'Error.'),
    });
  }

  /** Orientación del layout = la de la plantilla PNG (la que usa la impresión). */
  orientacionLayout(tipo: TipoCertificadoId): OrientacionCertificado {
    const p = this.plantillaDoc(this.slotTipo(tipo).id);
    if (p?.orientacion === 'horizontal' || p?.orientacion === 'vertical') {
      return p.orientacion;
    }
    return this.slotTipo(tipo).orientacion;
  }

  private layoutParaGuardar(): ConfigCertificado['layoutPorTipo'] {
    let layout = { ...(this.form().layoutPorTipo || {}) };
    for (const ed of this.layoutEditors ?? []) {
      layout = ed.snapshotLayoutPorTipo(layout);
    }
    return layout;
  }

  guardar() {
    this.saving.set(true);
    this.msg.set(null);
    const payload = { ...this.form(), layoutPorTipo: this.layoutParaGuardar() };
    this.patch('layoutPorTipo', payload.layoutPorTipo);
    this.cfgSvc.guardar(payload).subscribe({
      next: (c) => {
        this.form.set({
          ...c,
          plantillaPorTipo: { ...(c.plantillaPorTipo || {}) },
          layoutPorTipo: { ...(c.layoutPorTipo || {}) },
        });
        this.saving.set(false);
        this.msg.set('Configuración guardada.');
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al guardar.');
      },
    });
  }

  onFirmaDirector(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('firmaDirector', f);
    this.subirFirmas(fd);
  }

  onFirmaInstructor(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('firmaInstructor', f);
    this.subirFirmas(fd);
  }

  private subirFirmas(fd: FormData) {
    this.cfgSvc.guardarFirmas(fd).subscribe({
      next: (c) => {
        this.form.set({
          ...c,
          plantillaPorTipo: { ...(c.plantillaPorTipo || {}) },
          layoutPorTipo: { ...(c.layoutPorTipo || {}) },
        });
        this.msg.set('Firma actualizada.');
      },
      error: (e) => this.msg.set(e?.error?.message || 'Error subiendo firma.'),
    });
  }

  urlFondo(p: PlantillaCertificado) {
    return this.cfgSvc.urlFondo(p.urlFondo);
  }

  urlFirma(path?: string) {
    return this.cfgSvc.urlFondo(path);
  }

  subiendoTipo(tipo: TipoCertificadoId): boolean {
    return this.subiendo() === tipo;
  }

  onLayoutChange(layout: LayoutPorTipoCert) {
    this.patch('layoutPorTipo', layout);
  }

  urlFondoAbs(p?: PlantillaCertificado): string {
    if (!p?.urlFondo) return '';
    return this.urlFondo(p);
  }
}
