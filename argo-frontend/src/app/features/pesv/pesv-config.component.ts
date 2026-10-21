import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { PesvNavComponent } from './pesv-nav.component';

import {
  PesvCampoEmpresaPdf,
  PesvConfig,
  PesvPdfAlineacion,
  PesvPdfCatalogoDocumento,
  PesvPdfDocumentoConfig,
  PesvPdfDocumentoItemConfig,
  PesvPdfElementoLayout,
  PesvPdfFuenteOption,
  PesvPdfLogoCapa,
  PesvPdfTipografiaBloque,
  PesvPdfTipografiaDocumento,
  PesvService,
} from '../../core/services/pesv.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { ConfigRecibo, ConfigService } from '../../core/services/config.service';

type ConfigTab = 'general' | 'pdf';
type PdfConfigTab = 'global' | 'documentos';

const ID_TEXTO_LIBRE = '_textoLibre';
const ID_NUMERACION = '_numeracion';

const DOC_CAMPOS_ENCABEZADO = [
  'nombre',
  'titulo',
  'subtitulo',
  'versionDocumento',
  'vigenciaDocumento',
] as const;

const DOC_CAMPOS_ENCABEZADO_DEFAULT = [
  'titulo',
  'subtitulo',
  'versionDocumento',
  'vigenciaDocumento',
] as const;

@Component({
  selector: 'argo-pesv-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PesvNavComponent],
  templateUrl: './pesv-config.component.html',
  styleUrls: ['./pesv-shared.scss', './pesv-config.component.scss'],
})
export class PesvConfigComponent implements OnInit {
  private pesv = inject(PesvService);
  private configSvc = inject(ConfigService);
  accionPerm = inject(AccionPermisoService);

  tab = signal<ConfigTab>('pdf');
  pdfTab = signal<PdfConfigTab>('global');
  loading = signal(true);
  saving = signal(false);
  savingPdf = signal(false);
  uploading = signal<string | null>(null);
  msg = signal<string | null>(null);

  form = signal<PesvConfig>({
    vigenciaActiva: new Date().getFullYear(),
    tipoOrganizacion: 'cea',
  });
  pdfForm = signal<PesvPdfDocumentoConfig | null>(null);
  camposEmpresa = signal<PesvCampoEmpresaPdf[]>([]);
  catalogoDocumentos = signal<PesvPdfCatalogoDocumento[]>([]);
  docItemSeleccionado = signal<number | null>(null);
  filtroDoc = signal('');
  empresaPreview = signal<ConfigRecibo | null>(null);
  fuentesPdf = signal<PesvPdfFuenteOption[]>([
    { id: 'helvetica', label: 'Helvetica / Arial' },
    { id: 'times', label: 'Times New Roman' },
    { id: 'courier', label: 'Courier' },
    { id: 'calibri', label: 'Calibri' },
  ]);

  readonly MM_PREVIEW = 2.45;

