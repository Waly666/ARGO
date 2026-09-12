export type PortalIconKind = 'builtin' | 'emoji' | 'alias' | 'image';

export interface PortalIconCatalogItem {
  id: string;
  slug: string;
  label: string;
  category: string;
  kind: PortalIconKind;
  /** Slug builtin, carácter emoji, slug destino (alias) o URL de imagen. */
  value: string;
  activo: boolean;
}

export interface PortalIconografiaConfig {
  custom: PortalIconCatalogItem[];
  /** Slugs builtin ocultos en la galería y el picker. */
  hiddenBuiltin: string[];
}

export const PORTAL_ICON_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'educacion', label: 'Educación' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'comunicacion', label: 'Comunicación' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'tecnologia', label: 'Tecnología' },
] as const;

export const PORTAL_ICONOGRAFIA_DEFAULTS: PortalIconografiaConfig = {
  custom: [],
  hiddenBuiltin: [],
};
