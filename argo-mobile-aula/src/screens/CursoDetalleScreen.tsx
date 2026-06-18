import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchCurso, fetchInscripcion, matricularCurso } from '../api/aulaApi';
import type { CursoVirtual, EstadoInscripcionVirtual } from '../api/types';
import { puedeCursar } from '../utils/cursoUtils';
import { resolveUploadUrl, resolvePlayerUrl } from '../utils/uploadUrl';
import type { RootStackParamList } from '../navigation/types';

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

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.pad}>
      {img ? <Image source={{ uri: img }} style={styles.img} resizeMode="cover" /> : null}
      <ScaledText baseSize={22} style={{ color: c.text, fontWeight: '800' }}>
        {curso.nombreProg}
      </ScaledText>
      {curso.categoriaNombre ? (
        <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
          {curso.categoriaNombre}
        </ScaledText>
      ) : null}
      {curso.horas ? (
        <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
          {curso.horas} horas
        </ScaledText>
      ) : null}
      <SurfaceCard style={{ marginTop: 16 }}>
        <ScaledText baseSize={15} style={{ color: c.text, lineHeight: 22 }}>
          {curso.descripcionVirtual || curso.descripcion || 'Sin descripción.'}
        </ScaledText>
      </SurfaceCard>
      {curso.tarifaVirtual > 0 && !matriculado ? (
        <ScaledText baseSize={18} style={{ color: c.primary, fontWeight: '700', marginTop: 16 }}>
          ${curso.tarifaVirtual.toLocaleString('es-CO')}
        </ScaledText>
      ) : null}
      <View style={{ marginTop: 20, gap: 10 }}>
        {state.status !== 'signedIn' ? (
          <PrimaryButton label="Iniciar sesión para matricularse" onPress={() => nav.navigate('Login')} fullWidth />
        ) : puedeEntrar ? (
          <PrimaryButton label="Continuar curso" onPress={onContinuar} icon="play-outline" fullWidth />
        ) : matriculado ? (
          <ScaledText baseSize={14} style={{ color: c.warn, textAlign: 'center' }}>
            Complete el pago en el CEA para acceder a este curso.
          </ScaledText>
        ) : (
          <PrimaryButton
            label="Matricularme"
            onPress={onMatricular}
            loading={busy}
            icon="school-outline"
            fullWidth
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 16, paddingBottom: 32 },
  img: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16 },
});
