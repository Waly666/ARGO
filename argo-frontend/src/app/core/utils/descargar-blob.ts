/**
 * Descarga fiable de Blob (ZIP/PDF).
 * - En HTTPS/localhost: File System Access (sobrevive esperas largas).
 * - En HTTP por IP (LAN): tras espera larga Chrome pierde el gesto del usuario;
 *   se muestra un botón visible para guardar con un clic nuevo.
 */

export type DescargaBlobOpts = {
  /** Texto del botón si hace falta clic manual (LAN HTTP). */
  labelBoton?: string;
};

function mimeFor(filename: string, esZip: boolean, esPdf: boolean, fallback: string): string {
  if (esZip || /\.zip$/i.test(filename)) return 'application/zip';
  if (esPdf || /\.pdf$/i.test(filename)) return 'application/pdf';
  return fallback || 'application/octet-stream';
}

function mostrarBotonGuardar(url: string, filename: string, label?: string): Promise<void> {
  return new Promise((resolve) => {
    const prev = document.getElementById('argo-descarga-blob-bar');
    if (prev) prev.remove();

    const bar = document.createElement('div');
    bar.id = 'argo-descarga-blob-bar';
    bar.setAttribute('role', 'status');
    bar.style.cssText = [
      'position:fixed',
      'bottom:1.25rem',
      'right:1.25rem',
      'z-index:99999',
      'display:flex',
      'flex-direction:column',
      'gap:0.5rem',
      'max-width:min(22rem,calc(100vw - 2rem))',
      'padding:0.85rem 1rem',
      'border-radius:10px',
      'background:#0f172a',
      'color:#e2e8f0',
      'box-shadow:0 10px 40px rgba(0,0,0,.45)',
      'border:1px solid rgba(56,189,248,.35)',
      'font:600 0.9rem/1.35 system-ui,sans-serif',
    ].join(';');

    const hint = document.createElement('p');
    hint.style.cssText = 'margin:0;font-weight:500;font-size:0.8rem;color:#94a3b8';
    hint.textContent = 'El archivo ya está listo. Pulse el botón para guardarlo.';

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.textContent = label || `⬇ Guardar ${filename}`;
    a.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      'padding:0.55rem 0.9rem',
      'border-radius:8px',
      'background:#0284c7',
      'color:#fff',
      'text-decoration:none',
      'cursor:pointer',
    ].join(';');

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.textContent = 'Cerrar';
    cerrar.style.cssText =
      'align-self:flex-end;border:0;background:transparent;color:#94a3b8;cursor:pointer;font:500 0.75rem sans-serif';

    const cleanup = () => {
      bar.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      resolve();
    };

    a.addEventListener('click', () => {
      window.setTimeout(cleanup, 400);
    });
    cerrar.addEventListener('click', cleanup);

    bar.appendChild(hint);
    bar.appendChild(a);
    bar.appendChild(cerrar);
    document.body.appendChild(bar);
    try {
      a.focus();
    } catch {
      /* ignore */
    }
  });
}

/**
 * Dispara una descarga de Blob de forma fiable.
 */
export async function descargarBlob(
  blob: Blob,
  filename: string,
  opts?: DescargaBlobOpts,
): Promise<void> {
  if (!blob || blob.size < 4) {
    throw new Error('El archivo recibido está vacío.');
  }

  const type = String(blob.type || '').toLowerCase();
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const esZip = head[0] === 0x50 && head[1] === 0x4b; // PK
  const esPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
  const pareceJson =
    type.includes('json') ||
    type.includes('text') ||
    head[0] === 0x7b ||
    head[0] === 0x5b;

  if (pareceJson && !esZip && !esPdf) {
    let texto = 'No se pudo descargar el archivo.';
    try {
      const j = JSON.parse(await blob.text());
      if (j?.message) texto = String(j.message);
    } catch {
      /* ignore */
    }
    throw new Error(texto);
  }

  const wantsZip = /\.zip$/i.test(filename);
  if (wantsZip && !esZip) {
    throw new Error('La respuesta del servidor no es un ZIP válido.');
  }

  const mime = mimeFor(filename, esZip, esPdf, type);
  const buffer = await blob.arrayBuffer();
  const file = new File([buffer], filename, { type: mime });

  const w = window as Window & {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{ createWritable: () => Promise<{ write: (d: Blob) => Promise<void>; close: () => Promise<void> }> }>;
  };

  if (window.isSecureContext && typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: wantsZip
          ? [{ description: 'Archivo ZIP', accept: { 'application/zip': ['.zip'] } }]
          : esPdf
            ? [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }]
            : undefined,
      });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      return;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'AbortError') return;
      // Continuar con ancla / botón
    }
  }

  const url = URL.createObjectURL(file);

  // Fuera de HTTPS/localhost el gesto del clic original caduca tras esperas largas:
  // Chrome abre el blob en pestaña (aviso insecure) en lugar de descargar.
  if (!window.isSecureContext) {
    await mostrarBotonGuardar(url, filename, opts?.labelBoton);
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Lee mensaje de error cuando HttpClient usó responseType: 'blob'. */
export async function mensajeErrorBlob(err: unknown, fallback = 'No se pudo descargar.'): Promise<string> {
  const e = err as { error?: Blob | { message?: string }; message?: string };
  try {
    const body = e?.error;
    if (body instanceof Blob) {
      const t = await body.text();
      if (t) {
        const j = JSON.parse(t);
        if (j?.message) return String(j.message);
      }
    } else if (body && typeof body === 'object' && 'message' in body && body.message) {
      return String(body.message);
    }
  } catch {
    /* ignore */
  }
  return e?.message || fallback;
}
