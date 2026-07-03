import 'react-native-gesture-handler';
import './src/disable-native-screens';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { registerRootComponent } from 'expo';

import App from './App';
import { JORNADAS_VERDE } from './src/config/appBranding';

SplashScreen.preventAutoHideAsync().catch(() => {});
void SystemUI.setBackgroundColorAsync(JORNADAS_VERDE);

registerRootComponent(App);
