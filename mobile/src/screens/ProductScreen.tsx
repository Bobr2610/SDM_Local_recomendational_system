import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Header } from '../components/layout/Header'
import { CATEGORY_LABELS, getProductById } from '../data/productParser'
import type { RootStackParamList } from '../navigation/types'
import { colors, pagePadding, shadows } from '../config/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>

export function ProductScreen({ route, navigation }: Props) {
  const product = getProductById(route.params.productId)
  const [imageVisible, setImageVisible] = useState(true)

  if (!product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Продукт не найден</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>На главную</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.bg}>
        <LinearGradient
          colors={['#eef2fc', colors.bg, colors.bg]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <Header />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← На главную</Text>
        </Pressable>

        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {CATEGORY_LABELS[product.category] ?? product.category}
              </Text>
            </View>
          </View>

          <View style={styles.imageWrap}>
            <LinearGradient
              colors={[colors.primary.bg, colors.bg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {imageVisible && product.image ? (
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
                onError={() => setImageVisible(false)}
              />
            ) : null}
          </View>

          <Text style={styles.desc}>{product.description}</Text>
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>На главную</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  bg: { ...StyleSheet.absoluteFill },
  scroll: {
    paddingHorizontal: pagePadding,
    paddingBottom: 32,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  backLink: { marginVertical: 12 },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary.bg,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  imageWrap: {
    height: 176,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.8,
  },
  desc: {
    padding: 20,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.white,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 20,
  },
})
