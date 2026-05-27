import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { parseGradientStops } from '../../utils/parseGradient'

export type GlyphTone = {
  fg: string
  bg: string
  ring?: string
}

type Variant = 'hero' | 'card' | 'trait' | 'income'

const SIZES: Record<Variant, { size: number; radius: number }> = {
  hero: { size: 52, radius: 16 },
  card: { size: 44, radius: 14 },
  trait: { size: 36, radius: 10 },
  income: { size: 40, radius: 12 },
}

export function GlyphBadge({
  variant,
  tone,
  children,
  style,
}: {
  variant: Variant
  tone: GlyphTone
  children: ReactNode
  style?: ViewStyle
}) {
  const { size, radius } = SIZES[variant]
  const [bgStart, bgEnd] = parseGradientStops(tone.bg)

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: tone.ring ? 1 : 0,
          borderColor: tone.ring ?? 'transparent',
        },
        shadowsForVariant(variant),
        style,
      ]}
    >
      <LinearGradient
        colors={[bgStart, bgEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View style={styles.icon}>{children}</View>
    </View>
  )
}

function shadowsForVariant(variant: Variant): ViewStyle {
  if (variant === 'hero') {
    return {
      shadowColor: '#1a2332',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 6,
    }
  }
  return {
    shadowColor: '#1a2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
