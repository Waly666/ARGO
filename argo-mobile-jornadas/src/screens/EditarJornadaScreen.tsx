import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';

import { IconInput } from '../components/IconInput';
import { MunicipioBuscarField } from '../components/MunicipioBuscarField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  actualizarJornada,
  georefMunicipioPorCoords,
  obtenerJornada,
} from '../api/jornadasApi';
import type { MunicipioDivipola } from '../api/catalogosApi';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'EditarJornada'>;

function ymdFromIso(raw?: string | null): string {
  const t = String(raw || '').trim();
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function parseCoordInput(raw: string): number | null {
  const t = String(raw || '').trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function EditarJornadaScreen() {
  const route = useRoute<Route>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const { jornadaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);

  const [contratoLabel, setContratoLabel] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaProgramacion, setFechaProgramacion] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [depto, setDepto] = useState('');
  const [codMunicipio, setCodMunicipio] = useState('');
  const [munTexto, setMunTexto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [latTxt, setLatTxt] = useState('');
  const [lngTxt, setLngTxt] = useState('');
  const [deteGeorefe, setDeteGeorefe] = useState('');
  const [idContrato, setIdContrato] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const j = await obtenerJornada(jornadaId);
      setContratoLabel(j.contratoLabel || j.codContrato || '');
      setEstado(String(j.estado || ''));
      setIdContrato(String(j.idContrato || ''));
      setFechaProgramacion(ymdFromIso(j.fechaProgramacion));
      setMunicipio(j.municipio || '');
      setDepto(j.depto || '');
      setCodMunicipio(j.codMunicipio || '');
      setMunTexto(
        j.municipio && j.depto ? `${j.municipio} - ${j.depto}` : j.municipio || '',
      );
      setDireccion(j.direccion || '');
      setSupervisor(j.supervisor || '');
      setLatTxt(j.lat != null && Number.isFinite(j.lat) ? String(j.lat) : '');
      setLngTxt(j.lng != null && Number.isFinite(j.lng) ? String(j.lng) : '');
      setDeteGeorefe(j.deteGeorefe || '');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar la jornada');
    } finally {
      setLoading(false);
    }
  }, [jornadaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  function onMunSel(m: MunicipioDivipola) {
    setCodMunicipio(m.codMunicipio);
    setMunicipio(m.nombreMunicipio);
    setDepto(m.nombreDepto);
    setMunTexto(m.label);
    if (!deteGeorefe || deteGeorefe === 'MANUAL') setDeteGeorefe('MANUAL');
  }

  async function aplicarCoords(la: number, ln: number, origen: 'DISPOSITIVO_MOVIL' | 'MANUAL') {
    setLatTxt(String(la));
    setLngTxt(String(ln));
    setDeteGeorefe(origen);
    try {
      const geo = await georefMunicipioPorCoords(la, ln);
      if (geo.municipio) setMunicipio(geo.municipio);
      if (geo.depto) setDepto(geo.depto);
      if (geo.codMunicipio) setCodMunicipio(String(geo.codMunicipio));
      if (geo.municipio || geo.depto) {
        setMunTexto([geo.municipio, geo.depto].filter(Boolean).join(' - '));
      }
      return geo;
    } catch {
      return null;
    }
  }

  async function onUsarGps() {
    setGpsBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('GPS', 'Permita el acceso a la ubicación para cargar coordenadas.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const geo = await aplicarCoords(
        pos.coords.latitude,
        pos.coords.longitude,
        'DISPOSITIVO_MOVIL',
      );
      Alert.alert(
        'GPS listo',
        geo?.municipio
          ? `Coordenadas y municipio cargados:\n${geo.municipio} — ${geo.depto}`
          : 'Coordenadas cargadas. Revise municipio y guarde.',
      );
    } catch (e) {
      Alert.alert('GPS', e instanceof Error ? e.message : 'No se pudo obtener la ubicación');
    } finally {
      setGpsBusy(false);
    }
  }

  async function onResolverDesdeCoords() {
    const la = parseCoordInput(latTxt);
    const ln = parseCoordInput(lngTxt);
    if (la == null || ln == null) {
      Alert.alert('Coordenadas', 'Indique latitud y longitud válidas.');
      return;
    }
    setGpsBusy(true);
    try {
      const geo = await aplicarCoords(la, ln, 'MANUAL');
      if (!geo?.municipio) {
        Alert.alert('Georef', 'No se pudo resolver municipio con esas coordenadas.');
        return;
      }
      Alert.alert('Listo', `${geo.municipio} — ${geo.depto}`);
    } catch (e) {
      Alert.alert('Georef', e instanceof Error ? e.message : 'No se pudo resolver');
    } finally {
      setGpsBusy(false);
    }
  }

  async function onGuardar() {
    if (!fechaProgramacion.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(fechaProgramacion.trim())) {
      Alert.alert('Fecha', 'Use fecha AAAA-MM-DD.');
      return;
    }
    if (!municipio.trim() || !depto.trim()) {
      Alert.alert('Ubicación', 'Municipio y departamento son obligatorios.');
      return;
    }
    const la = parseCoordInput(latTxt);
    const ln = parseCoordInput(lngTxt);
    if ((latTxt.trim() || lngTxt.trim()) && (la == null || ln == null)) {
      Alert.alert('Coordenadas', 'Latitud/longitud inválidas. Déjelas vacías o corrija ambas.');
      return;
    }

    setBusy(true);
    try {
      await actualizarJornada(jornadaId, {
        fechaProgramacion: fechaProgramacion.trim(),
        municipio: municipio.trim(),
        depto: depto.trim(),
        codMunicipio: codMunicipio.trim() || undefined,
        direccion: direccion.trim(),
        supervisor: supervisor.trim(),
        lat: la,
        lng: ln,
        deteGeorefe:
          la != null && ln != null
            ? ((deteGeorefe as 'DISPOSITIVO_MOVIL' | 'MANUAL' | 'MAPA' | '') || 'MANUAL')
            : '',
      });
      Alert.alert('Guardado', 'Jornada actualizada.', [
        {
          text: 'Ver clases',
          onPress: () =>
            nav.replace('ClasesJornada', {
              jornadaId,
              jornadaLabel: `${fechaProgramacion} · ${municipio}`,
              idContrato,
            }),
        },
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SurfaceCard>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
            {contratoLabel || 'Jornada'}
          </ScaledText>
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
            Estado: {estado || '—'}
          </ScaledText>
        </SurfaceCard>

        <SurfaceCard style={{ marginTop: 12 }}>
          <ScaledText baseSize={15} style={styles.sec}>
            Datos de la jornada
          </ScaledText>
          <IconInput
            label="Fecha programación * (AAAA-MM-DD)"
            icon="calendar-outline"
            value={fechaProgramacion}
            onChangeText={setFechaProgramacion}
            placeholder="2026-07-20"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Supervisor"
            icon="person-outline"
            value={supervisor}
            onChangeText={setSupervisor}
          />
          <View style={{ height: 8 }} />
          <MunicipioBuscarField
            label="Municipio / departamento"
            required
            texto={munTexto}
            onSeleccionado={onMunSel}
            onLimpiar={() => {
              setMunTexto('');
              setMunicipio('');
              setDepto('');
              setCodMunicipio('');
            }}
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Dirección / sitio"
            icon="home-outline"
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Carpa, institución, dirección…"
          />
        </SurfaceCard>

        <SurfaceCard style={{ marginTop: 12 }}>
          <ScaledText baseSize={15} style={styles.sec}>
            Coordenadas
          </ScaledText>
          <PrimaryButton
            label={gpsBusy ? 'Obteniendo GPS…' : 'Cargar GPS del celular'}
            icon="navigate-outline"
            onPress={() => void onUsarGps()}
            disabled={busy || gpsBusy}
            fullWidth
          />
          <View style={{ height: 10 }} />
          <IconInput
            label="Latitud"
            icon="globe-outline"
            value={latTxt}
            onChangeText={setLatTxt}
            keyboardType="decimal-pad"
            placeholder="2.441000"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Longitud"
            icon="globe-outline"
            value={lngTxt}
            onChangeText={setLngTxt}
            keyboardType="decimal-pad"
            placeholder="-76.606000"
            autoCapitalize="none"
          />
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 6, marginBottom: 8 }}>
            Origen: {deteGeorefe || 'sin georef'}
          </ScaledText>
          <PrimaryButton
            label="Resolver municipio desde coordenadas"
            icon="location-outline"
            variant="ghost"
            onPress={() => void onResolverDesdeCoords()}
            disabled={busy || gpsBusy}
            fullWidth
          />
        </SurfaceCard>

        <View style={{ height: 16 }} />
        <PrimaryButton
          label={busy ? 'Guardando…' : 'Guardar jornada'}
          onPress={() => void onGuardar()}
          disabled={busy || gpsBusy}
          fullWidth
          icon="save-outline"
        />
        <View style={{ height: 8 }} />
        <PrimaryButton label="Cancelar" variant="ghost" onPress={() => nav.goBack()} fullWidth />
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  sec: { color: '#134e4a', fontWeight: '800', marginBottom: 10 },
});
