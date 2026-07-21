import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  // eslint-disable-next-line no-undef
  return btoa(binary);
}

/** Guarda bytes y abre el diálogo nativo de compartir (Excel, etc.). */
export async function compartirArchivoBytes(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
  const safe = (fileName || 'archivo').replace(/[^\w.\-]+/g, '_');
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) throw new Error('No hay carpeta temporal disponible.');
  const uri = `${dir}${safe}`;
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: safe,
  });
}
