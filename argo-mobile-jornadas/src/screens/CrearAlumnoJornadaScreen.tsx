import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { AlumnoQrLabelModal } from '../components/AlumnoQrLabelModal';
import { AsyncSearchField } from '../components/AsyncSearchField';
import { CatalogPickerField } from '../components/CatalogPickerField';
import { IconInput } from '../components/IconInput';
import { MunicipioBuscarField } from '../components/MunicipioBuscarField';
import { Pdf417ScanModal } from '../components/Pdf417ScanModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { crearAlumnoJornada } from '../api/jornadasApi';
import {
  buscarClientesFacturacion,
  buscarColegios,
  buscarEstamentosPublicos,
  listarDepartamentos,
  type MunicipioDivipola,
} from '../api/catalogosApi';
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
import { VOICE_PHRASES, type VoiceCommandDef } from '../voice/commands';
import { useVoiceScreen } from '../voice/VoiceContext';

type Route = RouteProp<RootStackParamList, 'CrearAlumnoJornada'>;

const ORIGEN_KEYS = ['colegio', 'estamento', 'empresa', 'operativo'] as const;

const ORIGEN_LABELS: Record<string, string> = {
  colegio: 'Institución educativa',
  estamento: 'Estamento público',
  empresa: 'Empresa',
  operativo: 'Operativo / calle',
};

const TIPOS_INSTITUCION = [
  { value: 'colegio', label: 'Colegio' },
  { value: 'instituto', label: 'Instituto técnico' },
  { value: 'universidad', label: 'Universidad' },
];

