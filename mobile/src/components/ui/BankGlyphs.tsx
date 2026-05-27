import Svg, { Circle, Path, Rect } from 'react-native-svg'

type G = { color?: string; size?: number }

const ON_ACCENT = '#fafbfd'

function GWrap({ size = 24, color = '#3d5fc4', children }: G & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  )
}

export function GlyphDeposit({ size = 24, color = '#3d5fc4' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} d="M12 3 4 7.2v2.3L12 14l8-4.5V7.2L12 3Zm0 2.4 5.2 2.9L12 11.2 6.8 8.3 12 5.4Z" />
      <Path fill={color} opacity={0.38} d="M5 11.5v5.8L12 21l7-3.7v-5.8l-2 .9v4.1L12 18.6 7 15.5v-4.1l-2-.9Z" />
      <Circle cx={12} cy={9.5} r={1.6} fill={color} />
    </GWrap>
  )
}

export function GlyphLoan({ size = 24, color = '#2d8a5c' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} opacity={0.35} d="M6 4h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <Path fill={color} d="M8 4h8l3 3H8V4Zm-1 8h6v1.5H7V12Zm0 3h4v1.5H7V15Z" />
      <Circle cx={16.5} cy={16.5} r={4.5} fill={color} />
      <Path fill={ON_ACCENT} d="M15.1 16.5h.9v-2.2h1.1v2.2h.9v1h-.9v.9h-1.1v-.9h-.9v-1Z" />
    </GWrap>
  )
}

export function GlyphCard({ size = 24, color = '#7c4dcc' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Rect x={2} y={5} width={20} height={14} rx={3} fill={color} opacity={0.32} />
      <Rect x={2} y={5} width={20} height={14} rx={3} fill={color} />
      <Rect x={2} y={9.5} width={20} height={3} fill={color} opacity={0.22} />
      <Rect x={5} y={14} width={5} height={3.5} rx={1} fill={ON_ACCENT} opacity={0.9} />
      <Rect x={13} y={14.8} width={6} height={1.2} rx={0.6} fill={ON_ACCENT} opacity={0.75} />
    </GWrap>
  )
}

export function GlyphBusiness({ size = 24, color = '#d97a1a' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} opacity={0.34} d="M4 20V9l8-4 8 4v11H4Z" />
      <Path fill={color} d="M6 20V10.2l6-3 6 3V20H6Zm3-8.5h6v1.5H9V11.5Zm0 3h6v1.5H9v-1.5Z" />
      <Path fill={color} d="M10 20v-4h4v4h-4Z" />
    </GWrap>
  )
}

export function GlyphVault({ size = 24, color = '#8a6d1a' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Rect x={3} y={3} width={18} height={18} rx={3} fill={color} opacity={0.32} />
      <Rect x={3} y={3} width={18} height={18} rx={3} fill={color} />
      <Circle cx={12} cy={12} r={5} fill={ON_ACCENT} opacity={0.92} />
      <Circle cx={12} cy={12} r={2.2} fill={color} />
      <Rect x={11} y={7} width={2} height={5} rx={1} fill={color} />
    </GWrap>
  )
}

export function GlyphServices({ size = 24, color = '#5c6b7f' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} opacity={0.34} d="M8 3h8v3H8V3Z" />
      <Path fill={color} d="M7 5h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <Path fill={ON_ACCENT} d="M8.5 11h7v1.4h-7V11Zm0 3.2h5v1.4h-5v-1.4Z" opacity={0.9} />
    </GWrap>
  )
}

export function GlyphProduct({ size = 24, color = '#5c6b7f' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} opacity={0.34} d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <Path fill={color} d="M12 4.2 5.5 8 12 11.8 18.5 8 12 4.2Zm-6.5 6.3L12 14l6.5-3.5L12 17.5 5.5 14Z" />
    </GWrap>
  )
}

