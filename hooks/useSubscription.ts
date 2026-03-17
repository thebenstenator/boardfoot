import { useUserStore } from '@/store/userStore'

export function useSubscription() {
  const tier = useUserStore((state) => state.tier)
  return {
    tier,
    isPro: tier === 'pro',
    isFree: tier === 'free',
  }
}