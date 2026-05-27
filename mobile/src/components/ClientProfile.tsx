import { Image, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { ProfileData } from '../config/profiles'
import { getTraitGlyph } from '../config/traitGlyphs'
import { colors, formatRubles, shadows } from '../config/theme'
import { GlyphWallet } from './ui/BankGlyphs'
import { GlyphBadge } from './ui/GlyphBadge'

const INCOME_TONE = {
  fg: colors.primary.DEFAULT,
  bg: `linear-gradient(145deg, ${colors.primary.bg}, #dce8fc)`,
  ring: 'rgba(61, 95, 196, 0.15)',
}

export function ClientProfile({ profile }: { profile: ProfileData }) {
  return (
    <View style={[styles.card, shadows.card]}>
      <LinearGradient colors={profile.avatarBg} style={styles.hero}>
        <View style={styles.heroFade} />
        <View style={styles.avatarOuter}>
          <Image source={profile.avatar} style={styles.avatar} />
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <View style={styles.roleRow}>
          <Text style={styles.role}>{profile.info}</Text>
          <Text style={styles.age}>{profile.age} лет</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.incomeBox}>
          <GlyphBadge variant="income" tone={INCOME_TONE}>
            <GlyphWallet size={20} color={INCOME_TONE.fg} />
          </GlyphBadge>
          <View style={styles.incomeText}>
            <Text style={styles.incomeLabel}>Ежемесячный доход</Text>
            <Text style={styles.incomeValue}>{formatRubles(profile.monthlyIncome)}</Text>
          </View>
        </View>

        <Text style={styles.desc}>{profile.description}</Text>

        <Text style={styles.sectionLabel}>Портрет клиента</Text>
        {profile.characteristics.map((ch) => {
          const { Glyph, tone } = getTraitGlyph(ch.icon)
          return (
            <View key={ch.label} style={styles.trait}>
              <GlyphBadge variant="trait" tone={tone}>
                <Glyph size={18} color={tone.fg} />
              </GlyphBadge>
              <Text style={styles.traitLabel}>{ch.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    backgroundColor: colors.surface,
    opacity: 0,
  },
  avatarOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  avatar: { width: '100%', height: '100%' },
  name: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 12,
    color: colors.text.primary,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  role: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary.bg,
    color: colors.primary.DEFAULT,
  },
  age: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  body: { padding: 16, paddingTop: 12 },
  incomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
  },
  incomeText: { flex: 1 },
  incomeLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text.muted,
  },
  incomeValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 2,
    color: colors.text.primary,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginBottom: 12,
  },
  trait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  traitLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: colors.text.primary,
  },
})
