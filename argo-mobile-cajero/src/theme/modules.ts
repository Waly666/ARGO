import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

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
    gradient: ['#3D5CFF', '#6B84FF'],
    permiso: ['caja.turno', 'caja.cobros', 'caja.admin'],
  },
  {
    key: 'Alumnos',
    label: 'Alumnos',
    icon: 'people',
    gradient: ['#3D5CFF', '#5B7BFF'],
    permiso: ['alumnos.ver', 'alumnos.gestionar'],
  },
  {
    key: 'Certificados',
    label: 'Certificados',
    icon: 'ribbon',
    gradient: ['#2B46E0', '#3D5CFF'],
    permiso: 'alumnos.certificados',
  },
  {
    key: 'Facturacion',
    label: 'Facturación',
    icon: 'document-text',
    gradient: ['#3D5CFF', '#22D3EE'],
    permiso: 'facturacion',
  },
  {
    key: 'Programas',
    label: 'Programas',
    icon: 'book',
    gradient: ['#2B46E0', '#6B84FF'],
    permiso: ['programas.ver', 'programas.gestionar', 'programas.agregar'],
  },
  {
    key: 'Servicios',
    label: 'Servicios',
    icon: 'layers',
    gradient: ['#3D5CFF', '#818CF8'],
    permiso: ['servicios.ver', 'servicios.gestionar'],
  },
  {
    key: 'AprobacionConsignacion',
    label: 'Consignaciones',
    icon: 'card',
    gradient: ['#10B981', '#34D399'],
    permiso: 'caja.admin',
  },
  {
    key: 'Autorizaciones',
    label: 'Autorizaciones',
    icon: 'shield-checkmark',
    gradient: ['#6366F1', '#8B5CF6'],
    permiso: ['config.autorizaciones', 'config.roles'],
  },
  {
    key: 'Ajustes',
    label: 'Lectura y alertas',
    icon: 'options',
    gradient: ['#475569', '#64748B'],
  },
];

export function moduleMeta(name: keyof RootStackParamList): ModuleMeta | undefined {
  return APP_MODULES.find((m) => m.key === name);
}
