import { Alert } from 'react-native';

let ultimoAvisoMs = 0;

export function procesarHeadersHorarioOperacion(headers: Headers): void {
  const tipo = headers.get('X-ARGO-Horario-Aviso');
  if (tipo !== 'gracia') return;
  const now = Date.now();
  if (now - ultimoAvisoMs < 8000) return;
  ultimoAvisoMs = now;

  const min = headers.get('X-ARGO-Horario-Gracia-Min');
  const cajaAbierta = headers.get('X-ARGO-Horario-Caja-Abierta') === '1';
  let mensaje =
    'El horario de operación ha finalizado. Termine su trabajo pendiente; la sesión se cerrará al agotar el período de gracia o al cerrar la caja.';
  if (cajaAbierta) mensaje += ' Tiene la caja abierta: ciérrela para finalizar.';
  if (min) mensaje += ` (${min} min restantes)`;

  Alert.alert('Horario de operación', mensaje, [{ text: 'Entendido' }]);
}
