import React, { useRef } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import {
  buildJornadaAlumnoQrPayload,
  etiquetaHtmlAlumno,
  fmtFechaEtiqueta,
} from '../utils/jornadaAlumnoQr';
import { compartirHtmlPdf, imprimirHtml } from '../services/documentoPrint';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type Props = {
  visible: boolean;
  numDoc: string;
  nombre: string;
  empresa?: string;
  codContrato?: string;
  fechaJornada?: string;
  onClose: () => void;
};

type QrRef = {
  toDataURL?: (cb: (data: string) => void) => void;
  getDataURL?: (cb: (data: string) => void) => void;
};

export function AlumnoQrLabelModal({
  visible,
  numDoc,
  nombre,
  empresa,
  codContrato,
  fechaJornada,
  onClose,
}: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const qrRef = useRef<QrRef | null>(null);
  const [busy, setBusy] = React.useState(false);

  const payload = buildJornadaAlumnoQrPayload(numDoc, nombre);

  function withQrDataUrl(fn: (dataUrl: string) => Promise<void>) {
    const qr = qrRef.current;
    const exportFn = qr?.toDataURL || qr?.getDataURL;
    if (!exportFn) {
      Alert.alert('QR', 'No se pudo generar el código QR.');
      return;
    }
    setBusy(true);
    exportFn.call(qr, async (data: string) => {
      try {
        const dataUrl = data.startsWith('data:') ? data : `data:image/png;base64,${data}`;
        await fn(dataUrl);
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo procesar la etiqueta');
      } finally {
        setBusy(false);
      }
    });
  }

  function onImprimir() {
    withQrDataUrl(async (dataUrl) => {
      const html = etiquetaHtmlAlumno({
        qrDataUrl: dataUrl,
        numDoc,
        nombre,
        empresa,
        codContrato,
        fechaJornada,
      });
      await imprimirHtml(html);
    });
  }

  function onCompartir() {
    withQrDataUrl(async (dataUrl) => {
      const html = etiquetaHtmlAlumno({
        qrDataUrl: dataUrl,
        numDoc,
        nombre,
        empresa,
        codContrato,
        fechaJornada,
      });
      await compartirHtmlPdf(html, `etiqueta-${numDoc}`);
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.bg}>
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <View style={styles.head}>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', flex: 1 }}>
              Etiqueta QR del alumno
            </ScaledText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={26} color={c.textSoft} />
            </Pressable>
          </View>

          <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 12 }}>
            Solo jornadas. Imprima o comparta la etiqueta y entréguesela al alumno. En clase, escanee el QR
            para registrarlo sin digitar el documento.
          </ScaledText>

          <View style={[styles.qrWrap, { borderColor: c.border, backgroundColor: '#fff' }]}>
            <QRCode
              value={payload}
              size={200}
              getRef={(ref: QrRef | null) => {
                qrRef.current = ref;
              }}
            />
          </View>

          <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700', marginTop: 14, textAlign: 'center' }}>
            {nombre || 'Alumno'}
          </ScaledText>
          <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', marginTop: 4 }}>
            Doc. {numDoc}
          </ScaledText>
          <ScaledText baseSize={13} style={{ color: c.primary, textAlign: 'center', marginTop: 6, fontWeight: '700' }}>
            {empresa?.trim() || '—'}
          </ScaledText>
          {codContrato?.trim() ? (
            <ScaledText baseSize={12} style={{ color: '#1e3a8a', textAlign: 'center', marginTop: 4, fontWeight: '700' }}>
              Contrato {codContrato.trim()}
            </ScaledText>
          ) : null}
          <ScaledText baseSize={12} style={{ color: c.textSoft, textAlign: 'center', marginTop: 2, fontWeight: '700' }}>
            Jornada {fmtFechaEtiqueta(fechaJornada)}
          </ScaledText>

          {busy ? <ActivityIndicator color={c.primary} style={{ marginTop: 12 }} /> : null}

          <View style={{ height: 16 }} />
          <PrimaryButton
            label="Imprimir etiqueta"
            icon="print-outline"
            onPress={onImprimir}
            disabled={busy}
            fullWidth
          />
          <View style={{ height: 8 }} />
          <PrimaryButton
            label="Compartir PDF etiqueta"
            icon="share-outline"
            variant="ghost"
            onPress={onCompartir}
            disabled={busy}
            fullWidth
          />
          <View style={{ height: 8 }} />
          <PrimaryButton label="Cerrar" variant="ghost" onPress={onClose} fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qrWrap: {
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
});
