/** En LAN usa la misma IP/host del navegador para llamar al API (otro equipo en la red). */
function serverBase(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
}

const base = serverBase();

export const environment = {
  production: false,
  apiUrl: `${base}/api`,
  uploadsUrl: `${base}/uploads`,
};
