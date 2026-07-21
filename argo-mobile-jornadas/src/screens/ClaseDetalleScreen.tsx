import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ClaseIdChip } from '../components/ClaseIdChip';
import { DataChip, estadoChipTone } from '../components/DataChip';
import { IconInput } from '../components/IconInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgramaPicker, mismoProgramaId, programaId, programaLabel } from '../components/ProgramaPicker';
import { QrScanModal } from '../components/QrScanModal';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import type { JornadaAlumnoQrData } from '../utils/jornadaAlumnoQr';
import { alertarMetaAlumnosJornada } from '../utils/metaAlumnosAlert';
import {
  actualizarClase,
  buscarAlumnoDoc,
  estadoOperacionJornadas,
  finalizarClase,
  inscritosClase,
  iniciarClase,
  listadoAsistenciaClaseHtml,
  listarAsistencias,
  matricularAlumno,
  obtenerClase,
  programasJornadaCap,
  progresoCertificacion,
  subirFotoEvidencia,
} from '../api/jornadasApi';
import type {
  AsistenciaClase,
  ClaseJornada,
  InscritoClase,
  MetaJornadaResp,
  ProgramaJornada,
  ProgresoCert,
} from '../api/types';
import { UBICACIONES_CLASE } from '../config/appBranding';
import { getUploadsBaseUrl } from '../config/apiBase';
import { compartirHtmlPdf, imprimirHtml } from '../services/documentoPrint';
import {
  formatCronometro,
  isoAHoraCompleta,
  isoAHoraInput,
  msDuracionClase,
  validarHoraInput,
} from '../utils/jornadaUi';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { puedeRegistrarAlumnosJornada } from '../utils/permisos';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'ClaseDetalle'>;

function nombreAlumno(a: {
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
}): string {
  const nom = [a.nombre1, a.nombre2].filter(Boolean).join(' ').trim() || String(a.nombres || '').trim();
  const ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ').trim() || String(a.apellidos || '').trim();
  return `${nom} ${ap}`.trim() || a.nombreCompleto || '';
}

