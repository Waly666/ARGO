import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';

type Props = {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ScreenBody({ children, refreshing, onRefresh }: Props) {
  const c = useTheme();
  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        ) : undefined
      }
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 24 },
  inner: { padding: 16 },
});