export function GlyphIncomeTrend({ size = 24, color = '#2d8a5c' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Rect x={3} y={14} width={4} height={7} rx={1} fill={color} opacity={0.35} />
      <Rect x={10} y={10} width={4} height={11} rx={1} fill={color} opacity={0.55} />
      <Rect x={17} y={6} width={4} height={15} rx={1} fill={color} />
      <Path fill={color} d="m16 8 2-2 2 2 1.2-1.2L18 4l-3.2 3.2L16 8Z" />
    </GWrap>
  )
}

export function GlyphShieldCheck({ size = 24, color = '#3d5fc4' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} opacity={0.32} d="M12 2 4 6v6c0 5.2 3.4 8.8 8 10 4.6-1.2 8-4.8 8-10V6l-8-4Z" />
      <Path fill={color} d="M12 2 4 6v6c0 5.2 3.4 8.8 8 10 4.6-1.2 8-4.8 8-10V6l-8-4Z" />
      <Path
        fill={ON_ACCENT}
        d="m10.2 12.2 1.6 1.6 3.8-4"
        stroke={ON_ACCENT}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </GWrap>
  )
}

export function GlyphLiquidity({ size = 24, color = '#3d5fc4' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Circle cx={8} cy={14} r={4} fill={color} opacity={0.38} />
      <Circle cx={14} cy={12} r={4} fill={color} opacity={0.58} />
      <Circle cx={17} cy={16} r={4} fill={color} />
      <Path fill={color} d="M6 7h12v1.5H6V7Zm2-3h8v1.5H8V4Z" opacity={0.7} />
    </GWrap>
  )
}

export function GlyphGoal({ size = 24, color = '#7c4dcc' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Circle cx={12} cy={12} r={9} fill={color} opacity={0.3} />
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={5.5} fill={color} opacity={0.5} />
      <Circle cx={12} cy={12} r={2} fill={color} />
    </GWrap>
  )
}

export function GlyphGrowth({ size = 24, color = '#d97a1a' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} opacity={0.32} d="M4 20h16v2H4v-2Z" />
      <Path fill={color} d="M6 16.5 11 11l3.5 3.5L20 9l1.4 1.4L14.5 17 11 13.5 7.4 17 6 16.5Z" />
      <Circle cx={18} cy={7} r={2.5} fill={color} />
    </GWrap>
  )
}

export function GlyphAnalytics({ size = 24, color = '#2d8a5c' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} d="M5 4h3v16H5V4Zm5.5 6h3v10h-3v-10ZM16 9h3v11h-3V9Z" opacity={0.4} />
      <Path fill={color} d="M5 8h3v12H5V8Zm5.5 4h3v8h-3v-8ZM16 6h3v14h-3V6Z" />
    </GWrap>
  )
}

export function GlyphDigital({ size = 24, color = '#3d5fc4' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Rect x={7} y={2} width={10} height={20} rx={2.5} fill={color} opacity={0.32} />
      <Rect x={7} y={2} width={10} height={20} rx={2.5} fill={color} />
      <Circle cx={12} cy={18.5} r={1.2} fill={ON_ACCENT} />
      <Rect x={9} y={5} width={6} height={9} rx={1} fill={ON_ACCENT} opacity={0.88} />
    </GWrap>
  )
}

export function GlyphBalance({ size = 24, color = '#7c4dcc' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} d="M12 3v3M5 8h14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path fill={color} opacity={0.35} d="M6 8 4 20h5L6 8Zm12 0 2 12h-5l-2-12Z" />
      <Path fill={color} d="M6 8 5 18h4l1-10Zm12 0 1 10h-4l-1-10Z" />
      <Circle cx={7.5} cy={18} r={2} fill={color} />
      <Circle cx={16.5} cy={18} r={2} fill={color} />
    </GWrap>
  )
}

export function GlyphWallet({ size = 24, color = '#3d5fc4' }: G) {
  return (
    <GWrap size={size} color={color}>
      <Path fill={color} opacity={0.34} d="M3 7a3 3 0 0 1 3-3h12v16H6a3 3 0 0 1-3-3V7Z" />
      <Path fill={color} d="M6 4h13a2 2 0 0 1 2 2v2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm11 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </GWrap>
  )
}
