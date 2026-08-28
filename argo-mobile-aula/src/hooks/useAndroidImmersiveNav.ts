import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Oculta la barra de navegación de Android (círculo / atrás / recientes).
 * Con edge-to-edge solo setVisibilityAsync es compatible; el usuario puede
 * mostrarla con el gesto del sistema (deslizar desde abajo).
 */
export function useAndroidImmersiveNav(enabled = true) {
  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;

    void NavigationBar.setVisibilityAsync('hidden');

    return () => {
      void NavigationBar.setVisibilityAsync('visible');
    };
  }, [enabled]);
}