  ngOnInit(): void {
    forkJoin({
      cfg: this.pesv.config(),
      pdf: this.pesv.configPdf(),
      recibo: this.configSvc.obtenerRecibo().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ cfg, pdf, recibo }) => {
        this.empresaPreview.set(recibo || null);
        this.form.set({ ...this.form(), ...cfg });
        this.pdfForm.set(this.normalizarPdfCliente(pdf.pdfDocumento));
        this.camposEmpresa.set(pdf.camposEmpresaDisponibles || []);
        this.fuentesPdf.set(pdf.fuentesPdf || []);
        const cat = pdf.catalogoDocumentos || [];
        this.catalogoDocumentos.set(cat);
        if (cat.length && this.docItemSeleccionado() == null) {
          this.docItemSeleccionado.set(cat[0].itemNo);
        }
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar configuración');
        this.loading.set(false);
      },
    });
  }

  patch(partial: Partial<PesvConfig>): void {
    this.form.set({ ...this.form(), ...partial });
  }

  patchPdf(partial: Partial<PesvPdfDocumentoConfig>): void {
    const cur = this.pdfForm();
    if (!cur) return;
    this.pdfForm.set({ ...cur, ...partial });
  }

  patchMargen(key: keyof PesvPdfDocumentoConfig['margenesMm'], val: number): void {
    const cur = this.pdfForm();
    if (!cur) return;
    this.pdfForm.set({
      ...cur,
      margenesMm: { ...cur.margenesMm, [key]: val },
    });
  }

  patchEncabezado(partial: Partial<PesvPdfDocumentoConfig['encabezado']>): void {
    const cur = this.pdfForm();
    if (!cur) return;
    let enc = { ...cur.encabezado, ...partial };
    enc = this.resyncLayoutBloque(enc, false);
    this.pdfForm.set({ ...cur, encabezado: enc });
  }

  patchPie(partial: Partial<PesvPdfDocumentoConfig['piePagina']>): void {
    const cur = this.pdfForm();
    if (!cur) return;
    let pie = { ...cur.piePagina, ...partial };
    pie = this.resyncLayoutBloque(pie, true);
    this.pdfForm.set({ ...cur, piePagina: pie });
  }

  patchMarcaAgua(partial: Partial<PesvPdfDocumentoConfig['marcaAgua']>): void {
    const cur = this.pdfForm();
    if (!cur) return;
    this.pdfForm.set({ ...cur, marcaAgua: { ...cur.marcaAgua, ...partial } });
  }

  docConfigActual(): PesvPdfDocumentoItemConfig | null {
    const itemNo = this.docItemSeleccionado();
    const cur = this.pdfForm();
    if (itemNo == null || !cur) return null;
    const key = String(itemNo);
    const fromForm = cur.documentosPorItem?.[key];
    if (fromForm) return fromForm;
    const cat = this.catalogoDocumentos().find((d) => d.itemNo === itemNo);
    return cat?.config ?? null;
  }

  patchDocItem(partial: Partial<PesvPdfDocumentoItemConfig>): void {
    const itemNo = this.docItemSeleccionado();
    const cur = this.pdfForm();
    if (itemNo == null || !cur) return;
    const key = String(itemNo);
    const prev = this.docConfigActual() || {
      nombre: '',
      titulo: '',
      subtitulo: '',
      versionDocumento: '',
      vigenciaDocumento: '',
      portada: { activa: false, imagenRuta: null },
      camposEncabezadoDocumentoActivos: [...DOC_CAMPOS_ENCABEZADO_DEFAULT],
      layoutEncabezadoDocumento: this.defaultLayoutEncabezadoDocumento([...DOC_CAMPOS_ENCABEZADO_DEFAULT]),
      tipografia: this.defaultTipografiaDocumento(),
    };
    let next: PesvPdfDocumentoItemConfig = {
      ...prev,
      ...partial,
      portada: partial.portada ? { ...prev.portada, ...partial.portada } : prev.portada,
      camposEncabezadoDocumentoActivos:
        partial.camposEncabezadoDocumentoActivos ??
        prev.camposEncabezadoDocumentoActivos ??
        [...DOC_CAMPOS_ENCABEZADO_DEFAULT],
      layoutEncabezadoDocumento:
        partial.layoutEncabezadoDocumento ??
        partial.layoutContenido ??
        prev.layoutEncabezadoDocumento ??
        prev.layoutContenido,
      tipografia: partial.tipografia ?? prev.tipografia ?? this.defaultTipografiaDocumento(),
    };
    next = this.resyncDocEncabezadoLayout(next);
    this.pdfForm.set({
      ...cur,
      documentosPorItem: { ...(cur.documentosPorItem || {}), [key]: next },
    });
  }

  patchDocPortada(partial: Partial<PesvPdfDocumentoItemConfig['portada']>): void {
    const prev = this.docConfigActual()?.portada || { activa: false, imagenRuta: null };
    this.patchDocItem({ portada: { ...prev, ...partial } });
  }

  catalogoDocumentosFiltrado(): PesvPdfCatalogoDocumento[] {
    const q = this.filtroDoc().trim().toLowerCase();
    const list = this.catalogoDocumentos();
    if (!q) return list;
    return list.filter(
      (d) =>
        String(d.itemNo).includes(q) ||
        d.tituloCatalogo.toLowerCase().includes(q) ||
        d.pregunta.toLowerCase().includes(q) ||
        (d.config?.nombre || '').toLowerCase().includes(q),
    );
  }

  docCatalogoSeleccionado(): PesvPdfCatalogoDocumento | null {
    const n = this.docItemSeleccionado();
    if (n == null) return null;
    return this.catalogoDocumentos().find((d) => d.itemNo === n) ?? null;
  }

  pdf(): PesvPdfDocumentoConfig | null {
    return this.pdfForm();
  }

  campoActivoEn(lista: string[], key: string): boolean {
    return lista.includes(key);
  }

  toggleCampo(bloque: 'encabezado' | 'piePagina', key: string): void {
    const cur = this.pdfForm();
    if (!cur) return;
    let b = { ...cur[bloque] };
    const set = new Set(b.camposActivos || []);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    b.camposActivos = [...set];
    b = this.resyncLayoutBloque(b, bloque === 'piePagina');
    this.pdfForm.set({ ...cur, [bloque]: b });
  }

  layoutBloque(bloque: 'encabezado' | 'piePagina'): PesvPdfElementoLayout[] {
    const pdf = this.pdf();
    if (!pdf) return [];
    const b = pdf[bloque];
    return b.elementosLayout?.length ? b.elementosLayout : this.resyncLayoutBloque({ ...b }, bloque === 'piePagina').elementosLayout || [];
  }

  camposDocEncabezadoActivos(): string[] {
    const dc = this.docConfigActual();
    if (!dc?.camposEncabezadoDocumentoActivos?.length) return [...DOC_CAMPOS_ENCABEZADO_DEFAULT];
    return dc.camposEncabezadoDocumentoActivos;
  }

  campoDocEncabezadoActivo(id: string): boolean {
    return this.camposDocEncabezadoActivos().includes(id);
  }

  toggleCampoDocEncabezado(id: string): void {
    const dc = this.docConfigActual();
    if (!dc) return;
    const set = new Set(this.camposDocEncabezadoActivos());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.patchDocItem({ camposEncabezadoDocumentoActivos: [...set] });
  }

  etiquetaCampoDocEncabezado(id: string): string {
    if (id === 'nombre') return 'Nombre del documento';
    if (id === 'titulo') return 'Título';
    if (id === 'subtitulo') return 'Subtítulo';
    if (id === 'versionDocumento') return 'Versión';
    if (id === 'vigenciaDocumento') return 'Vigencia (fecha)';
    return id;
  }

  vigenciaFechaInput(dc: PesvPdfDocumentoItemConfig): string {
    const v = (dc.vigenciaDocumento || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    return '';
  }

  onVigenciaFechaChange(iso: string): void {
    this.patchDocItem({ vigenciaDocumento: iso || '' });
  }

  layoutEncabezadoDocumento(): PesvPdfElementoLayout[] {
    const dc = this.docConfigActual();
    if (!dc) return this.defaultLayoutEncabezadoDocumento([...DOC_CAMPOS_ENCABEZADO_DEFAULT]);
    return dc.layoutEncabezadoDocumento?.length
      ? dc.layoutEncabezadoDocumento
      : this.defaultLayoutEncabezadoDocumento(this.camposDocEncabezadoActivos());
  }

  setAlineacionBloque(bloque: 'encabezado' | 'piePagina', id: string, alineacion: PesvPdfAlineacion): void {
    const layout = this.layoutBloque(bloque).map((e) => (e.id === id ? { ...e, alineacion } : e));
    if (bloque === 'encabezado') this.patchEncabezado({ elementosLayout: layout });
    else this.patchPie({ elementosLayout: layout });
  }

  moverEnBloque(bloque: 'encabezado' | 'piePagina', id: string, delta: -1 | 1): void {
    const list = [...this.layoutBloque(bloque)];
    const i = list.findIndex((e) => e.id === id);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    if (bloque === 'encabezado') this.patchEncabezado({ elementosLayout: list });
    else this.patchPie({ elementosLayout: list });
  }

  setAlineacionDocumento(id: string, alineacion: PesvPdfAlineacion): void {
    const layout = this.layoutEncabezadoDocumento().map((e) => (e.id === id ? { ...e, alineacion } : e));
    this.patchDocItem({ layoutEncabezadoDocumento: layout });
  }

  moverEnDocumento(id: string, delta: -1 | 1): void {
    const list = [...this.layoutEncabezadoDocumento()];
    const i = list.findIndex((e) => e.id === id);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this.patchDocItem({ layoutEncabezadoDocumento: list });
  }

  etiquetaLayoutId(id: string): string {
    if (id === ID_TEXTO_LIBRE) return 'Texto adicional / fijo';
    if (id === ID_NUMERACION) return 'Numeración de página';
    if (id === 'nombre') return 'Nombre del documento';
    if (id === 'versionDocumento') return 'Versión';
    if (id === 'vigenciaDocumento') return 'Vigencia (fecha)';
    return this.etiquetaCampoEmpresa(id) || id;
  }

  private defaultLayoutEncabezadoDocumento(campos: readonly string[]): PesvPdfElementoLayout[] {
    return campos.map((id) => ({ id, alineacion: 'center' as PesvPdfAlineacion }));
  }

  private resyncDocEncabezadoLayout(dc: PesvPdfDocumentoItemConfig): PesvPdfDocumentoItemConfig {
    const activos = dc.camposEncabezadoDocumentoActivos?.length
      ? dc.camposEncabezadoDocumentoActivos
      : [...DOC_CAMPOS_ENCABEZADO_DEFAULT];
    const allowed = new Set(activos);
    const src = dc.layoutEncabezadoDocumento || dc.layoutContenido || [];
    const out: PesvPdfElementoLayout[] = [];
    const seen = new Set<string>();
    for (const row of src) {
      if (!allowed.has(row.id) || seen.has(row.id)) continue;
      seen.add(row.id);
      out.push({ id: row.id, alineacion: row.alineacion || 'center' });
    }
    for (const id of activos) {
      if (seen.has(id)) continue;
      out.push({ id, alineacion: 'center' });
    }
    return { ...dc, camposEncabezadoDocumentoActivos: activos, layoutEncabezadoDocumento: out };
  }

  private defaultAlignForId(id: string): PesvPdfAlineacion {
    if (id === 'logo') return 'left';
    if (id === ID_NUMERACION || id === 'nit') return 'right';
    return 'center';
  }

  logoCapaBloque(bloque: 'encabezado' | 'piePagina'): PesvPdfLogoCapa {
    const pdf = this.pdf();
    const def =
      bloque === 'encabezado'
        ? this.defaultLogoCapa()
        : { anchoMm: 10, altoMm: 8, ancla: 'left' as PesvPdfAlineacion, opacidad: 1 };
    return { ...def, ...(pdf?.[bloque]?.logoCapa || {}) };
  }

  patchLogoCapa(bloque: 'encabezado' | 'piePagina', partial: Partial<PesvPdfLogoCapa>): void {
    const logoCapa = { ...this.logoCapaBloque(bloque), ...partial };
    if (bloque === 'encabezado') this.patchEncabezado({ logoCapa });
    else this.patchPie({ logoCapa });
  }

  patchTipografiaBloque(bloque: 'encabezado' | 'piePagina', partial: Partial<PesvPdfTipografiaBloque>): void {
    const cur = this.pdfForm();
    if (!cur) return;
    const b = cur[bloque];
    const tipografia = { ...(b.tipografia || { familia: 'helvetica', tamanoPt: 8 }), ...partial };
    if (bloque === 'encabezado') this.patchEncabezado({ tipografia });
    else this.patchPie({ tipografia });
  }

  patchDocTipografia(partial: Partial<PesvPdfTipografiaDocumento>): void {
    const prev = this.docConfigActual()?.tipografia || this.defaultTipografiaDocumento();
    this.patchDocItem({ tipografia: { ...prev, ...partial } });
  }

  logoActivoEn(bloque: 'encabezado' | 'piePagina'): boolean {
    const pdf = this.pdf();
    return !!pdf && this.campoActivoEn(pdf[bloque].camposActivos, 'logo');
  }

  cssFamilia(familiaId?: string): string {
    const id = (familiaId || 'helvetica').toLowerCase();
    if (id === 'times') return 'Times New Roman, Times, serif';
    if (id === 'courier') return 'Courier New, Courier, monospace';
    if (id === 'calibri') return 'Calibri, Segoe UI, sans-serif';
    return 'Helvetica, Arial, sans-serif';
  }

  estilosLogoCapa(bloque: 'encabezado' | 'piePagina'): Record<string, string> {
    const capa = this.logoCapaBloque(bloque);
    const w = capa.anchoMm * this.MM_PREVIEW;
    const h = capa.altoMm * this.MM_PREVIEW;
    const base: Record<string, string> = {
      width: `${w}px`,
      height: `${h}px`,
      opacity: String(capa.opacidad ?? 1),
      top: '50%',
      transform: 'translateY(-50%)',
    };
    if (capa.ancla === 'right') {
      base['right'] = '6px';
      base['left'] = 'auto';
    } else if (capa.ancla === 'center') {
      base['left'] = '50%';
      base['transform'] = 'translate(-50%, -50%)';
    } else {
      base['left'] = '6px';
    }
    return base;
  }

  estilosTipografiaBloque(bloque: 'encabezado' | 'piePagina'): Record<string, string> {
    const pdf = this.pdf();
    if (!pdf) return {};
    const t = pdf[bloque].tipografia || { familia: 'helvetica', tamanoPt: 8 };
    return {
      fontFamily: this.cssFamilia(t.familia),
      fontSize: `${t.tamanoPt * 0.72}px`,
    };
  }

  estilosLineaDocumento(filaId: string, dc: PesvPdfDocumentoItemConfig): Record<string, string> {
    const t = dc.tipografia || this.defaultTipografiaDocumento();
    let pt = t.tamanoMetaPt;
    if (filaId === 'nombre') pt = t.tamanoNombrePt;
    else if (filaId === 'titulo') pt = t.tamanoTituloPt;
    else if (filaId === 'subtitulo') pt = t.tamanoSubtituloPt;
    else if (filaId === 'versionDocumento') pt = t.tamanoVersionPt ?? t.tamanoMetaPt ?? 8;
    else if (filaId === 'vigenciaDocumento') pt = t.tamanoVigenciaPt ?? t.tamanoMetaPt ?? 8;
    const ptFinal = pt ?? 8;
    return {
      fontFamily: this.cssFamilia(t.familia),
      fontSize: `${ptFinal * 0.72}px`,
    };
  }

  private defaultLogoCapa(): PesvPdfLogoCapa {
    return { anchoMm: 12, altoMm: 10, ancla: 'left', opacidad: 1 };
  }

  private defaultTipografiaDocumento(): PesvPdfTipografiaDocumento {
    return {
      familia: 'helvetica',
      tamanoNombrePt: 7,
      tamanoTituloPt: 14,
      tamanoSubtituloPt: 10,
      tamanoVersionPt: 8,
      tamanoVigenciaPt: 8,
    };
  }

  formatoVigenciaPreview(iso: string): string {
    const v = (iso || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-');
      return `Vigencia hasta ${d}/${m}/${y}`;
    }
    return v ? `Vigencia ${v}` : '';
  }

  private resyncLayoutBloque(b: PesvPdfDocumentoConfig['encabezado'], isPie: boolean): PesvPdfDocumentoConfig['encabezado'] {
    const ids: string[] = (b.camposActivos || []).filter((k) => k !== 'logo');
    if (b.textoLibre?.trim()) ids.push(ID_TEXTO_LIBRE);
    if (isPie && b.mostrarNumeracion !== false) ids.push(ID_NUMERACION);
    const allowed = new Set(ids);
    const src = b.elementosLayout || [];
    const out: PesvPdfElementoLayout[] = [];
    const seen = new Set<string>();
    for (const row of src) {
      if (!allowed.has(row.id) || seen.has(row.id)) continue;
      seen.add(row.id);
      out.push({ id: row.id, alineacion: row.alineacion || this.defaultAlignForId(row.id) });
    }
    for (const id of ids) {
      if (seen.has(id)) continue;
      out.push({ id, alineacion: this.defaultAlignForId(id) });
    }
    return { ...b, elementosLayout: out };
  }

  guardarGeneral(): void {
    if (!this.accionPerm.tiene('pesv', 'editar')) {
      this.msg.set('Sin permiso');
      return;
    }
    this.saving.set(true);
    this.pesv.guardarConfig(this.form()).subscribe({
      next: (c) => {
        this.form.set({ ...this.form(), ...c });
        this.saving.set(false);
        this.msg.set('Configuración general guardada');
      },
      error: () => {
        this.saving.set(false);
        this.msg.set('Error al guardar');
      },
    });
  }

  guardarPdf(): void {
    const pdf = this.pdfForm();
    if (!pdf || !this.accionPerm.tiene('pesv', 'editar')) {
      this.msg.set('Sin permiso');
      return;
    }
    this.savingPdf.set(true);
    this.pesv.guardarConfigPdf(pdf).subscribe({
      next: (r) => {
        this.pdfForm.set(this.normalizarPdfCliente(r.pdfDocumento));
        if (r.catalogoDocumentos?.length) this.catalogoDocumentos.set(r.catalogoDocumentos);
        if (r.fuentesPdf?.length) this.fuentesPdf.set(r.fuentesPdf);
        this.savingPdf.set(false);
        this.msg.set('Configuración de PDF guardada');
      },
      error: () => {
        this.savingPdf.set(false);
        this.msg.set('Error al guardar PDF');
      },
    });
  }

  onPortadaDocumento(ev: Event): void {
    const itemNo = this.docItemSeleccionado();
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file || itemNo == null || !this.accionPerm.tiene('pesv', 'editar')) return;
    this.uploading.set(`portada-${itemNo}`);
    this.pesv.subirPortadaPdfDocumento(itemNo, file).subscribe({
      next: (r) => {
        this.pdfForm.set(r.pdfDocumento);
        if (r.catalogoDocumentos?.length) this.catalogoDocumentos.set(r.catalogoDocumentos);
        this.uploading.set(null);
        this.msg.set('Portada cargada (PNG/JPG a tamaño hoja al generar el PDF)');
        (ev.target as HTMLInputElement).value = '';
      },
      error: (err) => {
        this.uploading.set(null);
        this.msg.set(err?.error?.message || 'No se pudo subir la portada');
      },
    });
  }

  onImagen(zona: 'encabezado' | 'pie' | 'marcaAgua', ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file || !this.accionPerm.tiene('pesv', 'editar')) return;
    this.uploading.set(zona);
    this.pesv.subirImagenPdfLayout(zona, file).subscribe({
      next: (r) => {
        this.pdfForm.set(r.pdfDocumento);
        if (r.catalogoDocumentos?.length) this.catalogoDocumentos.set(r.catalogoDocumentos);
        this.uploading.set(null);
        this.msg.set('Imagen cargada (se ajustará al alto del bloque al generar el PDF)');
        (ev.target as HTMLInputElement).value = '';
      },
      error: (err) => {
        this.uploading.set(null);
        this.msg.set(err?.error?.message || 'No se pudo subir la imagen');
      },
    });
  }

  urlImagen(ruta?: string | null): string | null {
    return this.pesv.urlUploads(ruta);
  }

  etiquetaTamano(t: string): string {
    if (t === 'legal') return 'Oficio (Legal)';
    if (t === 'a4') return 'A4';
    return 'Carta (Letter)';
  }

  previewDocMeta(): PesvPdfDocumentoItemConfig | null {
    if (this.pdfTab() !== 'documentos') return null;
    return this.docConfigActual();
  }

  previewFilasBloque(bloque: 'encabezado' | 'piePagina'): { id: string; text: string; align: PesvPdfAlineacion; numeracion?: boolean }[] {
    const pdf = this.pdf();
    const emp = this.empresaPreview();
    if (!pdf) return [];
    const b = pdf[bloque];
    if (!b?.activo || b.modo === 'imagen') return [];
    const filas: { id: string; text: string; align: PesvPdfAlineacion; numeracion?: boolean }[] = [];
    for (const el of this.layoutBloque(bloque)) {
      if (el.id === ID_NUMERACION) {
        if (b.mostrarNumeracion !== false) {
          filas.push({
            id: el.id,
            text: '1 / 1',
            align: el.alineacion,
            numeracion: true,
          });
        }
        continue;
      }
      if (el.id === ID_TEXTO_LIBRE) {
        const t = b.textoLibre?.trim();
        if (t) filas.push({ id: el.id, text: t, align: el.alineacion });
        continue;
      }
      if (el.id === 'logo') continue;
      if (!this.campoActivoEn(b.camposActivos, el.id)) continue;
      const v = this.valorCampoEmpresaPreview(el.id, emp);
      if (v) filas.push({ id: el.id, text: v, align: el.alineacion });
    }
    return filas;
  }

  previewFilasEncabezadoDocumento(dc: PesvPdfDocumentoItemConfig): { id: string; text: string; align: PesvPdfAlineacion }[] {
    const filas: { id: string; text: string; align: PesvPdfAlineacion }[] = [];
    const activos = new Set(dc.camposEncabezadoDocumentoActivos?.length ? dc.camposEncabezadoDocumentoActivos : [...DOC_CAMPOS_ENCABEZADO_DEFAULT]);
    const layout = dc.layoutEncabezadoDocumento?.length
      ? dc.layoutEncabezadoDocumento
      : this.defaultLayoutEncabezadoDocumento([...activos]);
    for (const el of layout) {
      if (!activos.has(el.id)) continue;
      let text = '';
      switch (el.id) {
        case 'nombre':
          text = dc.nombre;
          break;
        case 'titulo':
          text = dc.titulo;
          break;
        case 'subtitulo':
          text = dc.subtitulo;
          break;
        case 'versionDocumento':
          text = dc.versionDocumento ? `Versión ${dc.versionDocumento}` : '';
          break;
        case 'vigenciaDocumento':
          text = this.formatoVigenciaPreview(dc.vigenciaDocumento);
          break;
      }
      if (text?.trim()) filas.push({ id: el.id, text: text.trim(), align: el.alineacion });
    }
    return filas;
  }

  private valorCampoEmpresaPreview(key: string, emp: ConfigRecibo | null): string {
    if (!emp) return this.etiquetaCampoEmpresa(key);
    switch (key) {
      case 'razonSocial':
      case 'nombreEmpresa':
        return (emp.nombreEmpresa || emp.nombreSede || '').trim() || this.etiquetaCampoEmpresa(key);
      case 'nit':
        return emp.nit ? `NIT ${emp.nit}` : '';
      case 'representanteLegal':
        return emp.representanteLegal ? `Rep. legal: ${emp.representanteLegal}` : '';
      case 'ciudad':
        return emp.ciudad || '';
      case 'departamento':
        return emp.departamento || '';
      case 'direccion':
        return emp.direccion || '';
      case 'telefono':
        return emp.telefono ? `Tel. ${emp.telefono}` : '';
      case 'email':
        return emp.email || '';
      default:
        return '';
    }
  }

  etiquetaCampoEmpresa(key: string): string {
    return this.camposEmpresa().find((c) => c.key === key)?.label || key;
  }

  logoPreviewUrl(): string | null {
    const emp = this.empresaPreview();
    if (!emp) return null;
    if (emp.urlLogoDataUrl) return emp.urlLogoDataUrl;
    if (emp.urlLogo) {
      return emp.urlLogo.startsWith('data:') || emp.urlLogo.startsWith('http')
        ? emp.urlLogo
        : this.pesv.urlUploads(emp.urlLogo);
    }
    return null;
  }

  private normalizarPdfCliente(pdf: PesvPdfDocumentoConfig): PesvPdfDocumentoConfig {
    const enc = this.resyncLayoutBloque({ ...pdf.encabezado }, false);
    const pie = this.resyncLayoutBloque({ ...pdf.piePagina }, true);
    return {
      ...pdf,
      encabezado: {
        ...enc,
        logoCapa: { ...this.defaultLogoCapa(), ...(enc.logoCapa || {}) },
      },
      piePagina: {
        ...pie,
        logoCapa: {
          anchoMm: 10,
          altoMm: 8,
          ancla: 'left',
          opacidad: 1,
          ...(pie.logoCapa || {}),
        },
      },
    };
  }

  estilosMarcaAguaLogo(): Record<string, string> {
    const pdf = this.pdf();
    if (!pdf) return {};
    const t = pdf.marcaAgua.logoTamano || { anchoMm: 48, altoMm: 42 };
    return {
      width: `${t.anchoMm * this.MM_PREVIEW}px`,
      height: `${t.altoMm * this.MM_PREVIEW}px`,
      objectFit: 'contain',
    };
  }

  patchMarcaAguaLogoTamano(partial: { anchoMm?: number; altoMm?: number }): void {
    const cur = this.pdf()?.marcaAgua.logoTamano || { anchoMm: 48, altoMm: 42 };
    this.patchMarcaAgua({ logoTamano: { ...cur, ...partial } });
  }

  marcaAguaPreviewUrl(): string | null {
    const pdf = this.pdf();
    if (!pdf?.marcaAgua.activa) return null;
    const custom = this.urlImagen(pdf.marcaAgua.imagenRuta);
    if (custom) return custom;
    if (pdf.marcaAgua.usarLogoEmpresa !== false) return this.logoPreviewUrl();
    return null;
  }
}
