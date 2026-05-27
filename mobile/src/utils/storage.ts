import AsyncStorage from '@react-native-async-storage/async-storage'

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const item = await AsyncStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : null
  } catch {
    return null
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}
