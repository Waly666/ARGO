import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';

/** Fondo claro del header del aula logueada. */
export function DashboardHeaderBackground() {
  const c = useTheme();
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: c.headerBg, borderBottomWidth: 1, borderBottomColor: c.headerBorder }]} />;
}
