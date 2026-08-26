import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type AlertaNotifData = {
  type?: string;
  alertId?: string;
  route?: string;
  documentoTitle?: string;
  documentoHtmlPath?: string;
};

export type { AlertaNotifData };

export function navigateFromAlertNotification(data: AlertaNotifData | undefined): void {
  if (!data || data.type !== 'argo-alerta' || !navigationRef.isReady()) return;

  if (data.documentoHtmlPath) {
    navigationRef.navigate('DocumentoViewer', {
      title: data.documentoTitle || 'Documento',
      htmlPath: data.documentoHtmlPath,
    });
    return;
  }

  const route = data.route as keyof RootStackParamList | undefined;
  if (!route) return;
  if (route === 'Home' || route === 'Caja' || route === 'Facturacion' || route === 'Alumnos' || route === 'AprobacionConsignacion' || route === 'Autorizaciones') {
    navigationRef.navigate(route);
  }
}
