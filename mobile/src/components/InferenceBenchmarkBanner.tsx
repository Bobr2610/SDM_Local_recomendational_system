import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'
import { colors } from '../config/theme'
import type { AllBenchmarkResults } from '../services/inferenceBenchmark'

type Props = {
  status: 'idle' | 'running' | 'done' | 'error'
  results: AllBenchmarkResults | null
  error: string | null
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function formatMs(ms: number) {
  return `${ms.toFixed(1)} ms`
}

export function InferenceBenchmarkBanner({ status, results, error }: Props) {
  if (Platform.OS !== 'android') return null

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Скорость inference (Android)</Text>
      <Text style={styles.hint}>
        Время отклика модели, не «Портрет клиента» ниже. Замер один раз при запуске.
      </Text>

      {status === 'running' && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Замер в фоне… UI остаётся активным</Text>
        </View>
      )}

      {status === 'error' && (
        <Text style={styles.errorText}>{error ?? 'Ошибка бенчмарка'}</Text>
      )}

      {status === 'done' && results && (
        <View style={styles.stats}>
          <Text style={styles.profileLine}>
            Профиль замера: <Text style={styles.profileName}>{results.profileName}</Text>
          </Text>
          <Text style={styles.profileSummary}>{results.profileSummary}</Text>
          <Text style={styles.backend}>
            Backend: <Text style={styles.backendValue}>{results.backend}</Text>
          </Text>

          <Text style={styles.group}>Инициализация модели</Text>
          <StatLine label="init" value={formatMs(results.initMs)} />

          <Text style={styles.group}>predictAsync (22 продукта)</Text>
          <StatLine label="среднее" value={formatMs(results.predict.averageMs)} />
          <StatLine label="min / max" value={`${formatMs(results.predict.minMs)} / ${formatMs(results.predict.maxMs)}`} />
          <StatLine label="p50 / p95" value={`${formatMs(results.predict.p50Ms)} / ${formatMs(results.predict.p95Ms)}`} />

          <Text style={styles.group}>fetchRecommendations (E2E)</Text>
          <StatLine label="среднее" value={formatMs(results.recommendations.averageMs)} />
          <StatLine
            label="min / max"
            value={`${formatMs(results.recommendations.minMs)} / ${formatMs(results.recommendations.maxMs)}`}
          />
          <StatLine
            label="p50 / p95"
            value={`${formatMs(results.recommendations.p50Ms)} / ${formatMs(results.recommendations.p95Ms)}`}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  profileLine: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  profileName: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileSummary: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 13,
    color: '#c0392b',
    lineHeight: 18,
  },
  stats: {
    gap: 4,
  },
  backend: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  backendValue: {
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  group: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
  },
})
