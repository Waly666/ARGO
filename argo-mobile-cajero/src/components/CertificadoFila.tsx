import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledText } from './ScaledText';
import { VerDocumentoButton } from './VerDocumentoButton';
import { certificadoHtmlPath } from '../api/certificadosApi';
import type { CertificadoItem } from '../api/domain';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type Props = {
  cert: CertificadoItem;
  onPressAlumno?: () => void;
};

export function CertificadoFila({ cert, onPressAlumno }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const titulo = cert.codigoCert ?? cert.encabezado ?? 'Certificado';

  return (
    <View style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}>
      <Ionicons name="ribbon-outline" size={24} color={c.primary} />
      <Pressable style={{ flex: 1 }} onPress={onPressAlumno} disabled={!onPressAlumno}>
        <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700' }}>{titulo}</ScaledText>
        {cert.nombreCompleto ? (
          <ScaledText baseSize={13} style={{ color: c.primary, marginTop: 3, fontWeight: '600' }}>
            {cert.nombreCompleto}
            {cert.numDoc ? ` · ${cert.numDoc}` : ''}
          </ScaledText>
        ) : null}
        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }} numberOfLines={2}>
          {cert.programaDescr ?? cert.nomCert ?? cert.tipoFormatoCertLabel ?? ''}
        </ScaledText>
        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
          {cert.fechaEmision ? `Emitido ${new Date(cert.fechaEmision).toLocaleDateString('es-CO')}` : ''}
          {cert.estado ? ` · ${cert.estado}` : ''}
        </ScaledText>
      </Pressable>
      <VerDocumentoButton titulo={`Certificado ${titulo}`} htmlPath={certificadoHtmlPath(cert._id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});
