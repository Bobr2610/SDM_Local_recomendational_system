import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, pagePadding, shadows } from '../../config/theme'

export function Header() {
  return (
    <View style={[styles.header, shadows.header]}>
      <View style={styles.inner}>
        <LinearGradient
          colors={[colors.primary.DEFAULT, colors.primary.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Text style={styles.logoText}>С</Text>
        </LinearGradient>
        <View style={styles.titles}>
          <Text style={styles.title}>СДМ Хакатон</Text>
          <Text style={styles.subtitle}>Система рекомендаций банковских продуктов</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(250, 251, 253, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: pagePadding,
    paddingVertical: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  logoText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.white,
  },
  titles: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 2,
    color: colors.text.secondary,
  },
})
