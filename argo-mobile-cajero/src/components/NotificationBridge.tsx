import { useEffect } from 'react';
import { useAlertPrefs } from '../context/AlertPrefsContext';
import { navigateFromAlertNotification, type AlertaNotifData } from '../navigation/navigationRef';
import {
  attachNotificationResponseListener,
  consumeInitialNotificationResponse,
  initSystemNotifications,
  setNotificationPrefs,
} from '../services/systemNotifications';

/** Enlaza permisos, preferencias y taps de notificaciones del sistema. */
export function NotificationBridge() {
  const alertPrefs = useAlertPrefs();

  useEffect(() => {
    setNotificationPrefs({
      enabled: alertPrefs.notificationsEnabled,
      sound: alertPrefs.soundEnabled,
    });
  }, [alertPrefs.notificationsEnabled, alertPrefs.soundEnabled]);

  useEffect(() => {
    if (!alertPrefs.notificationsEnabled) return;
    void initSystemNotifications();
  }, [alertPrefs.notificationsEnabled]);

  useEffect(() => {
    const onTap = (data: Record<string, unknown> | undefined) => {
      navigateFromAlertNotification(data as AlertaNotifData | undefined);
    };

    void consumeInitialNotificationResponse(onTap);
    return attachNotificationResponseListener(onTap);
  }, []);

  return null;
}
