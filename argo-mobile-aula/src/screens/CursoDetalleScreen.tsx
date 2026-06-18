import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressBar } from '../components/ProgressBar';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchCurso, fetchInscripcion, matricularCurso } from '../api/aulaApi';
import type { CursoVirtual, EstadoInscripcionVirtual } from '../api/types';
import { pctCurso, puedeCursar } from '../utils/cursoUtils';
import { resolveUploadUrl, resolvePlayerUrl } from '../utils/uploadUrl';
import type { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/spacing';

export default function CursoDetalleScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CursoDetalle'>>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const c = useTheme();
  const [curso, setCurso] = useState<CursoVirtual | null>(null);
  const [insc, setInsc] = useState<EstadoInscripcionVirtual | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const det = await fetchCurso(route.params.id);
      setCurso(det);
      if (state.status === 'signedIn') {
        try {
          const ins = await fetchInscripcion(route.params.id);
          setInsc(ins);
        } catch {
          setInsc(null);
        }
      }
    } catch (e) {
      Alert.alert('Curso', e instanceof Error ? e.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, [route.params.id, state.status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onMatricular() {
    setBusy(true);
    try {
      const res = await matricularCurso(route.params.id);
      Alert.alert('Matrícula', res.message);
      await load();
    } catch (e) {
      Alert.alert('Matrícula', e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  function onContinuar() {
    if (!curso) return;
    const url = resolvePlayerUrl(curso.playerUrl);
    if (!url) {
      Alert.alert('Curso', 'Este curso no tiene contenido disponible.');
      return;
    }
    nav.navigate('CoursePlayer', {
      idPrograma: String(curso.idPrograma),
      titulo: curso.nombreProg,
      playerUrl: url,
      storagePrefix: curso.storagePrefix ?? undefined,
    });
  }

  if (loading || !curso) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const img = resolveUploadUrl(curso.urlPortadaAbsoluta) || resolveUploadUrl(curso.urlPortadaVirtual);
  const matriculado = insc?.matriculado;
  const puedeEntrar = matriculado && puedeCursar(curso);
  const pct = pctCurso(curso);

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <View style={styles.heroWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.img} resizeMode="cover" />
        ) : (
          <LinearGradient colors={c.gradientHero} style={styles.img} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.imgOverlay}>
          {curso.categoriaNombre ? (
            <View style={styles.badge}>
              <ScaledText baseSize={11} style={{ color: '#fff', fontWeight: '700' }}>
                {curso.categoriaNombre}
              </ScaledText>
            </View>
          ) : null}
          <ScaledText baseSize={22} style={styles.heroTitle}>
            {curso.nombreProg}
          </ScaledText>
          {curso.horas ? (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
              <ScaledText baseSize={13} style={{ color: 'rgba(255,255,255,0.9)', marginLeft: 4 }}>
                {curso.horas} horas
              </ScaledText>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      {pct > 0 ? (
        <SurfaceCard style={{ marginBottom: space.lg }}>
          <ProgressBar pct={pct} label="Tu progreso" />
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700', marginBottom: space.sm }}>
          Descripción
        </ScaledText>
        <ScaledText baseSize={15} style={{ color: c.textSoft, lineHeight: 23 }}>
          {curso.descripcionVirtual || curso.descripcion || 'Sin descripción.'}
        </ScaledText>
      </SurfaceCard>

      {curso.tarifaVirtual > 0 && !matriculado ? (
        <View style={[styles.priceBanner, { backgroundColor: c.accentSoft }]}>
          <ScaledText baseSize={13} style={{ color: c.textSoft }}>
            Inversión
          </ScaledText>
          <ScaledText baseSize={22} style={{ color: c.primary, fontWeight: '800' }}>
            ${curso.tarifaVirtual.toLocaleString('es-CO')}
          </ScaledText>
        </View>
      ) : null}

      <View style={styles.actions}>
        {state.status !== 'signedIn' ? (
          <PrimaryButton label="Iniciar sesión para matricularse" onPress={() => nav.navigate('Login')} fullWidth size="lg" />
        ) : puedeEntrar ? (
          <PrimaryButton label="Continuar curso" onPress={onContinuar} icon="play" fullWidth size="lg" />
        ) : matriculado ? (
          <SurfaceCard padding="md">
            <ScaledText baseSize={14} style={{ color: c.warn, textAlign: 'center', fontWeight: '600' }}>
              Complete el pago en el CEA para acceder a este curso.
            </ScaledText>
          </SurfaceCard>
        ) : (
          <PrimaryButton
            label="Matricularme ahora"
            onPress={onMatricular}
            loading={busy}
            icon="school-outline"
            fullWidth
            size="lg"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: space.lg, paddingBottom: space.xxxl },
  heroWrap: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: space.lg },
  img: { width: '100%', height: 220 },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: space.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: space.sm,
  },
  heroTitle: { color: '#fff', fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.xs },
  priceBanner: {
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.lg,
    alignItems: 'center',
  },
  actions: { marginTop: space.xl, gap: space.md },
});
