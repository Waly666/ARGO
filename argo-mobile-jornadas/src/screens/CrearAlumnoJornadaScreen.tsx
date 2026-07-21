import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { AlumnoQrLabelModal } from '../components/AlumnoQrLabelModal';
import { CatalogPickerField } from '../components/CatalogPickerField';
import { IconInput } from '../components/IconInput';
import { MunicipioBuscarField } from '../components/MunicipioBuscarField';
import { Pdf417ScanModal } from '../components/Pdf417ScanModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { crearAlumnoJornada } from '../api/jornadasApi';
import type { MunicipioDivipola } from '../api/catalogosApi';
import {
  DISCAPACIDADES,
  ESTADOS_CIVIL,
  ESTRATOS,
  GENEROS,
  JORNADAS_ESTUDIO,
  MULTICULTURALIDAD,
  NIVEL_FORMACION,
  OCUPACIONES,
  REGIMEN_SALUD,
  TIPOS_DOC,
  TIPOS_SANGRE,
} from '../catalogos/alumnoCatalogos';
import type { CedulaPdf417Data } from '../utils/cedulaPdf417';
import { isValidNumDocDigits, sanitizeNumDocInput } from '../utils/numDoc';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { themeColors } from '../theme/colors';
import { puedeRegistrarAlumnosJornada } from '../utils/permisos';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'CrearAlumnoJornada'>;

