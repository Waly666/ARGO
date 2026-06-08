import React, { useCallback, useMemo, useState } from 'react';
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
import { crearLiquidacion, listarLiquidacionAlumno } from '../../api/liquidacionApi';
import { crearIngreso, listarIngresosAlumno, reciboIngresoHtmlPath } from '../../api/ingresosApi';
import { crearMatricula } from '../../api/matriculasApi';
import { listarProgramas } from '../../api/programasApi';
import { listarServicios } from '../../api/serviciosApi';
import { emitirFactura, facturaHtmlPath, listarElegiblesFe, listarFacturasAlumno } from '../../api/facturacionApi';
import { listarCertificadosAlumno } from '../../api/certificadosApi';
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
  filtrarProgramasBusqueda,
  idPrograma,
  labelPrograma,
  permiteCantidadServicio,
  programasParaMatricula,
  serviciosAdicionalesLista,
  valorServicioAdicional,
  type TarifaMatricula,
} from '../../utils/matricula';

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
  const { numDoc, nombre } = route.params;
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

  const load = useCallback(async () => {
    setLoading(true);
    setCertErr(null);
    try {
      const [liq, ing, progs, servs, eleg, fac] = await Promise.all([
        listarLiquidacionAlumno(numDoc),
        listarIngresosAlumno(numDoc),
        listarProgramas({ catalogo: true }),
        listarServicios({ catalogo: true }),
        listarElegiblesFe(numDoc).catch(() => []),
        listarFacturasAlumno(numDoc).catch(() => []),
      ]);
      setLiquidacion(liq.items);
      setTotales({ saldo: liq.totales?.saldo ?? 0 });
      setPagos(ing);
      setProgramas(progs);
      setServicios(servs);
      setElegiblesFe(eleg.map((e) => e._id));
      setFacturas(fac);

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
  const valorMatricula = useMemo(
    () => calcularValorMatricula(programaSel, servicios, tarifa),
    [programaSel, servicios, tarifa],
  );
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
  const totalPago = itemsPago.reduce((a, i) => a + (Number(i.valor) || 0), 0);

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
    const excede = validos.find((i) => i.valor > i.saldo + 0.0001);
    if (excede) {
      Alert.alert('Pagos', `El valor de «${excede.descripcion}» excede el saldo pendiente.`);
      return;
    }
    setBusy(true);
    try {
      const ing = await crearIngreso({
        numDoc,
        items: validos.map((i) => ({ idLiquidacion: i.idLiquidacion, valor: i.valor })),
        idTipoPago: '1',
      });
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
      await load();
      setTab('comprobantes');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo registrar el pago');
    } finally {
      setBusy(false);
    }
  }

  function seleccionarPrograma(p: ProgramaItem) {
    const id = idPrograma(p);
    setProgSelId(id);
    setTarifa(1);
  }

  async function crearMatriculaPrograma() {
    if (!programaSel || !progSelId) {
      Alert.alert('Matrícula', 'Seleccione un programa.');
      return;
    }
    const valor = valorMatricula;
    Alert.alert(
      'Crear matrícula',
      `${labelPrograma(programaSel)}\nTarifa ${tarifa}\nValor: ${valor.toLocaleString('es-CO')}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Matricular',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await crearMatricula({ numDoc, idPrograma: progSelId, tarifa });
                const avisoCea = esProgramaCea(programaSel)
                  ? ' Programe las horas CEA en el módulo de programación.'
                  : '';
                Alert.alert('Listo', `Matrícula creada. Revise la pestaña Pagos.${avisoCea}`);
                setProgSelId('');
                setProgBusqueda('');
                setTarifa(1);
                await load();
                setTab('pagos');
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo matricular');
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
        <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800' }}>{nombre}</ScaledText>
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 4 }}>Documento {numDoc}</ScaledText>
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
              {itemsPago.map((it) => (
                <SurfaceCard key={it.idLiquidacion} elevated={false} style={{ padding: 12, gap: 8 }}>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>{it.descripcion}</ScaledText>
                  <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                    Saldo: {it.saldo.toLocaleString('es-CO')}
                  </ScaledText>
                  <View style={styles.valorRow}>
                    <TextInput
                      value={valorItemInput(it)}
                      onChangeText={(t) => setValorItem(it.idLiquidacion, t)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      style={[
                        styles.valorInput,
                        { borderColor: c.border, backgroundColor: c.card, color: c.text },
                      ]}
                    />
                    <Pressable
                      onPress={() => pagarSaldoCompleto(it.idLiquidacion)}
                      style={[styles.totalBtn, { borderColor: c.primary, backgroundColor: c.accentSoft }]}
                    >
                      <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>Total</ScaledText>
                    </Pressable>
                  </View>
                  {it.valor > 0 ? (
                    <ScaledText
                      baseSize={12}
                      style={{ color: esAbonoParcial(it) ? c.warn : c.ok, fontWeight: '600' }}
                    >
                      {esAbonoParcial(it) ? 'Abono parcial' : 'Pago total del ítem'}
                    </ScaledText>
                  ) : null}
                </SurfaceCard>
              ))}
              <ScaledText baseSize={14} style={{ color: c.textSoft }}>
                Total comprobante: {totalPago.toLocaleString('es-CO')} (efectivo)
              </ScaledText>
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
              <View style={styles.tarifaRow}>
                {([1, 2, 3] as TarifaMatricula[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTarifa(t)}
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
                      Tarifa {t}
                    </ScaledText>
                  </Pressable>
                ))}
              </View>
              <View style={styles.valorMatRow}>
                <ScaledText baseSize={13} style={{ color: c.textSoft }}>Valor matrícula</ScaledText>
                <MoneyText value={valorMatricula} baseSize={16} style={{ color: c.primary }} bold />
              </View>
              <PrimaryButton
                label="Crear matrícula"
                icon="school-outline"
                onPress={() => void crearMatriculaPrograma()}
                disabled={busy}
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
