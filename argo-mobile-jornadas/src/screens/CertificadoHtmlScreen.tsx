import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

import { apiFetchText } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { getServerPublicOrigin, rewriteDocumentHtmlForMobile } from '../utils/documentHtml';
import { compartirHtmlPdf, imprimirHtml } from '../services/documentoPrint';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'CertificadoHtml'>;

export default function CertificadoHtmlScreen() {
  const route = useRoute<Route>();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const { id, titulo } = route.params;
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const path = `/jornadas/certificados-generados/${id}/html`;
        const text = await apiFetchText(path);
        setHtml(rewriteDocumentHtmlForMobile(text, path));
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'No se pudo cargar');
      }
    })();
  }, [id]);

  async function onCompartirPdf() {
    if (!html) return;
    setBusy(true);
    try {
      const nombre = (titulo || 'certificado').replace(/[^\w\-]+/g, '_').slice(0, 40);
      await compartirHtmlPdf(html, nombre || 'certificado-argo');
    } catch (e) {
      Alert.alert('Compartir', e instanceof Error ? e.message : 'No se pudo generar el PDF');
    } finally {
      setBusy(false);
    }
  }

  async function onImprimir() {
    if (!html) return;
    setBusy(true);
    try {
      await imprimirHtml(html);
    } catch (e) {
      Alert.alert('Imprimir', e instanceof Error ? e.message : 'No se pudo imprimir');
    } finally {
      setBusy(false);
    }
  }

  if (err) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ScaledText baseSize={15} style={{ color: c.danger }}>
          {err}
        </ScaledText>
      </View>
    );
  }

  if (!html) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} size="large" />
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 12 }}>
          Cargando certificado…
        </ScaledText>
      </View>
    );
  }

  const baseUrl = `${getServerPublicOrigin().replace(/\/$/, '')}/`;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl }}
        style={styles.web}
        startInLoadingState
        scalesPageToFit
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />
      <View style={[styles.footer, { backgroundColor: c.card, borderTopColor: c.border }]}>
        <PrimaryButton
          label="Imprimir"
          icon="print-outline"
          onPress={() => void onImprimir()}
          disabled={busy}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          label="Compartir PDF"
          icon="share-outline"
          variant="ghost"
          onPress={() => void onCompartirPdf()}
          disabled={busy}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  web: { flex: 1, backgroundColor: '#525659' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
});
