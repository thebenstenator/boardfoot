"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { useProjectStore } from "@/store/projectStore";
import type { UserProfile } from "@/types/bom";

export function useSubscription() {
  const { profile, setProfile, tier } = useUserStore();

  useEffect(() => {
    if (profile?.id) return; // already loaded

    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as UserProfile);
        useProjectStore.getState().setProfile(data as UserProfile);
      }
    }

    loadProfile();
  }, [profile?.id, setProfile]);

  return {
    tier,
    isPro: tier === "pro",
    isFree: tier === "free",
    profile,
  };
}
