import { useCallback, useEffect, useState } from 'react'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ClientProfile } from '../components/ClientProfile'
import { ClientSelector } from '../components/ClientSelector'
import { RecommendationsPanel } from '../components/RecommendationsPanel'
import { InferenceBenchmarkBanner } from '../components/InferenceBenchmarkBanner'
import { Header } from '../components/layout/Header'
import { useInferenceBenchmark } from '../hooks/useInferenceBenchmark'
import { PROFILES } from '../config/profiles'
import { colors, pagePadding } from '../config/theme'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { useUserInputStore } from '../store/userInputStore'

export function HomeScreen() {
  const [selectedIdx, setSelectedIdx] = useState(3)
  const setField = useUserInputStore((s) => s.setField)
  const hydrate = useUserInputStore((s) => s.hydrate)

  const handleSelect = useCallback(
    (idx: number) => {
      const p = PROFILES[idx]
      if (!p) return
      setField('age', p.age)
      setField('balance', p.balance)
      setField('monthlyIncome', p.monthlyIncome)
      setField('accountType', p.accountType)
      setField('currency', p.currency)
      setField('fullName', p.name)
      setField('sex', p.sex)
      setField('seniorityMonths', p.seniorityMonths)
      setField('isNewCustomer', p.isNewCustomer)
      setField('segment', p.segment)
      setField('regionName', p.regionName)
      setSelectedIdx(idx)
    },
    [setField],
  )

  const goNext = useCallback(() => {
    handleSelect((selectedIdx + 1) % PROFILES.length)
  }, [handleSelect, selectedIdx])

  const goPrev = useCallback(() => {
    handleSelect((selectedIdx - 1 + PROFILES.length) % PROFILES.length)
  }, [handleSelect, selectedIdx])

  const swipe = useHorizontalSwipe(goNext, goPrev)

  useEffect(() => {
    void hydrate()
    handleSelect(selectedIdx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const profile = PROFILES[selectedIdx]
  const benchmark = useInferenceBenchmark()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={['#eef2fc', colors.bg, colors.bg]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbRight} />

      <Header />

      <ScrollView
        {...swipe.panHandlers}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <InferenceBenchmarkBanner
          status={benchmark.status}
          results={benchmark.results}
          error={benchmark.error}
        />

        <View style={styles.pageHeader}>
          <Text style={styles.sectionLabel}>Демо рекомендаций</Text>
          <Text style={styles.pageTitle}>Подберите продукты для клиента</Text>
          <Text style={styles.pageSub}>
            Выберите профиль клиента — рекомендации строятся моделью CatBoost на устройстве.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Клиенты</Text>
        <ClientSelector selectedIdx={selectedIdx} onSelect={handleSelect} />

        <View style={styles.columns}>
          <ClientProfile key={profile.name} profile={profile} />
          <RecommendationsPanel key={`rec-${profile.name}`} profile={profile} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  bgOrbTop: {
    position: 'absolute',
    top: -80,
    left: '10%',
    width: '120%',
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(61, 95, 196, 0.12)',
  },
  bgOrbRight: {
    position: 'absolute',
    top: 0,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 77, 204, 0.08)',
  },
  scroll: {
    paddingHorizontal: pagePadding,
    paddingTop: 20,
    paddingBottom: 32,
  },
  pageHeader: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
    color: colors.text.primary,
  },
  pageSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
    maxWidth: 480,
  },
  columns: {
    gap: 16,
    marginTop: 24,
  },

})
