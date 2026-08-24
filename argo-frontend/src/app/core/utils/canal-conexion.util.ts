export type CanalConexionUsuario = 'mixta' | 'movil' | 'escritorio';

export const CANAL_CONEXION_OPCIONES: {
  id: CanalConexionUsuario;
  label: string;
  desc: string;
}[] = [
  { id: 'mixta', label: 'Mixta', desc: 'ERP web y aplicaciones móviles' },
  { id: 'escritorio', label: 'Solo escritorio', desc: 'Únicamente ERP web (navegador)' },
  { id: 'movil', label: 'Solo móvil', desc: 'Apps Cajero, Jornadas, Aula, etc.' },
];

export function normalizarCanalConexion(val?: string | null): CanalConexionUsuario {
  const v = String(val || 'mixta').trim().toLowerCase();
  if (v === 'movil' || v === 'escritorio') return v;
  return 'mixta';
}

export function labelCanalConexion(val?: string | null): string {
  const id = normalizarCanalConexion(val);
  return CANAL_CONEXION_OPCIONES.find((o) => o.id === id)?.label || 'Mixta';
}
