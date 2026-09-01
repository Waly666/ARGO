import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { ScaledText } from './ScaledText';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { ARGO_AZUL_REY } from '../config/appBranding';
import type { AuthUser } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { modulosHomeVisibles } from '../theme/modules';

function nombreUsuario(user: AuthUser | null): string {
  if (!user) return 'Usuario';
  const completo = [user.nombres, user.apellidos].filter(Boolean).join(' ').trim();
  if (completo) return completo;
  const emp = String(user.empleado?.nombreCompleto || '').trim();
  if (emp) return emp;
  return user.username || 'Usuario';
}

type MenuItem = {
  key: string;
  label: string;
  hint?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export function HamburgerHeaderButton() {
  const { openDrawer } = useDrawer();
  return (
    <Pressable
      onPress={openDrawer}
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      hitSlop={10}
      style={styles.hamburgerBtn}
    >
      <Ionicons name="menu" size={26} color="#fff" />
    </Pressable>
  );
}

export function AppDrawerMenu() {
  const { open, closeDrawer } = useDrawer();
  const { state, signOut } = useAuth();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);

  const user = state.status === 'signedIn' ? state.user : null;
  const drawerWidth = Math.min(300, Math.round(width * 0.82));

  const modulos = useMemo(() => modulosHomeVisibles(user?.permisos), [user?.permisos]);

  const go = (fn: () => void) => {
    closeDrawer();
    setTimeout(fn, 80);
  };

  const items: MenuItem[] = [
    {
      key: 'home',
      label: 'Inicio',
      hint: 'Panel principal',
      icon: 'home-outline',
      onPress: () => go(() => nav.navigate('Home')),
    },
    ...modulos.map((mod) => ({
      key: mod.key,
      label: mod.title,
      hint: mod.hint,
      icon: mod.icon,
      onPress: () =>
        go(() => {
          if (mod.route === 'CrearAlumnoJornada') nav.navigate('CrearAlumnoJornada', {});
          else if (mod.route === 'Certificados') nav.navigate('Certificados', {});
          else if (mod.route === 'CrearJornada') nav.navigate('CrearJornada', {});
          else nav.navigate(mod.route as 'Home');
        }),
    })),
  ];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              width: drawerWidth,
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: c.card,
            },
          ]}
        >
          <View style={[styles.panelHead, { backgroundColor: ARGO_AZUL_REY }]}>
            <View style={styles.headRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={ARGO_AZUL_REY} />
              </View>
              <Pressable onPress={closeDrawer} hitSlop={12} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            <ScaledText baseSize={12} style={{ color: 'rgba(255,255,255,0.85)', marginTop: 12 }}>
              ARGO Jornadas
            </ScaledText>
            <ScaledText
              baseSize={18}
              style={{ color: '#fff', fontWeight: '800', marginTop: 2 }}
              numberOfLines={2}
            >
              {nombreUsuario(user)}
            </ScaledText>
            <ScaledText baseSize={12} style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {user?.rolNombre || user?.rol || user?.username || ''}
            </ScaledText>
          </View>

          <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? c.bgAlt : 'transparent', borderColor: c.border },
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: c.bgAlt }]}>
                  <Ionicons name={item.icon} size={20} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }}>
                    {item.label}
                  </ScaledText>
                  {item.hint ? (
                    <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                      {item.hint}
                    </ScaledText>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.textSoft} />
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => {
              closeDrawer();
              void signOut();
            }}
            style={[styles.logout, { borderColor: c.border }]}
          >
            <Ionicons name="log-out-outline" size={20} color={c.danger} />
            <ScaledText baseSize={15} style={{ color: c.danger, fontWeight: '700', marginLeft: 10 }}>
              Cerrar sesión
            </ScaledText>
          </Pressable>
        </View>
        <Pressable style={styles.backdrop} onPress={closeDrawer} accessibilityLabel="Cerrar menú" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hamburgerBtn: {
    marginHorizontal: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    maxWidth: 320,
    height: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 2, height: 0 },
  },
  panelHead: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    padding: 12,
    paddingBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
