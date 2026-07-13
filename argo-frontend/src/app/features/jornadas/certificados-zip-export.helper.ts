import { firstValueFrom } from 'rxjs';

import { JornadaCapService } from '../../core/services/jornada-cap.service';
import { descargarBlob } from '../../core/utils/descargar-blob';
import type { CertZipProgreso } from './certificados-zip-progreso-modal.component';

export type CertZipFiltros = {
  idContrato?: string;
  idJornada?: string;
  idClase?: string;
  desde?: string;
  hasta?: string;
};

const POLL_MS = 450;

function httpErrorMessage(err: unknown, fallback: string): string {
  const e = err as { error?: { message?: string }; message?: string };
  return e?.error?.message || e?.message || fallback;
}

/**
 * Orquesta job ZIP + polling + descarga, actualizando progreso para el modal.
 */
export async function ejecutarExportZipCertificados(
  svc: JornadaCapService,
  filtros: CertZipFiltros,
  onProgreso: (p: CertZipProgreso) => void,
  filenameFallback: string,
): Promise<void> {
  onProgreso({
    status: 'running',
    fase: 'Iniciando generación…',
    hecho: 0,
    total: 0,
    porcentaje: 1,
  });

  let inicio;
  try {
    inicio = await firstValueFrom(svc.iniciarCertificadosJornadaZipJob(filtros));
  } catch (err) {
    throw new Error(httpErrorMessage(err, 'No se pudo iniciar la generación del ZIP.'));
  }
  const jobId = inicio.jobId;
  if (!jobId) {
    throw new Error('No se pudo iniciar el job de ZIP.');
  }

  onProgreso({
    status: 'running',
    jobId,
    fase: inicio.fase || 'Generando…',
    hecho: inicio.hecho || 0,
    total: inicio.total || 0,
    porcentaje: inicio.porcentaje || 2,
  });

  let ready = false;
  let filename = filenameFallback;

  while (!ready) {
    await sleep(POLL_MS);
    let p;
    try {
      p = await firstValueFrom(svc.progresoCertificadosJornadaZipJob(jobId));
    } catch (err) {
      throw new Error(httpErrorMessage(err, 'No se pudo consultar el progreso del ZIP.'));
    }
    if (p.status === 'error') {
      const lastError = p.message || 'Error al generar el ZIP';
      onProgreso({
        status: 'error',
        jobId,
        fase: 'Error',
        hecho: p.hecho || 0,
        total: p.total || 0,
        porcentaje: p.porcentaje || 0,
        message: lastError,
      });
      throw new Error(lastError);
    }
    onProgreso({
      status: p.status === 'ready' ? 'ready' : 'running',
      jobId,
      fase: p.fase || 'Generando…',
      hecho: p.hecho || 0,
      total: p.total || 0,
      porcentaje: p.porcentaje || 0,
      filename: p.filename,
    });
    if (p.status === 'ready') {
      ready = true;
      if (p.filename) filename = p.filename;
    }
  }

  onProgreso({
    status: 'downloading',
    jobId,
    fase: 'Descargando ZIP…',
    hecho: 0,
    total: 0,
    porcentaje: 100,
    filename,
  });

  let blob: Blob;
  try {
    blob = await firstValueFrom(svc.descargarCertificadosJornadaZipJob(jobId));
  } catch (err) {
    throw new Error(httpErrorMessage(err, 'No se pudo descargar el ZIP.'));
  }
  await descargarBlob(blob, filename, { labelBoton: `⬇ Guardar ${filename}` });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
