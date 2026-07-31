import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledText } from '../components/ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { useVoiceOptional } from './VoiceContext';

export function VoiceMicOverlay() {
  const voice = useVoiceOptional();
  const insets = useSafeAreaInsets();
  const { highContrast, buttonMultiplier } = useAccessibility();
  const c = themeColors(highContrast);

  if (!voice || !voice.activeScreenId) return null;

  const size = 56 * buttonMultiplier;
  const pending = voice.pendingConfirm;

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.fabWrap, { bottom: Math.max(insets.bottom, 12) + 8, right: 16 }]}
      >
        {voice.lastHeard && !voice.recognizing ? (
          <View style={[styles.heardChip, { backgroundColor: c.card, borderColor: c.border }]}>
            <ScaledText baseSize={11} numberOfLines={2} style={{ color: c.textSoft }}>
              «{voice.lastHeard}»
            </ScaledText>
          </View>
        ) : null}
        <Pressable
          accessibilityLabel={voice.recognizing ? 'Detener micrófono' : 'Activar micrófono'}
          onPress={() => {
            if (voice.recognizing) voice.stopListening();
            else void voice.startListening();
          }}
          style={[
            styles.fab,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: voice.recognizing ? c.danger : c.primary,
            },
          ]}
        >
          {voice.recognizing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="mic" size={26 * buttonMultiplier} color="#fff" />
          )}
        </Pressable>
        {voice.recognizing ? (
          <ScaledText baseSize={11} style={[styles.listeningHint, { color: c.primary }]}>
            Escuchando…
          </ScaledText>
        ) : null}
      </View>

      <Modal visible={Boolean(pending)} transparent animationType="fade" onRequestClose={voice.cancelPending}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="mic-circle-outline" size={36} color={c.primary} />
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', marginTop: 8 }}>
              {pending?.title}
            </ScaledText>
            <ScaledText
              baseSize={14}
              style={{ color: c.textSoft, marginTop: 8, textAlign: 'center', lineHeight: 20 }}
            >
              {pending?.message}
            </ScaledText>
            <View style={styles.modalActions}>
              <Pressable
                onPress={voice.cancelPending}
                style={[styles.modalBtn, { borderColor: c.border, backgroundColor: c.bgAlt }]}
              >
                <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }}>
                  Cancelar
                </ScaledText>
              </Pressable>
              <Pressable
                onPress={voice.confirmPending}
                style={[styles.modalBtn, { borderColor: c.primary, backgroundColor: c.primary }]}
              >
                <ScaledText baseSize={15} style={{ color: '#fff', fontWeight: '800' }}>
                  Confirmar
                </ScaledText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    zIndex: 50,
    alignItems: 'flex-end',
    maxWidth: 220,
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#0f766e',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  heardChip: {
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 200,
  },
  listeningHint: {
    marginTop: 6,
    fontWeight: '700',
    alignSelf: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