export default function ClaseDetalleScreen() {
  const route = useRoute<Route>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const { claseId, jornadaLabel, idContrato, prefillNumDoc } = route.params;
  const puedeRegistrar = puedeRegistrarAlumnosJornada(
    state.status === 'signedIn' ? state.user?.permisos : undefined,
  );

  const [clase, setClase] = useState<ClaseJornada | null>(null);
  const [programas, setProgramas] = useState<ProgramaJornada[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaClase[]>([]);
  const [inscritos, setInscritos] = useState<InscritoClase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [progSel, setProgSel] = useState('');
  const [ubicSel, setUbicSel] = useState('Carpa');

  const [numDoc, setNumDoc] = useState('');
  const [nombrePreview, setNombrePreview] = useState('');
  const [progreso, setProgreso] = useState<ProgresoCert | null>(null);
  const [progresoLoading, setProgresoLoading] = useState(false);
  const [tick, setTick] = useState(() => Date.now());
  const [scanQrOpen, setScanQrOpen] = useState(false);
  const [mostrarSwitchHorarioManual, setMostrarSwitchHorarioManual] = useState(false);
  const [horarioManual, setHorarioManual] = useState(false);
  const [horaInicioInp, setHoraInicioInp] = useState('');
  const [horaFinInp, setHoraFinInp] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const nd = String(prefillNumDoc || '').replace(/\D/g, '');
    if (nd) setNumDoc(nd);
  }, [prefillNumDoc]);

  const aplicarClaseEnPantalla = useCallback((cl: ClaseJornada, lista: ProgramaJornada[]) => {
    setClase(cl);
    setProgramas(lista);
    const idClaseProg = String(cl.idPrograma || '').trim();
    const match =
      lista.find((p) => mismoProgramaId(programaId(p), idClaseProg)) ||
      (cl.programaNombre
        ? lista.find(
            (p) =>
              programaLabel(p).toLowerCase() === String(cl.programaNombre).trim().toLowerCase(),
          )
        : undefined);
    setProgSel(match ? programaId(match) : idClaseProg);
    setUbicSel(cl.ubicacion || 'Carpa');
    setHorarioManual(cl.horarioManual === true);
    setHoraInicioInp(isoAHoraInput(cl.horaInicio) || '');
    setHoraFinInp(isoAHoraInput(cl.horaFin) || '');
  }, []);

  const cargar = useCallback(async () => {
    try {
      const [clRaw, progs, asis, ins, op] = await Promise.all([
        obtenerClase(claseId),
        programasJornadaCap(),
        listarAsistencias(claseId),
        inscritosClase(claseId),
        estadoOperacionJornadas().catch(() => null),
      ]);
      const lista = progs || [];
      setAsistencias(asis || []);
      setInscritos(ins || []);
      setMostrarSwitchHorarioManual(op?.mostrarSwitchHorarioManual === true);
      aplicarClaseEnPantalla(clRaw, lista);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar la clase');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }, [claseId, aplicarClaseEnPantalla]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useFocusEffect(
    useCallback(() => {
      setBusy(false);
      return () => setBusy(false);
    }, []),
  );

  const estadoClase = String(clase?.estado || '').toUpperCase();
  const enCurso = estadoClase === 'EN PROCESO';
  const finalizada = estadoClase === 'FINALIZADO';
  /** Config ON, o clase ya marcada como manual (conserva comportamiento). */
  const puedeUsarHorarioManual =
    mostrarSwitchHorarioManual || clase?.horarioManual === true || horarioManual;
  const modoManualActivo = puedeUsarHorarioManual && horarioManual;
  const libreParaTomar =
    estadoClase === 'PROGRAMADA' &&
    clase?.idEmpleadoInstructor == null &&
    !String(clase?.idUsuarioInstructor || '').trim();

  // Cronómetro en vivo mientras la clase está en curso.
  useEffect(() => {
    if (!enCurso || !clase?.horaInicio) return;
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enCurso, clase?.horaInicio, clase?._id]);

  const msCronometro = msDuracionClase(
    clase?.horaInicio,
    finalizada ? clase?.horaFin : null,
    enCurso ? tick : Date.now(),
  );
  const textoCronometro =
    msCronometro != null ? formatCronometro(msCronometro) : '00:00:00';

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const nd = numDoc.trim();
    if (nd.length < 5) {
      setProgreso(null);
      setNombrePreview('');
      return;
    }
    setProgresoLoading(true);
    debounceRef.current = setTimeout(() => {
      void progresoCertificacion(nd, idContrato)
        .then(setProgreso)
        .catch(() => setProgreso(null))
        .finally(() => setProgresoLoading(false));
      void buscarAlumnoDoc(nd)
        .then((a) => setNombrePreview(nombreAlumno(a)))
        .catch(() => setNombrePreview(''));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [numDoc, idContrato]);

  /**
   * Persiste el programa en la clase (BD). Matricular/asistencia exigen que la clase
   * ya tenga el programa guardado, no solo seleccionado en pantalla.
   */
  async function persistirProgramaEnClase(
    idPrograma: string,
    opts?: { ubicacion?: string; silencioso?: boolean },
  ): Promise<string> {
    const id = idPrograma.trim();
    if (!id) {
      throw new Error('Seleccione un programa de capacitación.');
    }
    const idEnClase = String(clase?.idPrograma || '').trim();
    const mismaUbic =
      opts?.ubicacion == null || opts.ubicacion === (clase?.ubicacion || 'Carpa');
    if (mismoProgramaId(idEnClase, id) && mismaUbic) {
      return idEnClase || id;
    }
    const updated = await actualizarClase(claseId, {
      idPrograma: id,
      ubicacion: opts?.ubicacion ?? ubicSel,
    });
    setClase(updated);
    const idGuardado = String(updated.idPrograma || id).trim();
    setProgSel(idGuardado);
    if (!opts?.silencioso) {
      Alert.alert('Guardado', 'Programa y ubicación actualizados.');
    }
    return idGuardado;
  }

  async function onProgramaElegido(id: string) {
    setProgSel(id);
    if (finalizada || busy) return;
    setBusy(true);
    try {
      await persistirProgramaEnClase(id, { silencioso: true });
    } catch (e) {
      Alert.alert(
        'Programa',
        e instanceof Error ? e.message : 'No se pudo guardar el programa en la clase.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function guardarProgramaUbicacion() {
    if (!clase) return;
    if (!progSel.trim()) {
      Alert.alert('Programa', 'Seleccione un programa de capacitación.');
      return;
    }
    setBusy(true);
    try {
      await persistirProgramaEnClase(progSel, { ubicacion: ubicSel });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  }

  async function onReabrirClase() {
    setBusy(true);
    try {
      const updated = await actualizarClase(claseId, { reabrir: true });
      setClase(updated);
      Alert.alert('Clase reabierta', 'Ya puede editar programa y registrar alumnos.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo reabrir la clase');
    } finally {
      setBusy(false);
    }
  }

  /** Automático = hora real. Manual = horas HH:mm según Configuración → Jornadas. */
  async function onIniciar() {
    if (modoManualActivo) {
      if (!validarHoraInput(horaInicioInp)) {
        Alert.alert('Horario', 'Indique la hora de inicio en formato HH:mm (ej. 08:30).');
        return;
      }
      if (horaFinInp.trim() && !validarHoraInput(horaFinInp)) {
        Alert.alert('Horario', 'Indique la hora de fin en formato HH:mm (ej. 10:30).');
        return;
      }
    }
    setBusy(true);
    try {
      const updated = await iniciarClase(
        claseId,
        modoManualActivo
          ? {
              horarioManual: true,
              horaInicio: horaInicioInp.trim(),
              ...(horaFinInp.trim() ? { horaFin: horaFinInp.trim() } : {}),
            }
          : { horarioManual: false },
      );
      setClase(updated);
      setHorarioManual(updated.horarioManual === true);
      setHoraInicioInp(isoAHoraInput(updated.horaInicio) || horaInicioInp);
      setHoraFinInp(isoAHoraInput(updated.horaFin) || horaFinInp);
      setTick(Date.now());
      Alert.alert(
        'Clase',
        modoManualActivo
          ? 'Clase iniciada con el horario manual indicado.'
          : 'Cronómetro iniciado con la hora real.',
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo iniciar');
    } finally {
      setBusy(false);
    }
  }

  async function onFinalizar() {
    if (modoManualActivo) {
      if (!validarHoraInput(horaInicioInp) && !clase?.horaInicio) {
        Alert.alert('Horario', 'Indique la hora de inicio en formato HH:mm.');
        return;
      }
      if (!validarHoraInput(horaFinInp)) {
        Alert.alert('Horario', 'Indique la hora de fin en formato HH:mm (ej. 10:30).');
        return;
      }
    } else if (!clase?.horaInicio && !enCurso) {
      Alert.alert(
        'Hora de inicio',
        'Pulse ▶ Iniciar cronómetro antes de finalizar, para registrar la hora real de inicio.',
      );
      return;
    }

    setBusy(true);
    try {
      const r = await finalizarClase(
        claseId,
        modoManualActivo
          ? {
              horarioManual: true,
              ...(validarHoraInput(horaInicioInp) ? { horaInicio: horaInicioInp.trim() } : {}),
              horaFin: horaFinInp.trim(),
            }
          : { horarioManual: false },
      );
      if (r.clase) {
        setClase(r.clase);
        setHoraInicioInp(isoAHoraInput(r.clase.horaInicio) || '');
        setHoraFinInp(isoAHoraInput(r.clase.horaFin) || '');
      }
      await cargar();
      const nCert = r.certificadosGenerados ?? 0;
      let msg =
        nCert > 0
          ? `Clase cerrada. Se emitieron ${nCert} certificado(s) según el contrato.`
          : 'Clase cerrada. No se emitieron certificados nuevos (revise sesiones requeridas o si ya tenían certificado).';
      if (r.asistenciasRegistradas) {
        msg += ` Asistencias pendientes registradas: ${r.asistenciasRegistradas}.`;
      }
      const hi = isoAHoraCompleta(r.clase?.horaInicio);
      const hf = isoAHoraCompleta(r.clase?.horaFin);
      const durMs = msDuracionClase(r.clase?.horaInicio, r.clase?.horaFin);
      if (hi && hf) {
        msg += `\n\nHorario: ${hi} → ${hf}`;
        if (durMs != null) msg += ` (${formatCronometro(durMs)})`;
      }
      Alert.alert('Clase finalizada', msg);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo finalizar');
    } finally {
      setBusy(false);
    }
  }

  async function onFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cámara', 'Permita el acceso a la cámara para la evidencia.');
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: false });
    if (shot.canceled || !shot.assets?.[0]?.uri) return;
    setBusy(true);
    try {
      const updated = await subirFotoEvidencia(claseId, shot.assets[0].uri);
      setClase(updated);
      Alert.alert('Evidencia', 'Foto guardada.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo subir la foto');
    } finally {
      setBusy(false);
    }
  }

  async function onListadoAsistencia() {
    setBusy(true);
    try {
      const html = await listadoAsistenciaClaseHtml(claseId);
      Alert.alert('Listado de asistencia', '¿Qué desea hacer?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Imprimir',
          onPress: () => {
            void imprimirHtml(html).catch((e) =>
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo imprimir'),
            );
          },
        },
        {
          text: 'Compartir PDF',
          onPress: () => {
            void compartirHtmlPdf(html, `asistencia-clase-${claseId}`).catch((e) =>
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo compartir'),
            );
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo generar el listado');
    } finally {
      setBusy(false);
    }
  }

  /** Matricular + inscribir. La asistencia se fuerza al finalizar la clase. */
  async function onRegistrarAlumno(opts?: { numDoc?: string; nombre?: string }) {
    const nd = (opts?.numDoc ?? numDoc).trim().replace(/\D/g, '') || (opts?.numDoc ?? numDoc).trim();
    const nombreHint = (opts?.nombre || nombrePreview || nd).trim();
    if (!nd) {
      Alert.alert('Documento', 'Escriba el documento o escanee el QR de la etiqueta.');
      return;
    }
    if (finalizada) {
      Alert.alert(
        'Clase finalizada',
        'No se pueden agregar alumnos a una clase ya finalizada.',
      );
      return;
    }
    if (!progSel.trim()) {
      Alert.alert('Programa', 'Elija el programa de la clase antes de registrar al alumno.');
      return;
    }
    if (!idContrato) {
      Alert.alert('Contrato', 'No se identificó el contrato de la jornada.');
      return;
    }

    const yaEnClase = inscritos.find(
      (i) => String(i.numDoc).replace(/\D/g, '') === nd || String(i.numDoc) === nd,
    );
    if (yaEnClase) {
      Alert.alert(
        'Ya en la clase',
        `${yaEnClase.nombreCompleto || nombreHint} ya está inscrito en esta clase.` +
          (yaEnClase.tieneAsistencia
            ? ' Ya tiene asistencia.'
            : ' La asistencia se registrará al finalizar.'),
      );
      return;
    }

    setBusy(true);
    try {
      const p = await progresoCertificacion(nd, idContrato);
      setProgreso(p);
      if (p?.certificado) {
        Alert.alert(
          'Ya certificado',
          `${nombreHint} ya tiene certificado en este contrato` +
            (p.certificado.codigoCert ? ` (${p.certificado.codigoCert})` : '') +
            '. No se puede matricular de nuevo.',
        );
        return;
      }

      const idProg = await persistirProgramaEnClase(progSel, { silencioso: true });
      const r = (await matricularAlumno(nd, idProg, claseId)) as {
        inscripcionDuplicada?: boolean;
        metaJornada?: MetaJornadaResp | null;
      };
      let nombre = nombreHint;
      try {
        const alu = await buscarAlumnoDoc(nd);
        const n = nombreAlumno(alu);
        if (n) nombre = n;
      } catch {
        /* keep hint */
      }
      setNumDoc('');
      setProgreso(null);
      setNombrePreview('');
      await cargar();
      const okMsg =
        `${nombre} quedó inscrito en la clase.` +
        (r.inscripcionDuplicada ? ' (ya estaba inscrito).' : '') +
        ' La asistencia se registrará al finalizar la clase.';
      const meta = r.metaJornada;
      if (meta?.metaAlcanzada && meta.mensaje) {
        Alert.alert('Alumno inscrito', okMsg, [
          {
            text: 'Continuar',
            onPress: () =>
              alertarMetaAlumnosJornada(meta, {
                contratoLabel: clase?.contratoLabel || clase?.codContrato,
              }),
          },
        ]);
      } else {
        Alert.alert('Alumno inscrito', okMsg);
      }
    } catch (e) {
      const err = e as Error & {
        status?: number;
        body?: {
          message?: string;
          codigo?: string;
          sesiones?: number;
          numSesCert?: number;
          faltan?: number;
          nombreAlumno?: string;
          certificado?: { codigoCert?: string };
        };
      };
      if (err.status === 409 && err.body?.codigo === 'ya_certificado_contrato') {
        const cod = err.body.certificado?.codigoCert;
        Alert.alert(
          'Ya certificado',
          err.body.message ||
            `${err.body.nombreAlumno || nombreHint} ya tiene certificado` +
              (cod ? ` (${cod})` : '') +
              '. No se puede matricular de nuevo.',
        );
        return;
      }
      if (err.status === 409 && err.body?.sesiones != null) {
        Alert.alert(
          'Progreso',
          `${err.body.nombreAlumno || nd}: ${err.body.sesiones}/${err.body.numSesCert} — faltan ${err.body.faltan}.`,
        );
        return;
      }
      const msg = err.body?.message || err.message || 'No se pudo registrar al alumno';
      if (err.status === 404 || /alumno no encontrado/i.test(msg)) {
        if (puedeRegistrar) {
          Alert.alert(
            'Alumno no encontrado',
            `No hay ficha para el documento ${nd}. Puede crearlo como alumno de jornada de capacitación.`,
            [
              {
                text: 'Crear alumno',
                onPress: () =>
                  nav.navigate('CrearAlumnoJornada', {
                    numDoc: nd,
                    claseId,
                    jornadaLabel,
                    idContrato,
                    codContrato: clase?.codContrato || clase?.contratoLabel,
                    fechaJornada: clase?.fechaClase || clase?.fechaJornada,
                  }),
              },
              { text: 'Cancelar', style: 'cancel' },
            ],
          );
        } else {
          Alert.alert(
            'Alumno no encontrado',
            `No hay ficha para el documento ${nd}. Solicite el alta en Registro/Recepción; el instructor solo inscribe alumnos ya creados.`,
          );
        }
        return;
      }
      if (/certificad/i.test(msg)) {
        Alert.alert('Ya certificado', msg);
        return;
      }
      Alert.alert('Error', msg);
    } finally {
      setBusy(false);
    }
  }

  function onQrEscaneado(data: JornadaAlumnoQrData) {
    setNumDoc(data.numDoc);
    if (data.nombre) setNombrePreview(data.nombre);
    void onRegistrarAlumno({ numDoc: data.numDoc, nombre: data.nombre });
  }

  const fotoUrl =
    clase?.urlforo && !clase.urlforo.startsWith('http')
      ? `${getUploadsBaseUrl()}/${clase.urlforo.replace(/^\/+/, '')}`
      : clase?.urlforo;

  if (loading && !clase) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void cargar()} tintColor={c.primary} />}
    >
      <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 8 }}>
        {jornadaLabel}
      </ScaledText>
      <SurfaceCard terminada={finalizada}>
        <View style={styles.row}>
          <ScaledText
            baseSize={18}
            style={{
              color: finalizada ? c.terminadaText : c.text,
              fontWeight: '800',
              flex: 1,
            }}
          >
            Clase
          </ScaledText>
          {(() => {
            const est = estadoChipTone(clase?.estado);
            return <DataChip label={est.label} icon={est.icon} tone={est.tone} />;
          })()}
        </View>
        <View style={styles.chipsRow}>
          <ClaseIdChip id={clase?._id || claseId} completo />
        </View>
        <View style={styles.chipsRow}>
          <DataChip
            label={clase?.contratoLabel || clase?.codContrato || 'Contrato'}
            icon="briefcase-outline"
            tone="neutral"
          />
          {clase?.carpaNombre ? (
            <DataChip label={clase.carpaNombre} icon="business-outline" tone="neutral" />
          ) : null}
          <DataChip
            label={ubicSel || clase?.ubicacion || '—'}
            icon="location-outline"
            tone="soft"
          />
          {(clase?.horaInicio || clase?.horaFin) && (
            <DataChip
              label={`${isoAHoraCompleta(clase?.horaInicio) || '—'}${
                clase?.horaFin ? ` → ${isoAHoraCompleta(clase.horaFin)}` : enCurso ? ' → …' : ''
              }`}
              icon="time-outline"
              tone="soft"
            />
          )}
          <DataChip
            label={
              clase?.instructorNombre
                ? clase.instructorNombre
                : finalizada
                  ? 'Sin instructor'
                  : libreParaTomar
                    ? 'Disponible'
                    : 'Sin instructor'
            }
            icon={
              clase?.instructorNombre
                ? 'person-outline'
                : libreParaTomar
                  ? 'hand-left-outline'
                  : 'person-outline'
            }
            tone="neutral"
          />
        </View>
      </SurfaceCard>

      <ScaledText baseSize={15} style={styles.sectionTitle}>
        Programa y ubicación
      </ScaledText>
      <SurfaceCard>
        <ProgramaPicker
          programas={programas}
          value={progSel}
          onChange={(id) => void onProgramaElegido(id)}
          disabled={busy || finalizada}
        />
        {!mismoProgramaId(progSel, clase?.idPrograma) && progSel ? (
          <ScaledText baseSize={12} style={{ color: c.warn, marginTop: 8 }}>
            Guardando programa en la clase…
          </ScaledText>
        ) : null}
        <ScaledText
          baseSize={13}
          style={{ color: c.textSoft, marginTop: 14, marginBottom: 6, fontWeight: '600' }}
        >
          Ubicación
        </ScaledText>
        <View style={styles.chipsWrap}>
          {UBICACIONES_CLASE.map((u) => {
            const sel = ubicSel === u;
            return (
              <Pressable
                key={u}
                onPress={() => !finalizada && setUbicSel(u)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: sel ? c.primary : c.bgAlt,
                    borderColor: sel ? c.primary : c.border,
                  },
                ]}
              >
                <ScaledText
                  baseSize={12}
                  style={{ color: sel ? '#fff' : c.textSoft, fontWeight: '700' }}
                >
                  {u}
                </ScaledText>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 10 }} />
        <PrimaryButton
          label="Guardar programa y ubicación"
          onPress={() => void guardarProgramaUbicacion()}
          disabled={busy || finalizada || !progSel.trim()}
          fullWidth
        />
      </SurfaceCard>

      <ScaledText baseSize={15} style={styles.sectionTitle}>
        Operación {modoManualActivo ? '(horario manual)' : '(horario real)'}
      </ScaledText>
      <SurfaceCard>
        {mostrarSwitchHorarioManual && !finalizada ? (
          <Pressable
            onPress={() => !enCurso && setHorarioManual((v) => !v)}
            disabled={busy || enCurso}
            style={[
              styles.manualSwitch,
              {
                backgroundColor: horarioManual ? c.accentSoft : c.bgAlt,
                borderColor: horarioManual ? c.primary : c.border,
                opacity: enCurso ? 0.7 : 1,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800' }}>
                Horario manual
              </ScaledText>
              <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                {horarioManual
                  ? 'Las horas escritas no se reemplazan al iniciar o finalizar.'
                  : 'Inicio y fin se toman automáticamente al pulsar los botones.'}
              </ScaledText>
            </View>
            <View
              style={[
                styles.switchKnob,
                { backgroundColor: horarioManual ? c.primary : c.border },
              ]}
            >
              <ScaledText baseSize={11} style={{ color: '#fff', fontWeight: '800' }}>
                {horarioManual ? 'ON' : 'OFF'}
              </ScaledText>
            </View>
          </Pressable>
        ) : null}

        {modoManualActivo && !finalizada ? (
          <View style={{ marginTop: mostrarSwitchHorarioManual ? 12 : 0, marginBottom: 10 }}>
            <IconInput
              label="Hora inicio (HH:mm)"
              icon="time-outline"
              value={horaInicioInp}
              onChangeText={setHoraInicioInp}
              keyboardType="numbers-and-punctuation"
              placeholder="08:30"
              editable={!busy}
            />
            <IconInput
              label="Hora fin (HH:mm)"
              icon="time-outline"
              value={horaFinInp}
              onChangeText={setHoraFinInp}
              keyboardType="numbers-and-punctuation"
              placeholder="10:30"
              editable={!busy}
            />
            <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 4 }}>
              Defina las horas y luego Iniciar / Finalizar. Si la clase ya era manual, se conservan
              aunque el switch global esté apagado.
            </ScaledText>
          </View>
        ) : (
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 10 }}>
            {mostrarSwitchHorarioManual
              ? 'Modo automático: la hora de inicio y fin se toman al pulsar Iniciar y Finalizar.'
              : 'Horario manual desactivado en Configuración → Jornadas. Se usa la hora real al iniciar y finalizar.'}
          </ScaledText>
        )}

        {finalizada ? (
          <View style={{ marginBottom: 12 }}>
            <ScaledText baseSize={13} style={{ color: c.warn, marginBottom: 8 }}>
              Esta clase está finalizada.
              {asistencias.length === 0
                ? ' Puede reabrirla para seguir editando.'
                : ' Ya tiene alumnos registrados; no se puede reabrir.'}
            </ScaledText>
            {asistencias.length === 0 ? (
              <PrimaryButton
                label="Reabrir clase"
                onPress={() => void onReabrirClase()}
                disabled={busy}
                fullWidth
                variant="ghost"
                icon="refresh-outline"
              />
            ) : null}
          </View>
        ) : null}

        {!modoManualActivo ? (
          <View
            style={[
              styles.cronoBox,
              {
                backgroundColor: enCurso ? c.okBg : finalizada ? c.bgAlt : c.accentSoft,
                borderColor: enCurso ? c.ok : c.border,
              },
            ]}
          >
            <ScaledText
              baseSize={12}
              style={{ color: c.textSoft, fontWeight: '700', letterSpacing: 1 }}
            >
              {enCurso ? 'EN CURSO' : finalizada ? 'DURACIÓN REAL' : 'CRONÓMETRO'}
            </ScaledText>
            <ScaledText
              baseSize={36}
              style={{
                color: enCurso ? c.ok : c.text,
                fontWeight: '800',
                fontVariant: ['tabular-nums'],
                marginTop: 4,
              }}
            >
              {textoCronometro}
            </ScaledText>
            <View style={styles.horaRealRow}>
              <View style={styles.horaRealBox}>
                <ScaledText baseSize={11} style={{ color: c.textSoft, fontWeight: '700' }}>
                  INICIO REAL
                </ScaledText>
                <ScaledText
                  baseSize={16}
                  style={{ color: c.text, fontWeight: '800', marginTop: 2 }}
                >
                  {isoAHoraCompleta(clase?.horaInicio) || '—'}
                </ScaledText>
              </View>
              <ScaledText baseSize={18} style={{ color: c.textSoft, fontWeight: '700' }}>
                →
              </ScaledText>
              <View style={styles.horaRealBox}>
                <ScaledText baseSize={11} style={{ color: c.textSoft, fontWeight: '700' }}>
                  FIN REAL
                </ScaledText>
                <ScaledText
                  baseSize={16}
                  style={{ color: c.text, fontWeight: '800', marginTop: 2 }}
                >
                  {finalizada
                    ? isoAHoraCompleta(clase?.horaFin) || '—'
                    : enCurso
                      ? 'en curso…'
                      : '—'}
                </ScaledText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ height: 12 }} />
        <PrimaryButton
          label={modoManualActivo ? '▶ Iniciar clase' : '▶ Iniciar cronómetro'}
          onPress={() => void onIniciar()}
          disabled={busy || finalizada || enCurso}
          fullWidth
          variant="ghost"
          icon="play"
        />
        <View style={{ height: 10 }} />
        <PrimaryButton
          label="Finalizar clase y emitir certificados"
          onPress={() => void onFinalizar()}
          disabled={busy || finalizada}
          fullWidth
          variant="danger"
          icon="checkmark-done-outline"
        />
        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 8, textAlign: 'center' }}>
          Al finalizar se registran asistencias pendientes y se emiten certificados según el
          contrato.
        </ScaledText>
        <View style={{ height: 10 }} />
        <PrimaryButton
          label="📷 Foto evidencia"
          onPress={() => void onFoto()}
          disabled={busy}
          fullWidth
          variant="ghost"
          icon="camera-outline"
        />
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.foto} resizeMode="cover" />
        ) : null}
      </SurfaceCard>

      <ScaledText baseSize={15} style={styles.sectionTitle}>
        Alumnos en la clase
      </ScaledText>
      <SurfaceCard>
        <PrimaryButton
          label="Listado de asistencia"
          icon="list-outline"
          variant="ghost"
          onPress={() => void onListadoAsistencia()}
          disabled={busy}
          fullWidth
        />
        <View style={{ height: 12 }} />
        <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10 }}>
          Puede inscribir alumnos antes de iniciar o durante la clase. Al finalizar se registra la
          asistencia de todos los inscritos y se emiten certificados según el contrato.
        </ScaledText>
        <PrimaryButton
          label="Escanear QR del alumno"
          icon="qr-code-outline"
          onPress={() => setScanQrOpen(true)}
          disabled={busy || finalizada}
          fullWidth
        />
        <View style={{ height: 10 }} />
        {puedeRegistrar ? (
          <PrimaryButton
            label="Crear alumno de jornada"
            icon="person-add-outline"
            variant="ghost"
            onPress={() =>
              nav.navigate('CrearAlumnoJornada', {
                numDoc: numDoc.trim() || undefined,
                claseId,
                jornadaLabel,
                idContrato,
                codContrato: clase?.codContrato || clase?.contratoLabel,
                fechaJornada: clase?.fechaClase || clase?.fechaJornada,
              })
            }
            disabled={busy || finalizada}
            fullWidth
          />
        ) : null}
        <View style={{ height: 12 }} />
        <IconInput
          label="Documento del alumno"
          icon="card-outline"
          value={numDoc}
          onChangeText={setNumDoc}
          keyboardType="number-pad"
          placeholder="Ej. 1234567890"
        />
        {nombrePreview ? (
          <ScaledText baseSize={14} style={{ color: c.text, marginBottom: 6 }}>
            {nombrePreview}
          </ScaledText>
        ) : null}
        {progresoLoading ? <ActivityIndicator color={c.primary} style={{ marginBottom: 8 }} /> : null}
        {progreso ? (
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10 }}>
            Progreso: {progreso.sesiones}/{progreso.numSesCert} sesiones
            {progreso.certificado
              ? ` · Certificado: ${progreso.certificado.codigoCert || 'OK'}`
              : ` · Faltan ${progreso.faltan}`}
          </ScaledText>
        ) : null}
        {!progSel.trim() && !String(clase?.idPrograma || '').trim() ? (
          <ScaledText baseSize={13} style={{ color: c.warn, marginBottom: 10 }}>
            Primero elija el programa arriba.
          </ScaledText>
        ) : null}
        <PrimaryButton
          label="Inscribir alumno en la clase"
          onPress={() => void onRegistrarAlumno()}
          disabled={busy || finalizada}
          fullWidth
          icon="checkmark-circle-outline"
        />
      </SurfaceCard>

      {inscritos.length > 0 ? (
        <>
          <ScaledText baseSize={15} style={styles.sectionTitle}>
            Registrados ({inscritos.length})
          </ScaledText>
          {inscritos.map((ins) => (
            <SurfaceCard key={String(ins.numDoc)} style={{ marginBottom: 8 }}>
              <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }}>
                {ins.nombreCompleto || 'Alumno'}
              </ScaledText>
              <View style={styles.chipsRow}>
                <DataChip label={`Doc. ${ins.numDoc}`} icon="card-outline" tone="peach" />
                {ins.tieneAsistencia ? (
                  <DataChip label="Asistió" icon="checkmark-circle" tone="mint" />
                ) : (
                  <DataChip label="Inscrito" icon="person-outline" tone="amber" />
                )}
                {ins.yaCertificadoContrato ? (
                  <DataChip
                    label={ins.certificadoCodigo ? `Cert. ${ins.certificadoCodigo}` : 'Certificado'}
                    icon="ribbon-outline"
                    tone="lilac"
                  />
                ) : null}
              </View>
            </SurfaceCard>
          ))}
        </>
      ) : null}

      <QrScanModal
        visible={scanQrOpen}
        onClose={() => setScanQrOpen(false)}
        onScan={onQrEscaneado}
      />


      <PrimaryButton
        label="Ver certificados del contrato"
        onPress={() =>
          nav.navigate('Certificados', {
            idContrato,
            contratoLabel: clase?.contratoLabel || clase?.codContrato,
          })
        }
        fullWidth
        variant="ghost"
        icon="ribbon-outline"
      />
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#134e4a', fontWeight: '800', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4e1f0',
    marginRight: 8,
    marginBottom: 6,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  horaRealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  horaRealBox: {
    flex: 1,
    alignItems: 'center',
  },
  opRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  cronoBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  manualSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  switchKnob: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  foto: { width: '100%', height: 180, borderRadius: 12, marginTop: 12 },
});
