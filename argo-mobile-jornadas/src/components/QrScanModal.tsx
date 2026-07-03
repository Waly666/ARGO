import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { parseJornadaAlumnoQr, type JornadaAlumnoQrData } from '../utils/jornadaAlumnoQr';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScan: (data: JornadaAlumnoQrData) => void;
};

export function QrScanModal({ visible, onClose, onScan }: Props) {
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function handleBarcode(result: { data?: string }) {
    if (locked) return;
    const parsed = parseJornadaAlumnoQr(result?.data || '');
    if (!parsed) {
      setErr('QR no válido. Use una etiqueta de jornadas ARGO.');
      return;
    }
    setLocked(true);
    setErr(null);
    onScan(parsed);
    onClose();
    setTimeout(() => setLocked(false), 800);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: '#0f172a' }]}>
        <View style={styles.topBar}>
          <ScaledText baseSize={17} style={{ color: '#fff', fontWeight: '800', flex: 1 }}>
            Escanear QR del alumno
          </ScaledText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        {!perm?.granted ? (
          <View style={styles.center}>
            <ScaledText baseSize={15} style={{ color: '#e2e8f0', textAlign: 'center', marginBottom: 16 }}>
              Se necesita permiso de cámara para leer el código QR de la etiqueta.
            </ScaledText>
            <PrimaryButton label="Permitir cámara" onPress={() => void requestPerm()} fullWidth />
            <View style={{ height: 8 }} />
            <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} fullWidth />
          </View>
        ) : (
          <View style={styles.camWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={locked ? undefined : handleBarcode}
            />
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.frame} />
              <ScaledText baseSize={14} style={styles.hint}>
                Centre el QR de la etiqueta del alumno
              </ScaledText>
            </View>
          </View>
        )}

        {err ? (
          <ScaledText baseSize={13} style={{ color: '#fca5a5', textAlign: 'center', padding: 12 }}>
            {err}
          </ScaledText>
        ) : null}

        <View style={{ padding: 16, paddingBottom: Math.max(16, insets.bottom) }}>
          <PrimaryButton label="Cerrar" variant="ghost" onPress={onClose} fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  camWrap: { flex: 1, margin: 16, borderRadius: 16, overflow: 'hidden' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#14b8a6',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: {
    color: '#fff',
    marginTop: 16,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
