import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { EmptyState } from '../../components/EmptyState';
import { ScaledText } from '../../components/ScaledText';
import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useTheme } from '../../context/ThemeContext';
import { certificadoHtmlPath, fetchMisCertificados, reciboHtmlPath } from '../../api/aulaApi';
import type { CertificadoPortal } from '../../api/types';
import { fmtFecha } from '../../utils/cursoUtils';
import type { RootStackParamList } from '../../navigation/types';

export default function CertificadosPanel() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const [certs, setCerts] = useState<CertificadoPortal[]>([]);

  const load = useCallback(async () => {
    try {
      setCerts(await fetchMisCertificados());
    } catch {
      setCerts([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function titulo(cert: CertificadoPortal) {
    return cert.encabezado || cert.nomCert || cert.programaDescr || 'Certificado';
  }

  return (
    <ScreenBody onRefresh={load}>
      <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800', marginBottom: 12 }}>
        Mis certificados
      </ScaledText>
      {certs.length === 0 ? (
        <EmptyState title="Sin certificados" subtitle="Complete cursos para obtener certificados" icon="ribbon-outline" />
      ) : (
        certs.map((cert) => (
          <SurfaceCard key={cert._id} style={{ marginBottom: 12 }}>
            <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700' }}>
              {titulo(cert)}
            </ScaledText>
            <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
              {cert.codigoCert ? `Código: ${cert.codigoCert} · ` : ''}
              Emisión: {fmtFecha(cert.fechaEmision)}
            </ScaledText>
            <View style={styles.actions}>
              <Pressable
                onPress={() =>
                  nav.navigate('DocumentoHtml', {
                    title: titulo(cert),
                    htmlPath: certificadoHtmlPath(cert._id),
                  })
                }
                style={[styles.btn, { borderColor: c.primary }]}
              >
                <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '600' }}>
                  Ver certificado
                </ScaledText>
              </Pressable>
              {cert.recibo?.idIngreso ? (
                <Pressable
                  onPress={() =>
                    nav.navigate('DocumentoHtml', {
                      title: `Recibo ${cert.recibo?.numRecibo ?? ''}`,
                      htmlPath: reciboHtmlPath(cert.recibo!.idIngreso),
                    })
                  }
                  style={[styles.btn, { borderColor: c.textSoft }]}
                >
                  <ScaledText baseSize={13} style={{ color: c.textSoft, fontWeight: '600' }}>
                    Recibo
                  </ScaledText>
                </Pressable>
              ) : null}
            </View>
          </SurfaceCard>
        ))
      )}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
});
