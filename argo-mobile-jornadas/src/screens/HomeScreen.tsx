import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { PressableCard } from '../components/PressableCard';
import { ScaledText } from '../components/ScaledText';
import { useAuth } from '../context/AuthContext';
import type { AuthUser } from '../api/types';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../navigation/types';

function nombreBienvenida(user: AuthUser | null): string {
  if (!user) return 'Instructor';
  const desdeEmpleado = String(user.empleado?.nombreCompleto || '').trim();
  if (desdeEmpleado) return desdeEmpleado;
  const completo = [user.nombres, user.apellidos].filter(Boolean).join(' ').trim();
  if (completo) return completo;
  return user.username || 'Instructor';
}

type MenuTile = {
  title: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

export default function HomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state, signOut } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;
  const nombre = nombreBienvenida(user);

  const tiles: MenuTile[] = [
    {
      title: 'Jornadas de hoy',
      hint: 'Clases, asistencias y certificados del día',
      icon: 'today-outline',
      accent: c.pastelSkyFg,
      iconBg: c.pastelSky,
      iconColor: c.pastelSkyFg,
      onPress: () => nav.navigate('JornadasHoy'),
    },
    {
      title: 'Certificados emitidos',
      hint: 'Consulta y abre certificados de jornadas',
      icon: 'ribbon-outline',
      accent: c.pastelLilacFg,
      iconBg: c.pastelLilac,
      iconColor: c.pastelLilacFg,
      onPress: () => nav.navigate('Certificados', {}),
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={styles.scroll}>
      <LinearGradient
        colors={highContrast ? [c.card, c.bgAlt] : c.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={c.primary} />
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#fff" />
            <ScaledText baseSize={11} style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>
              Campo
            </ScaledText>
          </View>
        </View>
        <ScaledText baseSize={13} style={{ color: 'rgba(255,255,255,0.9)', marginTop: 14 }}>
          Bienvenido
        </ScaledText>
        <ScaledText
          baseSize={22}
          style={{ color: '#fff', fontWeight: '800', marginTop: 4, lineHeight: 28 }}
        >
          {nombre}
        </ScaledText>
        <ScaledText baseSize={13} style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
          {user?.rolNombre || user?.rol || 'Instructor jornadas'}
        </ScaledText>
      </LinearGradient>

      <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '800', marginBottom: 12 }}>
        Operación en campo
      </ScaledText>

      {tiles.map((tile) => (
        <PressableCard key={tile.title} onPress={tile.onPress} cardStyle={styles.tileCard}>
          <View style={[styles.cardAccent, { backgroundColor: tile.accent }]} />
          <View style={styles.tileBody}>
            <View style={[styles.iconBox, { backgroundColor: tile.iconBg }]}>
              <Ionicons name={tile.icon} size={26} color={tile.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800' }}>
                {tile.title}
              </ScaledText>
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4, lineHeight: 18 }}>
                {tile.hint}
              </ScaledText>
            </View>
            <View style={[styles.openBtn, { backgroundColor: tile.iconBg }]}>
              <Ionicons name="chevron-forward" size={18} color={tile.iconColor} />
            </View>
          </View>
        </PressableCard>
      ))}

      <View style={{ height: 16 }} />
      <Pressable onPress={() => void signOut()} style={styles.logout}>
        <Ionicons name="log-out-outline" size={18} color={c.danger} />
        <ScaledText baseSize={15} style={{ color: c.danger, marginLeft: 8, fontWeight: '600' }}>
          Cerrar sesión
        </ScaledText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  hero: { borderRadius: 18, padding: 20, marginBottom: 20 },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  tileCard: {
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: {
    width: 5,
  },
  tileBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
});
