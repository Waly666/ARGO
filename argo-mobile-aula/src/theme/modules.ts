import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IonName = ComponentProps<typeof Ionicons>['name'];

export type AulaHubRoute =
  | 'AulaCursos'
  | 'AulaMisCursos'
  | 'AulaPresenciales'
  | 'AulaPuntajes'
  | 'AulaCertificados'
  | 'AulaForo'
  | 'AulaPerfil';

export type AulaPublicRoute = 'Catalogo' | 'ConsultaCertificados' | 'Login' | 'Registro';

export type ModuleMeta<T extends string = string> = {
  key: T;
  label: string;
  icon: IonName;
  gradient: [string, string];
};

export const AULA_HUB_MODULES: ModuleMeta<AulaHubRoute>[] = [
  { key: 'AulaCursos', label: 'Catálogo', icon: 'library', gradient: ['#3D5CFF', '#6B84FF'] },
  { key: 'AulaMisCursos', label: 'Mis cursos', icon: 'book', gradient: ['#2B46E0', '#5B7BFF'] },
  { key: 'AulaPresenciales', label: 'Clases presenciales', icon: 'people', gradient: ['#3D5CFF', '#22D3EE'] },
  { key: 'AulaPuntajes', label: 'Mis puntajes', icon: 'stats-chart', gradient: ['#2B46E0', '#6B84FF'] },
  { key: 'AulaCertificados', label: 'Certificados', icon: 'ribbon', gradient: ['#2B46E0', '#6B84FF'] },
  { key: 'AulaForo', label: 'Foro', icon: 'chatbubbles', gradient: ['#6366F1', '#8B5CF6'] },
  { key: 'AulaPerfil', label: 'Mi perfil', icon: 'person', gradient: ['#475569', '#64748B'] },
];

export const AULA_PUBLIC_MODULES: ModuleMeta<AulaPublicRoute>[] = [
  { key: 'Catalogo', label: 'Catálogo', icon: 'library', gradient: ['#3D5CFF', '#6B84FF'] },
  { key: 'ConsultaCertificados', label: 'Certificados', icon: 'ribbon', gradient: ['#2B46E0', '#6B84FF'] },
  { key: 'Login', label: 'Ingresar', icon: 'log-in', gradient: ['#2B46E0', '#5B7BFF'] },
  { key: 'Registro', label: 'Registro', icon: 'person-add', gradient: ['#6366F1', '#8B5CF6'] },
];
