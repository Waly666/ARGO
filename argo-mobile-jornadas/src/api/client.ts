import { getApiBaseUrl } from '../config/apiBase';

type TokenGetter = () => string | null;

let tokenGetter: TokenGetter = () => null;

export function setTokenGetter(fn: TokenGetter): void {
  tokenGetter = fn;
}

function mensajeRed(err: unknown, base: string): string {
  const m = err instanceof Error ? err.message : String(err);
  if (err instanceof Error && err.name === 'AbortError') {
    return `El servidor no respondió a tiempo (${base}). Revise red y que el backend esté activo.`;
  }
  if (/Network request failed|Failed to fetch|ECONNREFUSED|ETIMEDOUT|aborted/i.test(m)) {
    return `Sin conexión con ${base}. Celular y PC en la misma Wi‑Fi; permita el puerto en el firewall.`;
  }
  return m;
}

export async function apiFetch<T>(
  path: string,
  opts?: RequestInit & { auth?: boolean; timeoutMs?: number },
): Promise<T> {
  const base = getApiBaseUrl();
  const timeoutMs = opts?.timeoutMs ?? 25_000;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts?.headers as Record<string, string>),
  };
  if (opts?.auth !== false) {
    const t = tokenGetter();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
      ...opts,
      headers,
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new Error(mensajeRed(e, base));
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Respuesta no JSON (${res.status}) desde ${base}`);
    }
  }
  if (!res.ok) {
    const body = json as { message?: string; codigo?: string; sesiones?: number; numSesCert?: number; faltan?: number; nombreAlumno?: string };
    const err = new Error(body?.message ?? `${res.status} ${res.statusText}`) as Error & {
      status?: number;
      body?: typeof body;
    };
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return json as T;
}

export async function apiPostForm<T>(
  path: string,
  formData: FormData,
  opts?: { auth?: boolean; timeoutMs?: number },
): Promise<T> {
  const base = getApiBaseUrl();
  const timeoutMs = opts?.timeoutMs ?? 45_000;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts?.auth !== false) {
    const t = tokenGetter();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new Error(mensajeRed(e, base));
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Respuesta no JSON (${res.status})`);
    }
  }
  if (!res.ok) {
    throw new Error((json as { message?: string })?.message ?? `${res.status}`);
  }
  return json as T;
}

export async function apiFetchText(
  path: string,
  opts?: RequestInit & { auth?: boolean; timeoutMs?: number },
): Promise<string> {
  const base = getApiBaseUrl();
  const timeoutMs = opts?.timeoutMs ?? 30_000;
  const headers: Record<string, string> = {
    Accept: 'text/html, text/plain, */*',
    ...(opts?.headers as Record<string, string>),
  };
  if (opts?.auth !== false) {
    const t = tokenGetter();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
      ...opts,
      headers,
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new Error(mensajeRed(e, base));
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      if (text.trim()) msg = text.slice(0, 200);
    }
    throw new Error(msg);
  }
  return text;
}

export async function pingHealth(): Promise<{ ok: boolean }> {
  return apiFetch('/health', { auth: false, timeoutMs: 8000 });
}

export async function login(username: string, password: string): Promise<import('./types').LoginResponse> {
  const raw = await apiFetch<import('./types').LoginApiRaw & Record<string, unknown>>('/auth/login', {
    method: 'POST',
    auth: false,
    timeoutMs: 12_000,
    headers: {
      'Content-Type': 'application/json',
      'X-ARGO-Cliente': 'jornadas',
    },
    body: JSON.stringify({ username, password }),
  });

  if (raw.step === 'mfa_verify') {
    throw new Error(
      'Su cuenta exige verificación en dos pasos (MFA). Ingrese primero en la web ARGO o use un usuario instructor sin MFA para la app móvil.',
    );
  }
  if (raw.step === 'mfa_setup') {
    throw new Error(
      'Debe configurar verificación en dos pasos (MFA) en la web ARGO antes de usar la app móvil, o use un usuario sin MFA.',
    );
  }

  const token = raw.token;
  const user = raw.user;
  if (!token || !user) {
    throw new Error(
      raw.message ||
        'El servidor no devolvió sesión válida. Verifique usuario/contraseña o actualice el backend ARGO.',
    );
  }
  return { token, user };
}

export async function fetchMe() {
  return apiFetch<import('./types').AuthUser>('/auth/me', { timeoutMs: 10_000 });
}
