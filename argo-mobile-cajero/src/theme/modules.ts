import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { CAJERO_AZUL_REY } from '../config/appBranding';
import type { RootStackParamList } from '../navigation/types';

export type IonName = ComponentProps<typeof Ionicons>['name'];

export type ModuleMeta = {
  key: keyof RootStackParamList;
  label: string;
  icon: IonName;
  /** Gradiente del icono (inicio → fin), familia azul. */
  gradient: [string, string];
  permiso?: string | string[];
};

export const APP_MODULES: ModuleMeta[] = [
  {
    key: 'Caja',
    label: 'Caja',
    icon: 'wallet',
    gradient: ['#1d4ed8', CAJERO_AZUL_REY],
    permiso: ['caja.turno', 'caja.cobros', 'caja.admin'],
  },
  {
    key: 'Alumnos',
    label: 'Alumnos',
    icon: 'people',
    gradient: [CAJERO_AZUL_REY, '#60a5fa'],
    permiso: ['alumnos.ver', 'alumnos.gestionar'],
  },
  {
    key: 'Certificados',
    label: 'Certificados',
    icon: 'ribbon',
    gradient: ['#2563eb', '#38bdf8'],
    permiso: 'alumnos.certificados',
  },
  {
    key: 'Facturacion',
    label: 'Facturación',
    icon: 'document-text',
    gradient: ['#1e40af', '#3b82f6'],
    permiso: 'facturacion',
  },
  {
    key: 'Programas',
    label: 'Programas',
    icon: 'book',
    gradient: ['#1d4ed8', '#0ea5e9'],
    permiso: ['programas.ver', 'programas.gestionar', 'programas.agregar'],
  },
  {
    key: 'Servicios',
    label: 'Servicios',
    icon: 'layers',
    gradient: ['#2563eb', '#6366f1'],
    permiso: ['servicios.ver', 'servicios.gestionar'],
  },
  {
    key: 'Ajustes',
    label: 'Lectura y alertas',
    icon: 'options',
    gradient: ['#334155', '#64748b'],
  },
];

export function moduleMeta(name: keyof RootStackParamList): ModuleMeta | undefined {
  return APP_MODULES.find((m) => m.key === name);
}
