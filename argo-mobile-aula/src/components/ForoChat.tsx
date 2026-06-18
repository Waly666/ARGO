import React from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { MensajeForo } from '../api/types';
import { useForo } from '../hooks/useForo';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { fmtFecha } from '../utils/cursoUtils';

type Props = {
  token: string | null;
  idPrograma: string;
  nombreCurso?: string;
};

export function ForoChat({ token, idPrograma, nombreCurso = '' }: Props) {
  const c = useTheme();
  const { mensajes, conectado, cargando, error, enviarMensaje } = useForo({
    token,
    idPrograma,
    nombrePrograma: nombreCurso,
  });
  const [texto, setTexto] = React.useState('');

  function onEnviar() {
    if (!texto.trim()) return;
    enviarMensaje(texto);
    setTexto('');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: conectado ? c.ok : c.warn }]} />
        <ScaledText baseSize={12} style={{ color: c.textSoft }}>
          {conectado ? 'Conectado' : 'Reconectando…'}
        </ScaledText>
        {cargando ? (
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginLeft: 8 }}>
            Cargando…
          </ScaledText>
        ) : null}
      </View>
      {error ? (
        <ScaledText baseSize={13} style={{ color: c.danger, marginBottom: 8 }}>
          {error}
        </ScaledText>
      ) : null}
      <FlatList
        data={mensajes}
        keyExtractor={(m) => m._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <MensajeRow msg={item} />}
        ListEmptyComponent={
          !cargando ? (
            <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', padding: 24 }}>
              Sé el primero en escribir en este foro.
            </ScaledText>
          ) : null
        }
      />
      <View style={[styles.composer, { borderColor: c.border, backgroundColor: c.card }]}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un mensaje…"
          placeholderTextColor="#94a3b8"
          style={[styles.input, { color: c.text }]}
          multiline
        />
        <Pressable onPress={onEnviar} style={[styles.send, { backgroundColor: c.primary }]}>
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MensajeRow({ msg }: { msg: MensajeForo }) {
  const c = useTheme();
  const esStaff = msg.autorTipo === 'instructor' || msg.autorTipo === 'admin';
  return (
    <View style={[styles.msg, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.msgHead}>
        <ScaledText baseSize={13} style={{ color: esStaff ? c.primary : c.text, fontWeight: '700' }}>
          {msg.autorNombre}
          {esStaff ? ' · Instructor' : ''}
        </ScaledText>
        <ScaledText baseSize={11} style={{ color: c.textSoft }}>
          {fmtFecha(msg.createdAt)}
        </ScaledText>
      </View>
      <ScaledText baseSize={14} style={{ color: c.text, marginTop: 4 }}>
        {msg.texto}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  list: { paddingBottom: 8, flexGrow: 1 },
  msg: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8 },
  msgHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, padding: 4 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
