import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import {
  JORNADAS_APP_PERMISO,
  type JornadasAppPantalla,
  puedePantallaJornadas,
} from '../utils/permisos';

export type IonName = ComponentProps<typeof Ionicons>['name'];

/** Pantallas de inicio / menú lateral configurables por rol (Configuración → Roles). */
export type JornadasHomeModule = {
  key: string;
  route: keyof RootStackParamList;
  title: string;
  hint: string;
  icon: IonName;
  /** Si es null, siempre visible para usuarios con acceso a la app (p. ej. cambiar contraseña). */
  pantalla: JornadasAppPantalla | null;
};

export const HOME_MODULES: JornadasHomeModule[] = [
  {
    key: 'hoy',
    route: 'JornadasHoy',
    title: 'Jornadas de hoy',
    hint: 'Operación del día en carpa',
    icon: 'today-outline',
    pantalla: 'hoy',
  },
  {
    key: 'registrar',
    route: 'CrearAlumnoJornada',
    title: 'Nuevo alumno jornada',
    hint: 'Alta con PDF417 de la cédula o digitación (Registro)',
    icon: 'person-add-outline',
    pantalla: 'registrar_alumno',
  },
  {
    key: 'certificados',
    route: 'Certificados',
    title: 'Certificados emitidos',
    hint: 'Consulta y abre certificados de jornadas',
    icon: 'ribbon-outline',
    pantalla: 'certificados',
  },
  {
    key: 'password',
    route: 'CambiarPassword',
    title: 'Cambiar contraseña',
    hint: 'Actualizar la clave de su usuario',
    icon: 'key-outline',
    pantalla: null,
  },
  {
    key: 'gestionar',
    route: 'JornadasGestion',
    title: 'Gestionar jornadas',
    hint: 'Listar, editar y operar jornadas de cualquier fecha',
    icon: 'calendar-outline',
    pantalla: 'gestionar',
  },
  {
    key: 'crear',
    route: 'CrearJornada',
    title: 'Nueva jornada',
    hint: 'Crear jornada en un contrato',
    icon: 'add-circle-outline',
    pantalla: 'crear',
  },
  {
    key: 'informes',
    route: 'InformesJornadas',
    title: 'Informes',
    hint: 'Dashboard del contrato y PDF formal',
    icon: 'stats-chart-outline',
    pantalla: 'informes',
  },
];

/** Mapeo pantalla interna → ruta del stack (para guards). */
export const PANTALLA_A_RUTA: Partial<Record<JornadasAppPantalla, keyof RootStackParamList>> = {
  hoy: 'JornadasHoy',
  operar_clase: 'ClaseDetalle',
  registrar_alumno: 'CrearAlumnoJornada',
  certificados: 'Certificados',
  gestionar: 'JornadasGestion',
  crear: 'CrearJornada',
  editar: 'EditarJornada',
  informes: 'InformesJornadas',
};

export function modulosHomeVisibles(permisos: string[] | undefined): JornadasHomeModule[] {
  return HOME_MODULES.filter((m) => {
    if (m.pantalla === null) return true;
    return puedePantallaJornadas(permisos, m.pantalla);
  });
}

export function etiquetaPermisoPantalla(pantalla: JornadasAppPantalla): string {
  return JORNADAS_APP_PERMISO[pantalla];
}
