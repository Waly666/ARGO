import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { AlertaItem } from './alertStore';

const CHANNEL_ID = 'argo-alertas';

export type NotificationPrefs = {
  enabled: boolean;
  sound: boolean;
};

let prefs: NotificationPrefs = { enabled: true, sound: true };
let initialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: prefs.sound,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function setNotificationPrefs(next: NotificationPrefs): void {
  prefs = next;
}

function notificationId(alertaId: string): string {
  return `argo-${alertaId}`;
}

export async function initSystemNotifications(): Promise<boolean> {
  if (initialized) return prefs.enabled;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertas ARGO',
      description: 'Caja, comprobantes, certificados y avisos operativos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      enableVibrate: true,
      sound: 'default',
      showBadge: true,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    granted = req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  initialized = true;
  return granted;
}

export async function showAlertNotification(alerta: AlertaItem): Promise<void> {
  if (!prefs.enabled) return;

  const ok = await initSystemNotifications();
  if (!ok) return;

  const content: Notifications.NotificationContentInput = {
    title: alerta.titulo,
    body: alerta.detalle,
    data: {
      type: 'argo-alerta',
      alertId: alerta.id,
      route: alerta.route ?? null,
      documentoTitle: alerta.documento?.title ?? null,
      documentoHtmlPath: alerta.documento?.htmlPath ?? null,
    },
    sound: prefs.sound ? 'default' : undefined,
    priority: alerta.critico
      ? Notifications.AndroidNotificationPriority.HIGH
      : Notifications.AndroidNotificationPriority.DEFAULT,
    ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
  };

  await Notifications.scheduleNotificationAsync({
    identifier: notificationId(alerta.id),
    content,
    trigger: null,
  });
}

export async function cancelAlertNotification(alertaId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId(alertaId));
  } catch {
    /* ignore */
  }
}

export async function clearAllAlertNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    /* ignore */
  }
}

export function attachNotificationResponseListener(
  onResponse: (data: Record<string, unknown> | undefined) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((ev) => {
    onResponse(ev.notification.request.content.data as Record<string, unknown> | undefined);
  });
  return () => sub.remove();
}

export async function consumeInitialNotificationResponse(
  onResponse: (data: Record<string, unknown> | undefined) => void,
): Promise<void> {
  const last = await Notifications.getLastNotificationResponseAsync();
  if (!last) return;
  onResponse(last.notification.request.content.data as Record<string, unknown> | undefined);
}
