import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import {
  AUTORIZACION_DATOS_TITULO,
  buildAutorizacionDatosTexto,
} from '../config/autorizacionDatos';
import { radius, space } from '../theme/spacing';

type Props = {
  aceptado: boolean;
  onAceptadoChange: (value: boolean) => void;
  nombreEmpresa?: string | null;
  correo?: string | null;
};

export function AutorizacionDatos({ aceptado, onAceptadoChange, nombreEmpresa, correo }: Props) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [modalOpen, setModalOpen] = useState(false);

  const texto = useMemo(
    () => buildAutorizacionDatosTexto(nombreEmpresa, correo),
    [nombreEmpresa, correo],
  );
  const parrafos = useMemo(() => texto.split('\n\n').filter(Boolean), [texto]);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onAceptadoChange(!aceptado)}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceptado }}
      >
        <Ionicons
          name={aceptado ? 'checkbox' : 'square-outline'}
          size={22}
          color={aceptado ? c.primary : c.textSoft}
          style={styles.checkIcon}
        />
        <View style={styles.labelWrap}>
          <ScaledText baseSize={14} style={{ color: c.text, lineHeight: 21 }}>
            Acepto los términos del servicio *
          </ScaledText>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              setModalOpen(true);
            }}
            hitSlop={6}
          >
            <ScaledText baseSize={13} style={{ color: c.primary, textDecorationLine: 'underline', marginTop: 4 }}>
              Ver autorización de tratamiento de datos
            </ScaledText>
          </Pressable>
        </View>
      </Pressable>

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={[styles.modalRoot, { paddingTop: insets.top, backgroundColor: c.bg }]}>
          <View style={[styles.modalHead, { borderBottomColor: c.border }]}>
            <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '600', flex: 1, lineHeight: 22 }}>
              {AUTORIZACION_DATOS_TITULO}
            </ScaledText>
            <Pressable onPress={() => setModalOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={26} color={c.textSoft} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {parrafos.map((p, i) => (
              <ScaledText
                key={i}
                baseSize={14}
                style={{ color: c.textSoft, lineHeight: 22, marginBottom: space.md }}
              >
                {p}
              </ScaledText>
            ))}
          </ScrollView>
          <View style={{ padding: space.lg, paddingBottom: Math.max(space.lg, insets.bottom) }}>
            <PrimaryButton
              label="Aceptar y cerrar"
              onPress={() => {
                onAceptadoChange(true);
                setModalOpen(false);
              }}
              fullWidth
            />
            <View style={{ height: space.sm }} />
            <PrimaryButton label="Cerrar" variant="ghost" onPress={() => setModalOpen(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: space.md, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  checkIcon: { marginTop: 2, marginRight: space.sm },
  labelWrap: { flex: 1 },
  modalRoot: { flex: 1 },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
  },
  modalBody: { padding: space.lg, paddingBottom: space.xl },
});
