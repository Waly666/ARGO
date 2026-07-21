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

import { CatalogPickerField } from '../components/CatalogPickerField';
import { IconInput } from '../components/IconInput';
import { MunicipioBuscarField } from '../components/MunicipioBuscarField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  crearJornadaContrato,
  georefMunicipioPorCoords,
  listarContratos,
} from '../api/jornadasApi';
import type { CatalogOption } from '../catalogos/alumnoCatalogos';
import type { MunicipioDivipola } from '../api/catalogosApi';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { puedeGestionarJornadas } from '../utils/permisos';
import { ymdLocal } from '../utils/jornadaUi';
import { themeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'CrearJornada'>;

function parseCoordInput(raw: string): number | null {
  const t = String(raw || '').trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function CrearJornadaScreen() {
  const route = useRoute<Route>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;
  const esAdmin = puedeGestionarJornadas(user?.permisos, user?.rol, user?.rolNombre);

  const [loadingOpts, setLoadingOpts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [contratosOpts, setContratosOpts] = useState<CatalogOption[]>([]);

  const [idContrato, setIdContrato] = useState(route.params?.idContrato || '');
  const [fechaProgramacion, setFechaProgramacion] = useState(ymdLocal());
  const [municipio, setMunicipio] = useState('');
  const [depto, setDepto] = useState('');
  const [codMunicipio, setCodMunicipio] = useState('');
  const [munTexto, setMunTexto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [latTxt, setLatTxt] = useState('');
  const [lngTxt, setLngTxt] = useState('');
  const [deteGeorefe, setDeteGeorefe] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!esAdmin) {
        Alert.alert('Sin permiso', 'Solo administradores pueden crear jornadas.');
        nav.goBack();
        return;
      }
      void (async () => {
        setLoadingOpts(true);
        try {
          const list = await listarContratos();
          const opts = (list || [])
            .filter((x) => x._id && String(x.estado || '').toLowerCase() !== 'ejecutado')
            .map((x) => ({
              value: x._id,
              label: `${x.codContrato || '—'} — ${x.nombreComercial || x.razoSocial || 'Contrato'}`,
            }));
          setContratosOpts(opts);
          if (!idContrato && opts.length === 1) setIdContrato(opts[0].value);
          const sel = (list || []).find((x) => x._id === (idContrato || opts[0]?.value));
          if (sel?.supervisor && !supervisor) setSupervisor(sel.supervisor);
        } catch (e) {
          Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron cargar contratos');
        } finally {
          setLoadingOpts(false);
        }
      })();
    }, [esAdmin, nav]),
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
        Alert.alert('GPS', 'Permita el acceso a la ubicación.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await aplicarCoords(pos.coords.latitude, pos.coords.longitude, 'DISPOSITIVO_MOVIL');
      Alert.alert(
        'GPS listo',
        geo?.municipio
          ? `Coordenadas y municipio:\n${geo.municipio} — ${geo.depto}`
          : 'Coordenadas cargadas.',
      );
    } catch (e) {
      Alert.alert('GPS', e instanceof Error ? e.message : 'No se pudo obtener ubicación');
    } finally {
      setGpsBusy(false);
    }
  }

  async function onGuardar() {
    if (!idContrato) {
      Alert.alert('Contrato', 'Seleccione un contrato.');
      return;
    }
    if (!fechaProgramacion.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(fechaProgramacion.trim())) {
      Alert.alert('Fecha', 'Use fecha AAAA-MM-DD.');
      return;
    }
    if (!direccion.trim()) {
      Alert.alert('Dirección', 'La dirección / sitio es obligatoria.');
      return;
    }
    if (!municipio.trim() || !depto.trim()) {
      Alert.alert('Ubicación', 'Municipio y departamento son obligatorios.');
      return;
    }
    const la = parseCoordInput(latTxt);
    const ln = parseCoordInput(lngTxt);
    if ((latTxt.trim() || lngTxt.trim()) && (la == null || ln == null)) {
      Alert.alert('Coordenadas', 'Latitud/longitud inválidas.');
      return;
    }

    setBusy(true);
    try {
      const r = await crearJornadaContrato(idContrato, {
        fechaProgramacion: fechaProgramacion.trim(),
        direccion: direccion.trim(),
        municipio: municipio.trim(),
        depto: depto.trim(),
        codMunicipio: codMunicipio.trim() || undefined,
        supervisor: supervisor.trim() || undefined,
        lat: la,
        lng: ln,
        deteGeorefe: la != null && ln != null ? deteGeorefe || 'MANUAL' : undefined,
        generarClases: true,
      });
      const j = r.jornada;
      Alert.alert(
        'Jornada creada',
        `Se crearon ${r.clasesCreadas ?? 0} clase(s).`,
        [
          {
            text: 'Ver clases',
            onPress: () =>
              nav.replace('ClasesJornada', {
                jornadaId: j._id,
                jornadaLabel: `${fechaProgramacion} · ${municipio}`,
                idContrato,
              }),
          },
          { text: 'OK', onPress: () => nav.navigate('JornadasGestion') },
        ],
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setBusy(false);
    }
  }

  if (loadingOpts) {
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
            Nueva jornada
          </ScaledText>
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
            Se generan las clases del contrato automáticamente.
          </ScaledText>
        </SurfaceCard>

        <SurfaceCard style={{ marginTop: 12 }}>
          <CatalogPickerField
            label="Contrato"
            required
            options={contratosOpts}
            value={idContrato}
            onChange={setIdContrato}
            placeholder="Seleccione contrato…"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Fecha programación * (AAAA-MM-DD)"
            icon="calendar-outline"
            value={fechaProgramacion}
            onChangeText={setFechaProgramacion}
            placeholder={ymdLocal()}
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
            label="Dirección / sitio *"
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
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Longitud"
            icon="globe-outline"
            value={lngTxt}
            onChangeText={setLngTxt}
            keyboardType="decimal-pad"
            autoCapitalize="none"
          />
        </SurfaceCard>

        <View style={{ height: 16 }} />
        <PrimaryButton
          label={busy ? 'Creando…' : 'Crear jornada'}
          onPress={() => void onGuardar()}
          disabled={busy || gpsBusy}
          fullWidth
          icon="add-circle-outline"
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
