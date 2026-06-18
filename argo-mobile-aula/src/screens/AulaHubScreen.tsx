import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { usePortalConfig } from '../context/PortalConfigContext';
import { useTheme } from '../context/ThemeContext';
import type { AulaTabParamList } from '../navigation/types';
import TableroPanel from './aula/TableroPanel';
import MisCursosPanel from './aula/MisCursosPanel';
import PresencialesPanel from './aula/PresencialesPanel';
import PuntajesPanel from './aula/PuntajesPanel';
import CertificadosPanel from './aula/CertificadosPanel';
import ForoPanel from './aula/ForoPanel';
import PerfilPanel from './aula/PerfilPanel';

const Tab = createBottomTabNavigator<AulaTabParamList>();
type IonName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof AulaTabParamList, IonName> = {
  Tablero: 'grid-outline',
  MisCursos: 'book-outline',
  Presenciales: 'people-outline',
  Puntajes: 'stats-chart-outline',
  Certificados: 'ribbon-outline',
  Foro: 'chatbubbles-outline',
  Perfil: 'person-outline',
};

export default function AulaHubScreen() {
  const c = useTheme();
  const { config } = usePortalConfig();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: c.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerTitle: config?.nombreCea ?? 'Mi aula',
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSoft,
        tabBarStyle: { borderTopColor: c.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Tablero" component={TableroPanel} options={{ title: 'Tablero', tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="MisCursos" component={MisCursosPanel} options={{ title: 'Mis cursos' }} />
      <Tab.Screen name="Presenciales" component={PresencialesPanel} options={{ title: 'Presenciales' }} />
      <Tab.Screen name="Puntajes" component={PuntajesPanel} options={{ title: 'Puntajes' }} />
      <Tab.Screen name="Certificados" component={CertificadosPanel} options={{ title: 'Certificados' }} />
      <Tab.Screen name="Foro" component={ForoPanel} options={{ title: 'Foro', headerShown: false }} />
      <Tab.Screen name="Perfil" component={PerfilPanel} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
