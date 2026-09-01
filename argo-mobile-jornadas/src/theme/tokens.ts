/** Tokens visuales estilo fintech (alineado con argo-mobile-cajero). */
export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
  icon: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardPressed: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    shadowColor: '#3D5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
} as const;

export const spacing = {
  screen: 20,
  card: 18,
  section: 24,
} as const;
