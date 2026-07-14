import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import QRCode from 'qrcode';

import { formatNumDoc } from '../../core/utils/num-doc.helpers';
import { ConfigPaginasInformesService } from '../../core/services/config-paginas-informes.service';
import {
  buildJornadaAlumnoQrPayload,
  etiquetaHtmlAlumno,
  paginaEtiquetasHtml,
  type JornadaAlumnoEtiqueta,
} from './jornada-alumno-qr.util';

@Injectable({ providedIn: 'root' })
export class JornadaEtiquetaQrService {
  private paginasSvc = inject(ConfigPaginasInformesService);

  /**
   * Genera etiquetas QR (solo jornadas) y abre ventana de impresión.
   * El payload es el mismo que lee la app móvil al escanear.
   */
  async imprimirEtiquetas(alumnos: JornadaAlumnoEtiqueta[]): Promise<{ ok: number; fail: number }> {
    const unicos = this.dedupe(alumnos);
    if (!unicos.length) return { ok: 0, fail: 0 };

    const bloques: string[] = [];
    let fail = 0;
    for (const a of unicos) {
      const numDoc = formatNumDoc(a.numDoc) || String(a.numDoc ?? '').replace(/\D/g, '');
      const nombre = String(a.nombre || '').trim() || numDoc;
      if (numDoc.length < 5) {
        fail += 1;
        continue;
      }
      try {
        const payload = buildJornadaAlumnoQrPayload(numDoc, nombre);
        const qrDataUrl = await QRCode.toDataURL(payload, {
          width: 280,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        bloques.push(
          etiquetaHtmlAlumno({
            qrDataUrl,
            numDoc,
            nombre,
            empresa: a.empresa,
            codContrato: a.codContrato,
            fechaJornada: a.fechaJornada,
          }),
        );
      } catch {
        fail += 1;
      }
    }

    if (!bloques.length) return { ok: 0, fail };

    let atPageCss: string | undefined;
    try {
      atPageCss = await firstValueFrom(this.paginasSvc.ensureAndAtPageCss('etiqueta_qr_jornada'));
    } catch {
      atPageCss = undefined;
    }
    const html = paginaEtiquetasHtml(bloques, atPageCss);
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      throw new Error('Permita ventanas emergentes para imprimir las etiquetas QR.');
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    return { ok: bloques.length, fail };
  }

  async imprimirUna(
    numDoc: string | number,
    nombre: string,
    extra?: {
      empresa?: string | null;
      codContrato?: string | null;
      fechaJornada?: string | null;
    },
  ): Promise<void> {
    await this.imprimirEtiquetas([
      {
        numDoc,
        nombre,
        empresa: extra?.empresa,
        codContrato: extra?.codContrato,
        fechaJornada: extra?.fechaJornada,
      },
    ]);
  }

  private dedupe(alumnos: JornadaAlumnoEtiqueta[]): JornadaAlumnoEtiqueta[] {
    const seen = new Set<string>();
    const out: JornadaAlumnoEtiqueta[] = [];
    for (const a of alumnos) {
      const key = formatNumDoc(a.numDoc) || String(a.numDoc ?? '').replace(/\D/g, '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(a);
    }
    return out;
  }
}
