import React from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenBody } from '../../components/ScreenBody';
import { AlumnoFormulario, type AlumnoFormGuardado } from '../../components/AlumnoFormulario';
import { ModuleScreenHero } from '../../components/ModuleScreenHero';
import type { RootStackParamList } from '../../navigation/types';

export default function AlumnoCrearScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();

  function onGuardado({ alumno, nombre }: AlumnoFormGuardado) {
    Alert.alert('Alumno registrado', `${nombre}\nDocumento ${alumno.numDoc}`, [
      { text: 'Volver a lista', style: 'cancel', onPress: () => nav.goBack() },
      {
        text: 'Ir a ficha',
        onPress: () =>
          nav.replace('AlumnoDetalle', {
            numDoc: String(alumno.numDoc),
            nombre,
            alumnoId: alumno._id,
          }),
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenBody>
        <ModuleScreenHero
          compact
          title="Nuevo alumno"
          subtitle="Identificación, datos personales, contacto, cobro, diversidad y empresa."
          icon="person-add"
        />
        <AlumnoFormulario onGuardado={onGuardado} onCancelar={() => nav.goBack()} />
      </ScreenBody>
    </KeyboardAvoidingView>
  );
}
