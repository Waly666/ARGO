import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { ScreenBody } from '../components/ScreenBody';
import { SurfaceCard } from '../components/SurfaceCard';
import { usePortalConfig } from '../context/PortalConfigContext';
import { useTheme } from '../context/ThemeContext';
import { fetchCursos } from '../api/aulaApi';
import type { CursoVirtual } from '../api/types';
import { CursoCard } from '../components/CursoCard';
import { resolveUploadUrl } from '../utils/uploadUrl';
import type { RootStackParamList } from '../navigation/types';

export default function WelcomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { config } = usePortalConfig();
  const c = useTheme();
  const [destacados, setDestacados] = useState<CursoVirtual[]>([]);

  const load = useCallback(async () => {
    try {
      const rows = await fetchCursos();
      setDestacados(rows.slice(0, 4));
    } catch {
      setDestacados([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const heroImg = resolveUploadUrl(config?.site?.tema?.urlHeroAbsoluta) || resolveUploadUrl(config?.site?.tema?.urlHero);
  const logo = resolveUploadUrl(config?.urlLogoAbsoluta) || resolveUploadUrl(config?.urlLogo);

  return (
    <ScreenBody onRefresh={load}>
      <LinearGradient colors={[c.primaryDark, c.primary]} style={styles.hero}>
        {logo ? <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" /> : null}
        <ScaledText baseSize={24} style={styles.heroTitle}>
          {config?.heroTitulo ?? config?.nombreCea ?? 'Aula virtual'}
        </ScaledText>
        <ScaledText baseSize={15} style={styles.heroSub}>
          {config?.heroSubtitulo ?? 'Capacitación en línea'}
        </ScaledText>
        {heroImg ? <Image source={{ uri: heroImg }} style={styles.heroImg} resizeMode="cover" /> : null}
        <PrimaryButton label="Iniciar sesión" onPress={() => nav.navigate('Login')} icon="log-in-outline" />
        <Pressable onPress={() => nav.navigate('Catalogo')} style={styles.linkBtn}>
          <ScaledText baseSize={15} style={{ color: '#fff', fontWeight: '600' }}>
            Explorar cursos
          </ScaledText>
        </Pressable>
      </LinearGradient>

      {destacados.length > 0 ? (
        <SurfaceCard style={{ marginTop: 16 }}>
          <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', marginBottom: 12 }}>
            Cursos destacados
          </ScaledText>
          {destacados.map((curso) => (
            <CursoCard
              key={String(curso.idPrograma)}
              curso={curso}
              onPress={() =>
                nav.navigate('CursoDetalle', { id: String(curso.idPrograma), titulo: curso.nombreProg })
              }
            />
          ))}
        </SurfaceCard>
      ) : null}

      <View style={styles.quick}>
        <PrimaryButton
          label="Consultar certificados"
          variant="ghost"
          onPress={() => nav.navigate('ConsultaCertificados')}
          icon="ribbon-outline"
          fullWidth
        />
        {config?.registroAbierto !== false ? (
          <PrimaryButton
            label="Registrarse"
            variant="ghost"
            onPress={() => nav.navigate('Registro')}
            icon="person-add-outline"
            fullWidth
          />
        ) : null}
      </View>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20, marginBottom: 4 },
  logo: { width: 100, height: 56, marginBottom: 8, alignSelf: 'center' },
  heroTitle: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginBottom: 16, marginTop: 6 },
  heroImg: { width: '100%', height: 140, borderRadius: 12, marginBottom: 16 },
  linkBtn: { alignItems: 'center', marginTop: 12, padding: 8 },
  quick: { marginTop: 16, gap: 8 },
});
