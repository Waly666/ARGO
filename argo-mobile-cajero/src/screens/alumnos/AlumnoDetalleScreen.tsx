import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { SearchField } from '../../components/SearchField';
import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { ScaledText } from '../../components/ScaledText';
import { MoneyText } from '../../components/MoneyText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VerDocumentoButton } from '../../components/VerDocumentoButton';
import { CertificadoFila } from '../../components/CertificadoFila';
import {
  PagoCobroFields,
  pagoCobroStateInicial,
  validarEstadoPago,
  type PagoCobroState,
} from '../../components/PagoCobroFields';
import { fetchTiposPago } from '../../api/catalogosApi';
import { fetchAlumnoPorDoc } from '../../api/alumnosApi';
import { crearLiquidacion, listarLiquidacionAlumno } from '../../api/liquidacionApi';
import { crearIngreso, listarIngresosAlumno, reciboIngresoHtmlPath } from '../../api/ingresosApi';
import { crearMatricula } from '../../api/matriculasApi';
import { listarProgramas } from '../../api/programasApi';
import { listarServicios } from '../../api/serviciosApi';
import { emitirFactura, facturaHtmlPath, listarElegiblesFe, listarFacturasAlumno } from '../../api/facturacionApi';
import { listarCertificadosAlumno } from '../../api/certificadosApi';
import { previewMatriculaExtras, type PreviewServicioAdicionalItem } from '../../api/configApi';
import type {
  CertificadoItem,
  FacturaElectronicaItem,
  IngresoRow,
  LiquidacionItem,
  ProgramaItem,
  ServicioItem,
} from '../../api/domain';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  calcularValorMatricula,
  descrConCantidad,
  esProgramaCea,
  esProgramaSoloVirtual,
  etiquetaTarifa,
  filtrarProgramasBusqueda,
  idPrograma,
  labelPrograma,
  permiteCantidadServicio,
  programasParaMatricula,
  serviciosAdicionalesLista,
  serviciosPrograma,
  tarifasPermitidasPrograma,
  valorServicioAdicional,
  TARIFA_VIRTUAL,
  type TarifaMatricula,
} from '../../utils/matricula';
import {
  esLiquidacionVirtual,
  mensajeErrorApi,
} from '../../utils/pago';
import { nombreCompleto } from '../../utils/format';

type Tab = 'pagos' | 'servicios' | 'comprobantes' | 'certificados';

type ItemPagoSel = {
  idLiquidacion: string;
  descripcion: string;
  saldo: number;
  valor: number;
  valorText?: string;
};

function valorItemInput(it: ItemPagoSel): string {
  if (it.valorText != null) return it.valorText;
  if (!(it.valor > 0)) return '';
  return String(Math.round(it.valor));
}

function esAbonoParcial(it: ItemPagoSel): boolean {
  return it.valor > 0 && it.valor < it.saldo - 0.0001;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'pagos', label: 'Pagos' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'comprobantes', label: 'Recibos y FE' },
  { id: 'certificados', label: 'Certificados' },
];

