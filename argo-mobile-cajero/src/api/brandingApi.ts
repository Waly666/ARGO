import { apiFetch } from './client';

export type ConfigPublica = {
  nombreEmpresa?: string;
  urlLogo?: string | null;
  turnstileSiteKey?: string;
  mfaRequired?: boolean;
};

/** Marca institucional (sin autenticación). Misma fuente que el login del ERP. */
export async function fetchConfigPublica(): Promise<ConfigPublica> {
  return apiFetch<ConfigPublica>('/auth/config', { auth: false, timeoutMs: 10_000 });
}
