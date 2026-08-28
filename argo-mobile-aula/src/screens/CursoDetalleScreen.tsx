import React, { useCallback, useEffect, useState } from 'react';

import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import type { StackNavigationProp } from '@react-navigation/stack';

import { Ionicons } from '@expo/vector-icons';

import type { ComponentProps } from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { CursoAcciones } from '../components/CursoAcciones';

import { PortalAsistenteFlotante } from '../components/PortalAsistenteFlotante';

import { ScaledText } from '../components/ScaledText';

import { SegmentedTabs } from '../components/SegmentedTabs';

import { useAuth } from '../context/AuthContext';

import { usePortalConfig } from '../context/PortalConfigContext';

import { useTheme } from '../context/ThemeContext';

import type { ThemeColors } from '../theme/colors';

import { usePasarelaActiva } from '../hooks/usePasarelaActiva';

import { fetchCurso, fetchInscripcion, fetchProgreso, matricularCurso } from '../api/aulaApi';

import type { CursoVirtual, EstadoInscripcionVirtual, ProgresoVirtualResp } from '../api/types';

import { pctCurso } from '../utils/cursoUtils';

import { etiquetaPrecioCatalogo, fmtPrecioColombia } from '../utils/cursoPrecio';

import { resolveUploadUrl, resolvePlayerUrl } from '../utils/uploadUrl';

import { asistenteVistaParaPagina } from '../utils/asistentePortal';

import type { RootStackParamList } from '../navigation/types';

import { radius, space } from '../theme/spacing';

import { shadow } from '../theme/shadows';



type TabKey = 'about' | 'lessons';

type IonName = ComponentProps<typeof Ionicons>['name'];



