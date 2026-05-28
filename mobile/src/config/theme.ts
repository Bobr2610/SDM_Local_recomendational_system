import { Platform, type ViewStyle } from 'react-native'

/** Design tokens — hex equivalents of OKLCH values in frontend/src/index.css */
export const colors = {
  bg: '#f5f7fb',
  surface: '#fafbfd',
  border: '#e2e8f0',
  borderLight: '#edf1f6',

  primary: {
    DEFAULT: '#3d5fc4',
    dark: '#2f4da8',
    light: '#5a76d4',
    bg: '#eef2fc',
    bgLight: '#f5f8fe',
    glow: 'rgba(61, 95, 196, 0.22)',
  },

  text: {
    primary: '#1a2332',
    secondary: '#5c6b7f',
    muted: '#8b97a8',
    white: '#fafbfd',
  },

  accent: {
    green: { bg: '#e8f5ee', icon: '#2d8a5c' },
    blue: { bg: '#e8f0fe', icon: '#3d5fc4' },
    purple: { bg: '#f0e8fe', icon: '#7c4dcc' },
    orange: { bg: '#fff4e6', icon: '#d97a1a' },
    yellow: { bg: '#f9f5e8', text: '#8a6d1a' },
  },

  segmented: {
    bg: '#eef1f6',
    activeShadow: 'rgba(61, 95, 196, 0.22)',
  },

  rank: [
    { from: '#3d5fc4', to: '#2f4da8', shadow: 'rgba(61, 95, 196, 0.28)' },
    { from: '#2d8a5c', to: '#247349', shadow: 'rgba(45, 138, 92, 0.22)' },
    { from: '#7c4dcc', to: '#6a3db8', shadow: 'rgba(124, 77, 204, 0.22)' },
    { from: '#d97a1a', to: '#c46a12', shadow: 'rgba(217, 122, 26, 0.22)' },
    { from: '#c0392b', to: '#a83226', shadow: 'rgba(192, 57, 43, 0.22)' },
  ],
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 20,
} as const

export function formatRubles(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}

export function formatEuroYear(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} EUR/год`
}

export function formatEuro(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} EUR`
}

function shadow(
  elevation: number,
  offsetY: number,
  radius: number,
  opacity: number,
): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#1a2332',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle
}

export const shadows = {
  card: shadow(3, 4, 14, 0.06),
  cardHover: shadow(6, 12, 28, 0.09),
  hero: {
    ...shadow(8, 8, 28, 0.28),
    shadowColor: colors.primary.DEFAULT,
  },
  header: shadow(2, 4, 20, 0.04),
  profileActive: shadow(6, 8, 24, 0.14),
  elevated: shadow(8, 16, 40, 0.08),
} as const

export const pagePadding = 16
