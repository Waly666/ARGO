import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CedulaCameraModal, type CedulaCaptura } from './CedulaCameraModal';
import { FormSection } from './FormSection';
import { Pdf417ScanModal } from './Pdf417ScanModal';
import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { SurfaceCard } from './SurfaceCard';
import { escanearCedulaAlumno } from '../api/alumnosApi';
import type { AlumnoCrearDto } from '../api/domain';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import type { CedulaPdf417Data } from '../utils/cedulaPdf417';
import { capturarImagenCedula } from '../utils/imageCapture';
import { mayusculasNombre } from '../utils/format';
import type { SoportePago } from '../utils/pago';
import { mensajeErrorApi } from '../utils/pago';

type OcrAplicado = {
  patch: Partial<AlumnoCrearDto & { genero?: string; tipoSangre?: string }>;
  warnings?: string[];
  /** Solo si se escaneó foto (OCR). PDF417 no adjunta imagen. */
  imagen?: SoportePago;
};

type Props = {
  visible: boolean;
  onOmitir: () => void;
  onAplicado: (r: OcrAplicado) => void;
};

function patchDesdePdf417(data: CedulaPdf417Data): OcrAplicado['patch'] {
  return {
    tipoDoc: data.tipoDoc || '1',
    numDoc: data.numDoc,
    apellido1: mayusculasNombre(data.apellido1 || ''),
    apellido2: mayusculasNombre(data.apellido2 || ''),
    nombre1: mayusculasNombre(data.nombre1 || ''),
    nombre2: mayusculasNombre(data.nombre2 || ''),
    fechaNac: data.fechaNac || undefined,
    genero: data.genero,
    tipoSangre: data.tipoSangre,
  };
}

export function CedulaScanPanel({ visible, onOmitir, onAplicado }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [scanFile, setScanFile] = useState<SoportePago | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pdf417Open, setPdf417Open] = useState(false);

  function aplicarCaptura(img: CedulaCaptura) {
    setScanFile(img);
    setScanPreview(img.uri);
  }

  async function elegirGaleria() {
    setCapturando(true);
    try {
      const img = await capturarImagenCedula('galeria');
      if (!img) return;
      setScanFile(img);
      setScanPreview(img.uri);
    } finally {
      setCapturando(false);
    }
  }

  function onPdf417(data: CedulaPdf417Data) {
    onAplicado({ patch: patchDesdePdf417(data) });
    Alert.alert(
      'Cédula leída (PDF417)',
      'Documento, nombres, fecha, género y tipo de sangre sugeridos. Revise y complete expedición y contacto.',
    );
  }

  async function leerCedula() {
    if (!scanFile) {
      Alert.alert('Escanear cédula', 'Fotografíe o elija una imagen del frente de la cédula.');
      return;
    }
    setScanning(true);
    try {
      const r = await escanearCedulaAlumno(scanFile);
      const s = r.sugerido;
      const patch: OcrAplicado['patch'] = {
        tipoDoc: s.tipoDoc || '1',
        numDoc: s.numDoc != null ? String(s.numDoc).replace(/\D/g, '') : undefined,
        apellido1: mayusculasNombre(s.apellido1 || ''),
        apellido2: mayusculasNombre(s.apellido2 || ''),
        nombre1: mayusculasNombre(s.nombre1 || ''),
        nombre2: mayusculasNombre(s.nombre2 || ''),
        fechaNac: s.fechaNac || undefined,
      };
      onAplicado({
        patch,
        warnings: r.meta?.advertencias,
        imagen: scanFile,
      });
      const adv = r.meta?.advertencias?.length
        ? `\n\nRevise: ${r.meta.advertencias.join(' ')}`
        : '';
      Alert.alert(
        'Frente leído',
        `Documento y nombres sugeridos. Complete género, expedición y demás datos manualmente.${adv}`,
      );
    } catch (e) {
      const msg = mensajeErrorApi(e);
      Alert.alert(
        'No se pudo leer la cédula',
        `${msg}\n\nConsejos:\n• Solo el frente de la cédula\n• Alinee dentro del recuadro verde\n• Buena luz, sin reflejos\n• Original o fotocopia ampliada legible`,
      );
    } finally {
      setScanning(false);
    }
  }

  if (!visible) return null;

  return (
    <>
      <CedulaCameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCaptura={aplicarCaptura}
      />
      <Pdf417ScanModal
        visible={pdf417Open}
        onClose={() => setPdf417Open(false)}
        onScan={onPdf417}
      />

      <FormSection
        title="Escanear cédula"
        subtitle="PDF417 (reverso) o foto del frente"
        icon="scan-outline"
        tone="accent"
      >
        <SurfaceCard elevated={false} style={{ padding: 12, backgroundColor: c.accentSoft, gap: 6 }}>
          <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700' }}>
            Dos formas de leer
          </ScaledText>
          <ScaledText baseSize={12} style={{ color: c.textSoft, lineHeight: 18 }}>
            • PDF417: código de bandas en el reverso (rápido; incluye género y sangre).{'\n'}
            • Foto OCR: solo el frente (documento y nombres; puede tardar ~1 min).
          </ScaledText>
        </SurfaceCard>

        <PrimaryButton
          label="Escanear código PDF417 (reverso)"
          icon="barcode-outline"
          onPress={() => setPdf417Open(true)}
          disabled={scanning || capturando}
          fullWidth
        />

        <ScaledText baseSize={12} style={{ color: c.textSoft, fontWeight: '700', marginTop: 4 }}>
          O leer el frente con foto
        </ScaledText>

        {scanPreview ? (
          <Image source={{ uri: scanPreview }} style={styles.scanImg} resizeMode="contain" />
        ) : (
          <View style={[styles.scanEmpty, { borderColor: c.border }]}>
            <Ionicons name="card-outline" size={36} color={c.textSoft} />
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 8, textAlign: 'center' }}>
              Sin imagen — fotografíe el frente
            </ScaledText>
          </View>
        )}

        <PrimaryButton
          label={capturando ? 'Abriendo…' : 'Fotografiar frente con marco guía'}
          icon="scan-circle-outline"
          onPress={() => setCameraOpen(true)}
          disabled={capturando || scanning}
          fullWidth
        />
        <PrimaryButton
          label="Elegir de galería"
          icon="images-outline"
          variant="ghost"
          onPress={() => void elegirGaleria()}
          disabled={capturando || scanning}
          fullWidth
        />

        {scanning ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={c.primary} />
            <ScaledText baseSize={14} style={{ color: c.textSoft, flex: 1 }}>
              Leyendo frente de la cédula (puede tardar ~1 min)…
            </ScaledText>
          </View>
        ) : null}

        <PrimaryButton
          label={scanning ? 'Leyendo…' : 'Leer frente y rellenar datos'}
          icon="sparkles-outline"
          onPress={() => void leerCedula()}
          disabled={scanning || !scanFile || capturando}
          fullWidth
        />

        <Pressable onPress={onOmitir} style={styles.omitir}>
          <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '700' }}>
            Digitar manual sin escanear
          </ScaledText>
        </Pressable>
      </FormSection>
    </>
  );
}

const styles = StyleSheet.create({
  scanImg: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#0f172a' },
  scanEmpty: {
    height: 140,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  omitir: { alignItems: 'center', paddingVertical: 8 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
});

export function CedulaScanLink({ onPress }: { onPress: () => void }) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  return (
    <Pressable onPress={onPress} style={[styles.link, { borderColor: c.primary }]}>
      <Ionicons name="scan-outline" size={18} color={c.primary} />
      <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>
        Volver a escanear cédula
      </ScaledText>
    </Pressable>
  );
}
