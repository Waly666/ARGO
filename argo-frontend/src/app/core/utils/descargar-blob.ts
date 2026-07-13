/**
 * Dispara una descarga de Blob de forma fiable (ancla en DOM + revoke diferido).
 * Evita fallos silenciosos al revocar el object URL antes de que el navegador lea el archivo.
 */
export async function descargarBlob(blob: Blob, filename: string): Promise<void> {
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
    head[0] === 0x7b || // {
    head[0] === 0x5b; // [

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

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revocar tarde: liberar de inmediato anula descargas grandes/lentas.
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
