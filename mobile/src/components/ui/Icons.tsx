import type { ReactNode } from 'react'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

type IconProps = { color?: string; size?: number }

function StrokeIcon({
  size = 22,
  color = 'currentColor',
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  )
}

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function GraduationIcon({ color = '#3d5fc4', size = 14 }: IconProps) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M22 10v6M2 10l10-5 10 5-10 5z" {...stroke(color)} />
      <Path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" {...stroke(color)} />
    </StrokeIcon>
  )
}

export function BriefcaseIcon({ color = '#7c4dcc', size = 14 }: IconProps) {
  return (
    <StrokeIcon size={size} color={color}>
      <Rect x="2" y="7" width="20" height="14" rx="2" {...stroke(color)} />
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" {...stroke(color)} />
    </StrokeIcon>
  )
}

export function RocketIcon({ color = '#d97a1a', size = 14 }: IconProps) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path
        d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
        {...stroke(color)}
      />
      <Path
        d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
        {...stroke(color)}
      />
      <Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" {...stroke(color)} />
      <Path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" {...stroke(color)} />
    </StrokeIcon>
  )
}

export function BuildingIcon({ color = '#2d8a5c', size = 14 }: IconProps) {
  return (
    <StrokeIcon size={size} color={color}>
      <Rect x="4" y="2" width="16" height="20" rx="2" {...stroke(color)} />
      <Path d="M9 22v-4h6v4" {...stroke(color)} />
      <Circle cx="8" cy="6" r="0.01" fill={color} />
      <Circle cx="16" cy="6" r="0.01" fill={color} />
      <Circle cx="12" cy="6" r="0.01" fill={color} />
      <Circle cx="8" cy="10" r="0.01" fill={color} />
      <Circle cx="16" cy="10" r="0.01" fill={color} />
      <Circle cx="12" cy="10" r="0.01" fill={color} />
      <Circle cx="8" cy="14" r="0.01" fill={color} />
      <Circle cx="16" cy="14" r="0.01" fill={color} />
      <Circle cx="12" cy="14" r="0.01" fill={color} />
    </StrokeIcon>
  )
}
