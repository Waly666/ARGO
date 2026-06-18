import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { IconInput } from '../components/IconInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { usePortalConfig } from '../context/PortalConfigContext';
import { useTheme } from '../context/ThemeContext';
import {
  buscarAlumnoRegistro,
  registro,
  registroConfirmar,
  registroReenviarCodigo,
  registroSolicitar,
} from '../api/aulaApi';
import type { RootStackParamList } from '../navigation/types';

type Step = 'doc' | 'form' | 'verify';

export default function RegistroScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth();
  const { config } = usePortalConfig();
  const c = useTheme();
  const [step, setStep] = useState<Step>('doc');
  const [numDoc, setNumDoc] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [esArgo, setEsArgo] = useState(false);

  async function onBuscarDoc() {
    if (!numDoc.trim()) return;
    setLoading(true);
    try {
      const r = await buscarAlumnoRegistro(numDoc.trim());
      if (r.tieneCuentaPortal) {
        Alert.alert('Registro', 'Ya existe una cuenta con este documento. Inicie sesión.');
        nav.navigate('Login');
        return;
      }
      setEsArgo(r.existeEnArgo);
      if (r.alumno) {
        const n = String(r.alumno.nombreCompleto || r.alumno.nombres || '');
        if (n) setNombre(n);
      }
      setStep('form');
    } catch (e) {
      Alert.alert('Registro', e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function onRegistrar() {
    if (!email.trim() || !password || password.length < 6) {
      Alert.alert('Registro', 'Correo y contraseña (mín. 6 caracteres) son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const body = {
        numDoc: Number(numDoc),
        email: email.trim(),
        password,
        nombreCompleto: nombre.trim() || undefined,
      };
      if (config?.emailVerificacionRegistro) {
        const v = await registroSolicitar(body);
        setPendingId(v.pendingId);
        setStep('verify');
      } else {
        const auth = await registro(body);
        await signIn(email, password);
        Alert.alert('Registro', 'Cuenta creada correctamente');
      }
    } catch (e) {
      Alert.alert('Registro', e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function onConfirmar() {
    if (!codigo.trim()) return;
    setLoading(true);
    try {
      await registroConfirmar(pendingId, codigo.trim());
      await signIn(email, password);
      Alert.alert('Registro', 'Correo verificado. Bienvenido.');
    } catch (e) {
      Alert.alert('Verificación', e instanceof Error ? e.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  async function onReenviar() {
    try {
      await registroReenviarCodigo(pendingId);
      Alert.alert('Verificación', 'Código reenviado');
    } catch (e) {
      Alert.alert('Verificación', e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.pad}>
      <SurfaceCard>
        <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800', marginBottom: 12 }}>
          Crear cuenta
        </ScaledText>
        {step === 'doc' ? (
          <>
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
              Ingrese su documento para verificar si ya está en el sistema.
            </ScaledText>
            <IconInput value={numDoc} onChangeText={setNumDoc} placeholder="Documento" keyboardType="numeric" />
            <PrimaryButton label="Continuar" onPress={onBuscarDoc} loading={loading} fullWidth />
          </>
        ) : null}
        {step === 'form' ? (
          <>
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 8 }}>
              {esArgo ? 'Encontramos sus datos en ARGO.' : 'Complete su registro.'}
            </ScaledText>
            <IconInput value={nombre} onChangeText={setNombre} placeholder="Nombre completo" icon="person-outline" />
            <IconInput
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              icon="mail-outline"
              keyboardType="email-address"
            />
            <IconInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              icon="lock-closed-outline"
              secureTextEntry
            />
            <PrimaryButton label="Registrarme" onPress={onRegistrar} loading={loading} fullWidth />
          </>
        ) : null}
        {step === 'verify' ? (
          <>
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
              Enviamos un código a {email}. Ingréselo para activar su cuenta.
            </ScaledText>
            <IconInput value={codigo} onChangeText={setCodigo} placeholder="Código" keyboardType="numeric" />
            <PrimaryButton label="Verificar" onPress={onConfirmar} loading={loading} fullWidth />
            <PrimaryButton label="Reenviar código" variant="ghost" onPress={onReenviar} fullWidth />
          </>
        ) : null}
      </SurfaceCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
});
