import { create } from 'zustand'
import type { UserProfile } from '@/types/bom'

interface UserStore {
  profile: UserProfile | null
  setProfile: (profile: UserProfile | null) => void
  tier: 'free' | 'pro'
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  tier: 'free',
  setProfile: (profile) => set({
    profile,
    tier: profile?.subscription_tier ?? 'free',
  }),
}))