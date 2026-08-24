import { Alert } from 'react-native';

import { fetchCajaActiva } from '../api/client';

export async function ensureCajaAbierta(accion: string): Promise<boolean> {
  try {
    const r = await fetchCajaActiva();
    if (r.abierta) return true;
  } catch {
    // Si falla la consulta, dejar que el backend valide al registrar.
    return true;
  }
  Alert.alert(
    'Caja cerrada',
    `Debe abrir su caja antes de ${accion}. En el ERP: Caja → Abrir mi caja.`,
  );
  return false;
}
