import { Injectable, inject } from '@angular/core';

import { ConfigRecibo, ConfigService } from './config.service';
import {
  buildInformeGeneralHtml,
  buildInformeIndividualHtml,
} from './caja-informe-document';
import {
  CajaDescuadre,
  CajaEgresoItem,
  CajaIngresoItem,
  CajaSesion,
  ResumenCaja,
  ResumenCierreGeneral,
} from './caja-sesion.service';

@Injectable({ providedIn: 'root' })
export class CajaInformePrintService {
  private configSvc = inject(ConfigService);
  private empresaCache: ConfigRecibo | null = null;

  imprimirIndividual(opts: {
    sesion: CajaSesion;
    resumen: ResumenCaja;
    ingresos: CajaIngresoItem[];
    egresos: CajaEgresoItem[];
    descuadre?: CajaDescuadre | null;
    empresa?: ConfigRecibo | null;
  }): void {
    const run = (empresa: ConfigRecibo | null) => {
      const html = buildInformeIndividualHtml({ ...opts, empresa });
      this.abrirVentana(html, `Cuadre de caja #${opts.sesion.idSesion}`);
    };
    if (opts.empresa !== undefined) {
      run(opts.empresa);
      return;
    }
    this.obtenerEmpresa(run);
  }

  imprimirGeneral(general: ResumenCierreGeneral, empresa?: ConfigRecibo | null): void {
    const run = (emp: ConfigRecibo | null) => {
      const html = buildInformeGeneralHtml({ general, empresa: emp });
      this.abrirVentana(html, 'Informe general de cierre de cajas');
    };
    if (empresa !== undefined) {
      run(empresa);
      return;
    }
    this.obtenerEmpresa(run);
  }

  private obtenerEmpresa(cb: (empresa: ConfigRecibo | null) => void): void {
    if (this.empresaCache) {
      cb(this.empresaCache);
      return;
    }
    this.configSvc.obtenerRecibo().subscribe({
      next: (c) => {
        this.empresaCache = c;
        cb(c);
      },
      error: () => cb(null),
    });
  }

  private abrirVentana(html: string, titulo: string): void {
    const ventana = window.open('', '_blank', 'width=920,height=720,scrollbars=yes');
    if (!ventana) {
      alert('Permita ventanas emergentes para ver el informe de caja.');
      return;
    }
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.document.title = titulo;
    ventana.focus();
    const imprimir = () => {
      try {
        ventana.focus();
        ventana.print();
      } catch {
        /* usuario puede usar botón Imprimir de la ventana */
      }
    };
    if (ventana.document.readyState === 'complete') {
      setTimeout(imprimir, 300);
    } else {
      ventana.onload = () => setTimeout(imprimir, 300);
    }
  }
}
