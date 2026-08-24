import { apiFetch } from './client';

export interface GestorItem {
  _id: string;
  nombres?: string;
  apellidos?: string;
  numero?: string;
  seudonimo?: string;
  correo?: string;
  celular?: string;
  activo?: boolean;
}

export async function buscarGestores(q?: string): Promise<GestorItem[]> {
  const term = String(q ?? '').trim();
  const path = term ? `/gestores?q=${encodeURIComponent(term)}` : '/gestores';
  return apiFetch<GestorItem[]>(path);
}

export function labelGestor(g: GestorItem): string {
  const pseudo = String(g.seudonimo || '').trim();
  if (pseudo) return pseudo;
  const nom = [g.nombres, g.apellidos].map((s) => String(s || '').trim()).filter(Boolean).join(' ');
  if (nom) return nom;
  return String(g.numero || 'Gestor');
}
