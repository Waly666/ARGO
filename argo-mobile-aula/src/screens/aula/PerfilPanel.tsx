import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { IconInput } from '../../components/IconInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScaledText } from '../../components/ScaledText';
import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { actualizarEmpresa, buscarEmpresas } from '../../api/aulaApi';
import type { RootStackParamList } from '../../navigation/types';

export default function PerfilPanel() {
  const { state, signOut, updateEmpresa } = useAuth();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const [editEmpresa, setEditEmpresa] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<{ _id: string; nombre: string; identificacion: string }[]>([]);
  const [loading, setLoading] = useState(false);

  if (state.status !== 'signedIn') return null;
  const { user } = state;

  async function onBuscarEmpresa(q: string) {
    setBusqueda(q);
    if (q.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    try {
      setSugerencias(await buscarEmpresas(q.trim()));
    } catch {
      setSugerencias([]);
    }
  }

  async function onSeleccionarEmpresa(e: { _id: string; nombre: string }) {
    setLoading(true);
    try {
      const res = await actualizarEmpresa(e._id);
      updateEmpresa(res.empresaId, res.empresaNombre);
      setEditEmpresa(false);
      Alert.alert('Perfil', `Empresa vinculada: ${res.empresaNombre}`);
    } catch (err) {
      Alert.alert('Perfil', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function onQuitarEmpresa() {
    try {
      await actualizarEmpresa(null);
      updateEmpresa(null, null);
    } catch {
      /* ignore */
    }
  }

  return (
    <ScreenBody>
      <SurfaceCard>
        <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800' }}>
          {user.nombreCompleto}
        </ScaledText>
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 4 }}>
          {user.email}
        </ScaledText>
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 2 }}>
          Documento: {user.numDoc}
        </ScaledText>
        <View style={[styles.empresa, { borderColor: c.border }]}>
          <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }}>
            Empresa
          </ScaledText>
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
            {user.empresaNombre ?? 'Sin empresa vinculada'}
          </ScaledText>
          {!editEmpresa ? (
            <View style={styles.empBtns}>
              <PrimaryButton label="Cambiar" variant="ghost" onPress={() => setEditEmpresa(true)} />
              {user.empresaId ? (
                <PrimaryButton label="Quitar" variant="ghost" onPress={() => void onQuitarEmpresa()} />
              ) : null}
            </View>
          ) : (
            <>
              <IconInput value={busqueda} onChangeText={onBuscarEmpresa} placeholder="Buscar empresa…" />
              {sugerencias.map((e) => (
                <Pressable key={e._id} onPress={() => void onSeleccionarEmpresa(e)} style={styles.sug}>
                  <ScaledText baseSize={14} style={{ color: c.text }}>
                    {e.nombre}
                  </ScaledText>
                  <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                    {e.identificacion}
                  </ScaledText>
                </Pressable>
              ))}
              <PrimaryButton label="Cancelar" variant="ghost" onPress={() => setEditEmpresa(false)} loading={loading} />
            </>
          )}
        </View>
      </SurfaceCard>
      <View style={{ marginTop: 16, gap: 10 }}>
        <PrimaryButton label="Catálogo público" variant="ghost" onPress={() => nav.navigate('Catalogo')} fullWidth />
        <PrimaryButton
          label="Cerrar sesión"
          variant="danger"
          onPress={() => void signOut()}
          icon="log-out-outline"
          fullWidth
        />
      </View>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  empresa: { borderTopWidth: 1, marginTop: 16, paddingTop: 12 },
  empBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  sug: { paddingVertical: 8 },
});
