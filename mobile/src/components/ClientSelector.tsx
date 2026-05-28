import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BriefcaseIcon, BuildingIcon, GraduationIcon, RocketIcon } from './ui/Icons'
import { PROFILES, SELECTOR_THEMES } from '../config/profiles'
import { colors, formatEuroYear, shadows } from '../config/theme'

const SELECTOR_ICONS = [GraduationIcon, BriefcaseIcon, RocketIcon, BuildingIcon]

type Props = {
  selectedIdx: number
  onSelect: (idx: number) => void
}

export function ClientSelector({ selectedIdx, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {PROFILES.map((p, idx) => {
        const active = selectedIdx === idx
        const Icon = SELECTOR_ICONS[idx]
        const theme = SELECTOR_THEMES[idx]

        return (
          <Pressable
            key={p.name}
            onPress={() => onSelect(idx)}
            style={[styles.card, active && styles.cardActive, shadows.card]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {active && <View style={styles.activeBar} />}
            <LinearGradient
              colors={['rgba(255,255,255,0)', theme.wash]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.avatarWrap}>
              <LinearGradient colors={p.avatarBg} style={styles.avatarRing}>
                <Image source={p.avatar} style={styles.avatar} />
              </LinearGradient>
              <View style={[styles.badge, { backgroundColor: theme.iconBg }]}>
                <Icon color={theme.accent} size={14} />
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.meta}>
                {p.info}, {p.age} лет
              </Text>
              <Text style={styles.income}>
                {formatEuroYear(p.modelIncomeEurYear)}
              </Text>
            </View>
            <View style={[styles.radio, active && styles.radioOn]}>
              {active && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: colors.primary.DEFAULT,
    ...shadows.profileActive,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary.DEFAULT,
  },
  avatarWrap: { position: 'relative' },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 22 },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text.primary,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    color: colors.text.secondary,
  },
  income: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: colors.text.muted,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary.DEFAULT },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.DEFAULT,
  },
})
