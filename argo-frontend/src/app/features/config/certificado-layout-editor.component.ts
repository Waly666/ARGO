import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import {
  CAMPOS_CERTIFICADO_LAYOUT,
  CampoCertificadoId,
  CampoLayoutCert,
  EditorSeleccion,
  FUENTES_CERTIFICADO,
  TAMANO_FUENTE_MAX_PT,
  TAMANO_FUENTE_MIN_PT,
  LayoutDefaultsApi,
  LayoutOrientacionCert,
  LayoutPorTipoCert,
  QR_ESQUINAS,
  QrLayoutCert,
} from '../../core/constants/certificado-campos-layout';
import {
  OrientacionCertificado,
  TipoCertificadoId,
  labelOrientacion,
  labelTipoCert,
} from '../../core/constants/tipos-certificado';
import { ConfigCertificadoService } from '../../core/services/config-certificado.service';
import { fsToEditorFontSize } from '../../core/utils/certificado-tipografia';

@Component({
  selector: 'argo-certificado-layout-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificado-layout-editor.component.html',
  styleUrls: ['./certificado-layout-editor.component.scss'],
})
export class CertificadoLayoutEditorComponent implements OnInit {
  private cfgSvc = inject(ConfigCertificadoService);
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) tipo!: TipoCertificadoId;
  @Input({ required: true }) orientacion!: OrientacionCertificado;
  @Input() urlFondoPreview = '';
  @Input() layoutPorTipo: LayoutPorTipoCert = {};
  @Input() mostrarQr = true;
  @Input() qrPosicionGlobal: string = 'inferior_izquierda';
  @Input() qrTamanoGlobal = 72;
  @Output() layoutChange = new EventEmitter<LayoutPorTipoCert>();

  campos = CAMPOS_CERTIFICADO_LAYOUT;
  fuenteMinPt = TAMANO_FUENTE_MIN_PT;
  fuenteMaxPt = TAMANO_FUENTE_MAX_PT;
  qrPosMin = 2;
  qrPosMax = 90;
  qrEsquinas = QR_ESQUINAS;
  fuentes = FUENTES_CERTIFICADO;
  labelTipo = labelTipoCert;
  labelOri = labelOrientacion;

  abierto = signal(false);
  campoSel = signal<EditorSeleccion>('nombre');
  textoSel = computed(() => {
    const s = this.campoSel();
    return s === 'qr' ? null : s;
  });
  defaults = signal<LayoutDefaultsApi | null>(null);
  previewHtml = signal<string | null>(null);
  cargandoPreview = signal(false);

  ngOnInit(): void {
    this.cfgSvc.layoutDefaults().subscribe({ next: (d) => this.defaults.set(d) });
  }

  abrirEditor() {
    const abrir = () => {
      this.materializarTipografiaEnCampos();
      this.abierto.set(true);
    };
    if (this.defaults()) abrir();
    else {
      this.cfgSvc.layoutDefaults().subscribe({
        next: (d) => {
          this.defaults.set(d);
          abrir();
        },
      });
    }
  }

  esQrSel(): boolean {
    return this.campoSel() === 'qr';
  }

  seleccionar(id: EditorSeleccion) {
    this.campoSel.set(id);
  }

  labelCampo(id: CampoCertificadoId): string {
    return this.campos.find((c) => c.id === id)?.label || id;
  }

  private slot(): LayoutOrientacionCert {
    return this.layoutPorTipo?.[this.tipo]?.[this.orientacion] || {};
  }

  private presetQr(esquina: string): QrLayoutCert {
    const defs = this.defaults();
    const ori = this.orientacion === 'horizontal' ? 'horizontal' : 'vertical';
    const map = defs?.qr?.[ori] as Record<string, QrLayoutCert> | undefined;
    return (map?.[esquina] as QrLayoutCert) || { bottom: '2.5%', left: '2.5%' };
  }

  qrGuardado(): QrLayoutCert {
    return this.slot().qr || {};
  }

  /** Valores efectivos (guardados + valores por defecto globales) */
  qrEfectivo(): QrLayoutCert {
    const q = this.qrGuardado();
    const preset = this.presetQr(this.qrPosicionGlobal);
    return {
      sizePx: q.sizePx ?? this.qrTamanoGlobal,
      top: q.top ?? preset.top,
      bottom: q.bottom ?? preset.bottom,
      left: q.left ?? preset.left,
      right: q.right ?? preset.right,
    };
  }

  colorGlobal(): string {
    return this.slot().color || '#4a3a6a';
  }

  /** Mezcla campos guardados en `campos` con valores legados en la raíz del slot. */
  campo(id: CampoCertificadoId): CampoLayoutCert {
    const s = this.slot();
    const legacy = (s as LayoutOrientacionCert & Record<string, CampoLayoutCert | undefined>)[id];
    const modern = s.campos?.[id];
    if (modern != null && legacy != null && typeof modern === 'object' && typeof legacy === 'object') {
      return { ...legacy, ...modern };
    }
    return modern ?? legacy ?? {};
  }

  visible(id: CampoCertificadoId): boolean {
    return this.campo(id).visible !== false;
  }

  private emit(slot: LayoutOrientacionCert) {
    const next: LayoutPorTipoCert = {
      ...(this.layoutPorTipo || {}),
      [this.tipo]: {
        ...(this.layoutPorTipo?.[this.tipo] || {}),
        [this.orientacion]: slot,
      },
    };
    this.layoutChange.emit(next);
  }

  patchSlot(partial: Partial<LayoutOrientacionCert>) {
    this.emit({ ...this.slot(), ...partial });
  }

  patchColorGlobal(color: string) {
    this.patchSlot({ color });
  }

  /** Valores de tipografía que el usuario ve en el panel (para persistirlos al imprimir). */
  private tipografiaEfectiva(id: CampoCertificadoId): Partial<CampoLayoutCert> {
    const c = this.campo(id);
    const d = this.defectoCampo(id);
    const out: Partial<CampoLayoutCert> = {};
    const fs = c.fs || d['fs'];
    const fw = c.fw || d['fw'];
    const ls = c.ls || d['ls'];
    const fontFamily = c.fontFamily || d['fontFamily'];
    if (fs) out.fs = fs;
    if (fw) out.fw = fw;
    if (ls) out.ls = ls;
    if (fontFamily) out.fontFamily = fontFamily;
    return out;
  }

  /** Escribe fs/fuente en `campos` para todos los textos (evita perderlos al mover posición). */
  materializarTipografiaEnCampos() {
    if (!this.defaults()) return;
    const campos = { ...(this.slot().campos || {}) };
    for (const meta of this.campos) {
      const id = meta.id;
      campos[id] = { ...this.campo(id), ...this.tipografiaEfectiva(id) };
    }
    this.patchSlot({ campos });
  }

  /** Fusiona tipografía de este tipo/orientación en el layout (para Guardar configuración). */
  snapshotLayoutPorTipo(base: LayoutPorTipoCert): LayoutPorTipoCert {
    if (!this.defaults()) return base;
    const campos = { ...(this.slot().campos || {}) };
    for (const meta of this.campos) {
      const id = meta.id;
      campos[id] = { ...this.campo(id), ...this.tipografiaEfectiva(id) };
    }
    const slot: LayoutOrientacionCert = { ...this.slot(), campos };
    return {
      ...(base || {}),
      [this.tipo]: {
        ...(base?.[this.tipo] || {}),
        [this.orientacion]: slot,
      },
    };
  }

  patchCampo(id: CampoCertificadoId, partial: Partial<CampoLayoutCert>) {
    const campos = { ...(this.slot().campos || {}) };
    const next: CampoLayoutCert = {
      ...this.campo(id),
      ...this.tipografiaEfectiva(id),
      ...partial,
    };
    if (partial.top === null) delete next.top;
    if (partial.bottom === null) delete next.bottom;
    campos[id] = next;
    this.patchSlot({ campos });
  }

  patchQr(partial: Partial<QrLayoutCert>) {
    const prev = { ...this.qrGuardado(), ...partial };
    if (partial.top === null) delete prev.top;
    if (partial.bottom === null) delete prev.bottom;
    if (partial.left === null) delete prev.left;
    if (partial.right === null) delete prev.right;
    this.patchSlot({ qr: prev });
  }

  usaAnclaAbajoQr(): boolean {
    const q = this.qrEfectivo();
    if (q.top != null && String(q.top).trim() !== '') return false;
    return !!(q.bottom && String(q.bottom).trim());
  }

  qrSizeActual(): number {
    return Math.min(140, Math.max(40, this.qrEfectivo().sizePx ?? 72));
  }

  onQrSize(n: number) {
    this.patchQr({ sizePx: Math.min(140, Math.max(40, Math.round(n))) });
  }

  qrTopActual(): number {
    return this.pctVal(this.qrEfectivo().top, 2);
  }

  qrBottomActual(): number {
    return this.pctVal(this.qrEfectivo().bottom, 2.5);
  }

  qrLeftActual(): number {
    return this.pctVal(this.qrEfectivo().left, 2.5);
  }

  qrRightActual(): number {
    return this.pctVal(this.qrEfectivo().right, 2.5);
  }

  onQrTop(n: number) {
    this.patchQr({ top: `${n}%`, bottom: null, right: null });
  }

  onQrBottom(n: number) {
    this.patchQr({ bottom: `${n}%`, top: null });
  }

  onQrLeft(n: number) {
    this.patchQr({ left: `${this.clampQrHorizontal(n)}%`, right: null });
  }

  onQrRight(n: number) {
    this.patchQr({ right: `${this.clampQrHorizontal(n)}%`, left: null });
  }

  aplicarEsquinaQr(esquina: string) {
    const p = this.presetQr(esquina);
    this.patchQr({
      top: p.top ?? null,
      bottom: p.bottom ?? null,
      left: p.left ?? null,
      right: p.right ?? null,
      sizePx: this.qrSizeActual(),
    });
  }

  nudgeQr(dir: 'up' | 'down' | 'left' | 'right') {
    const paso = 0.5;
    if (dir === 'up' || dir === 'down') {
      if (this.usaAnclaAbajoQr()) {
        const b = this.qrBottomActual() + (dir === 'up' ? paso : -paso);
        this.onQrBottom(Math.min(45, Math.max(2, b)));
      } else {
        const t = this.qrTopActual() + (dir === 'up' ? -paso : paso);
        this.onQrTop(Math.min(40, Math.max(1, t)));
      }
      return;
    }
    const q = this.qrEfectivo();
    if (q.right && !q.left) {
      const r = this.qrRightActual() + (dir === 'left' ? paso : -paso);
      this.onQrRight(this.clampQrHorizontal(r));
    } else {
      const l = this.qrLeftActual() + (dir === 'left' ? -paso : paso);
      this.onQrLeft(this.clampQrHorizontal(l));
    }
  }

  private clampQrHorizontal(n: number): number {
    return Math.min(this.qrPosMax, Math.max(this.qrPosMin, n));
  }

  restaurarQr() {
    const slot = { ...this.slot() };
    delete slot.qr;
    this.patchSlot(slot);
  }

  usaAnclaAbajo(id: CampoCertificadoId): boolean {
    const c = this.campo(id);
    const d = this.defectoCampo(id);
    if (c.top != null && String(c.top).trim() !== '') return false;
    if (c.bottom === null) return false;
    if (c.bottom != null && String(c.bottom).trim() !== '') return true;
    return !!d['bottom'] && !d['top'];
  }

  pctVal(v?: string | null, fallback = 50): number {
    const m = String(v ?? '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : fallback;
  }

  topActual(id: CampoCertificadoId): number {
    return this.pctVal(this.campo(id).top, this.pctVal(this.defectoCampo(id)['top'], 50));
  }

  bottomActual(id: CampoCertificadoId): number {
    return this.pctVal(this.campo(id).bottom, this.pctVal(this.defectoCampo(id)['bottom'], 11));
  }

  leftActual(id: CampoCertificadoId): number {
    return this.pctVal(this.campo(id).left, 50);
  }

  anchoActual(id: CampoCertificadoId): number {
    return this.pctVal(this.campo(id).w, this.pctVal(this.defectoCampo(id)['w'], 82));
  }

  onAncho(id: CampoCertificadoId, n: number) {
    this.patchCampo(id, { w: `${n}%` });
  }

  onTop(id: CampoCertificadoId, n: number) {
    this.patchCampo(id, { top: `${n}%`, bottom: null });
  }

  onBottom(id: CampoCertificadoId, n: number) {
    this.patchCampo(id, { bottom: `${n}%`, top: null });
  }

  onLeft(id: CampoCertificadoId, n: number) {
    this.patchCampo(id, { left: `${n}%` });
  }

  esCentrado(id: CampoCertificadoId): boolean {
    const c = this.campo(id);
    const d = this.defectoCampo(id);
    const sinLeft = !c.left && !d['left'];
    return sinLeft && (c.align || d['align'] || 'center') === 'center';
  }

  setCentrado(id: CampoCertificadoId, centrado: boolean) {
    if (centrado) {
      this.patchCampo(id, { left: undefined, align: 'center' });
    } else {
      this.patchCampo(id, { left: '34%', align: 'center' });
    }
  }

  fsPt(v?: string): number {
    const m = String(v ?? '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 12;
  }

  tamanoActual(id: CampoCertificadoId): number {
    return this.fsPt(this.campo(id).fs || this.defectoCampo(id)['fs']);
  }

  onTamano(id: CampoCertificadoId, n: number) {
    const v = Math.min(this.fuenteMaxPt, Math.max(this.fuenteMinPt, Number(n) || this.fuenteMinPt));
    this.patchCampo(id, { fs: `${Math.round(v * 2) / 2}pt` });
  }

  ajustarTamano(id: CampoCertificadoId, delta: number) {
    this.onTamano(id, this.tamanoActual(id) + delta);
  }

  nudge(id: CampoCertificadoId, dir: 'up' | 'down' | 'left' | 'right') {
    const paso = 0.5;
    if (dir === 'up' || dir === 'down') {
      if (this.usaAnclaAbajo(id)) {
        const b = this.bottomActual(id) + (dir === 'up' ? paso : -paso);
        this.onBottom(id, Math.min(45, Math.max(2, b)));
      } else {
        const t = this.topActual(id) + (dir === 'up' ? -paso : paso);
        this.onTop(id, Math.min(95, Math.max(0, t)));
      }
      return;
    }
    if (this.esCentrado(id)) this.setCentrado(id, false);
    const l = this.leftActual(id) + (dir === 'left' ? -paso : paso);
    this.onLeft(id, Math.min(90, Math.max(2, l)));
  }

  defectoCampo(id: CampoCertificadoId): Record<string, string> {
    const defs = this.defaults();
    const ori = this.orientacion === 'horizontal' ? defs?.horizontal : defs?.vertical;
    return ((ori?.[id] as Record<string, string>) || {}) as Record<string, string>;
  }

  previewSafe(): SafeHtml | null {
    const h = this.previewHtml();
    return h ? this.sanitizer.bypassSecurityTrustHtml(h) : null;
  }

  restaurarCampo(id: CampoCertificadoId) {
    const campos = { ...(this.slot().campos || {}) };
    delete campos[id];
    this.patchSlot({ campos });
  }

  restaurarTodo() {
    const porTipo = { ...(this.layoutPorTipo || {}) };
    if (porTipo[this.tipo]) {
      const t = { ...porTipo[this.tipo] };
      delete t[this.orientacion];
      if (Object.keys(t).length === 0) delete porTipo[this.tipo];
      else porTipo[this.tipo] = t;
    }
    this.layoutChange.emit(porTipo);
  }

  abrirPreview() {
    this.materializarTipografiaEnCampos();
    this.cargandoPreview.set(true);
    this.cfgSvc
      .vistaPrevia({
        tipo: this.tipo,
        orientacion: this.orientacion,
        layoutPorTipo: this.layoutPorTipo,
        urlFondo: this.urlFondoPreview,
      })
      .subscribe({
        next: (html) => {
          this.previewHtml.set(html);
          this.cargandoPreview.set(false);
        },
        error: () => this.cargandoPreview.set(false),
      });
  }

  cerrarPreview() {
    this.previewHtml.set(null);
  }

  estiloOverlayQr(): Record<string, string> {
    const q = this.qrEfectivo();
    const px = this.qrSizeActual();
    const pct = (px / 380) * 100;
    const st: Record<string, string> = {
      width: `${pct}%`,
      aspectRatio: '1',
    };
    if (q.top) {
      st['top'] = q.top;
      st['bottom'] = 'auto';
    } else if (q.bottom) {
      st['bottom'] = q.bottom;
      st['top'] = 'auto';
    }
    if (q.left) st['left'] = q.left;
    if (q.right) st['right'] = q.right;
    if (this.esQrSel()) {
      st['outline'] = '2px solid #4ea3ff';
      st['boxShadow'] = '0 0 0 2px rgba(78,163,255,0.35)';
    }
    return st;
  }

  estiloOverlay(id: CampoCertificadoId): Record<string, string> {
    const c = this.campo(id);
    const d = this.defectoCampo(id) as CampoLayoutCert;
    const left = c.left ?? d.left;
    const align = c.align || d.align || 'center';
    const color = c.color || this.colorGlobal();
    const sel = this.campoSel() === id;
    const st: Record<string, string> = {
      color,
      fontSize: fsToEditorFontSize(c.fs || d.fs, this.orientacion),
      fontWeight: String(c.fw || d.fw || '600'),
      textAlign: align,
      fontFamily: c.fontFamily || d.fontFamily || 'Arial, sans-serif',
    };
    if (this.usaAnclaAbajo(id)) {
      st['top'] = 'auto';
      st['bottom'] = c.bottom || d.bottom || '10%';
    } else {
      st['top'] = c.top || d.top || '50%';
    }
    if (left) {
      st['left'] = left;
      st['width'] = c.w || d.w || '30%';
      st['transform'] = 'none';
    } else if (align === 'center') {
      st['left'] = '50%';
      st['transform'] = 'translateX(-50%)';
      st['width'] = c.w || d.w || (this.esMultilinea(id) ? '82%' : '82%');
    }
    if (c.visible === false) st['display'] = 'none';
    if (this.esMultilinea(id)) {
      st['whiteSpace'] = 'normal';
      st['wordWrap'] = 'break-word';
      st['overflowWrap'] = 'break-word';
      st['lineHeight'] = '1.2';
      st['overflow'] = 'visible';
      st['maxHeight'] = 'none';
    }
    if (sel) st['outline'] = '2px solid #4ea3ff';
    return st;
  }

  esMultilinea(id: CampoCertificadoId): boolean {
    return id === 'nombre' || id === 'curso';
  }

  textoMuestra(id: CampoCertificadoId): string {
    const map: Record<CampoCertificadoId, string> = {
      nombre: 'JUAN CARLOS PEREZ GOMEZ MARTINEZ',
      tipoDoc: 'CC',
      doc: '1234567890',
      curso: 'TRANSPORTE DE MERCANCIAS PELIGROSAS CLASE 3',
      ciudad: 'Villavicencio',
      horas: '40',
      fecha: '21/05/2026',
      vence: '21/05/2027',
      acta: '12345',
      folio: '67890',
      runt: 'RUNT-001',
      obs: 'Sin observaciones',
      certId: 'CERT-000001',
    };
    return map[id];
  }
}
