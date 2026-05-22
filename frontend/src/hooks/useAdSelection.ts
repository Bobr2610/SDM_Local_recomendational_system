import { useUserInputStore } from '../store'

export function useAdSelection() {
  const store = useUserInputStore()
  return {
    age: store.age,
    balance: store.balance,
    selectedAd: store.selectedAd,
    isLoading: store.isLoading,
    error: store.error,
    clearError: store.clearError,
    profile: {
      fullName: store.fullName,
      age: store.age,
      currency: store.currency,
      balance: store.balance,
      monthlyIncome: store.monthlyIncome,
      accountType: store.accountType,
    },
    setField: store.setField,
  }
}
