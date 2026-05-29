import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import type { ProfileData } from '../config/profiles'
import { colors, shadows } from '../config/theme'
import type { AdProduct } from '../data/productParser'
import {
  fetchRecommendationsForProfile,
  getPopularProducts,
  useUserInputStore,
} from '../store/userInputStore'
import type { RootStackParamList } from '../navigation/types'
import { CategoryGlyph } from './ui/CategoryGlyph'

type Nav = NativeStackNavigationProp<RootStackParamList>

const CATEGORY_TAGS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: 'Вклад',
  loans_individuals: 'Кредит',
  debit_cards: 'Карта',
  rko_business_packages: 'РКО',
  deposits_business: 'Депозит',
  additional_business_services: 'Услуга',
}

function getCategoryTag(cat: string): string {
  return CATEGORY_TAGS[cat] ?? cat
}

function uniqueProducts(items: AdProduct[], limit: number): AdProduct[] {
  const seen = new Set<string>()
  const out: AdProduct[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}

function HeroRecCard({
  product,
  onPress,
}: {
  product: AdProduct
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.heroCard, shadows.hero]}>
      <LinearGradient
        colors={[colors.primary.DEFAULT, colors.primary.dark, '#2a4088']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroOrb} />
      <View style={styles.heroLayout}>
        <View style={styles.heroContent}>
          <View style={styles.heroTags}>
            <Text style={styles.rankBadgeHero}>Лучший выбор</Text>
            <Text style={styles.recTagHero}>{getCategoryTag(product.category)}</Text>
          </View>
          <Text style={styles.heroName}>{product.name}</Text>
          <Text style={styles.heroDesc} numberOfLines={3}>
            {product.description}
          </Text>
        </View>
        <CategoryGlyph category={product.category} variant="hero" />
      </View>
    </Pressable>
  )
}

function SecondaryRecCard({
  product,
  rank,
  onPress,
}: {
  product: AdProduct
  rank: number
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.recCard, shadows.card]}>
      <View style={styles.recTop}>
        <Text style={styles.recRank}>{rank}</Text>
        <Text style={styles.recTag}>{getCategoryTag(product.category)}</Text>
      </View>
      <View style={styles.recGlyph}>
        <CategoryGlyph category={product.category} variant="card" />
      </View>
      <Text style={styles.recName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.recDesc} numberOfLines={2}>
        {product.description}
      </Text>
    </Pressable>
  )
}

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: 'profile' | 'popular'
  onChange: (m: 'profile' | 'popular') => void
}) {
  return (
    <View style={styles.modeHeader}>
      <Text style={styles.modeTitle}>Режим рекомендаций</Text>
      <View style={styles.modeSwitch}>
        {(['profile', 'popular'] as const).map((m) => {
          const active = mode === m
          return (
            <Pressable
              key={m}
              onPress={() => onChange(m)}
              style={[styles.modeBtn, active && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, active && styles.modeTextActive]}>
                {m === 'profile' ? 'По профилю' : 'Популярные'}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function RecommendationsPanel({ profile }: { profile: ProfileData | null }) {
  const navigation = useNavigation<Nav>()
  const [mode, setMode] = useState<'profile' | 'popular'>('profile')
  const clickHistory = useUserInputStore((s) => s.clickHistory)
  const trackClick = useUserInputStore((s) => s.trackClick)
  const [products, setProducts] = useState<AdProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (mode === 'popular') {
      setLoading(false)
      setModelError(null)
      setProducts(uniqueProducts(getPopularProducts(), 5))
      return
    }

    if (!profile) {
      setLoading(false)
      setModelError(null)
      setProducts([])
      return
    }

    setLoading(true)
    setModelError(null)
    setProducts([])

    void (async () => {
      const result = await fetchRecommendationsForProfile(profile)
      if (cancelled) return
      setLoading(false)
      if (result.status === 'error') {
        setModelError(result.message)
        setProducts([])
        return
      }
      setModelError(null)
      setProducts(uniqueProducts(result.products, 5))
    })()

    return () => {
      cancelled = true
    }
  }, [profile, mode, clickHistory])

  const openProduct = (id: string) => {
    trackClick(id)
    navigation.navigate('Product', { productId: id })
  }

  return (
    <View style={[styles.panel, shadows.elevated]}>
      <ModeSwitch mode={mode} onChange={setMode} />
      <Text style={styles.sectionLabel}>
        {mode === 'profile' ? 'Топ-5 · CatBoost на устройстве' : 'Топ-5 · популярные (не модель)'}
      </Text>

      {mode === 'profile' && loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Считаем рекомендации модели…</Text>
        </View>
      )}

      {mode === 'profile' && modelError && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Модель недоступна</Text>
          <Text style={styles.errorText}>{modelError}</Text>
        </View>
      )}

      {products[0] && (
        <View style={styles.heroWrap}>
          <HeroRecCard product={products[0]} onPress={() => openProduct(products[0].id)} />
        </View>
      )}

      <View style={styles.grid}>
        {products.slice(1).map((p, i) => (
          <View key={p.id} style={styles.gridItem}>
            <SecondaryRecCard product={p} rank={i + 2} onPress={() => openProduct(p.id)} />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  modeHeader: { marginBottom: 20 },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.segmented.bg,
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.primary.DEFAULT,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modeTextActive: { color: colors.text.white },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  errorBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#f5c6c2',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c0392b',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#922b21',
  },
  heroWrap: { marginBottom: 12 },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 120,
  },
  heroOrb: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  heroContent: { flex: 1, minWidth: 0 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  rankBadgeHero: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.accent.yellow.bg,
    color: colors.accent.yellow.text,
  },
  recTagHero: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: colors.text.white,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
    color: colors.text.white,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(250, 251, 253, 0.85)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: { width: '100%' },
  recCard: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 168,
  },
  recTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recRank: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: colors.bg,
    color: colors.text.muted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  recTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.bg,
    color: colors.text.muted,
  },
  recGlyph: { marginBottom: 12 },
  recName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: 6,
  },
  recDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.secondary,
  },
})
