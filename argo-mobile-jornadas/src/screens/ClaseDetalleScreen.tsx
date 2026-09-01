import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
  alumnosClaseAnterior,
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
  quitarInscripcionClase,
  subirFotoEvidencia,
} from '../api/jornadasApi';
import {
  labelOrigenJornada,
  mensajeOrigenNoCoincide,
  origenAlumnoEfectivo,
} from '../utils/origenJornada';
import type {
  AlumnoClaseAnterior,
  AsistenciaClase,
  ClaseAnteriorResumen,
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
import { puedeGestionarJornadas, puedeRegistrarAlumnosJornada } from '../utils/permisos';
import type { RootStackParamList } from '../navigation/types';
import { VOICE_PHRASES, type VoiceCommandDef } from '../voice/commands';
import { useVoiceScreen } from '../voice/VoiceContext';

type Route = RouteProp<RootStackParamList, 'ClaseDetalle'>;

const ORIGEN_OPTS: { key: 'colegio' | 'estamento' | 'empresa' | 'operativo'; label: string }[] = [
  { key: 'colegio', label: 'Inst. educativa' },
  { key: 'estamento', label: 'Estamento' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'operativo', label: 'Operativo' },
];

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
  const puedeGestionar = puedeGestionarJornadas(
    state.status === 'signedIn' ? state.user?.permisos : undefined,
    state.status === 'signedIn' ? state.user?.rol : undefined,
    state.status === 'signedIn' ? state.user?.rolNombre : undefined,
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
  /** Filtro de origen al operar (no al crear la clase). */
  const [origenFiltro, setOrigenFiltro] = useState<string>('operativo');
  const [origenPreviewMismatch, setOrigenPreviewMismatch] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalClaseAnterior, setModalClaseAnterior] = useState(false);
  const [cargandoAnterior, setCargandoAnterior] = useState(false);
  const [claseAnteriorInfo, setClaseAnteriorInfo] = useState<ClaseAnteriorResumen | null>(null);
  const [alumnosAnterior, setAlumnosAnterior] = useState<AlumnoClaseAnterior[]>([]);
  const [selAnterior, setSelAnterior] = useState<Set<number>>(new Set());
  const [matriculandoAnterior, setMatriculandoAnterior] = useState(false);

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
    const o = cl.origenesAlumnos || { operativo: true };
    const activos = ORIGEN_OPTS.filter((x) => !!o[x.key]).map((x) => x.key);
    const listaActivos = (activos.length ? activos : ['operativo']) as string[];
    const origenClase = String(cl.origenOperacion || '').trim().toLowerCase();
    setOrigenFiltro((prev) => {
      if (origenClase && listaActivos.includes(origenClase)) return origenClase;
      if (listaActivos.includes(prev)) return prev;
      return listaActivos.includes('operativo')
        ? 'operativo'
        : String(listaActivos[0] || 'operativo');
    });
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
  const origenesActivos = useMemo(() => {
    const o = clase?.origenesAlumnos || { operativo: true };
    const act = ORIGEN_OPTS.filter((x) => !!o[x.key]);
    return act.length ? act : ORIGEN_OPTS.filter((x) => x.key === 'operativo');
  }, [clase?.origenesAlumnos]);
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
      setOrigenPreviewMismatch(null);
      return;
    }
    setProgresoLoading(true);
    debounceRef.current = setTimeout(() => {
      void progresoCertificacion(nd, idContrato)
        .then(setProgreso)
        .catch(() => setProgreso(null))
        .finally(() => setProgresoLoading(false));
      void buscarAlumnoDoc(nd)
        .then((a) => {
          setNombrePreview(nombreAlumno(a));
          const origenAlu = origenAlumnoEfectivo(a.origenJornadaCap);
          const filtro = origenAlumnoEfectivo(origenFiltro);
          if (origenAlu !== filtro) {
            setOrigenPreviewMismatch(mensajeOrigenNoCoincide(origenAlu, filtro));
          } else {
            setOrigenPreviewMismatch(null);
          }
        })
        .catch(() => {
          setNombrePreview('');
          setOrigenPreviewMismatch(null);
        });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [numDoc, idContrato, origenFiltro]);

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
    let nombreHint = (opts?.nombre || nombrePreview || nd).trim();
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

    const filtro = origenAlumnoEfectivo(origenFiltro);
    try {
      const alu = await buscarAlumnoDoc(nd);
      const n = nombreAlumno(alu);
      if (n) nombreHint = n;
      const origenAlu = origenAlumnoEfectivo(alu.origenJornadaCap);
      if (origenAlu !== filtro) {
        Alert.alert('Origen distinto', mensajeOrigenNoCoincide(origenAlu, filtro));
        return;
      }
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 404 || /alumno no encontrado/i.test(err.message || '')) {
        // Dejar que el flujo de abajo ofrezca crear alumno con el origen del filtro.
      } else {
        Alert.alert('Error', err.message || 'No se pudo consultar el alumno');
        return;
      }
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
      const r = (await matricularAlumno(nd, idProg, claseId, filtro)) as {
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
      setOrigenPreviewMismatch(null);
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
          origenAlumno?: string;
          origenFiltro?: string;
          certificado?: { codigoCert?: string };
        };
      };
      if (err.status === 400 && err.body?.codigo === 'origen_no_coincide') {
        Alert.alert(
          'Origen distinto',
          err.body.message ||
            mensajeOrigenNoCoincide(
              String(err.body.origenAlumno || ''),
              String(err.body.origenFiltro || filtro),
            ),
        );
        return;
      }
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
                    origenJornadaCap: origenFiltro,
                    codMunicipio: clase?.codMunicipioJornada || undefined,
                    empresaId: clase?.idClienteFacturacion || undefined,
                    empresaNombre: clase?.clienteNombre || undefined,
                    origenesPermitidos: origenesActivos.map((o) => o.key),
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

  const filtroOrigenActivo = origenAlumnoEfectivo(origenFiltro);

  const alumnosAnteriorDisponibles = useMemo(() => {
    const ya = new Set(inscritos.map((i) => Number(i.numDoc)));
    return alumnosAnterior.filter((a) => {
      if (ya.has(Number(a.numDoc))) return false;
      if (a.puedeMatricular === false) return false;
      if (a.yaInscritoEnEstaClase) return false;
      // Solo los del mismo origen que opera esta clase (evita equivocaciones entre carpas).
      return origenAlumnoEfectivo(a.origenJornadaCap) === filtroOrigenActivo;
    });
  }, [alumnosAnterior, inscritos, filtroOrigenActivo]);

  const alumnosAnteriorOmitidos = useMemo(() => {
    const ya = new Set(inscritos.map((i) => Number(i.numDoc)));
    return alumnosAnterior.filter((a) => {
      if (ya.has(Number(a.numDoc)) || a.yaInscritoEnEstaClase) return false;
      if (a.puedeMatricular === false) return true;
      return origenAlumnoEfectivo(a.origenJornadaCap) !== filtroOrigenActivo;
    });
  }, [alumnosAnterior, inscritos, filtroOrigenActivo]);

  async function abrirModalClaseAnterior() {
    if (finalizada) {
      Alert.alert('Clase finalizada', 'No se pueden agregar alumnos a una clase ya finalizada.');
      return;
    }
    if (!progSel.trim() && !String(clase?.idPrograma || '').trim()) {
      Alert.alert('Programa', 'Elija y guarde el programa de la clase antes de copiar alumnos.');
      return;
    }
    setModalClaseAnterior(true);
    setCargandoAnterior(true);
    setClaseAnteriorInfo(null);
    setAlumnosAnterior([]);
    setSelAnterior(new Set());
    try {
      const r = await alumnosClaseAnterior(claseId);
      setClaseAnteriorInfo(r.clase);
      setAlumnosAnterior(r.alumnos || []);
      const ya = new Set(inscritos.map((i) => Number(i.numDoc)));
      const pre = new Set<number>();
      for (const a of r.alumnos || []) {
        if (ya.has(Number(a.numDoc)) || a.yaInscritoEnEstaClase) continue;
        if (a.puedeMatricular === false) continue;
        if (origenAlumnoEfectivo(a.origenJornadaCap) !== origenAlumnoEfectivo(origenFiltro)) {
          continue;
        }
        pre.add(Number(a.numDoc));
      }
      setSelAnterior(pre);
    } catch (e) {
      Alert.alert(
        'Clase anterior',
        e instanceof Error ? e.message : 'No se pudo cargar la clase anterior.',
      );
      setModalClaseAnterior(false);
    } finally {
      setCargandoAnterior(false);
    }
  }

  function toggleSelAnterior(numDoc: number) {
    setSelAnterior((prev) => {
      const next = new Set(prev);
      if (next.has(numDoc)) next.delete(numDoc);
      else next.add(numDoc);
      return next;
    });
  }

  function seleccionarTodosAnterior() {
    setSelAnterior(new Set(alumnosAnteriorDisponibles.map((a) => Number(a.numDoc))));
  }

  function limpiarSelAnterior() {
    setSelAnterior(new Set());
  }

  function confirmarMatricularAnterior() {
    const seleccion = alumnosAnteriorDisponibles.filter((a) => selAnterior.has(Number(a.numDoc)));
    if (!seleccion.length) {
      Alert.alert('Selección', 'Marque al menos un alumno para inscribir.');
      return;
    }
    const fuente = claseAnteriorInfo
      ? [
          claseAnteriorInfo.carpaNombre,
          claseAnteriorInfo.programaNombre,
          claseAnteriorInfo.indiceClaseEnJornada != null
            ? `clase #${claseAnteriorInfo.indiceClaseEnJornada}`
            : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : 'clase anterior';
    Alert.alert(
      'Inscribir desde clase anterior',
      `¿Inscribir ${seleccion.length} alumno(s) de «${fuente}» en ESTA clase?\n\nOrigen activo: ${labelOrigenJornada(origenFiltro)}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, inscribir',
          onPress: () => void matricularSeleccionAnterior(seleccion),
        },
      ],
    );
  }

  async function matricularSeleccionAnterior(seleccion: AlumnoClaseAnterior[]) {
    setMatriculandoAnterior(true);
    setBusy(true);
    let ok = 0;
    const errores: string[] = [];
    try {
      const idProg = await persistirProgramaEnClase(progSel || String(clase?.idPrograma || ''), {
        silencioso: true,
      });
      for (const a of seleccion) {
        try {
          const origenAlu = origenAlumnoEfectivo(a.origenJornadaCap);
          await matricularAlumno(String(a.numDoc), idProg, claseId, origenAlu);
          ok += 1;
        } catch (e) {
          const msg =
            (e as Error & { body?: { message?: string } })?.body?.message ||
            (e instanceof Error ? e.message : 'Error');
          errores.push(`${a.nombreCompleto || a.numDoc}: ${msg}`);
        }
      }
      await cargar();
      setModalClaseAnterior(false);
      const base = `Inscritos ${ok} de ${seleccion.length} desde la clase anterior.`;
      if (errores.length) {
        Alert.alert('Resultado parcial', `${base}\n\n${errores.slice(0, 5).join('\n')}`);
      } else {
        Alert.alert('Listo', base);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo completar la inscripción.');
    } finally {
      setMatriculandoAnterior(false);
      setBusy(false);
    }
  }

  function onQuitarInscrito(ins: InscritoClase) {
    if (finalizada && !puedeGestionar) {
      Alert.alert(
        'Clase finalizada',
        'Solo un administrador puede quitar alumnos de una clase ya finalizada.',
      );
      return;
    }
    const nombre = ins.nombreCompleto || `doc. ${ins.numDoc}`;
    const extraAsist = ins.tieneAsistencia
      ? ' También se eliminará su asistencia en esta clase.'
      : '';
    Alert.alert(
      'Quitar de la clase',
      `¿Quitar a ${nombre} de esta clase?\n\nLa matrícula al programa se conserva.${extraAsist}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, quitar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await quitarInscripcionClase(claseId, ins.numDoc);
                await cargar();
                Alert.alert('Listo', `${nombre} fue retirado de la clase.`);
              } catch (e) {
                Alert.alert(
                  'Error',
                  e instanceof Error ? e.message : 'No se pudo quitar al alumno.',
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  }

  const claseVoiceCommands = useMemo<VoiceCommandDef[]>(
    () => [
      { id: 'siguiente', phrases: VOICE_PHRASES.siguiente },
      { id: 'anterior', phrases: VOICE_PHRASES.anterior },
      { id: 'limpiar', phrases: VOICE_PHRASES.limpiar },
      {
        id: 'iniciar',
        phrases: VOICE_PHRASES.iniciar,
        requireConfirm: true,
        confirmTitle: 'Iniciar clase',
        confirmMessage: '¿Confirma iniciar el cronómetro / la clase por comando de voz?',
      },
      {
        id: 'finalizar',
        phrases: VOICE_PHRASES.finalizar,
        requireConfirm: true,
        confirmTitle: 'Finalizar clase',
        confirmMessage:
          '¿Confirma finalizar la clase? Se registrarán asistencias y se emitirán certificados según el contrato.',
      },
      { id: 'inscribir', phrases: VOICE_PHRASES.inscribir },
    ],
    [],
  );

  const claseFieldOrder = useMemo(() => {
    const fields = ['numDoc'];
    if (modoManualActivo) {
      fields.unshift('horaInicio', 'horaFin');
    }
    return fields;
  }, [modoManualActivo]);

  useVoiceScreen({
    screenId: 'ClaseDetalle',
    fieldOrder: claseFieldOrder,
    commands: claseVoiceCommands,
    runCommand: async (commandId) => {
      if (commandId === 'iniciar') {
        if (busy || finalizada || enCurso) return;
        await onIniciar();
        return;
      }
      if (commandId === 'finalizar') {
        if (busy || finalizada) return;
        await onFinalizar();
        return;
      }
      if (commandId === 'inscribir') {
        if (busy || finalizada || origenPreviewMismatch) return;
        await onRegistrarAlumno();
      }
    },
  });

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
              voiceFieldId="horaInicio"
              value={horaInicioInp}
              onChangeText={setHoraInicioInp}
              keyboardType="numbers-and-punctuation"
              placeholder="08:30"
              editable={!busy}
            />
            <IconInput
              label="Hora fin (HH:mm)"
              icon="time-outline"
              voiceFieldId="horaFin"
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
        {origenesActivos.length > 1 ? (
          <>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 8 }}>
              Solo se inscriben alumnos del origen seleccionado
            </ScaledText>
            <View style={styles.chipsRow}>
              {origenesActivos.map((o) => {
                const sel = origenFiltro === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => {
                      setOrigenFiltro(o.key);
                      setOrigenPreviewMismatch(null);
                    }}
                    style={[
                      styles.origenChip,
                      {
                        borderColor: sel ? c.primary : c.border,
                        backgroundColor: sel ? c.accentSoft : c.card,
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
            <View style={{ height: 12 }} />
          </>
        ) : origenesActivos.length === 1 ? (
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10 }}>
            Origen del contrato: {origenesActivos[0].label} (solo se inscriben alumnos de este
            origen)
          </ScaledText>
        ) : null}
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
          label="Desde clase anterior"
          icon="people-circle-outline"
          variant="ghost"
          onPress={() => void abrirModalClaseAnterior()}
          disabled={busy || finalizada}
          fullWidth
        />
        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 6, marginBottom: 10 }}>
          Copia alumnos de la carpa/clase previa de esta jornada (todos o seleccionados), del origen
          activo.
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
                origenJornadaCap: origenFiltro,
                codMunicipio: clase?.codMunicipioJornada || undefined,
                empresaId: clase?.idClienteFacturacion || undefined,
                empresaNombre: clase?.clienteNombre || undefined,
                origenesPermitidos: origenesActivos.map((o) => o.key),
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
          voiceFieldId="numDoc"
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
        {origenPreviewMismatch ? (
          <ScaledText baseSize={13} style={{ color: c.warn, marginBottom: 10, lineHeight: 18 }}>
            {origenPreviewMismatch}
          </ScaledText>
        ) : numDoc.trim().length >= 5 && nombrePreview ? (
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 8 }}>
            Origen OK · {labelOrigenJornada(origenFiltro)}
          </ScaledText>
        ) : null}
        {progresoLoading ? <ActivityIndicator color={c.primary} style={{ marginBottom: 8 }} /> : null}
        {progreso ? (
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10 }}>
            Progreso: {progreso.sesiones}/{progreso.numSesCert} sesiones
            {progreso.tipoCertificado === 'por_clase' ? ' · por clase' : ''}
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
          disabled={busy || finalizada || !!origenPreviewMismatch}
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
              <View style={styles.inscritoHead}>
                <View style={{ flex: 1, minWidth: 0 }}>
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
                        label={
                          ins.certificadoCodigo ? `Cert. ${ins.certificadoCodigo}` : 'Certificado'
                        }
                        icon="ribbon-outline"
                        tone="lilac"
                      />
                    ) : null}
                  </View>
                </View>
                {(!finalizada || puedeGestionar) && !ins.yaCertificadoContrato ? (
                  <Pressable
                    onPress={() => onQuitarInscrito(ins)}
                    disabled={busy}
                    hitSlop={8}
                    style={[
                      styles.quitarBtn,
                      {
                        borderColor: '#fca5a5',
                        backgroundColor: c.dangerBg,
                        opacity: busy ? 0.5 : 1,
                      },
                    ]}
                    accessibilityLabel={`Quitar a ${ins.nombreCompleto || ins.numDoc} de la clase`}
                  >
                    <Ionicons name="trash-outline" size={18} color={c.danger} />
                  </Pressable>
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

      <Modal
        visible={modalClaseAnterior}
        animationType="slide"
        transparent
        onRequestClose={() => !matriculandoAnterior && setModalClaseAnterior(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', marginBottom: 6 }}>
              Desde clase anterior
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10, lineHeight: 18 }}>
              Inscribe en ESTA clase alumnos que ya estaban en la carpa/clase previa de la misma
              jornada. Origen activo: {labelOrigenJornada(origenFiltro)}.
            </ScaledText>

            {cargandoAnterior ? (
              <ActivityIndicator color={c.primary} style={{ marginVertical: 24 }} />
            ) : !claseAnteriorInfo ? (
              <ScaledText baseSize={14} style={{ color: c.textSoft, marginVertical: 16 }}>
                No hay clase anterior en esta jornada (esta es la primera).
              </ScaledText>
            ) : (
              <>
                <View
                  style={[
                    styles.fuenteBox,
                    { borderColor: c.border, backgroundColor: c.accentSoft },
                  ]}
                >
                  <ScaledText baseSize={12} style={{ color: c.textSoft, fontWeight: '700' }}>
                    CLASE FUENTE
                  </ScaledText>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700', marginTop: 4 }}>
                    {[
                      claseAnteriorInfo.carpaNombre,
                      claseAnteriorInfo.programaNombre,
                      claseAnteriorInfo.indiceClaseEnJornada != null
                        ? `#${claseAnteriorInfo.indiceClaseEnJornada}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Clase anterior'}
                  </ScaledText>
                </View>

                {alumnosAnteriorDisponibles.length === 0 ? (
                  <ScaledText baseSize={14} style={{ color: c.warn, marginVertical: 12, lineHeight: 20 }}>
                    No hay alumnos nuevos que coincidan con el origen «
                    {labelOrigenJornada(origenFiltro)}»
                    {alumnosAnteriorOmitidos.length
                      ? ` (${alumnosAnteriorOmitidos.length} omitido(s): otro origen, ya inscritos o certificados).`
                      : '.'}
                  </ScaledText>
                ) : (
                  <>
                    <View style={styles.selActions}>
                      <Pressable onPress={seleccionarTodosAnterior} hitSlop={8}>
                        <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '800' }}>
                          Todos ({alumnosAnteriorDisponibles.length})
                        </ScaledText>
                      </Pressable>
                      <Pressable onPress={limpiarSelAnterior} hitSlop={8}>
                        <ScaledText baseSize={13} style={{ color: c.textSoft, fontWeight: '700' }}>
                          Ninguno
                        </ScaledText>
                      </Pressable>
                      <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                        {selAnterior.size} sel.
                      </ScaledText>
                    </View>
                    <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
                      {alumnosAnteriorDisponibles.map((a) => {
                        const checked = selAnterior.has(Number(a.numDoc));
                        return (
                          <Pressable
                            key={String(a.numDoc)}
                            onPress={() => toggleSelAnterior(Number(a.numDoc))}
                            style={[
                              styles.selRow,
                              {
                                borderColor: checked ? c.primary : c.border,
                                backgroundColor: checked ? c.accentSoft : c.bg,
                              },
                            ]}
                          >
                            <Ionicons
                              name={checked ? 'checkbox' : 'square-outline'}
                              size={22}
                              color={checked ? c.primary : c.textSoft}
                            />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <ScaledText
                                baseSize={14}
                                style={{ color: c.text, fontWeight: '700' }}
                                numberOfLines={1}
                              >
                                {a.nombreCompleto || `Doc. ${a.numDoc}`}
                              </ScaledText>
                              <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                                Doc. {a.numDoc} · {labelOrigenJornada(a.origenJornadaCap)}
                              </ScaledText>
                            </View>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    {alumnosAnteriorOmitidos.length > 0 ? (
                      <ScaledText
                        baseSize={12}
                        style={{ color: c.textSoft, marginTop: 8, lineHeight: 16 }}
                      >
                        {alumnosAnteriorOmitidos.length} no listado(s): otro origen, ya en esta clase
                        o con certificado.
                      </ScaledText>
                    ) : null}
                  </>
                )}
              </>
            )}

            <View style={{ height: 14 }} />
            <PrimaryButton
              label={
                matriculandoAnterior
                  ? 'Inscribiendo…'
                  : `Inscribir seleccionados (${selAnterior.size})`
              }
              onPress={confirmarMatricularAnterior}
              disabled={
                cargandoAnterior ||
                matriculandoAnterior ||
                selAnterior.size === 0 ||
                !claseAnteriorInfo
              }
              fullWidth
              icon="checkmark-done-outline"
            />
            <View style={{ height: 8 }} />
            <PrimaryButton
              label="Cerrar"
              variant="ghost"
              onPress={() => setModalClaseAnterior(false)}
              disabled={matriculandoAnterior}
              fullWidth
            />
          </View>
        </View>
      </Modal>

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
  sectionTitle: { color: '#0F172A', fontWeight: '800', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  inscritoHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  quitarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  origenChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '88%',
  },
  fuenteBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  selActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  selRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
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
