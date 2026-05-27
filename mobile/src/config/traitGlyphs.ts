import { colors } from './theme'
import type { ProfileData } from './profiles'
import {
  GlyphAnalytics,
  GlyphBalance,
  GlyphDigital,
  GlyphGoal,
  GlyphGrowth,
  GlyphIncomeTrend,
  GlyphLiquidity,
  GlyphShieldCheck,
} from '../components/ui/BankGlyphs'

type TraitIcon = ProfileData['characteristics'][number]['icon']

const TRAIT_GLYPHS: Record<
  TraitIcon,
  { Glyph: typeof GlyphIncomeTrend; tone: { fg: string; bg: string } }
> = {
  trend: {
    Glyph: GlyphIncomeTrend,
    tone: { fg: colors.accent.green.icon, bg: `linear-gradient(145deg, ${colors.accent.green.bg}, #dcefe4)` },
  },
  shield: {
    Glyph: GlyphShieldCheck,
    tone: { fg: colors.accent.blue.icon, bg: `linear-gradient(145deg, ${colors.accent.blue.bg}, #dce8fc)` },
  },
  droplet: {
    Glyph: GlyphLiquidity,
    tone: { fg: colors.accent.blue.icon, bg: `linear-gradient(145deg, ${colors.accent.blue.bg}, #d8e4f8)` },
  },
  target: {
    Glyph: GlyphGoal,
    tone: { fg: colors.accent.purple.icon, bg: `linear-gradient(145deg, ${colors.accent.purple.bg}, #e6dcf8)` },
  },
  rocket: {
    Glyph: GlyphGrowth,
    tone: { fg: colors.accent.orange.icon, bg: `linear-gradient(145deg, ${colors.accent.orange.bg}, #fce8d4)` },
  },
  chart: {
    Glyph: GlyphAnalytics,
    tone: { fg: colors.accent.green.icon, bg: `linear-gradient(145deg, ${colors.accent.green.bg}, #dcefe4)` },
  },
  phone: {
    Glyph: GlyphDigital,
    tone: { fg: colors.accent.blue.icon, bg: `linear-gradient(145deg, ${colors.accent.blue.bg}, #dce8fc)` },
  },
  balance: {
    Glyph: GlyphBalance,
    tone: { fg: colors.accent.purple.icon, bg: `linear-gradient(145deg, ${colors.accent.purple.bg}, #e6dcf8)` },
  },
}

export function getTraitGlyph(icon: TraitIcon) {
  return TRAIT_GLYPHS[icon]
}
