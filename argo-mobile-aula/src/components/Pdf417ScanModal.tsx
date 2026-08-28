import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import {
  parseCedulaColombianaPdf417,
  pareceCedulaPdf417Incompleta,
  type CedulaPdf417Data,
} from '../utils/cedulaPdf417';
import { radius, space } from '../theme/spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScan: (data: CedulaPdf417Data) => void;
};

const MODERN_SCANNER = CameraView.isModernBarcodeScannerAvailable;
const SCREEN_W = Dimensions.get('window').width;
/** PDF417 de cédula colombiana: franja ancha y baja (~10:1). */
const FRAME_W = Math.round(SCREEN_W * 0.94);
const FRAME_H = Math.max(56, Math.round(FRAME_W * 0.11));

type ScanPayload = Pick<BarcodeScanningResult, 'data' | 'type' | 'raw'>;

function rawCandidates(result: ScanPayload): string[] {
  const values = [result.data, result.raw].filter((v): v is string => Boolean(v && String(v).trim()));
  return [...new Set(values.map((v) => String(v)))];
}

export function Pdf417ScanModal({ visible, onClose, onScan }: Props) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(false);
  const bestRawRef = useRef('');
  const lastTryRef = useRef(0);
  const lockedRef = useRef(false);

  const reset = useCallback(() => {
    lockedRef.current = false;
    setLocked(false);
    setErr(null);
    setTorch(false);
    setNativeOpen(false);
    bestRawRef.current = '';
    lastTryRef.current = 0;
  }, []);

  useEffect(() => {
    if (visible) {
      reset();
    } else {
      void CameraView.dismissScanner().catch(() => {});
    }
  }, [visible, reset]);

  const acceptScan = useCallback(
    (parsed: CedulaPdf417Data) => {
      lockedRef.current = true;
      setLocked(true);
      setErr(null);
      onScan(parsed);
      onClose();
      void CameraView.dismissScanner().catch(() => {});
      setTimeout(() => {
        lockedRef.current = false;
        setLocked(false);
      }, 800);
    },
    [onClose, onScan],
  );

  const processPayload = useCallback(
    (raw: string) => {
      if (lockedRef.current || !raw.trim()) return;

      if (/PubDSK_/i.test(raw) && raw.length > bestRawRef.current.length) {
        bestRawRef.current = raw;
      }

      const parsed = parseCedulaColombianaPdf417(raw);
      if (parsed) {
        acceptScan(parsed);
        return;
      }

      const best = bestRawRef.current;
      const parsedBest = best ? parseCedulaColombianaPdf417(best) : null;
      if (parsedBest) {
        acceptScan(parsedBest);
        return;
      }

      const now = Date.now();
      if (now - lastTryRef.current < 1200) return;
      lastTryRef.current = now;

      if (pareceCedulaPdf417Incompleta(raw) || pareceCedulaPdf417Incompleta(best)) {
        setErr(
          'Lectura incompleta. Acerque la cédula y alinee toda la franja PDF417 dentro del recuadro horizontal.',
        );
        return;
      }

      setErr(
        'No se reconoció la cédula. Use el reverso (amarilla) y encaje el código PDF417 en el recuadro ancho.',
      );
    },
    [acceptScan],
  );

  const handleBarcode = useCallback(
    (result: ScanPayload) => {
      if (lockedRef.current) return;
      if (result.type && result.type !== 'pdf417' && !/pdf417/i.test(result.type)) return;
      for (const raw of rawCandidates(result)) {
        processPayload(raw);
        if (lockedRef.current) break;
      }
    },
    [processPayload],
  );

  useEffect(() => {
    if (!visible || !nativeOpen) return undefined;
    const sub = CameraView.onModernBarcodeScanned((event) => {
      handleBarcode(event);
    });
    return () => sub.remove();
  }, [visible, nativeOpen, handleBarcode]);

  const iniciarEscaneoNativo = useCallback(async () => {
    if (!perm?.granted) {
      const res = await requestPerm();
      if (!res.granted) return;
    }
    setErr(null);
    setNativeOpen(true);
    try {
      await CameraView.launchScanner({
        barcodeTypes: ['pdf417'],
        isGuidanceEnabled: true,
        isHighlightingEnabled: true,
      });
    } catch {
      setNativeOpen(false);
      setErr('No se pudo abrir el lector del sistema. Use la cámara integrada.');
    }
  }, [perm?.granted, requestPerm]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: '#0f172a' }]}>
        <View style={styles.topBar}>
          <ScaledText baseSize={17} style={{ color: '#fff', fontWeight: '700', flex: 1 }}>
            Escanear PDF417
          </ScaledText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        {!perm?.granted ? (
          <View style={styles.center}>
            <ScaledText baseSize={15} style={{ color: '#e2e8f0', textAlign: 'center', marginBottom: space.lg }}>
              Se necesita permiso de cámara para leer el código PDF417 del reverso de la cédula amarilla.
            </ScaledText>
            <PrimaryButton label="Permitir cámara" onPress={() => void requestPerm()} fullWidth />
            <View style={{ height: space.sm }} />
            <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} fullWidth />
          </View>
        ) : (
          <View style={styles.camWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              autofocus="off"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: ['pdf417'] }}
              onBarcodeScanned={locked ? undefined : handleBarcode}
            />

            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.maskTop} />
              <View style={styles.maskRow}>
                <View style={styles.maskSide} />
                <View style={[styles.frame, { width: FRAME_W, height: FRAME_H, borderColor: c.primary }]}>
                  <View style={[styles.corner, styles.cornerTL, { borderColor: c.primary }]} />
                  <View style={[styles.corner, styles.cornerTR, { borderColor: c.primary }]} />
                  <View style={[styles.corner, styles.cornerBL, { borderColor: c.primary }]} />
                  <View style={[styles.corner, styles.cornerBR, { borderColor: c.primary }]} />
                </View>
                <View style={styles.maskSide} />
              </View>
              <View style={styles.maskBottom}>
                <ScaledText baseSize={14} style={styles.hint}>
                  Reverso de la cédula · alinee la franja PDF417 en el recuadro horizontal
                </ScaledText>
              </View>
            </View>

            <Pressable
              style={[styles.torchBtn, { backgroundColor: torch ? c.primary : 'rgba(0,0,0,0.55)' }]}
              onPress={() => setTorch((v) => !v)}
            >
              <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color="#fff" />
            </Pressable>
          </View>
        )}

        {err ? (
          <ScaledText baseSize={13} style={{ color: '#fca5a5', textAlign: 'center', paddingHorizontal: space.md }}>
            {err}
          </ScaledText>
        ) : null}

        <View style={{ padding: space.lg, paddingBottom: Math.max(space.lg, insets.bottom), gap: space.sm }}>
          {MODERN_SCANNER && perm?.granted ? (
            <Pressable onPress={() => void iniciarEscaneoNativo()}>
              <ScaledText baseSize={12} style={{ color: '#94a3b8', textAlign: 'center', marginBottom: space.xs }}>
                ¿No lee? Probar lector del sistema
              </ScaledText>
            </Pressable>
          ) : null}
          <PrimaryButton label="Cerrar" variant="ghost" onPress={onClose} fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const MASK = 'rgba(0,0,0,0.55)';

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  center: { flex: 1, justifyContent: 'center', padding: space.xl },
  camWrap: { flex: 1, marginHorizontal: space.md, marginBottom: space.sm, borderRadius: radius.xl, overflow: 'hidden' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  maskTop: {
    flex: 1,
    backgroundColor: MASK,
  },
  maskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskSide: {
    flex: 1,
    height: FRAME_H,
    backgroundColor: MASK,
  },
  maskBottom: {
    flex: 1,
    backgroundColor: MASK,
    alignItems: 'center',
    paddingTop: space.lg,
    paddingHorizontal: space.md,
  },
  frame: {
    borderWidth: 2,
    borderRadius: 6,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderWidth: 3,
  },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  hint: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  torchBtn: {
    position: 'absolute',
    right: space.md,
    top: space.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
