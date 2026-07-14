import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ConfigPaginasInformesService,
  PaginaInforme,
  PaginasInformesCatalogos,
} from '../../core/services/config-paginas-informes.service';

interface GrupoUi {
  id: string;
  label: string;
  paginas: PaginaInforme[];
}

interface PagePreviewModel {
  widthMm: number;
  heightMm: number;
  label: string;
  /** CSS width of the paper preview box */
  boxW: number;
  boxH: number;
  /** Padding in px representing margins on the preview */
  padTop: number;
  padRight: number;
  padBottom: number;
  padLeft: number;
}

const PREVIEW_MAX = 200;

@Component({
  selector: 'argo-config-paginas-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-paginas-informes.component.html',
  styleUrls: ['./config-paginas-informes.component.scss'],
})
export class ConfigPaginasInformesComponent implements OnInit {
  private svc = inject(ConfigPaginasInformesService);

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  paginas = signal<PaginaInforme[]>([]);
  catalogos = signal<PaginasInformesCatalogos | null>(null);
  grupoAbierto = signal<string | null>('comprobantes');

  grupos = computed<GrupoUi[]>(() => {
    const mapa = new Map(this.paginas().map((p) => [p.key, p]));
    const cats = this.catalogos()?.grupos || [];
    if (cats.length) {
      return cats.map((g) => ({
        id: g.id,
        label: g.label,
        paginas: g.informes.map((i) => mapa.get(i.key)!).filter(Boolean),
      }));
    }
    const byGrupo = new Map<string, GrupoUi>();
    for (const p of this.paginas()) {
      const id = p.grupoId || 'otros';
      if (!byGrupo.has(id)) {
        byGrupo.set(id, { id, label: p.grupoLabel || id, paginas: [] });
      }
      byGrupo.get(id)!.paginas.push(p);
    }
    return [...byGrupo.values()];
  });

  ngOnInit(): void {
    this.svc.catalogos().subscribe({
      next: (c) => this.catalogos.set(c),
      error: () => this.catalogos.set(null),
    });
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.svc.obtener(true).subscribe({
      next: (r) => {
        this.paginas.set(structuredClone(r.paginas || []));
        this.loading.set(false);
      },
      error: () => {
        this.paginas.set([]);
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set('No se pudo cargar la configuración de páginas de informes.');
      },
    });
  }

  toggleGrupo(id: string): void {
    this.grupoAbierto.set(this.grupoAbierto() === id ? null : id);
  }

  patch(key: string, campo: keyof PaginaInforme, valor: unknown): void {
    this.paginas.update((rows) =>
      rows.map((r) => (r.key === key ? { ...r, [campo]: valor } : r)),
    );
  }

  patchMargin(key: string, lado: 'top' | 'right' | 'bottom' | 'left', valor: number | string): void {
    const n = Math.max(0, Math.min(50, Number(valor) || 0));
    this.paginas.update((rows) =>
      rows.map((r) =>
        r.key === key ? { ...r, margins: { ...r.margins, [lado]: n } } : r,
      ),
    );
  }

  igualarMargenes(key: string, desde: 'top' | 'right' | 'bottom' | 'left' = 'top'): void {
    const p = this.paginas().find((x) => x.key === key);
    if (!p) return;
    const v = p.margins[desde];
    this.paginas.update((rows) =>
      rows.map((r) =>
        r.key === key
          ? { ...r, margins: { top: v, right: v, bottom: v, left: v } }
          : r,
      ),
    );
  }

  /** Dimensiones físicas aproximadas para la vista previa (estilo Word). */
  paperSizeMm(p: PaginaInforme): { w: number; h: number; label: string } {
    const map: Record<string, { w: number; h: number; label: string }> = {
      A4: { w: 210, h: 297, label: 'A4' },
      letter: { w: 216, h: 279, label: 'Carta' },
      legal: { w: 216, h: 356, label: 'Oficio' },
      media_carta: { w: 140, h: 216, label: 'Media carta' },
      termico_80: { w: 80, h: 160, label: 'Térmico 80 mm' },
      termico_58: { w: 58, h: 140, label: 'Térmico 58 mm' },
      etiqueta_qr: { w: 52, h: 32, label: 'Etiqueta QR' },
      cert_horizontal: { w: 297, h: 210, label: 'Certificado horizontal' },
      cert_vertical: { w: 210, h: 297, label: 'Certificado vertical' },
    };
    const base = map[p.size] || map['A4'];
    const ori = String(p.orientation || '').toLowerCase();
    // Solo girar presets de hoja estándar (no los que ya tienen forma fija)
    const girables = new Set(['A4', 'letter', 'legal']);
    if (girables.has(p.size) && ori === 'landscape') {
      return { w: base.h, h: base.w, label: `${base.label} horizontal` };
    }
    if (girables.has(p.size) && ori === 'portrait') {
      return { ...base, label: `${base.label} vertical` };
    }
    return base;
  }

  preview(p: PaginaInforme): PagePreviewModel {
    const paper = this.paperSizeMm(p);
    const scale = Math.min(PREVIEW_MAX / paper.w, PREVIEW_MAX / paper.h);
    const boxW = Math.round(paper.w * scale);
    const boxH = Math.round(paper.h * scale);
    const m = p.margins || { top: 0, right: 0, bottom: 0, left: 0 };
    const clampPad = (mm: number, max: number) =>
      Math.min(Math.round(mm * scale), Math.floor(max * 0.42));
    return {
      widthMm: paper.w,
      heightMm: paper.h,
      label: paper.label,
      boxW,
      boxH,
      padTop: clampPad(m.top, boxH),
      padRight: clampPad(m.right, boxW),
      padBottom: clampPad(m.bottom, boxH),
      padLeft: clampPad(m.left, boxW),
    };
  }

  paperStyle(p: PaginaInforme): Record<string, string> {
    const v = this.preview(p);
    return {
      width: `${v.boxW}px`,
      height: `${v.boxH}px`,
      padding: `${v.padTop}px ${v.padRight}px ${v.padBottom}px ${v.padLeft}px`,
    };
  }

  cssPreview(p: PaginaInforme): string {
    const m = p.margins || { top: 12, right: 12, bottom: 12, left: 12 };
    const margin = `${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm`;
    const sizeMap: Record<string, string> = {
      A4: 'A4',
      letter: 'letter',
      legal: 'legal',
      media_carta: '140mm 216mm',
      termico_80: '80mm auto',
      termico_58: '58mm auto',
      etiqueta_qr: '52mm 32mm',
      cert_horizontal: '297mm 210mm',
      cert_vertical: '210mm 297mm',
    };
    let size = sizeMap[p.size] || p.size || 'A4';
    if (['A4', 'letter', 'legal'].includes(p.size) && p.orientation) {
      size = `${size} ${p.orientation}`;
    }
    return `@page { size: ${size}; margin: ${margin}; }`.replace(/\s+/g, ' ').trim();
  }

  guardar(): void {
    this.saving.set(true);
    this.msg.set(null);
    this.svc.guardar(this.paginas()).subscribe({
      next: (r) => {
        this.paginas.set(structuredClone(r.paginas || []));
        this.saving.set(false);
        this.msgError.set(false);
        this.msg.set('Páginas de informes guardadas.');
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo guardar.');
      },
    });
  }
}
