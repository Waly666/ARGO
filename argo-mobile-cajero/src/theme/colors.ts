/** Paleta fintech — azul royal, fondos claros, acentos suaves. */
export const colors = {
  primary: '#3D5CFF',
  primaryDark: '#2B46E0',
  primaryLight: '#6B84FF',
  navy: '#0B1026',
  navySoft: '#151B33',
  accent: '#22D3EE',
  accentSoft: '#EEF2FF',
  bg: '#F4F6FB',
  bgAlt: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  border: '#E8ECF4',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  warn: '#F59E0B',
  warnBg: '#FFFBEB',
  ok: '#10B981',
  okBg: '#ECFDF5',
  shadow: '#3D5CFF',
  chipBg: '#EEF2FF',
};

export function themeColors(highContrast: boolean) {
  if (!highContrast) return colors;
  return {
    ...colors,
    bg: '#0B1026',
    bgAlt: '#151B33',
    card: '#1A2038',
    text: '#F8FAFC',
    textSoft: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#2D3555',
    primary: '#6B84FF',
    primaryDark: '#3D5CFF',
    primaryLight: '#93AAFF',
    navy: '#060914',
    navySoft: '#0B1026',
    accent: '#67E8F9',
    accentSoft: '#164E63',
    chipBg: '#1E2642',
    shadow: '#000000',
  };
}