export default function CursoDetalleScreen() {

  const route = useRoute<RouteProp<RootStackParamList, 'CursoDetalle'>>();

  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();

  const { state } = useAuth();

  const c = useTheme();

  const insets = useSafeAreaInsets();

  const { pasarelaActiva } = usePasarelaActiva();

  const { config: portalConfig } = usePortalConfig();

  const asistente = asistenteVistaParaPagina(portalConfig?.landing?.asistente ?? null, 'cursos');

  const [curso, setCurso] = useState<CursoVirtual | null>(null);

  const [insc, setInsc] = useState<EstadoInscripcionVirtual | null>(null);

  const [progreso, setProgreso] = useState<ProgresoVirtualResp | null>(null);

  const [tab, setTab] = useState<TabKey>('about');

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState('');

  const [descExpanded, setDescExpanded] = useState(false);

  const [bottomBarH, setBottomBarH] = useState(160);



  const load = useCallback(async () => {

    setLoading(true);

    try {

      const det = await fetchCurso(route.params.id);

      setCurso(det);

      if (state.status === 'signedIn') {

        try {

          const ins = await fetchInscripcion(route.params.id);

          setInsc(ins);

          if (ins.matriculado) {

            try {

              const prog = await fetchProgreso(route.params.id);

              setProgreso(prog);

            } catch {

              setProgreso(null);

            }

          } else {

            setProgreso(null);

          }

        } catch {

          setInsc(null);

          setProgreso(null);

        }

      } else {

        setInsc(null);

        setProgreso(null);

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



  useFocusEffect(

    useCallback(() => {

      if (state.status === 'signedIn') {

        void fetchInscripcion(route.params.id)

          .then(setInsc)

          .catch(() => setInsc(null));

      }

    }, [state.status, route.params.id]),

  );



  async function onMatricular() {

    setBusy(true);

    setMsg('');

    try {

      const res = await matricularCurso(route.params.id);

      setMsg(res.message);

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

  const matriculado = insc?.matriculado === true;

  const puedeEntrar = insc?.puedeCursar === true;

  const pct = pctCurso(curso);

  const precio = etiquetaPrecioCatalogo(curso);

  const signedIn = state.status === 'signedIn';

  const descripcion = curso.descripcionVirtual || curso.descripcion || 'Sin descripción.';

  const clases = progreso?.progreso?.clases ?? [];



  return (

    <View style={[styles.root, { backgroundColor: c.bg }]}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomBarH + space.lg }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.heroWrap}>

          {img ? (

            <Image source={{ uri: img }} style={styles.heroImg} resizeMode="cover" />

          ) : (

            <View style={[styles.heroImg, { backgroundColor: c.foroSoft }]} />

          )}

          <Pressable

            onPress={() => nav.goBack()}

            style={[styles.fab, { top: insets.top + 8, backgroundColor: c.card }, shadow.sm]}

          >

            <Ionicons name="arrow-back" size={20} color={c.text} />

          </Pressable>

          <Pressable style={[styles.fabRight, { top: insets.top + 8, backgroundColor: c.card }, shadow.sm]}>

            <Ionicons name="bookmark-outline" size={20} color={c.text} />

          </Pressable>

        </View>



        <View style={styles.body}>

          {curso.categoriaNombre ? (

            <View style={[styles.badge, { backgroundColor: c.foroSoft }]}>

              <ScaledText baseSize={11} style={{ color: c.primary, fontWeight: '700' }}>

                {curso.categoriaNombre}

              </ScaledText>

            </View>

          ) : null}



          <ScaledText baseSize={22} style={{ color: c.text, fontWeight: '600', lineHeight: 30, marginTop: space.sm }}>

            {curso.nombreProg}

          </ScaledText>



          <View style={styles.ratingRow}>

            <View style={[styles.ratingPill, { backgroundColor: c.foroSoft }]}>

              <ScaledText baseSize={11} style={{ color: c.primary, fontWeight: '700' }}>

                Destacado

              </ScaledText>

            </View>

            <Ionicons name="star" size={14} color={c.gold} />

            <ScaledText baseSize={13} style={{ color: c.textSoft, fontWeight: '600' }}>

              4.8

            </ScaledText>

          </View>



          <View style={styles.priceRow}>

            <ScaledText baseSize={24} style={{ color: c.primary, fontWeight: '600' }}>

              {precio.badgeTone === 'price' ? fmtPrecioColombia(curso.tarifaVirtual) : precio.badge}

            </ScaledText>

            {precio.badgeTone === 'price' && curso.tarifaVirtual > 0 ? (

              <ScaledText baseSize={16} style={{ color: c.textSoft, textDecorationLine: 'line-through', marginLeft: 8 }}>

                {fmtPrecioColombia(Math.round(curso.tarifaVirtual * 1.35))}

              </ScaledText>

            ) : null}

          </View>

          <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>

            {precio.hint}

          </ScaledText>



          <View style={styles.statsRow}>

            <Stat icon="people-outline" label="Modalidad" value="Virtual" colors={c} />

            <Stat icon="time-outline" label="Duración" value={curso.horas ? `${curso.horas} h` : 'Flexible'} colors={c} />

            <Stat icon="ribbon-outline" label="Certificado" value="Sí" colors={c} />

          </View>



          {pct > 0 ? (

            <View style={[styles.progressChip, { backgroundColor: c.okSoft }]}>

              <ScaledText baseSize={13} style={{ color: c.ok, fontWeight: '700' }}>

                Tu progreso: {Math.round(pct)}%

              </ScaledText>

            </View>

          ) : null}



          <SegmentedTabs

            tabs={[

              { key: 'about', label: 'Acerca de' },

              { key: 'lessons', label: 'Lecciones' },

            ]}

            active={tab}

            onChange={(k) => setTab(k as TabKey)}

          />



          {tab === 'about' ? (

            <View>

              <ScaledText baseSize={15} style={{ color: c.textSoft, lineHeight: 24 }} numberOfLines={descExpanded ? undefined : 5}>

                {descripcion}

              </ScaledText>

              {descripcion.length > 180 ? (

                <Pressable onPress={() => setDescExpanded((v) => !v)} style={{ marginTop: space.sm }}>

                  <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>

                    {descExpanded ? 'Leer menos' : 'Leer más…'}

                  </ScaledText>

                </Pressable>

              ) : null}

            </View>

          ) : (

            <View>

              <View style={styles.lessonsHead}>

                <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '600' }}>

                  {clases.length > 0 ? `${clases.length} lecciones` : 'Contenido del curso'}

                </ScaledText>

                {matriculado ? (

                  <ScaledText baseSize={12} style={{ color: c.primary, fontWeight: '700' }}>

                    {Math.round(pct)}% completado

                  </ScaledText>

                ) : null}

              </View>

              {!matriculado ? (

                <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 22 }}>

                  Matricúlese para ver el listado de lecciones y su avance.

                </ScaledText>

              ) : clases.length === 0 ? (

                <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 22 }}>

                  El contenido se abre en el reproductor del curso. Pulse «Entrar al curso» para comenzar.

                </ScaledText>

              ) : (

                clases.map((clase, idx) => {

                  const locked = !clase.aprobada && idx > 0 && !clases[idx - 1]?.aprobada;

                  return (

                    <View

                      key={clase.numero}

                      style={[styles.lessonRow, { borderColor: c.borderLight, backgroundColor: c.card }, shadow.sm]}

                    >

                      <View style={[styles.lessonNum, { backgroundColor: c.foroSoft }]}>

                        <ScaledText baseSize={12} style={{ color: c.primary, fontWeight: '600' }}>

                          {String(clase.numero).padStart(2, '0')}

                        </ScaledText>

                      </View>

                      <View style={{ flex: 1 }}>

                        <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700' }}>

                          Lección {clase.numero}

                        </ScaledText>

                        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>

                          {Math.round(clase.pct)}% · {clase.aprobada ? 'Completada' : 'Pendiente'}

                        </ScaledText>

                      </View>

                      <Ionicons

                        name={clase.aprobada ? 'checkmark-circle' : locked ? 'lock-closed' : 'play-circle'}

                        size={22}

                        color={clase.aprobada ? c.ok : locked ? c.textSoft : c.primary}

                      />

                    </View>

                  );

                })

              )}

            </View>

          )}



          {msg ? (

            <ScaledText baseSize={13} style={{ color: c.ok, marginTop: space.lg, textAlign: 'center', fontWeight: '600' }}>

              {msg}

            </ScaledText>

          ) : null}

        </View>

      </ScrollView>



      <View onLayout={(e) => setBottomBarH(e.nativeEvent.layout.height)}>
        <CursoAcciones

        curso={curso}

        inscripcion={insc}

        signedIn={signedIn}

        pasarelaActiva={pasarelaActiva}

        puedeEntrar={puedeEntrar}

        matriculado={matriculado}

        busyMatricula={busy}

        onMatricular={() => void onMatricular()}

        onContinuar={onContinuar}

        onRegistro={() => nav.navigate('Registro')}

        onLogin={() => nav.navigate('Login')}

        onPagoIniciado={() => void load()}

        />
      </View>

      {asistente ? <PortalAsistenteFlotante config={asistente} /> : null}

    </View>

  );

}



