import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_LADO = 1600;
const JPEG_COMPRESS = 0.72;

/**
 * Android ImageDecoder / FormData no aceptan data: URI
 * ("Unsupported for data URI implementation").
 * Deja un archivo file:// en caché listo para multipart.
 */
export async function uriLocalParaUpload(
  uri: string,
  nombre = 'evidencia.jpg',
): Promise<string> {
  const src = String(uri || '').trim();
  if (!src) throw new Error('No hay foto para subir.');

  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) throw new Error('No hay carpeta temporal disponible.');
  const dest = `${dir}${Date.now()}-${nombre.replace(/[^\w.\-]+/g, '_')}`;

  if (src.startsWith('data:')) {
    const comma = src.indexOf(',');
    const b64 = comma >= 0 ? src.slice(comma + 1) : src;
    await FileSystem.writeAsStringAsync(dest, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return dest;
  }

  const from = src.startsWith('/') ? `file://${src}` : src;
  try {
    await FileSystem.copyAsync({ from, to: dest });
    return dest;
  } catch {
    return from;
  }
}

function resizeOps(width?: number, height?: number): ImageManipulator.Action[] {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  if (w >= h && w > MAX_LADO) return [{ resize: { width: MAX_LADO } }];
  if (h > MAX_LADO) return [{ resize: { height: MAX_LADO } }];
  if (!w && !h) return [{ resize: { width: MAX_LADO } }];
  return [];
}

/** Fuerza JPEG reducido (las cámaras Android a veces entregan PNG de varios MB). */
export async function comprimirFotoJpeg(
  uri: string,
  width?: number,
  height?: number,
): Promise<string> {
  const src = uri.startsWith('/') ? `file://${uri}` : uri;
  const out = await ImageManipulator.manipulateAsync(src, resizeOps(width, height), {
    compress: JPEG_COMPRESS,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  if (!out?.uri) throw new Error('No se pudo comprimir la foto.');
  return uriLocalParaUpload(out.uri, 'evidencia.jpg');
}

export async function capturarFotoCamara(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('CAMARA_PERMISO');
  }

  // quality 1 evita la compresión nativa (ImageDecoder) que falla con data:/content: en Android.
  // Luego se recodifica a JPEG reducido con ImageManipulator.
  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
    exif: false,
    ...(Platform.OS === 'android' ? { legacy: true } : {}),
  };

  const shot = await ImagePicker.launchCameraAsync(opts);
  if (shot.canceled || !shot.assets?.[0]?.uri) return null;
  const asset = shot.assets[0];
  const local = await uriLocalParaUpload(asset.uri, 'captura.jpg');
  return comprimirFotoJpeg(local, asset.width, asset.height);
}
