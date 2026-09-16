import {Platform} from 'react-native';

/**
 * Shared visual language for the app. Palette is picked from the book cover:
 * deep emerald with a muted gold accent.
 */
export const colors = {
  primary: '#136F4E',
  primaryDark: '#0C5239',
  primaryTint: '#E7F1EC',
  accent: '#C9A227',
  background: '#F1F4F3',
  surface: '#FFFFFF',
  text: '#16211D',
  textMuted: '#6B7A75',
  border: '#E4EAE7',
  overlay: 'rgba(12, 32, 24, 0.45)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

/**
 * Elevation on Android, matching soft shadow on iOS.
 */
export function shadow(level) {
  if (Platform.OS === 'android') {
    return {elevation: level};
  }
  return {
    shadowColor: '#0C2018',
    shadowOpacity: 0.12 + level * 0.01,
    shadowRadius: level * 1.4,
    shadowOffset: {width: 0, height: level * 0.5},
  };
}
