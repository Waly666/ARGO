import type { CertZipProgreso } from './certificados-zip-progreso-modal.component';

export type ProgresoEntregaEmit = {
  open: boolean;
  progreso: CertZipProgreso;
  titulo: string;
  subtitulo: string;
};

export const TITULO_PROGRESO_PAQUETE_CONTRATO = 'Generando paquete de entrega del contrato';
export const SUBTITULO_PROGRESO_PAQUETE_CONTRATO =
  'Informes generales + encuesta + por jornada (informe, certificados, evidencia PDF, fotos de clases y evidencia fotográfica adicional)';
