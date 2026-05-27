import { colors } from './theme'
import {
  GlyphBusiness,
  GlyphCard,
  GlyphDeposit,
  GlyphLoan,
  GlyphProduct,
  GlyphServices,
  GlyphVault,
} from '../components/ui/BankGlyphs'

type GlyphComponent = typeof GlyphDeposit

export type CategoryGlyphMeta = {
  Glyph: GlyphComponent
  tone: { fg: string; bg: string; ring?: string }
  heroTone: { fg: string; bg: string; ring?: string }
}

const blue = {
  fg: colors.accent.blue.icon,
  bg: `linear-gradient(145deg, ${colors.accent.blue.bg}, #dce8fc)`,
  ring: 'rgba(61, 95, 196, 0.2)',
}
const green = {
  fg: colors.accent.green.icon,
  bg: `linear-gradient(145deg, ${colors.accent.green.bg}, #dcefe4)`,
  ring: 'rgba(45, 138, 92, 0.2)',
}
const purple = {
  fg: colors.accent.purple.icon,
  bg: `linear-gradient(145deg, ${colors.accent.purple.bg}, #e6dcf8)`,
  ring: 'rgba(124, 77, 204, 0.2)',
}
const orange = {
  fg: colors.accent.orange.icon,
  bg: `linear-gradient(145deg, ${colors.accent.orange.bg}, #fce8d4)`,
  ring: 'rgba(217, 122, 26, 0.2)',
}
const gold = {
  fg: colors.accent.yellow.text,
  bg: `linear-gradient(145deg, ${colors.accent.yellow.bg}, #f5ecd4)`,
  ring: 'rgba(138, 109, 26, 0.22)',
}
const neutral = {
  fg: colors.text.secondary,
  bg: `linear-gradient(145deg, #f3f5f8, #e8ecf2)`,
  ring: 'rgba(92, 107, 127, 0.15)',
}

const heroWhite = {
  fg: colors.text.white,
  bg: 'linear-gradient(155deg, rgba(255,255,255,0.28), rgba(255,255,255,0.12))',
  ring: 'rgba(255, 255, 255, 0.35)',
}

export const CATEGORY_GLYPHS: Record<string, CategoryGlyphMeta> = {
  deposits_and_savings_accounts_individuals: { Glyph: GlyphDeposit, tone: blue, heroTone: heroWhite },
  loans_individuals: { Glyph: GlyphLoan, tone: green, heroTone: heroWhite },
  debit_cards: { Glyph: GlyphCard, tone: purple, heroTone: heroWhite },
  rko_business_packages: { Glyph: GlyphBusiness, tone: orange, heroTone: heroWhite },
  deposits_business: { Glyph: GlyphVault, tone: gold, heroTone: heroWhite },
  additional_business_services: { Glyph: GlyphServices, tone: neutral, heroTone: heroWhite },
}

const DEFAULT: CategoryGlyphMeta = {
  Glyph: GlyphProduct,
  tone: neutral,
  heroTone: heroWhite,
}

export function getCategoryGlyph(category: string): CategoryGlyphMeta {
  return CATEGORY_GLYPHS[category] ?? DEFAULT
}