export default function AlumnoDetalleScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AlumnoDetalle'>>();
  const { numDoc, nombre: nombreRoute } = route.params;
  const [alumnoId, setAlumnoId] = useState(route.params.alumnoId ?? '');
  const [displayNombre, setDisplayNombre] = useState(nombreRoute);
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [tab, setTab] = useState<Tab>('pagos');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [liquidacion, setLiquidacion] = useState<LiquidacionItem[]>([]);
  const [totales, setTotales] = useState({ saldo: 0 });
  const [pagos, setPagos] = useState<IngresoRow[]>([]);
  const [facturas, setFacturas] = useState<FacturaElectronicaItem[]>([]);
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);
  const [certErr, setCertErr] = useState<string | null>(null);
  const [itemsPago, setItemsPago] = useState<ItemPagoSel[]>([]);
  const [programas, setProgramas] = useState<ProgramaItem[]>([]);
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [elegiblesFe, setElegiblesFe] = useState<string[]>([]);
  const [progBusqueda, setProgBusqueda] = useState('');
  const [progSelId, setProgSelId] = useState('');
  const [tarifa, setTarifa] = useState<TarifaMatricula>(1);
  const [servBusqueda, setServBusqueda] = useState('');
  const [servSelId, setServSelId] = useState('');
  const [servCantidad, setServCantidad] = useState('1');
  const [servValorManual, setServValorManual] = useState('');
  const [extrasMatricula, setExtrasMatricula] = useState<PreviewServicioAdicionalItem[]>([]);
  const [pagoCobro, setPagoCobro] = useState<PagoCobroState>(() => pagoCobroStateInicial());
  const [tiposPago, setTiposPago] = useState<Awaited<ReturnType<typeof fetchTiposPago>>>([]);
  const [alumnoCorreo, setAlumnoCorreo] = useState('');
  const [matriculaEmailPortal, setMatriculaEmailPortal] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setCertErr(null);
    try {
      const [liq, ing, progs, servs, eleg, fac, alumno, tipos] = await Promise.all([
        listarLiquidacionAlumno(numDoc),
        listarIngresosAlumno(numDoc),
        listarProgramas({ catalogo: true }),
        listarServicios({ catalogo: true }),
        listarElegiblesFe(numDoc).catch(() => []),
        listarFacturasAlumno(numDoc).catch(() => []),
        fetchAlumnoPorDoc(numDoc).catch(() => null),
        fetchTiposPago().catch(() => []),
      ]);
      setLiquidacion(liq.items);
      setTotales({ saldo: liq.totales?.saldo ?? 0 });
      setPagos(ing);
      setProgramas(progs);
      setServicios(servs);
      setElegiblesFe(eleg.map((e) => e._id));
      setFacturas(fac);
      setAlumnoCorreo(String(alumno?.correo || '').trim());
      if (alumno?._id) setAlumnoId(alumno._id);
      if (alumno) {
        const nc = nombreCompleto(alumno);
        if (nc) {
          setDisplayNombre(nc);
          nav.setOptions({ title: nc });
        }
      }
      setTiposPago(tipos);

      try {
        const certs = await listarCertificadosAlumno(numDoc);
        setCertificados(certs);
      } catch (e) {
        setCertificados([]);
        setCertErr(e instanceof Error ? e.message : 'Sin acceso a certificados');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, [numDoc]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const programasMat = useMemo(() => programasParaMatricula(programas), [programas]);
  const programasFiltrados = useMemo(
    () => filtrarProgramasBusqueda(programasMat, progBusqueda),
    [programasMat, progBusqueda],
  );
  const programaSel = useMemo(
    () => programasMat.find((p) => idPrograma(p) === progSelId) ?? null,
    [programasMat, progSelId],
  );
  const serviciosProgSel = useMemo(
    () => serviciosPrograma(programaSel, servicios),
    [programaSel, servicios],
  );
  const tarifasPermitidas = useMemo(
    () => (programaSel ? tarifasPermitidasPrograma(programaSel, serviciosProgSel) : [1, 2, 3]),
    [programaSel, serviciosProgSel],
  );
  const programaSoloVirtual = useMemo(
    () => esProgramaSoloVirtual(programaSel, serviciosProgSel),
    [programaSel, serviciosProgSel],
  );
  const esTarifaVirtualSel = tarifa === TARIFA_VIRTUAL;
  const valorMatricula = useMemo(
    () => calcularValorMatricula(programaSel, servicios, tarifa),
    [programaSel, servicios, tarifa],
  );
  const totalExtrasMatricula = useMemo(
    () => extrasMatricula.reduce((a, i) => a + (Number(i.valor) || 0), 0),
    [extrasMatricula],
  );
  const valorMatriculaTotal = valorMatricula + totalExtrasMatricula;

  useEffect(() => {
    const idP = programaSel ? idPrograma(programaSel) : '';
    if (!idP) {
      setExtrasMatricula([]);
      return;
    }
    let cancel = false;
    previewMatriculaExtras(idP, tarifa)
      .then((r) => {
        if (!cancel) setExtrasMatricula(r.items || []);
      })
      .catch(() => {
        if (!cancel) setExtrasMatricula([]);
      });
    return () => {
      cancel = true;
    };
  }, [programaSel, tarifa]);
  const serviciosAdicionales = useMemo(() => serviciosAdicionalesLista(servicios), [servicios]);
  const serviciosFiltrados = useMemo(() => {
    const t = servBusqueda.trim().toLowerCase();
    if (!t) return serviciosAdicionales;
    return serviciosAdicionales.filter((s) =>
      String(s.descrServicio || s.descripcion || '')
        .toLowerCase()
        .includes(t),
    );
  }, [serviciosAdicionales, servBusqueda]);
  const servicioSel = useMemo(
    () =>
      serviciosAdicionales.find((s) => String(s.idServ ?? s._id) === servSelId) ?? null,
    [serviciosAdicionales, servSelId],
  );
  const servUsaCantidad = permiteCantidadServicio(servicioSel);
  const servValorTotal = valorServicioAdicional(
    servicioSel,
    Number(servCantidad.replace(/[^\d]/g, '') || '1'),
    Number(servValorManual.replace(/[^\d]/g, '') || '0'),
  );

  const pendientes = liquidacion.filter((i) => (Number(i.saldo) || 0) > 0);
  const subtotalPago = itemsPago.reduce((a, i) => a + (Number(i.valor) || 0), 0);
  const totalPago = subtotalPago + (pagoCobro.totalExtras || 0);
  const idsLiquidacionPago = itemsPago.map((i) => i.idLiquidacion);

  function liquidacionPorId(id: string): LiquidacionItem | undefined {
    return liquidacion.find((i) => i._id === id);
  }

  function patchPagoCobro(patch: Partial<PagoCobroState>) {
    setPagoCobro((s) => ({ ...s, ...patch }));
  }

  function itemSeleccionado(id: string): boolean {
    return itemsPago.some((x) => x.idLiquidacion === id);
  }

  function toggleItem(item: LiquidacionItem) {
    const id = item._id;
    setItemsPago((arr) => {
      if (arr.some((x) => x.idLiquidacion === id)) {
        return arr.filter((x) => x.idLiquidacion !== id);
      }
      const saldo = Number(item.saldo) || 0;
      return [
        ...arr,
        {
          idLiquidacion: id,
          descripcion: item.descripcion || 'Servicio',
          saldo,
          valor: saldo,
        },
      ];
    });
  }

  function setValorItem(idLiq: string, val: string) {
    const liq = liquidacionPorId(idLiq);
    if (liq && esLiquidacionVirtual(liq)) {
      pagarSaldoCompleto(idLiq);
      return;
    }
    const raw = val.replace(/[^\d]/g, '');
    const n = raw === '' ? 0 : Number(raw);
    setItemsPago((arr) =>
      arr.map((x) => {
        if (x.idLiquidacion !== idLiq) return x;
        const valor = raw === '' ? 0 : Math.max(0, Math.min(n, x.saldo));
        return { ...x, valor, valorText: raw };
      }),
    );
  }

  function pagarSaldoCompleto(idLiq: string) {
    setItemsPago((arr) =>
      arr.map((x) =>
        x.idLiquidacion === idLiq ? { ...x, valor: x.saldo, valorText: undefined } : x,
      ),
    );
  }

  async function registrarPago() {
    const validos = itemsPago.filter((i) => i.valor > 0);
    if (!validos.length) {
      Alert.alert('Pagos', 'Seleccione ítems e indique un valor mayor a cero.');
      return;
    }
    for (const i of validos) {
      const liq = liquidacionPorId(i.idLiquidacion);
      if (liq && esLiquidacionVirtual(liq) && Math.abs(i.valor - i.saldo) > 0.0001) {
        Alert.alert(
          'Matrícula virtual',
          `«${i.descripcion}» debe pagarse en su totalidad (${Math.round(i.saldo).toLocaleString('es-CO')} COP).`,
        );
        return;
      }
    }
    const excede = validos.find((i) => i.valor > i.saldo + 0.0001);
    if (excede) {
      Alert.alert('Pagos', `El valor de «${excede.descripcion}» excede el saldo pendiente.`);
      return;
    }
    const valPago = validarEstadoPago(pagoCobro, tiposPago);
    if (!valPago.ok) {
      Alert.alert('Pagos', valPago.message ?? 'Complete los datos del pago.');
      return;
    }
    setBusy(true);
    try {
      const ing = await crearIngreso(
        {
          numDoc,
          items: validos.map((i) => ({ idLiquidacion: i.idLiquidacion, valor: i.valor })),
          idTipoPago: pagoCobro.idTipoPago,
          idCuentaBancaria: pagoCobro.idCuentaBancaria || undefined,
          numComprobante: pagoCobro.numComprobante.trim() || undefined,
          observaciones: pagoCobro.observaciones.trim() || undefined,
        },
        pagoCobro.soporte,
      );
      const num = ing.numRecibo ?? ing._id;
      Alert.alert('Pago registrado', `Recibo #${num}`, [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Imprimir recibo',
          onPress: () =>
            nav.navigate('DocumentoViewer', {
              title: `Recibo ${num}`,
              htmlPath: reciboIngresoHtmlPath(ing._id),
            }),
        },
      ]);
      setItemsPago([]);
      setPagoCobro(pagoCobroStateInicial());
      await load();
      setTab('comprobantes');
    } catch (e) {
      Alert.alert('Error', mensajeErrorApi(e));
    } finally {
      setBusy(false);
    }
  }

  function seleccionarPrograma(p: ProgramaItem) {
    const id = idPrograma(p);
    setProgSelId(id);
    const servsProg = serviciosPrograma(p, servicios);
    const permitidas = tarifasPermitidasPrograma(p, servsProg);
    setTarifa((permitidas[0] ?? 1) as TarifaMatricula);
    setMatriculaEmailPortal('');
  }

  async function crearMatriculaPrograma() {
    if (!programaSel || !progSelId) {
      Alert.alert('Matrícula', 'Seleccione un programa.');
      return;
    }
    if (programaSoloVirtual) {
      Alert.alert(
        'Solo portal',
        'Este programa es solo virtual. El alumno debe matricularse en el portal; usted puede cobrar cuando aparezca la liquidación.',
      );
      return;
    }
    if (esTarifaVirtualSel) {
      const email = matriculaEmailPortal.trim() || alumnoCorreo;
      if (!email) {
        Alert.alert('Matrícula virtual', 'Indique el correo del portal (usuario de acceso).');
        return;
      }
    }
    const valor = valorMatriculaTotal;
    Alert.alert(
      'Crear matrícula',
      `${labelPrograma(programaSel)}\n${etiquetaTarifa(tarifa)}\nValor: ${valor.toLocaleString('es-CO')}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Matricular',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                const email = matriculaEmailPortal.trim() || alumnoCorreo;
                await crearMatricula({
                  numDoc,
                  idPrograma: progSelId,
                  tarifa,
                  ...(esTarifaVirtualSel
                    ? { crearUsuarioPortal: true, email }
                    : {}),
                });
                const avisoCea = esProgramaCea(programaSel)
                  ? ' Programe las horas CEA en el módulo de programación.'
                  : '';
                Alert.alert('Listo', `Matrícula creada. Revise la pestaña Pagos.${avisoCea}`);
                setProgSelId('');
                setProgBusqueda('');
                setTarifa(1);
                setMatriculaEmailPortal('');
                await load();
                setTab('pagos');
              } catch (e) {
                Alert.alert('Error', mensajeErrorApi(e));
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  }

  function seleccionarServicioAdicional(s: ServicioItem) {
    const id = String(s.idServ ?? s._id ?? '');
    if (!id) return;
    setServSelId(id);
    setServCantidad('1');
    const sugerido = Number(s.tarifa1) || 0;
    setServValorManual(sugerido > 0 ? String(Math.round(sugerido)) : '');
  }

  async function agregarServicioAdicional() {
    if (!servicioSel || !servSelId) {
      Alert.alert('Servicio', 'Seleccione un servicio adicional.');
      return;
    }
    const cant = Math.max(1, Math.floor(Number(servCantidad.replace(/[^\d]/g, '') || '1')));
    const valor = servValorTotal;
    if (valor <= 0) {
      Alert.alert(
        'Servicio',
        servUsaCantidad
          ? 'Indique cantidad y verifique la tarifa unitaria.'
          : 'Indique el valor del servicio (mayor a cero).',
      );
      return;
    }
    const base = String(servicioSel.descrServicio || servicioSel.descripcion || '').trim();
    const descripcion = servUsaCantidad ? descrConCantidad(base, cant) : base;
    setBusy(true);
    try {
      await crearLiquidacion({
        numDoc,
        idServ: servSelId,
        descripcion: descripcion || undefined,
        valor,
        cantidad: servUsaCantidad ? cant : undefined,
      });
      Alert.alert('Listo', 'Servicio adicional agregado a la cuenta del alumno.');
      setServSelId('');
      setServBusqueda('');
      setServCantidad('1');
      setServValorManual('');
      await load();
      setTab('pagos');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo agregar');
    } finally {
      setBusy(false);
    }
  }

  async function emitirFacturaElegibles() {
    if (!elegiblesFe.length) {
      Alert.alert('Facturación', 'No hay ítems pagados elegibles para facturar.');
      return;
    }
    setBusy(true);
    try {
      const f = await emitirFactura({ numDoc, idLiquidaciones: elegiblesFe });
      const num = f.numeroFactura ?? 'Factura';
      Alert.alert('Factura emitida', num, [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Imprimir',
          onPress: () =>
            nav.navigate('DocumentoViewer', {
              title: `Factura ${num}`,
              htmlPath: facturaHtmlPath(f._id),
            }),
        },
      ]);
      await load();
      setTab('comprobantes');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo emitir factura');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenBody refreshing={loading} onRefresh={() => { setLoading(true); void load(); }}>
      <SurfaceCard style={{ marginBottom: 12 }}>
        <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800' }}>{displayNombre}</ScaledText>
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 4 }}>Documento {numDoc}</ScaledText>
        <PrimaryButton
          label="Editar datos del alumno"
          icon="create-outline"
          variant="ghost"
          onPress={() =>
            nav.navigate('AlumnoEditar', {
              alumnoId: alumnoId || undefined,
              numDoc,
              nombre: displayNombre,
            })
          }
          style={{ marginTop: 12 }}
          fullWidth
        />
        <View style={styles.saldoRow}>
          <ScaledText baseSize={14} style={{ color: c.textSoft }}>Saldo pendiente</ScaledText>
          <MoneyText value={totales.saldo} baseSize={18} style={{ color: c.warn }} bold />
        </View>
        {certificados.length > 0 ? (
          <ScaledText baseSize={13} style={{ color: c.ok, marginTop: 8, fontWeight: '600' }}>
            {certificados.length} certificado(s) emitido(s) — pestaña Certificados
          </ScaledText>
        ) : null}
      </SurfaceCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && { backgroundColor: c.primary }]}
          >
            <ScaledText baseSize={13} style={{ color: tab === t.id ? '#fff' : c.text, fontWeight: '700' }}>
              {t.label}
            </ScaledText>
          </Pressable>
        ))}
      </ScrollView>

      {tab === 'pagos' ? (
        <>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
            Cuenta por cobrar
          </ScaledText>
          {pendientes.length ? pendientes.map((item) => (
            <Pressable
              key={item._id}
              onPress={() => toggleItem(item)}
              style={[
                styles.itemRow,
                { borderColor: c.border, backgroundColor: itemSeleccionado(item._id) ? c.accentSoft : c.card },
              ]}
            >
              <Ionicons
                name={itemSeleccionado(item._id) ? 'checkbox' : 'square-outline'}
                size={22}
                color={c.primary}
              />
              <View style={{ flex: 1 }}>
                <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>{item.descripcion}</ScaledText>
                {esLiquidacionVirtual(item) ? (
                  <ScaledText baseSize={11} style={{ color: c.accent, fontWeight: '700', marginTop: 2 }}>
                    Matrícula virtual — pago total
                  </ScaledText>
                ) : null}
                <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                  Saldo pendiente
                </ScaledText>
                <MoneyText value={item.saldo} baseSize={14} style={{ color: c.primary, marginTop: 2 }} />
              </View>
            </Pressable>
          )) : (
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>Sin saldos pendientes.</ScaledText>
          )}
          {itemsPago.length ? (
            <View style={{ marginTop: 12, gap: 12 }}>
              <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700' }}>
                Valor a pagar
              </ScaledText>
              {itemsPago.map((it) => {
                const liq = liquidacionPorId(it.idLiquidacion);
                const virtual = liq ? esLiquidacionVirtual(liq) : false;
                return (
                <SurfaceCard key={it.idLiquidacion} elevated={false} style={{ padding: 12, gap: 8 }}>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>{it.descripcion}</ScaledText>
                  {virtual ? (
                    <ScaledText baseSize={11} style={{ color: c.accent, fontWeight: '700' }}>
                      Debe pagarse el saldo completo
                    </ScaledText>
                  ) : null}
                  <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                    Saldo: {it.saldo.toLocaleString('es-CO')}
                  </ScaledText>
                  <View style={styles.valorRow}>
                    <TextInput
                      value={valorItemInput(it)}
                      onChangeText={(t) => setValorItem(it.idLiquidacion, t)}
                      keyboardType="number-pad"
                      placeholder="0"
                      editable={!virtual}
                      placeholderTextColor="#94a3b8"
                      style={[
                        styles.valorInput,
                        { borderColor: c.border, backgroundColor: virtual ? c.bg : c.card, color: c.text },
                      ]}
                    />
                    {!virtual ? (
                    <Pressable
                      onPress={() => pagarSaldoCompleto(it.idLiquidacion)}
                      style={[styles.totalBtn, { borderColor: c.primary, backgroundColor: c.accentSoft }]}
                    >
                      <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>Total</ScaledText>
                    </Pressable>
                    ) : null}
                  </View>
                  {it.valor > 0 ? (
                    <ScaledText
                      baseSize={12}
                      style={{ color: esAbonoParcial(it) && !virtual ? c.warn : c.ok, fontWeight: '600' }}
                    >
                      {virtual || !esAbonoParcial(it) ? 'Pago total del ítem' : 'Abono parcial'}
                    </ScaledText>
                  ) : null}
                </SurfaceCard>
              );})}
              <PagoCobroFields
                idLiquidaciones={idsLiquidacionPago}
                subtotalItems={subtotalPago}
                value={pagoCobro}
                onChange={patchPagoCobro}
              />
              <PrimaryButton
                label="Registrar cobro"
                icon="cash-outline"
                onPress={() => void registrarPago()}
                disabled={busy || totalPago <= 0}
                fullWidth
              />
            </View>
          ) : null}
        </>
      ) : null}

      {tab === 'servicios' ? (
        <>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
            Crear matrícula
          </ScaledText>
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 8, lineHeight: 18 }}>
            Todos los programas activos excepto jornadas de capacitación (esas van en el módulo Jornadas).
          </ScaledText>
          <SearchField
            value={progBusqueda}
            onChangeText={setProgBusqueda}
            placeholder="Buscar programa por nombre o código…"
          />
          {programasFiltrados.length ? programasFiltrados.slice(0, 40).map((p) => {
            const id = idPrograma(p);
            const sel = progSelId === id;
            return (
              <Pressable
                key={id}
                onPress={() => seleccionarPrograma(p)}
                style={[
                  styles.itemRow,
                  { borderColor: c.border, backgroundColor: sel ? c.accentSoft : c.card },
                ]}
              >
                <Ionicons name={sel ? 'radio-button-on' : 'radio-button-off'} size={20} color={c.primary} />
                <View style={{ flex: 1 }}>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>
                    {labelPrograma(p)}
                  </ScaledText>
                </View>
              </Pressable>
            );
          }) : (
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
              No hay programas disponibles para matrícula.
            </ScaledText>
          )}
          {programaSel ? (
            <SurfaceCard style={{ marginTop: 10, marginBottom: 12, padding: 12, gap: 10 }} elevated={false}>
              <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700' }}>
                {labelPrograma(programaSel)}
              </ScaledText>
              {programaSoloVirtual ? (
                <ScaledText baseSize={13} style={{ color: c.warn, lineHeight: 18 }}>
                  Programa solo virtual: el alumno debe matricularse en el portal. Puede cobrar la liquidación en Pagos.
                </ScaledText>
              ) : null}
              <View style={styles.tarifaRow}>
                {tarifasPermitidas.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => {
                      setTarifa(t as TarifaMatricula);
                      if (t === TARIFA_VIRTUAL && !matriculaEmailPortal && alumnoCorreo) {
                        setMatriculaEmailPortal(alumnoCorreo);
                      }
                    }}
                    style={[
                      styles.tarifaChip,
                      {
                        borderColor: c.primary,
                        backgroundColor: tarifa === t ? c.primary : c.card,
                      },
                    ]}
                  >
                    <ScaledText
                      baseSize={13}
                      style={{ color: tarifa === t ? '#fff' : c.primary, fontWeight: '700' }}
                    >
                      {etiquetaTarifa(t)}
                    </ScaledText>
                  </Pressable>
                ))}
              </View>
              {esTarifaVirtualSel && !programaSoloVirtual ? (
                <>
                  <ScaledText baseSize={13} style={{ color: c.textSoft }}>
                    Correo portal (acceso aula virtual)
                  </ScaledText>
                  <TextInput
                    value={matriculaEmailPortal}
                    onChangeText={setMatriculaEmailPortal}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder={alumnoCorreo || 'correo@ejemplo.com'}
                    placeholderTextColor="#94a3b8"
                    style={[styles.valorInput, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
                  />
                </>
              ) : null}
              <View style={styles.valorMatRow}>
                <ScaledText baseSize={13} style={{ color: c.textSoft }}>Valor matrícula</ScaledText>
                <MoneyText value={valorMatriculaTotal} baseSize={16} style={{ color: c.primary }} bold />
              </View>
              {extrasMatricula.length ? (
                <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                  {extrasMatricula.map((ex) => `${ex.descripcion}: ${Number(ex.valor).toLocaleString('es-CO')}`).join(' · ')}
                </ScaledText>
              ) : null}
              <PrimaryButton
                label="Crear matrícula"
                icon="school-outline"
                onPress={() => void crearMatriculaPrograma()}
                disabled={busy || programaSoloVirtual}
                fullWidth
              />
            </SurfaceCard>
          ) : null}

          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginTop: 8, marginBottom: 8 }}>
            Agregar servicio adicional
          </ScaledText>
          <SearchField
            value={servBusqueda}
            onChangeText={setServBusqueda}
            placeholder="Buscar servicio adicional…"
          />
          {serviciosFiltrados.length ? serviciosFiltrados.slice(0, 30).map((s) => {
            const id = String(s.idServ ?? s._id);
            const sel = servSelId === id;
            return (
              <Pressable
                key={id}
                onPress={() => seleccionarServicioAdicional(s)}
                style={[
                  styles.itemRow,
                  { borderColor: c.border, backgroundColor: sel ? c.accentSoft : c.card },
                ]}
              >
                <Ionicons name={sel ? 'radio-button-on' : 'radio-button-off'} size={20} color={c.accent} />
                <View style={{ flex: 1 }}>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>
                    {s.descrServicio || s.descripcion}
                  </ScaledText>
                  {Number(s.tarifa1) > 0 ? (
                    <MoneyText value={s.tarifa1} baseSize={13} style={{ color: c.textSoft, marginTop: 2 }} />
                  ) : (
                    <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                      Valor variable
                    </ScaledText>
                  )}
                </View>
              </Pressable>
            );
          }) : (
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
              Sin servicios adicionales.
            </ScaledText>
          )}
          {servicioSel ? (
            <SurfaceCard style={{ marginTop: 10, padding: 12, gap: 10 }} elevated={false}>
              {servUsaCantidad ? (
                <>
                  <ScaledText baseSize={13} style={{ color: c.textSoft }}>
                    {/\bhoras?\b.*\bpractic/i.test(String(servicioSel.descrServicio || ''))
                      ? 'Cantidad (horas)'
                      : 'Cantidad'}
                  </ScaledText>
                  <TextInput
                    value={servCantidad}
                    onChangeText={(t) => setServCantidad(t.replace(/[^\d]/g, ''))}
                    keyboardType="number-pad"
                    style={[styles.valorInput, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
                  />
                  <View style={styles.valorMatRow}>
                    <ScaledText baseSize={13} style={{ color: c.textSoft }}>Valor total</ScaledText>
                    <MoneyText value={servValorTotal} baseSize={16} style={{ color: c.primary }} bold />
                  </View>
                </>
              ) : (
                <>
                  <ScaledText baseSize={13} style={{ color: c.textSoft }}>Valor a cobrar</ScaledText>
                  <TextInput
                    value={servValorManual}
                    onChangeText={(t) => setServValorManual(t.replace(/[^\d]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    style={[styles.valorInput, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
                  />
                </>
              )}
              <PrimaryButton
                label="Agregar servicio"
                icon="construct-outline"
                onPress={() => void agregarServicioAdicional()}
                disabled={busy || servValorTotal <= 0}
                fullWidth
              />
            </SurfaceCard>
          ) : null}
        </>
      ) : null}

      {tab === 'comprobantes' ? (
        <>
          {elegiblesFe.length ? (
            <View style={{ marginBottom: 14 }}>
              <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 8 }}>
                {elegiblesFe.length} ítem(s) listo(s) para factura electrónica
              </ScaledText>
              <PrimaryButton
                label="Emitir factura"
                icon="receipt-outline"
                onPress={() => void emitirFacturaElegibles()}
                disabled={busy}
                fullWidth
              />
            </View>
          ) : null}

          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
            Recibos de pago
          </ScaledText>
          {pagos.length ? pagos.map((p) => (
            <View key={p._id} style={[styles.itemRow, { borderColor: c.border, backgroundColor: c.card }]}>
              <View style={{ flex: 1 }}>
                <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>
                  Recibo #{p.numRecibo ?? '—'}
                </ScaledText>
                <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
                  {p.fecha ? new Date(p.fecha).toLocaleString('es-CO') : ''} · {p.tipoPagoDescr ?? p.formaPago}
                </ScaledText>
                <MoneyText value={p.valor} baseSize={14} style={{ color: c.ok, marginTop: 4 }} bold />
              </View>
              <VerDocumentoButton
                titulo={`Recibo ${p.numRecibo ?? p._id}`}
                htmlPath={reciboIngresoHtmlPath(p._id)}
              />
            </View>
          )) : (
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 16 }}>Sin recibos de pago.</ScaledText>
          )}

          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 8, marginTop: 8 }}>
            Facturas electrónicas
          </ScaledText>
          {facturas.length ? facturas.map((f) => (
            <View key={f._id} style={[styles.itemRow, { borderColor: c.border, backgroundColor: c.card }]}>
              <View style={{ flex: 1 }}>
                <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>
                  {f.numeroFactura ?? 'Factura'}
                </ScaledText>
                <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
                  {f.estado ?? '—'}
                  {f.emitidaAt ? ` · ${new Date(f.emitidaAt).toLocaleDateString('es-CO')}` : ''}
                </ScaledText>
                <MoneyText value={f.valorTotal} baseSize={14} style={{ color: c.primary, marginTop: 4 }} bold />
              </View>
              <VerDocumentoButton
                titulo={`Factura ${f.numeroFactura ?? f._id}`}
                htmlPath={facturaHtmlPath(f._id)}
              />
            </View>
          )) : (
            <ScaledText baseSize={14} style={{ color: c.textSoft }}>Sin facturas emitidas para este alumno.</ScaledText>
          )}
        </>
      ) : null}

      {tab === 'certificados' ? (
        <>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
            Certificados expedidos
          </ScaledText>
          {certErr && !certificados.length ? (
            <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 20, marginBottom: 12 }}>
              {certErr}. Se requiere permiso de certificados en el rol del usuario.
            </ScaledText>
          ) : null}
          {certificados.length ? certificados.map((cert) => (
            <CertificadoFila key={cert._id} cert={cert} />
          )) : !certErr ? (
            <ScaledText baseSize={14} style={{ color: c.textSoft }}>Sin certificados expedidos.</ScaledText>
          ) : null}
        </>
      ) : null}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  saldoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14, paddingRight: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#e2e8f0' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  valorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valorInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  totalBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tarifaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tarifaChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  valorMatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