function Stat({ icon, label, value, colors }: { icon: IonName; label: string; value: string; colors: ThemeColors }) {

  return (

    <View style={[styles.stat, { backgroundColor: colors.bgSoft }]}>

      <Ionicons name={icon} size={18} color={colors.primary} />

      <ScaledText baseSize={11} style={{ color: colors.textSoft, marginTop: 4 }}>

        {label}

      </ScaledText>

      <ScaledText baseSize={13} style={{ color: colors.text, fontWeight: '700', marginTop: 2 }}>

        {value}

      </ScaledText>

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1 },

  scroll: { flex: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  heroWrap: { position: 'relative' },

  heroImg: { width: '100%', height: 240 },

  fab: {

    position: 'absolute',

    left: space.lg,

    width: 40,

    height: 40,

    borderRadius: 20,

    alignItems: 'center',

    justifyContent: 'center',

  },

  fabRight: {

    position: 'absolute',

    right: space.lg,

    width: 40,

    height: 40,

    borderRadius: 20,

    alignItems: 'center',

    justifyContent: 'center',

  },

  body: { padding: space.lg },

  badge: {

    alignSelf: 'flex-start',

    paddingHorizontal: space.md,

    paddingVertical: 4,

    borderRadius: radius.pill,

  },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },

  ratingPill: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill, marginRight: 4 },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: space.md },

  statsRow: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, marginBottom: space.lg },

  stat: {

    flex: 1,

    borderRadius: radius.lg,

    padding: space.md,

    alignItems: 'center',

  },

  progressChip: {

    alignSelf: 'flex-start',

    paddingHorizontal: space.md,

    paddingVertical: space.sm,

    borderRadius: radius.pill,

    marginBottom: space.md,

  },

  lessonsHead: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: space.md,

  },

  lessonRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: space.md,

    borderWidth: 1,

    borderRadius: radius.xl,

    padding: space.md,

    marginBottom: space.sm,

  },

  lessonNum: {

    width: 36,

    height: 36,

    borderRadius: 18,

    alignItems: 'center',

    justifyContent: 'center',

  },

});


