import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconInput } from './IconInput';
import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { enviarSolicitudConsignacion } from '../api/aulaApi';
import type {
  EstadoConsignacionCurso,
  MedioPagoConsignacionPublico,
} from '../api/types';
import { fmtPrecioColombia } from '../utils/cursoPrecio';
import { resolveUploadUrl } from '../utils/uploadUrl';
import { radius, space } from '../theme/spacing';

/** QR grande para escanear cómodo desde otra app de banco. */
const QR_SIZE = Math.min(Dimensions.get('window').width - 48, 340);

type Props = {
  visible: boolean;
  onClose: () => void;
  idPrograma: string | number;
  tituloCurso: string;
  monto: number;
  estado: EstadoConsignacionCurso;
  onEnviado: () => void;
};

function iconoMedio(etiqueta?: string | null): string {
  const t = String(etiqueta || '').toLowerCase();
  if (t.includes('nequi')) return 'N';
  if (t.includes('davi')) return 'D';
  if (t.includes('bancolombia') || t.includes('banco')) return 'B';
  if (t.includes('pse')) return 'P';
  return '$';
}

function texto(estado: EstadoConsignacionCurso, clave: keyof NonNullable<EstadoConsignacionCurso['textos']>, fb: string) {
  return estado.textos?.[clave] || fb;
}

export function PagoConsignacionModal({
  visible,
  onClose,
  idPrograma,
  tituloCurso,
  monto,
  estado,
  onEnviado,
}: Props) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [medio, setMedio] = useState<MedioPagoConsignacionPublico | null>(null);
  const [referencia, setReferencia] = useState('');
  const [comprobante, setComprobante] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [err, setErr] = useState('');

  function reset() {
    setMedio(null);
    setReferencia('');
    setComprobante(null);
    setErr('');
  }

  function cerrar() {
    reset();
    onClose();
  }

  async function elegirImagen() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr('Se necesita permiso para acceder a la galería.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      setComprobante(res.assets[0]);
      setErr('');
    }
  }

  async function enviar() {
    if (!medio || enviando) return;
    const ref = referencia.trim();
    if (!ref) {
      setErr('Indique la referencia bancaria de la consignación.');
      return;
    }
    if (!comprobante?.uri) {
      setErr('Adjunte la foto del comprobante de pago.');
      return;
    }
    setEnviando(true);
    setErr('');
    try {
      const res = await enviarSolicitudConsignacion(idPrograma, medio.id, ref, {
        uri: comprobante.uri,
        name: comprobante.fileName || `comprobante-${Date.now()}.jpg`,
        type: comprobante.mimeType || 'image/jpeg',
      });
      reset();
      onClose();
      onEnviado();
      Alert.alert('Consignación', res.message || 'Solicitud enviada. Está en revisión.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  }

  const qrUrl = medio ? resolveUploadUrl(medio.urlQr) : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: c.bg }]}>
        <View style={[styles.head, { borderBottomColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <ScaledText baseSize={12} style={{ color: c.primary, fontWeight: '600' }}>
              Pago por consignación
            </ScaledText>
            <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '600', marginTop: 2 }} numberOfLines={2}>
              {tituloCurso}
            </ScaledText>
            <ScaledText baseSize={20} style={{ color: c.primary, fontWeight: '700', marginTop: space.sm }}>
              {fmtPrecioColombia(monto)}
            </ScaledText>
          </View>
          <Pressable onPress={cerrar} hitSlop={12}>
            <Ionicons name="close" size={28} color={c.textSoft} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {err ? (
            <ScaledText baseSize={13} style={{ color: c.danger, marginBottom: space.md }}>
              {err}
            </ScaledText>
          ) : null}

          {!medio ? (
            <>
              <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '600', marginBottom: space.sm }}>
                {texto(estado, 'tituloElegirMedio', '¿Dónde va a consignar?')}
              </ScaledText>
              <ScaledText baseSize={13} style={{ color: c.textSoft, lineHeight: 20, marginBottom: space.lg }}>
                {texto(
                  estado,
                  'instruccionesPago',
                  'Elija la cuenta, realice la transferencia por el valor del curso y registre su comprobante.',
                )}
              </ScaledText>
              {estado.medios.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setMedio(m)}
                  style={({ pressed }) => [
                    styles.medio,
                    { borderColor: c.border, backgroundColor: c.card, opacity: pressed ? 0.92 : 1 },
                  ]}
                >
                  <View style={[styles.medioIcon, { backgroundColor: c.foroSoft }]}>
                    <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '700' }}>
                      {iconoMedio(m.etiqueta)}
                    </ScaledText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '600' }}>
                      {m.etiqueta}
                    </ScaledText>
                    {m.bancoNombre ? (
                      <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                        {m.bancoNombre}
                      </ScaledText>
                    ) : null}
                    {m.cuentaDescr ? (
                      <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                        {m.cuentaDescr}
                      </ScaledText>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.textSoft} />
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Pressable onPress={() => setMedio(null)} style={{ marginBottom: space.md }}>
                <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '600' }}>
                  ← Cambiar cuenta de pago
                </ScaledText>
              </Pressable>

              {qrUrl ? (
                <View style={[styles.qrCard, { borderColor: c.border, backgroundColor: c.card }]}>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600', marginBottom: space.md }}>
                    Escanee para pagar
                  </ScaledText>
                  <Image
                    source={{ uri: qrUrl }}
                    style={{ width: QR_SIZE, height: QR_SIZE }}
                    resizeMode="contain"
                  />
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: space.sm, textAlign: 'center' }}>
                    Abra la app de su banco y escanee el código
                  </ScaledText>
                </View>
              ) : null}

              {medio.instruccionesExtra ? (
                <ScaledText baseSize={13} style={{ color: c.textSoft, lineHeight: 20, marginBottom: space.md }}>
                  {medio.instruccionesExtra}
                </ScaledText>
              ) : null}

              <ScaledText baseSize={13} style={{ color: c.textSoft, lineHeight: 20, marginBottom: space.md }}>
                {texto(
                  estado,
                  'textoReferenciaSugerida',
                  'En el concepto incluya su documento y el nombre del curso.',
                )}
              </ScaledText>

              <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
                Referencia bancaria *
              </ScaledText>
              <IconInput
                value={referencia}
                onChangeText={setReferencia}
                placeholder="Número de aprobación o referencia"
                icon="receipt-outline"
              />

              <PrimaryButton
                label={comprobante ? 'Cambiar comprobante' : 'Adjuntar foto del comprobante'}
                onPress={() => void elegirImagen()}
                icon="image-outline"
                variant="secondary"
                fullWidth
              />
              {comprobante ? (
                <ScaledText baseSize={12} style={{ color: c.ok, textAlign: 'center', marginBottom: space.md }}>
                  Imagen seleccionada
                </ScaledText>
              ) : null}

              <PrimaryButton
                label={enviando ? 'Enviando…' : 'Confirmar y enviar comprobante'}
                onPress={() => void enviar()}
                loading={enviando}
                icon="checkmark-circle-outline"
                fullWidth
              />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: space.lg,
    borderBottomWidth: 1,
    gap: space.md,
  },
  body: { padding: space.lg, paddingBottom: space.xl },
  medio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.md,
    marginBottom: space.sm,
  },
  medioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.lg,
    paddingVertical: space.xl,
    alignItems: 'center',
    marginBottom: space.lg,
    width: '100%',
  },
});