function emailOk(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function celularOk(v: string): boolean {
  const d = v.replace(/\D/g, '');
  return d.length === 10 && d.startsWith('3');
}

export default function CrearAlumnoJornadaScreen() {
  const route = useRoute<Route>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast, textMultiplier } = useAccessibility();
  const c = themeColors(highContrast);
  const puedeRegistrar = puedeRegistrarAlumnosJornada(
    state.status === 'signedIn' ? state.user?.permisos : undefined,
  );
  const {
    numDoc: numDocInicial,
    claseId,
    jornadaLabel,
    idContrato,
    codContrato,
    fechaJornada,
  } = route.params;

  const [tipoDoc, setTipoDoc] = useState('1');
  const [numDoc, setNumDoc] = useState(sanitizeNumDocInput(numDocInicial || ''));
  const [expedida, setExpedida] = useState('');
  const [expedidaTexto, setExpedidaTexto] = useState('');
  const [nombre1, setNombre1] = useState('');
  const [nombre2, setNombre2] = useState('');
  const [apellido1, setApellido1] = useState('');
  const [apellido2, setApellido2] = useState('');
  const [fechaNac, setFechaNac] = useState('');

  const [genero, setGenero] = useState('');
  const [tipoSangre, setTipoSangre] = useState('');
  const [jornada, setJornada] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [estrato, setEstrato] = useState('');
  const [regimenSalud, setRegimenSalud] = useState('');
  const [nivelFormacion, setNivelFormacion] = useState('');
  const [ocupacion, setOcupacion] = useState('');

  const [correo, setCorreo] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [munOrigen, setMunOrigen] = useState('');
  const [munOrigenTexto, setMunOrigenTexto] = useState('');

  const [discapacidad, setDiscapacidad] = useState('9');
  const [multiCulturalidad, setMultiCulturalidad] = useState('NO_APLICA');
  const [observaciones, setObservaciones] = useState('');

  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [qrLabel, setQrLabel] = useState<{ numDoc: string; nombre: string } | null>(null);

  const nombreCompleto = useMemo(
    () => [nombre1, nombre2, apellido1, apellido2].map((x) => x.trim()).filter(Boolean).join(' '),
    [nombre1, nombre2, apellido1, apellido2],
  );

  function aplicarPdf417(data: CedulaPdf417Data) {
    setTipoDoc(data.tipoDoc || '1');
    setNumDoc(sanitizeNumDocInput(data.numDoc));
    setApellido1(data.apellido1 || '');
    setApellido2(data.apellido2 || '');
    setNombre1(data.nombre1 || '');
    setNombre2(data.nombre2 || '');
    if (data.fechaNac) setFechaNac(data.fechaNac);
    if (data.genero) setGenero(data.genero);
    if (data.tipoSangre) setTipoSangre(data.tipoSangre);
    Alert.alert('Cédula leída', 'Revise y complete los demás campos obligatorios.');
  }

  function onExpedidaSel(m: MunicipioDivipola) {
    setExpedida(m.codMunicipio);
    setExpedidaTexto(m.label);
  }

  function onMunOrigenSel(m: MunicipioDivipola) {
    setMunOrigen(m.codMunicipio);
    setMunOrigenTexto(m.label);
  }

  function validar(): string | null {
    const nd = sanitizeNumDocInput(numDoc);
    if (!isValidNumDocDigits(nd)) return 'Documento: 6 a 14 dígitos.';
    if (!expedida.trim()) return 'Indique el municipio de expedición.';
    if (!apellido1.trim() || !apellido2.trim()) return 'Ambos apellidos son obligatorios.';
    if (!nombre1.trim() || !nombre2.trim()) return 'Ambos nombres son obligatorios.';
    if (!fechaNac.trim()) return 'Indique la fecha de nacimiento (AAAA-MM-DD).';
    if (!genero) return 'Seleccione el género.';
    if (!tipoSangre) return 'Seleccione el tipo de sangre.';
    if (!jornada) return 'Seleccione la jornada.';
    if (!estadoCivil) return 'Seleccione el estado civil.';
    if (!estrato) return 'Seleccione el estrato.';
    if (!regimenSalud) return 'Seleccione el régimen de salud.';
    if (!nivelFormacion) return 'Seleccione el nivel de formación.';
    if (!ocupacion) return 'Seleccione la ocupación.';
    if (!emailOk(correo)) return 'Correo inválido.';
    if (!celularOk(celular)) return 'Celular: 10 dígitos que empiecen por 3.';
    if (!direccion.trim()) return 'Indique la dirección.';
    if (!munOrigen.trim()) return 'Indique el municipio de origen.';
    return null;
  }

  function volverAClase(doc?: string) {
    if (!claseId) {
      nav.goBack();
      return;
    }
    nav.navigate('ClaseDetalle', {
      claseId,
      jornadaLabel: jornadaLabel || 'Clase',
      idContrato: idContrato || '',
      prefillNumDoc: doc,
    });
  }

  async function onGuardar() {
    const errMsg = validar();
    if (errMsg) {
      Alert.alert('Faltan datos', errMsg);
      return;
    }
    const nd = sanitizeNumDocInput(numDoc);

    setBusy(true);
    try {
      const creado = await crearAlumnoJornada({
        tipoDoc,
        numDoc: nd,
        expedida,
        nombre1: nombre1.trim(),
        nombre2: nombre2.trim(),
        apellido1: apellido1.trim(),
        apellido2: apellido2.trim(),
        fechaNac: fechaNac.trim(),
        genero,
        tipoSangre,
        jornada,
        estadoCivil,
        estrato,
        regimenSalud,
        nivelFormacion,
        ocupacion,
        correo: correo.trim(),
        celular: celular.replace(/\D/g, ''),
        direccion: direccion.trim(),
        munOrigen,
        codMunicipio: munOrigen,
        discapacidad,
        multiCulturalidad,
        observaciones: observaciones.trim() || undefined,
      });
      const nombre =
        creado.nombreCompleto ||
        [creado.nombre1, creado.nombre2, creado.apellido1, creado.apellido2]
          .filter(Boolean)
          .join(' ') ||
        nombreCompleto;
      const doc = String(creado.numDoc ?? nd);

      Alert.alert('Alumno creado', `${nombre} quedó como jornada de capacitación.`, [
        { text: 'Ver etiqueta QR', onPress: () => setQrLabel({ numDoc: doc, nombre }) },
        { text: claseId ? 'Volver a la clase' : 'Listo', onPress: () => volverAClase(doc) },
      ]);
    } catch (e) {
      const err = e as Error & {
        status?: number;
        body?: { message?: string; codigo?: string; alumno?: { numDoc?: string | number } };
      };
      if (err.status === 409 && err.body?.codigo === 'alumno_duplicado') {
        const doc = String(err.body.alumno?.numDoc || nd);
        setNumDoc(sanitizeNumDocInput(doc));
        Alert.alert(
          'Ya existe',
          err.body.message || 'Ya hay un alumno con ese documento.',
          claseId
            ? [
                { text: 'Volver a la clase', onPress: () => volverAClase(doc) },
                { text: 'OK', style: 'cancel' },
              ]
            : [{ text: 'OK' }],
        );
        return;
      }
      Alert.alert('Error', err.body?.message || err.message || 'No se pudo crear el alumno');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {!puedeRegistrar ? (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
            Sin permiso de registro
          </ScaledText>
          <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 20, marginBottom: 16 }}>
            El alta de alumnos de jornada la realiza Registro/Recepción. Los instructores solo
            inscriben y operan clase con alumnos ya creados.
          </ScaledText>
          <PrimaryButton label="Volver" variant="ghost" fullWidth onPress={() => nav.goBack()} />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10 }}>
          Tipo fijo: Jornadas de Capacitación. Misma ficha del front: personales, contacto, origen y
          diversidad. Escanee PDF417 o digite.
        </ScaledText>

        <PrimaryButton
          label="Escanear PDF417 de la cédula"
          icon="scan-outline"
          onPress={() => setScanOpen(true)}
          disabled={busy}
          fullWidth
        />
        <View style={{ height: 12 }} />

        <SurfaceCard>
          <ScaledText baseSize={15} style={styles.secTitle}>
            Identificación
          </ScaledText>
          <CatalogPickerField
            label="Tipo documento"
            required
            options={TIPOS_DOC}
            value={tipoDoc}
            onChange={setTipoDoc}
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Número documento *"
            icon="card-outline"
            value={numDoc}
            onChangeText={(t) => setNumDoc(sanitizeNumDocInput(t))}
            keyboardType="number-pad"
          />
          <View style={{ height: 8 }} />
          <MunicipioBuscarField
            label="Expedida en"
            required
            texto={expedidaTexto}
            onSeleccionado={onExpedidaSel}
            onLimpiar={() => {
              setExpedida('');
              setExpedidaTexto('');
            }}
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Primer apellido *"
            icon="person-outline"
            value={apellido1}
            onChangeText={setApellido1}
            autoCapitalize="characters"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Segundo apellido *"
            icon="person-outline"
            value={apellido2}
            onChangeText={setApellido2}
            autoCapitalize="characters"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Primer nombre *"
            icon="person-outline"
            value={nombre1}
            onChangeText={setNombre1}
            autoCapitalize="characters"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Segundo nombre *"
            icon="person-outline"
            value={nombre2}
            onChangeText={setNombre2}
            autoCapitalize="characters"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Fecha nacimiento * (AAAA-MM-DD)"
            icon="calendar-outline"
            value={fechaNac}
            onChangeText={setFechaNac}
            placeholder="1990-05-21"
            autoCapitalize="none"
          />
        </SurfaceCard>

        <SurfaceCard style={{ marginTop: 12 }}>
          <ScaledText baseSize={15} style={styles.secTitle}>
            Datos personales
          </ScaledText>
          <CatalogPickerField label="Género" required options={GENEROS} value={genero} onChange={setGenero} />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Tipo de sangre"
            required
            options={TIPOS_SANGRE}
            value={tipoSangre}
            onChange={setTipoSangre}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Jornada"
            required
            options={JORNADAS_ESTUDIO}
            value={jornada}
            onChange={setJornada}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Estado civil"
            required
            options={ESTADOS_CIVIL}
            value={estadoCivil}
            onChange={setEstadoCivil}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Estrato"
            required
            options={ESTRATOS}
            value={estrato}
            onChange={setEstrato}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Régimen de salud"
            required
            options={REGIMEN_SALUD}
            value={regimenSalud}
            onChange={setRegimenSalud}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Nivel de formación"
            required
            options={NIVEL_FORMACION}
            value={nivelFormacion}
            onChange={setNivelFormacion}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Ocupación"
            required
            options={OCUPACIONES}
            value={ocupacion}
            onChange={setOcupacion}
          />
        </SurfaceCard>

        <SurfaceCard style={{ marginTop: 12 }}>
          <ScaledText baseSize={15} style={styles.secTitle}>
            Contacto y ubicación
          </ScaledText>
          <IconInput
            label="Correo *"
            icon="mail-outline"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Celular * (10 dígitos, inicia en 3)"
            icon="call-outline"
            value={celular}
            onChangeText={(t) => setCelular(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Dirección *"
            icon="home-outline"
            value={direccion}
            onChangeText={setDireccion}
          />
          <View style={{ height: 8 }} />
          <MunicipioBuscarField
            label="Municipio de origen"
            required
            texto={munOrigenTexto}
            onSeleccionado={onMunOrigenSel}
            onLimpiar={() => {
              setMunOrigen('');
              setMunOrigenTexto('');
            }}
          />
        </SurfaceCard>

        <SurfaceCard style={{ marginTop: 12 }}>
          <ScaledText baseSize={15} style={styles.secTitle}>
            Origen y diversidad
          </ScaledText>
          <CatalogPickerField
            label="Discapacidad"
            options={DISCAPACIDADES}
            value={discapacidad}
            onChange={setDiscapacidad}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Multiculturalidad"
            options={MULTICULTURALIDAD}
            value={multiCulturalidad}
            onChange={setMultiCulturalidad}
          />
          <View style={{ height: 8 }} />
          <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
            Observaciones
          </ScaledText>
          <TextInput
            value={observaciones}
            onChangeText={setObservaciones}
            multiline
            numberOfLines={4}
            placeholder="Opcional"
            placeholderTextColor="#94a3b8"
            style={[
              styles.obs,
              {
                borderColor: c.border,
                backgroundColor: c.card,
                color: c.text,
                fontSize: 15 * textMultiplier,
              },
            ]}
            textAlignVertical="top"
          />
        </SurfaceCard>

        <View style={{ height: 16 }} />
        <PrimaryButton
          label={busy ? 'Guardando…' : 'Crear alumno de jornada'}
          onPress={() => void onGuardar()}
          disabled={busy}
          fullWidth
          icon="person-add-outline"
        />
        <View style={{ height: 8 }} />
        <PrimaryButton label="Cancelar" variant="ghost" onPress={() => nav.goBack()} fullWidth />
        <View style={{ height: 32 }} />
      </ScrollView>
      )}

      {puedeRegistrar ? (
        <>
          <Pdf417ScanModal visible={scanOpen} onClose={() => setScanOpen(false)} onScan={aplicarPdf417} />
          <AlumnoQrLabelModal
            visible={!!qrLabel}
            numDoc={qrLabel?.numDoc || ''}
            nombre={qrLabel?.nombre || ''}
            codContrato={codContrato}
            fechaJornada={fechaJornada}
            onClose={() => {
              const doc = qrLabel?.numDoc;
              setQrLabel(null);
              volverAClase(doc);
            }}
          />
        </>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  secTitle: { color: '#134e4a', fontWeight: '800', marginBottom: 10 },
  obs: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
  },
});
