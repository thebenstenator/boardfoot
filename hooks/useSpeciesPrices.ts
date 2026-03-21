"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SpeciesPrice {
  species_name: string;
  price_low: number | null;
  price_high: number | null;
  notes: string | null;
  my_price: number | null; // user override if exists
}

export function useSpeciesPrices() {
  const [species, setSpecies] = useState<SpeciesPrice[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch global prices
      const { data: globalPrices } = await supabase
        .from("species_prices")
        .select("species_name, price_low, price_high, notes")
        .order("species_name");

      if (!globalPrices) return;

      // Fetch user overrides if logged in
      let userOverrides: Record<string, number> = {};
      if (user) {
        const { data: overrides } = await supabase
          .from("user_species_prices")
          .select("species_name, my_price")
          .eq("user_id", user.id);

        if (overrides) {
          userOverrides = Object.fromEntries(
            overrides.map((o) => [o.species_name, o.my_price]),
          );
        }
      }

      setSpecies(
        globalPrices.map((s) => ({
          ...s,
          my_price: userOverrides[s.species_name] ?? null,
        })),
      );
    }

    load();
  }, []);

  async function saveUserPrice(speciesName: string, price: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_species_prices").upsert({
      user_id: user.id,
      species_name: speciesName,
      my_price: price,
      updated_at: new Date().toISOString(),
    });

    // Update local state
    setSpecies((prev) =>
      prev.map((s) =>
        s.species_name === speciesName ? { ...s, my_price: price } : s,
      ),
    );
  }

  function getSuggestedPrice(speciesName: string): number | null {
    const match = species.find((s) => s.species_name === speciesName);
    if (!match) return null;
    if (match.my_price !== null) return match.my_price;
    if (match.price_low !== null && match.price_high !== null) {
      return (match.price_low + match.price_high) / 2;
    }
    return null;
  }

  return { species, saveUserPrice, getSuggestedPrice };
}
