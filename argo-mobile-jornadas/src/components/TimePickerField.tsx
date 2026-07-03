import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

const HORAS = Array.from({ length: 24 }, (_, i) => i);
/** Minutos en pasos de 5 (más fácil en carpa). */
const MINUTOS = Array.from({ length: 12 }, (_, i) => i * 5);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseHhmm(value?: string): { h: number; m: number } {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { h: 8, m: 0 };
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  let min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  // Ajustar al paso de 5 más cercano
  min = Math.round(min / 5) * 5;
  if (min >= 60) return { h: Math.min(23, h + 1), m: 0 };
  return { h, m: min };
}

function toHhmm(h: number, m: number): string {
  return `${pad2(h)}:${pad2(m)}`;
}

type WheelProps = {
  data: number[];
  value: number;
  onChange: (n: number) => void;
  label: string;
};

function NumberWheel({ data, value, onChange, label }: WheelProps) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const listRef = useRef<FlatList<number>>(null);
  const index = Math.max(0, data.indexOf(value));

  useEffect(() => {
    const t = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: index * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [index]);

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    const i = Math.round(y / ITEM_H);
    const clamped = Math.min(data.length - 1, Math.max(0, i));
    onChange(data[clamped]);
    listRef.current?.scrollToOffset({ offset: clamped * ITEM_H, animated: true });
  }

  return (
    <View style={styles.wheelCol}>
      <ScaledText baseSize={12} style={{ color: c.textSoft, fontWeight: '700', marginBottom: 6 }}>
        {label}
      </ScaledText>
      <View style={[styles.wheelBox, { borderColor: c.border, backgroundColor: c.bgAlt }]}>
        {/* Recuadro detrás de los números: verde transparente para que se lea la hora elegida */}
        <View
          pointerEvents="none"
          style={[
            styles.wheelHighlight,
            {
              borderColor: c.primary,
              backgroundColor: 'rgba(13, 148, 136, 0.18)',
            },
          ]}
        />
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => String(item)}
          style={styles.wheelList}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: PAD }}
          getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
          onMomentumScrollEnd={onMomentumEnd}
          onScrollEndDrag={onMomentumEnd}
          renderItem={({ item }) => {
            const sel = item === value;
            return (
              <View style={styles.wheelItem}>
                <ScaledText
                  baseSize={sel ? 24 : 16}
                  style={{
                    color: sel ? c.text : c.textSoft,
                    fontWeight: sel ? '800' : '500',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {pad2(item)}
                </ScaledText>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

type Props = {
  label: string;
  value: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function TimePickerField({
  label,
  value,
  onChange,
  disabled,
  placeholder = 'Elegir hora',
}: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const initial = useMemo(() => parseHhmm(value), [value]);
  const [h, setH] = useState(initial.h);
  const [m, setM] = useState(initial.m);

  function openPicker() {
    if (disabled) return;
    const p = parseHhmm(value);
    setH(p.h);
    setM(p.m);
    setOpen(true);
  }

  function confirmar() {
    onChange(toHhmm(h, m));
    setOpen(false);
  }

  const display = value?.trim() || '';

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 4, fontWeight: '600' }}>
        {label}
      </ScaledText>
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: c.border,
            backgroundColor: c.bgAlt,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="time-outline" size={22} color={c.primary} />
        <ScaledText
          baseSize={18}
          style={{
            color: display ? c.text : c.textSoft,
            fontWeight: '800',
            marginLeft: 10,
            fontVariant: ['tabular-nums'],
            flex: 1,
          }}
        >
          {display || placeholder}
        </ScaledText>
        <Ionicons name="chevron-down" size={20} color={c.primary} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: c.card }]}>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', marginBottom: 4 }}>
              {label}
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 14 }}>
              Deslice para elegir hora y minutos
            </ScaledText>

            <View style={styles.wheelsRow}>
              <NumberWheel data={HORAS} value={h} onChange={setH} label="Hora" />
              <ScaledText baseSize={28} style={{ color: c.text, fontWeight: '800', marginTop: 28 }}>
                :
              </ScaledText>
              <NumberWheel data={MINUTOS} value={m} onChange={setM} label="Minutos" />
            </View>

            <View style={[styles.preview, { backgroundColor: c.accentSoft }]}>
              <ScaledText baseSize={32} style={{ color: c.primary, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {toHhmm(h, m)}
              </ScaledText>
            </View>

            <View style={{ height: 12 }} />
            <PrimaryButton label="Usar esta hora" onPress={confirmar} fullWidth icon="checkmark" />
            <View style={{ height: 8 }} />
            <PrimaryButton label="Cancelar" variant="ghost" onPress={() => setOpen(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 52,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  wheelCol: { flex: 1, alignItems: 'center' },
  wheelBox: {
    height: ITEM_H * VISIBLE,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  wheelHighlight: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: PAD,
    height: ITEM_H,
    borderRadius: 10,
    borderWidth: 2,
    zIndex: 0,
  },
  wheelList: {
    zIndex: 1,
    elevation: 1,
  },
  wheelItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
