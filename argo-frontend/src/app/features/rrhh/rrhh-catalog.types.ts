export interface RrhhCatalogField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'cargos-multiselect';
  required?: boolean;
  col?: number;
  options?: { value: string; label: string }[];
  /** Texto de ayuda bajo el campo. */
  hint?: string;
}

export interface RrhhCatalogConfig {
  titulo: string;
  hint?: string;
  apiPath: string;
  idKey: string;
  labelKey?: string;
  fields: RrhhCatalogField[];
  columns: { key: string; label: string }[];
}
