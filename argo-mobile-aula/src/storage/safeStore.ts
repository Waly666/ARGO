import * as SecureStore from 'expo-secure-store';

const memory = new Map<string, string>();
const TIMEOUT_MS = 2500;
/** SecureStore en Android limita ~2048 bytes por valor. */
const SECURE_MAX = 1800;

async function withTimeout<T>(p: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), TIMEOUT_MS)),
  ]);
}

function chunkMetaKey(key: string): string {
  return `${key}__chunks`;
}

function chunkKey(key: string, index: number): string {
  return `${key}__${index}`;
}

async function readChunked(key: string): Promise<string | null> {
  const meta = await withTimeout(SecureStore.getItemAsync(chunkMetaKey(key)), null);
  if (!meta) return null;
  const count = Number.parseInt(meta, 10);
  if (!Number.isFinite(count) || count < 1) return null;
  let value = '';
  for (let i = 0; i < count; i += 1) {
    const part = await withTimeout(SecureStore.getItemAsync(chunkKey(key, i)), null);
    if (part == null) return null;
    value += part;
  }
  return value;
}

async function writeChunked(key: string, value: string): Promise<void> {
  const chunks = Math.ceil(value.length / SECURE_MAX);
  await withTimeout(SecureStore.setItemAsync(chunkMetaKey(key), String(chunks)), undefined);
  for (let i = 0; i < chunks; i += 1) {
    const part = value.slice(i * SECURE_MAX, (i + 1) * SECURE_MAX);
    await withTimeout(SecureStore.setItemAsync(chunkKey(key, i), part), undefined);
  }
  await withTimeout(SecureStore.deleteItemAsync(key), undefined);
}

async function deleteChunked(key: string): Promise<void> {
  const meta = await withTimeout(SecureStore.getItemAsync(chunkMetaKey(key)), null);
  if (meta) {
    const count = Number.parseInt(meta, 10);
    if (Number.isFinite(count) && count > 0) {
      for (let i = 0; i < count; i += 1) {
        await withTimeout(SecureStore.deleteItemAsync(chunkKey(key, i)), undefined);
      }
    }
    await withTimeout(SecureStore.deleteItemAsync(chunkMetaKey(key)), undefined);
  }
}

export async function secureGet(key: string): Promise<string | null> {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    let v = await withTimeout(SecureStore.getItemAsync(key), null);
    if (v == null) v = await readChunked(key);
    if (v != null) memory.set(key, v);
    return v;
  } catch {
    return memory.get(key) ?? null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  memory.set(key, value);
  try {
    if (value.length <= SECURE_MAX) {
      await withTimeout(SecureStore.setItemAsync(key, value), undefined);
      await deleteChunked(key);
      return;
    }
    await writeChunked(key, value);
  } catch {
    /* memoria */
  }
}

export async function secureDelete(key: string): Promise<void> {
  memory.delete(key);
  try {
    await withTimeout(SecureStore.deleteItemAsync(key), undefined);
    await deleteChunked(key);
  } catch {
    /* ignore */
  }
}
