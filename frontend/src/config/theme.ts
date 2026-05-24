export const colors = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#EAEAEA',

  primary: {
    DEFAULT: '#2563EB',
    dark: '#1D4ED8',
    light: '#93C5FD',
    bg: '#EFF6FF',
    bgLight: '#F8FBFF',
    glow: 'rgba(37,99,235,0.25)',
  },

  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    light: '#F3F4F6',
    white: '#FFFFFF',
  },

  segmented: {
    bg: '#F3F4F6',
    activeShadow: 'rgba(0,0,0,0.06)',
  },

  shadow: {
    card: '0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.04)',
    hover: '0 8px 24px rgba(0,0,0,0.06)',
  },

  rank: [
    { from: '#2563EB', to: '#1D4ED8', shadow: 'rgba(37,99,235,0.25)' },
    { from: '#059669', to: '#047857', shadow: 'rgba(5,150,105,0.25)' },
    { from: '#7C3AED', to: '#6D28D9', shadow: 'rgba(124,58,237,0.25)' },
    { from: '#D97706', to: '#B45309', shadow: 'rgba(217,119,6,0.25)' },
    { from: '#E11D48', to: '#BE123C', shadow: 'rgba(225,29,72,0.25)' },
  ],
} as const
