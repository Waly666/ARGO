/** Decodifica payload JWT (sin verificar firma; solo exp en cliente). */
export function jwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

/** true si el token ya no es válido por tiempo (margen opcional en segundos). */
export function isJwtExpired(token: string, leewaySec = 30): boolean {
  const payload = jwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= (payload.exp - leewaySec) * 1000;
}
