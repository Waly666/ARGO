import type { ViewStyle } from 'react-native';

import { shadows as tokenShadows } from './tokens';

/** Sombras estilo fintech (ARGO Cajero). */
export const shadow = {
  sm: {
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  } satisfies ViewStyle,
  md: tokenShadows.card satisfies ViewStyle,
  lg: {
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  } satisfies ViewStyle,
  button: tokenShadows.button satisfies ViewStyle,
};
