import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledText } from '../components/ScaledText';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { space } from '../theme/spacing';

export default function PagoCheckoutScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PagoCheckout'>>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const { url, titulo } = route.params;

  function onNavChange(navState: { url?: string }) {
    const u = String(navState.url || '');
    if (/pago=ok|transaction.*approved|status=APPROVED/i.test(u)) {
      nav.goBack();
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="close" size={26} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '600' }} numberOfLines={1}>
            Pago en línea
          </ScaledText>
          {titulo ? (
            <ScaledText baseSize={12} style={{ color: c.textSoft }} numberOfLines={1}>
              {titulo}
            </ScaledText>
          ) : null}
        </View>
      </View>

      <View style={styles.webWrap}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={c.primary} />
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: space.md }}>
              Cargando pasarela de pago…
            </ScaledText>
          </View>
        ) : null}
        <WebView
          source={{ uri: url }}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={onNavChange}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1, opacity: loading ? 0 : 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    gap: space.sm,
  },
  backBtn: { padding: 4 },
  webWrap: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