const GRADOS = Array.from({ length: 11 }, (_, i) => ({
  value: String(i + 1),
  label: `Grado ${i + 1}`,
}));

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
    origenJornadaCap: origenParam,
    origenesPermitidos: origenesPermitidosParam,
    codMunicipio: codMunParam,
    empresaId: empresaIdParam,
    empresaNombre: empresaNombreParam,
  } = route.params;

  const origenesDisponibles = useMemo(() => {
    const raw = Array.isArray(origenesPermitidosParam)
      ? origenesPermitidosParam.map((x) => String(x || '').trim()).filter(Boolean)
      : [];
    const set = new Set(raw.length ? raw : ORIGEN_KEYS);
    return ORIGEN_KEYS.filter((k) => set.has(k)).map((key) => ({
      key,
      label: ORIGEN_LABELS[key],
    }));
  }, [origenesPermitidosParam]);

  const origenInicial = (() => {
    const p = String(origenParam || '').trim();
    if (p && origenesDisponibles.some((o) => o.key === p)) return p;
    return origenesDisponibles[0]?.key || 'operativo';
  })();

  const codMunicipioJornada = String(codMunParam || '').trim();
  const bloqueaOrigen = Boolean(origenParam && claseId);

  const [origenJornadaCap, setOrigenJornadaCap] = useState(origenInicial);

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
  const [codDepartamento, setCodDepartamento] = useState('');
  const [nombreDepartamento, setNombreDepartamento] = useState('');
  const [munOrigen, setMunOrigen] = useState('');
  const [munOrigenTexto, setMunOrigenTexto] = useState('');
  const [opcionesDepto, setOpcionesDepto] = useState<{ value: string; label: string }[]>([]);

  const [discapacidad, setDiscapacidad] = useState('9');
  const [multiCulturalidad, setMultiCulturalidad] = useState('NO_APLICA');
  const [observaciones, setObservaciones] = useState('');

  const [colegioCodigo, setColegioCodigo] = useState('');
  const [colegioNombre, setColegioNombre] = useState('');
  const [gradoColegio, setGradoColegio] = useState('');
  const [tipoInstitucion, setTipoInstitucion] = useState('colegio');
  const [programaInstitucion, setProgramaInstitucion] = useState('');
  const [estamentoId, setEstamentoId] = useState('');
  const [estamentoNombre, setEstamentoNombre] = useState('');
  const [cargoEstamento, setCargoEstamento] = useState('');
  const [dependenciaEstamento, setDependenciaEstamento] = useState('');
  const [empresaId, setEmpresaId] = useState(String(empresaIdParam || '').trim());
  const [empresaNombre, setEmpresaNombre] = useState(String(empresaNombreParam || '').trim());
  const empresaFijaContrato = Boolean(String(empresaIdParam || '').trim());

  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [qrLabel, setQrLabel] = useState<{ numDoc: string; nombre: string } | null>(null);

  const nombreCompleto = useMemo(
    () => [nombre1, nombre2, apellido1, apellido2].map((x) => x.trim()).filter(Boolean).join(' '),
    [nombre1, nombre2, apellido1, apellido2],
  );

  const codColegioFiltro = String(munOrigen || codMunicipioJornada || '').trim();

  const esNivelSuperior = tipoInstitucion === 'instituto' || tipoInstitucion === 'universidad';

  const buscarColegioCb = useCallback(
    async (q: string) => {
      const term = q.trim();
      // Sin municipio: en básica hace falta texto; en superior se lista todo el nivel.
      if (!codColegioFiltro && term.length < 2 && !esNivelSuperior) return [];
      const rows = await buscarColegios(
        codColegioFiltro,
        term,
        esNivelSuperior ? 400 : 40,
        tipoInstitucion,
      );
      return rows.map((r) => ({
        id: r.codigoEstablecimiento,
        label: r.label || r.nombreEstablecimiento,
        hint: r.hint || [r.nombreMunicipio, r.codMunicipio].filter(Boolean).join(' · ') || undefined,
      }));
    },
    [codColegioFiltro, tipoInstitucion, esNivelSuperior],
  );

  const buscarEstamentoCb = useCallback(
    async (q: string) => {
      const rows = await buscarEstamentosPublicos(codColegioFiltro, q, 40);
      return rows.map((r) => ({
        id: r.idEstamento,
        label: r.label || r.nombre,
        hint: [r.tipo, r.nombreMunicipio].filter(Boolean).join(' · ') || undefined,
      }));
    },
    [codColegioFiltro],
  );

  const buscarEmpresaCb = useCallback(async (q: string) => {
    try {
      const rows = await buscarClientesFacturacion(q, 40);
      return rows.map((r) => ({
        id: r._id,
        label: r.nombre,
        hint: r.identificacion || undefined,
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    void listarDepartamentos()
      .then((rows) =>
        setOpcionesDepto(
          (rows || []).map((d) => ({
            value: String(d.codDepto || '').padStart(2, '0'),
            label: String(d.nombreDepto || '').trim(),
          })),
        ),
      )
      .catch(() => setOpcionesDepto([]));
  }, []);

  function aplicarPdf417(data: CedulaPdf417Data) {
    setTipoDoc(data.tipoDoc || '1');
    setNumDoc(sanitizeNumDocInput(data.numDoc));
    setApellido1(data.apellido1 || '');
    setApellido2(data.apellido2 || '');
    setNombre1(data.nombre1 || '');
    setNombre2(data.nombre2 || '');
    if (data.fechaNac) setFechaNac(data.fechaNac);
    if (data.genero) setGenero(data.genero);
  }

  function onExpedidaSel(m: MunicipioDivipola) {
    setExpedida(m.codMunicipio);
    setExpedidaTexto(m.label);
  }

  function onMunOrigenSel(m: MunicipioDivipola) {
    setMunOrigen(m.codMunicipio);
    setMunOrigenTexto(m.nombreMunicipio || m.label);
    if (m.codDepto) {
      setCodDepartamento(String(m.codDepto).padStart(2, '0'));
      setNombreDepartamento(m.nombreDepto || nombreDepartamento);
    }
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
    if (!codDepartamento.trim()) return 'Indique el departamento de origen.';
    if (!munOrigen.trim()) return 'Indique el municipio de origen.';
    if (origenJornadaCap === 'colegio') {
      if (!tipoInstitucion) return 'Seleccione el tipo de institución.';
      if (!colegioNombre.trim()) {
        return tipoInstitucion === 'colegio'
          ? 'Seleccione o indique el colegio.'
          : 'Indique el nombre de la institución.';
      }
      if (tipoInstitucion === 'colegio') {
        const g = parseInt(gradoColegio, 10);
        if (!Number.isFinite(g) || g < 1 || g > 11) return 'Seleccione el grado (1–11).';
      } else if (!programaInstitucion.trim()) {
        return 'Indique el programa, carrera o semestre.';
      }
    }
    if (origenJornadaCap === 'estamento') {
      if (!estamentoId.trim()) return 'Seleccione el estamento público.';
      if (!cargoEstamento.trim()) return 'Indique el cargo.';
      if (!dependenciaEstamento.trim()) return 'Indique la dependencia.';
    }
    if (origenJornadaCap === 'empresa' && !empresaId) {
      return 'Seleccione la empresa (cliente de facturación).';
    }
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
        codDepartamento,
        nombreDepartamento: nombreDepartamento || undefined,
        discapacidad,
        multiCulturalidad,
        observaciones: observaciones.trim() || undefined,
        origenJornadaCap,
        ...(origenJornadaCap === 'colegio'
          ? {
              tipoInstitucionEducativa: tipoInstitucion,
              colegioCodigo: colegioCodigo || undefined,
              colegioNombre,
              ...(tipoInstitucion === 'colegio'
                ? { gradoColegio: parseInt(gradoColegio, 10) }
                : { programaInstitucion: programaInstitucion.trim().toUpperCase() }),
            }
          : {}),
        ...(origenJornadaCap === 'estamento'
          ? {
              estamentoId,
              estamentoNombre,
              cargoEstamento: cargoEstamento.trim().toUpperCase(),
              dependenciaEstamento: dependenciaEstamento.trim().toUpperCase(),
            }
          : {}),
        ...(origenJornadaCap === 'empresa' && empresaId ? { empresaId } : {}),
      });
      const nombre =
        creado.nombreCompleto ||
        [creado.nombre1, creado.nombre2, creado.apellido1, creado.apellido2]
          .filter(Boolean)
          .join(' ') ||
        nombreCompleto;
      const doc = String(creado.numDoc ?? nd);

      Alert.alert('Alumno creado', `${nombre} quedó como jornada de capacitación.`, [
        {
          text: 'Imprimir QR',
          onPress: () => setQrLabel({ numDoc: doc, nombre }),
        },
        ...(claseId
          ? [
              { text: 'Volver a la clase', onPress: () => volverAClase(doc) },
              { text: 'OK', style: 'cancel' as const },
            ]
          : [{ text: 'OK' }]),
      ]);
    } catch (err: any) {
      if (err?.status === 409 && err?.body?.codigo === 'alumno_duplicado') {
        const docDup = sanitizeNumDocInput(numDoc);
        Alert.alert(
          'Documento ya registrado',
          err.body?.message || 'Ya existe un alumno con ese documento.',
          claseId
            ? [
                { text: 'Volver a la clase', onPress: () => volverAClase(docDup) },
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

  const alumnoFieldOrder = useMemo(() => {
    const base = [
      'numDoc',
      'apellido1',
      'apellido2',
      'nombre1',
      'nombre2',
      'fechaNac',
      'correo',
      'celular',
      'direccion',
    ];
    if (origenJornadaCap === 'colegio') {
      return [...base, 'colegioNombre', 'programaInstitucion'];
    }
    if (origenJornadaCap === 'estamento') {
      return [...base, 'cargoEstamento', 'dependenciaEstamento'];
    }
    return base;
  }, [origenJornadaCap]);

  const alumnoVoiceCommands = useMemo<VoiceCommandDef[]>(
    () => [
      { id: 'siguiente', phrases: VOICE_PHRASES.siguiente },
      { id: 'anterior', phrases: VOICE_PHRASES.anterior },
      { id: 'limpiar', phrases: VOICE_PHRASES.limpiar },
      {
        id: 'guardar',
        phrases: VOICE_PHRASES.guardar,
        requireConfirm: true,
        confirmTitle: 'Guardar alumno',
        confirmMessage: '¿Confirma crear el alumno de jornada con los datos dictados?',
      },
    ],
    [],
  );

  useVoiceScreen({
    screenId: 'CrearAlumnoJornada',
    enabled: puedeRegistrar,
    fieldOrder: alumnoFieldOrder,
    commands: alumnoVoiceCommands,
    runCommand: async (commandId) => {
      if (commandId === 'guardar') {
        if (busy) return;
        await onGuardar();
      }
    },
  });

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
            Tipo fijo: Jornadas de Capacitación. Escanee PDF417 o digite los datos.
            {jornadaLabel ? ` · ${jornadaLabel}` : ''}
          </ScaledText>

          {origenesDisponibles.length > 0 ? (
            <SurfaceCard style={{ marginBottom: 12 }}>
              <ScaledText baseSize={15} style={styles.secTitle}>
                Origen del participante
              </ScaledText>
              {bloqueaOrigen ? (
                <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 8 }}>
                  Definido desde la clase: {ORIGEN_LABELS[origenJornadaCap] || origenJornadaCap}
                </ScaledText>
              ) : null}
              <View style={styles.chipsRow}>
                {origenesDisponibles.map((o) => {
                  const sel = origenJornadaCap === o.key;
                  const disabled = bloqueaOrigen && !sel;
                  return (
                    <Pressable
                      key={o.key}
                      disabled={disabled}
                      onPress={() => {
                        if (bloqueaOrigen) return;
                        setOrigenJornadaCap(o.key);
                        if (o.key !== 'colegio') {
                          setColegioCodigo('');
                          setColegioNombre('');
                          setGradoColegio('');
                          setProgramaInstitucion('');
                        }
                        if (o.key !== 'estamento') {
                          setEstamentoId('');
                          setEstamentoNombre('');
                          setCargoEstamento('');
                          setDependenciaEstamento('');
                        }
                        if (o.key !== 'empresa' && !empresaFijaContrato) {
                          setEmpresaId('');
                          setEmpresaNombre('');
                        }
                      }}
                      style={[
                        styles.origenChip,
                        {
                          borderColor: sel ? c.primary : c.border,
                          backgroundColor: sel ? c.accentSoft : c.card,
                          opacity: disabled ? 0.45 : 1,
                        },
                      ]}
                    >
                      <ScaledText
                        baseSize={13}
                        style={{ color: sel ? c.primary : c.text, fontWeight: sel ? '800' : '600' }}
                      >
                        {o.label}
                      </ScaledText>
                    </Pressable>
                  );
                })}
              </View>
            </SurfaceCard>
          ) : null}

          <PrimaryButton
            label="Escanear PDF417 de la cédula"
            icon="scan-outline"
            onPress={() => setScanOpen(true)}
            disabled={busy}
            fullWidth
          />
          <View style={{ height: 12 }} />

          <SurfaceCard style={{ marginBottom: 12 }}>
            <ScaledText baseSize={15} style={styles.secTitle}>
              Origen geográfico del alumno
            </ScaledText>
            <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 8, lineHeight: 18 }}>
              Elija departamento y luego municipio. Se usa para filtrar colegios y estamentos.
            </ScaledText>
            <CatalogPickerField
              label="Departamento de origen"
              required
              options={opcionesDepto}
              value={codDepartamento}
              onChange={(v) => {
                const opt = opcionesDepto.find((d) => d.value === v);
                setCodDepartamento(v);
                setNombreDepartamento(opt?.label || '');
                setMunOrigen('');
                setMunOrigenTexto('');
              }}
            />
            <View style={{ height: 8 }} />
            <MunicipioBuscarField
              label="Municipio de origen / residencia"
              required
              texto={munOrigenTexto}
              codDepto={codDepartamento}
              disabled={!codDepartamento}
              onSeleccionado={onMunOrigenSel}
              onLimpiar={() => {
                setMunOrigen('');
                setMunOrigenTexto('');
              }}
            />
          </SurfaceCard>

          {(origenJornadaCap === 'colegio' ||
            origenJornadaCap === 'estamento' ||
            origenJornadaCap === 'empresa') && (
            <SurfaceCard style={{ marginBottom: 12 }}>
              <ScaledText baseSize={15} style={styles.secTitle}>
                Datos del origen ({ORIGEN_LABELS[origenJornadaCap]})
              </ScaledText>
              {origenJornadaCap === 'colegio' ? (
                <>
                  <CatalogPickerField
                    label="Tipo de institución"
                    required
                    options={TIPOS_INSTITUCION}
                    value={tipoInstitucion}
                    onChange={(v) => {
                      setTipoInstitucion(v);
                      setColegioCodigo('');
                      setColegioNombre('');
                      setGradoColegio('');
                      setProgramaInstitucion('');
                    }}
                  />
                  <View style={{ height: 8 }} />
                  {tipoInstitucion === 'colegio' ? (
                    <>
                      {!codColegioFiltro ? (
                        <ScaledText baseSize={13} style={{ color: c.warn, marginBottom: 8 }}>
                          Elija primero el municipio de origen (más abajo) o cree desde una clase con
                          municipio. Sin municipio, escriba al menos 2 letras para buscar a nivel
                          nacional.
                        </ScaledText>
                      ) : (
                        <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 8 }}>
                          Filtra colegios por municipio:{' '}
                          {munOrigenTexto || codColegioFiltro}
                          {codMunicipioJornada && munOrigen && munOrigen !== codMunicipioJornada
                            ? ' (ficha alumno)'
                            : ''}
                        </ScaledText>
                      )}
                      <AsyncSearchField
                        label="Colegio"
                        required
                        texto={colegioNombre}
                        placeholder="Buscar colegio…"
                        loadOnOpen={Boolean(codColegioFiltro)}
                        minChars={codColegioFiltro ? 0 : 2}
                        onBuscar={buscarColegioCb}
                        onSeleccionado={(item) => {
                          setColegioCodigo(item.id);
                          setColegioNombre(item.label);
                        }}
                        onLimpiar={() => {
                          setColegioCodigo('');
                          setColegioNombre('');
                        }}
                      />
                      <CatalogPickerField
                        label="Grado"
                        required
                        options={GRADOS}
                        value={gradoColegio}
                        onChange={setGradoColegio}
                      />
                    </>
                  ) : (
                    <>
                      <ScaledText
                        baseSize={12}
                        style={{ color: c.textSoft, marginBottom: 8, lineHeight: 18 }}
                      >
                        Lista todas las del nivel: primero las del municipio, luego el resto del
                        país. También puede escribir el nombre a mano.
                      </ScaledText>
                      <AsyncSearchField
                        label={
                          tipoInstitucion === 'universidad' ? 'Universidad' : 'Instituto técnico'
                        }
                        texto={colegioNombre}
                        placeholder="Buscar en catálogo…"
                        loadOnOpen
                        minChars={0}
                        onBuscar={buscarColegioCb}
                        onSeleccionado={(item) => {
                          setColegioCodigo(item.id);
                          setColegioNombre(item.label);
                        }}
                        onLimpiar={() => {
                          setColegioCodigo('');
                          setColegioNombre('');
                        }}
                      />
                      <IconInput
                        label="Nombre de la institución *"
                        icon="school-outline"
                        voiceFieldId="colegioNombre"
                        value={colegioNombre}
                        onChangeText={(t) => {
                          setColegioNombre(t);
                          if (!t.trim()) setColegioCodigo('');
                        }}
                        autoCapitalize="characters"
                      />
                      <View style={{ height: 8 }} />
                      <IconInput
                        label="Programa / carrera / semestre *"
                        icon="book-outline"
                        voiceFieldId="programaInstitucion"
                        value={programaInstitucion}
                        onChangeText={setProgramaInstitucion}
                        autoCapitalize="characters"
                      />
                    </>
                  )}
                </>
              ) : null}
              {origenJornadaCap === 'estamento' ? (
                <>
                  <AsyncSearchField
                    label="Estamento público"
                    required
                    texto={estamentoNombre}
                    placeholder="Buscar estamento…"
                    loadOnOpen
                    minChars={0}
                    onBuscar={buscarEstamentoCb}
                    onSeleccionado={(item) => {
                      setEstamentoId(item.id);
                      setEstamentoNombre(item.label);
                    }}
                    onLimpiar={() => {
                      setEstamentoId('');
                      setEstamentoNombre('');
                    }}
                  />
                  <IconInput
                    label="Cargo *"
                    icon="briefcase-outline"
                    voiceFieldId="cargoEstamento"
                    value={cargoEstamento}
                    onChangeText={setCargoEstamento}
                    autoCapitalize="characters"
                  />
                  <View style={{ height: 8 }} />
                  <IconInput
                    label="Dependencia *"
                    icon="business-outline"
                    voiceFieldId="dependenciaEstamento"
                    value={dependenciaEstamento}
                    onChangeText={setDependenciaEstamento}
                    autoCapitalize="characters"
                  />
                </>
              ) : null}
              {origenJornadaCap === 'empresa' ? (
                empresaFijaContrato ? (
                  <ScaledText baseSize={14} style={{ color: c.text, lineHeight: 20 }}>
                    Empresa del contrato: {empresaNombre || empresaId || '—'}
                  </ScaledText>
                ) : (
                  <>
                    <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 8 }}>
                      Busque el cliente de facturación. Requiere permiso de facturación o pagos.
                    </ScaledText>
                    <AsyncSearchField
                      label="Empresa / cliente"
                      required
                      texto={empresaNombre}
                      placeholder="Buscar por razón social o NIT…"
                      loadOnOpen
                      minChars={0}
                      onBuscar={buscarEmpresaCb}
                      onSeleccionado={(item) => {
                        setEmpresaId(item.id);
                        setEmpresaNombre(item.label);
                      }}
                      onLimpiar={() => {
                        setEmpresaId('');
                        setEmpresaNombre('');
                      }}
                    />
                  </>
                )
              ) : null}
            </SurfaceCard>
          )}

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
              voiceFieldId="numDoc"
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
              voiceFieldId="apellido1"
              value={apellido1}
              onChangeText={setApellido1}
              autoCapitalize="characters"
            />
            <View style={{ height: 8 }} />
            <IconInput
              label="Segundo apellido *"
              icon="person-outline"
              voiceFieldId="apellido2"
              value={apellido2}
              onChangeText={setApellido2}
              autoCapitalize="characters"
            />
            <View style={{ height: 8 }} />
            <IconInput
              label="Primer nombre *"
              icon="person-outline"
              voiceFieldId="nombre1"
              value={nombre1}
              onChangeText={setNombre1}
              autoCapitalize="characters"
            />
            <View style={{ height: 8 }} />
            <IconInput
              label="Segundo nombre *"
              icon="person-outline"
              voiceFieldId="nombre2"
              value={nombre2}
              onChangeText={setNombre2}
              autoCapitalize="characters"
            />
            <View style={{ height: 8 }} />
            <IconInput
              label="Fecha nacimiento * (AAAA-MM-DD)"
              icon="calendar-outline"
              voiceFieldId="fechaNac"
              value={fechaNac}
              onChangeText={setFechaNac}
              placeholder="1990-01-15"
            />
          </SurfaceCard>

          <SurfaceCard style={{ marginTop: 12 }}>
            <ScaledText baseSize={15} style={styles.secTitle}>
              Datos personales
            </ScaledText>
            <CatalogPickerField
              label="Género"
              required
              options={GENEROS}
              value={genero}
              onChange={setGenero}
            />
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
              voiceFieldId="correo"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ height: 8 }} />
            <IconInput
              label="Celular * (10 dígitos, inicia en 3)"
              icon="call-outline"
              voiceFieldId="celular"
              value={celular}
              onChangeText={(t) => setCelular(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
            />
            <View style={{ height: 8 }} />
            <IconInput
              label="Dirección *"
              icon="home-outline"
              voiceFieldId="direccion"
              value={direccion}
              onChangeText={setDireccion}
            />
            {codDepartamento && munOrigenTexto ? (
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 8 }}>
                Origen: {nombreDepartamento || codDepartamento} / {munOrigenTexto}
              </ScaledText>
            ) : (
              <ScaledText baseSize={13} style={{ color: c.warn, marginTop: 8 }}>
                Falta departamento y municipio de origen (bloque superior).
              </ScaledText>
            )}
          </SurfaceCard>

          <SurfaceCard style={{ marginTop: 12 }}>
            <ScaledText baseSize={15} style={styles.secTitle}>
              Diversidad
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
            <ScaledText
              baseSize={14}
              style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}
            >
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
            icon="checkmark-circle-outline"
          />
          {(codContrato || fechaJornada) && (
            <ScaledText
              baseSize={12}
              style={{ color: c.textSoft, marginTop: 10, textAlign: 'center' }}
            >
              {[codContrato, fechaJornada].filter(Boolean).join(' · ')}
            </ScaledText>
          )}
          <View style={{ height: 28 }} />
        </ScrollView>
      )}

      <Pdf417ScanModal
        visible={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={(data) => {
          setScanOpen(false);
          aplicarPdf417(data);
        }}
      />
      <AlumnoQrLabelModal
        visible={!!qrLabel}
        numDoc={qrLabel?.numDoc || ''}
        nombre={qrLabel?.nombre || ''}
        onClose={() => setQrLabel(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  secTitle: { fontWeight: '800', marginBottom: 10, color: '#134e4a' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  origenChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  obs: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 96,
  },
});
