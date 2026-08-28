import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PagoConsignacionModal } from './PagoConsignacionModal';
import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { fetchEstadoConsignacionCurso, iniciarPagoEnLinea } from '../api/aulaApi';
import type { CursoVirtual, EstadoConsignacionCurso, EstadoInscripcionVirtual } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { hintMatricula, hintMatriculado, hintPagoEnLinea, fmtPrecioColombia } from '../utils/cursoPrecio';
import {
  esPagoBloqueado,
  modoPagoInscripcion,
  montoPagoCurso,
  pagoPendiente,
  puedeMostrarPagoWompi,
} from '../utils/pagoVirtual';
import { shadow } from '../theme/shadows';
import { space } from '../theme/spacing';

type Props = {
  curso: CursoVirtual;
  inscripcion?: EstadoInscripcionVirtual | null;
  signedIn: boolean;
  pasarelaActiva: boolean;
  puedeEntrar: boolean;
  matriculado: boolean;
  busyMatricula: boolean;
  onMatricular: () => void;
  onContinuar: () => void;
  onRegistro: () => void;
  onLogin: () => void;
  onPagoIniciado?: () => void;
  compact?: boolean;
};

export function CursoAcciones({
  curso,
  inscripcion,
  signedIn,
  pasarelaActiva,
  puedeEntrar,
  matriculado,
  busyMatricula,
  onMatricular,
  onContinuar,
  onRegistro,
  onLogin,
  onPagoIniciado,
  compact,
}: Props) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [pagando, setPagando] = useState(false);
  const [consignacion, setConsignacion] = useState<EstadoConsignacionCurso | null>(null);
  const [consignacionOpen, setConsignacionOpen] = useState(false);

  const ins = inscripcion ?? null;
  const modo = ins ? modoPagoInscripcion(ins, curso) : 'sin_deuda';
  const mostrarWompi = ins ? puedeMostrarPagoWompi(ins, curso, pasarelaActiva) : false;
  const mostrarConsignacion = !!(
    ins &&
    pagoPendiente(ins) &&
    consignacion?.consignacionActiva &&
    consignacion.puedeEnviarSolicitud
  );

  useEffect(() => {
    if (!signedIn || !matriculado || !ins || ins.pago?.pagado) {
      setConsignacion(null);
      return;
    }
    let cancelled = false;
    void fetchEstadoConsignacionCurso(curso.idPrograma)
      .then((st) => {
        if (!cancelled) setConsignacion(st);
      })
      .catch(() => {
        if (!cancelled) setConsignacion(null);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, matriculado, ins, curso.idPrograma]);

  async function onPagarEnLinea() {
    if (pagando) return;
    if (!pasarelaActiva) {
      Alert.alert(
        'Pago en línea',
        'Los pagos en línea no están activos en este momento. Acérquese al CEA o use consignación si está disponible.',
      );
      return;
    }
    setPagando(true);
    try {
      const res = await iniciarPagoEnLinea(curso.idPrograma);
      if (!res.checkoutUrl?.trim()) {
        throw new Error('No se pudo iniciar el pago en línea.');
      }
      onPagoIniciado?.();
      nav.navigate('PagoCheckout', {
        url: res.checkoutUrl.trim(),
        titulo: curso.nombreProg,
        idPrograma: String(curso.idPrograma),
      });
    } catch (e) {
      Alert.alert('Pago en línea', e instanceof Error ? e.message : 'No se pudo iniciar el pago.');
    } finally {
      setPagando(false);
    }
  }

  let hint = '';
  if (!signedIn) {
    hint = hintMatricula(curso);
  } else if (matriculado && ins) {
    hint = hintMatriculado(ins, pasarelaActiva);
    if ((mostrarWompi || mostrarConsignacion) && modo !== 'pagado') {
      hint = `${hint} ${hintPagoEnLinea(esPagoBloqueado(ins, curso) ? 'bloqueado' : 'opcional')}`;
    }
  } else {
    hint = hintMatricula(curso);
  }

  const solicitud = consignacion?.solicitud;

  return (
    <>
      <View
        style={[
          styles.wrap,
          !compact && shadow.lg,
          {
            backgroundColor: c.card,
            borderTopColor: c.border,
            paddingBottom: compact ? 0 : Math.max(insets.bottom, space.md),
          },
        ]}
      >
        {hint ? (
          <ScaledText baseSize={12} style={{ color: c.textSoft, textAlign: 'center', lineHeight: 18, marginBottom: space.sm }}>
            {hint}
          </ScaledText>
        ) : null}

        {solicitud?.estado === 'pendiente' ? (
          <ScaledText baseSize={12} style={{ color: c.primary, textAlign: 'center', marginBottom: space.sm }}>
            {consignacion?.textos?.mensajeEnRevision ||
              'Recibimos su comprobante. Un administrador lo revisará pronto.'}
          </ScaledText>
        ) : null}
        {solicitud?.estado === 'rechazada' ? (
          <ScaledText baseSize={12} style={{ color: c.warn, textAlign: 'center', marginBottom: space.sm }}>
            {consignacion?.textos?.mensajeRechazado ||
              'Su comprobante no pudo ser verificado. Puede enviar una nueva solicitud.'}
          </ScaledText>
        ) : null}

        {!signedIn ? (
          <View style={styles.stack}>
            <PrimaryButton label="Registrarse e inscribirse" onPress={onRegistro} fullWidth size="lg" icon="person-add-outline" />
            <PrimaryButton label="Ya tengo cuenta" variant="ghost" onPress={onLogin} fullWidth />
          </View>
        ) : !matriculado ? (
          <PrimaryButton
            label={
              curso.tarifaVirtual > 0
                ? `Matricularme — ${fmtPrecioColombia(curso.tarifaVirtual)}`
                : 'Matricularme gratis'
            }
            onPress={onMatricular}
            loading={busyMatricula}
            icon="school-outline"
            fullWidth
            size="lg"
          />
        ) : (
          <View style={styles.stack}>
            {mostrarWompi ? (
              <PrimaryButton
                label={pagando ? 'Abriendo pasarela…' : 'Pagar en línea (Wompi)'}
                onPress={() => void onPagarEnLinea()}
                loading={pagando}
                icon="card-outline"
                fullWidth
                size="lg"
              />
            ) : null}
            {mostrarConsignacion ? (
              <PrimaryButton
                label="Pagar por consignación (QR)"
                onPress={() => setConsignacionOpen(true)}
                icon="qr-code-outline"
                fullWidth
                variant={mostrarWompi ? 'secondary' : 'primary'}
                size="lg"
              />
            ) : null}
            {puedeEntrar ? (
              <PrimaryButton
                label="Entrar al curso"
                onPress={onContinuar}
                icon="play"
                fullWidth
                size="lg"
                variant={mostrarWompi || mostrarConsignacion ? 'secondary' : 'primary'}
              />
            ) : null}
            {matriculado && !puedeEntrar && !mostrarWompi && !mostrarConsignacion ? (
              <PrimaryButton
                label="Ver estado de matrícula"
                onPress={() =>
                  Alert.alert(
                    'Matrícula',
                    ins ? hintMatriculado(ins, pasarelaActiva) : 'Consulte con el CEA el estado de su matrícula.',
                  )
                }
                variant="secondary"
                fullWidth
                icon="information-circle-outline"
              />
            ) : null}
          </View>
        )}
      </View>

      {consignacion && ins ? (
        <PagoConsignacionModal
          visible={consignacionOpen}
          onClose={() => setConsignacionOpen(false)}
          idPrograma={curso.idPrograma}
          tituloCurso={curso.nombreProg}
          monto={montoPagoCurso(ins, curso)}
          estado={consignacion}
          onEnviado={() => {
            onPagoIniciado?.();
            void fetchEstadoConsignacionCurso(curso.idPrograma).then(setConsignacion).catch(() => {});
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  stack: { gap: space.sm },
});
