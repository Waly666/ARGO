import { Alert, Platform } from 'react-native';

import { solicitarEliminacion } from '../api/autorizacionApi';
import { ModuloCrud } from './crudPermiso';
import { puedeEliminarModulo, puedeSolicitarEliminacion } from './accionPermiso';

export type ResultadoEliminacion = 'eliminado' | 'solicitado' | 'cancelado' | 'error';

export type EliminarOSolicitarOptions = {
  modulo: ModuloCrud;
  idEntidad: string;
  resumen: string;
  permisos: string[];
  tituloConfirm?: string;
  mensajeConfirm?: string;
  confirmLabel?: string;
  ejecutar: () => Promise<unknown>;
};

function confirmarAlert(
  titulo: string,
  mensaje: string,
  confirmLabel: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

function solicitarMotivo(): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Motivo de la solicitud',
        'Indique brevemente por qué debe eliminarse (opcional).',
        (text) => resolve(text ?? ''),
        'plain-text',
        '',
        'default',
      );
      return;
    }
    Alert.alert('Motivo de la solicitud', '¿Enviar solicitud al administrador?', [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      { text: 'Enviar', onPress: () => resolve('') },
    ]);
  });
}

async function solicitarAutorizacion(
  opts: EliminarOSolicitarOptions,
): Promise<ResultadoEliminacion> {
  const motivo = await solicitarMotivo();
  if (motivo === null) return 'cancelado';

  try {
    await solicitarEliminacion({
      modulo: opts.modulo,
      idEntidad: opts.idEntidad,
      resumen: opts.resumen,
      motivo: motivo.trim() || null,
    });
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Solicitud enviada',
        'Su solicitud quedó pendiente. Un administrador la revisará en Configuración → Autorizaciones pendientes.',
        [{ text: 'Entendido', onPress: () => resolve() }],
      );
    });
    return 'solicitado';
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al registrar la solicitud.';
    Alert.alert('No se pudo enviar la solicitud', msg);
    return 'error';
  }
}

export async function ejecutarEliminacionOSolicitar(
  opts: EliminarOSolicitarOptions,
): Promise<ResultadoEliminacion> {
  const { modulo, idEntidad, resumen, permisos } = opts;
  const puedeEliminar = puedeEliminarModulo(permisos, modulo);
  const puedeSolicitar = puedeSolicitarEliminacion(permisos, modulo);
  if (!puedeEliminar && !puedeSolicitar) return 'cancelado';

  const titulo =
    opts.tituloConfirm ||
    (puedeEliminar ? `Eliminar ${modulo}` : 'Solicitar eliminación');
  const mensaje =
    opts.mensajeConfirm ||
    (puedeEliminar
      ? `¿Confirma eliminar ${resumen}? Esta acción no se puede deshacer.`
      : `No tiene permiso para eliminar directamente. Se enviará una solicitud para: ${resumen}.`);
  const confirmLabel = opts.confirmLabel || (puedeEliminar ? 'Eliminar' : 'Enviar solicitud');

  const ok = await confirmarAlert(titulo, mensaje, confirmLabel);
  if (!ok) return 'cancelado';

  if (puedeEliminar) {
    try {
      await opts.ejecutar();
      return 'eliminado';
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'AUTORIZACION_REQUERIDA' || /AUTORIZACION_REQUERIDA/i.test(err.message)) {
        return solicitarAutorizacion(opts);
      }
      throw e;
    }
  }

  return solicitarAutorizacion(opts);
}
