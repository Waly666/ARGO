import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { radius, space } from '../theme/spacing';

type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  scrollable?: boolean;
};

export function SegmentedTabs({ tabs, active, onChange, scrollable }: Props) {
  const c = useTheme();
  const row = (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              scrollable && styles.tabScroll,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <ScaledText
              baseSize={14}
              style={{
                color: on ? c.primary : c.textSoft,
                fontWeight: on ? '800' : '600',
              }}
            >
              {tab.label}
            </ScaledText>
            {on ? <View style={[styles.underline, { backgroundColor: c.primary }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {row}
      </ScrollView>
    );
  }

  return <View style={styles.wrap}>{row}</View>;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  scroll: { paddingBottom: 2 },
  row: { flexDirection: 'row', gap: space.xl },
  tab: {
    paddingBottom: space.sm,
    alignItems: 'center',
    minWidth: 72,
  },
  tabScroll: { marginRight: space.lg },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: radius.pill,
  },
});
