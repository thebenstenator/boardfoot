"use client";

import { useState, useRef, useEffect } from "react";
import { useSpeciesPrices } from "@/hooks/useSpeciesPrices";

interface SpeciesInputProps {
  value: string;
  onChange: (species: string, suggestedPrice?: number) => void;
  tabIndex?: number;
}

export function SpeciesInput({ value, onChange, tabIndex }: SpeciesInputProps) {
  const { species, getSuggestedPrice } = useSpeciesPrices();
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered =
    draft.length > 0
      ? species.filter((s) =>
          s.species_name.toLowerCase().includes(draft.toLowerCase()),
        )
      : [];

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(speciesName: string) {
    const suggested = getSuggestedPrice(speciesName);
    onChange(speciesName, suggested ?? undefined);
    setDraft(speciesName);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[highlighted]) {
        handleSelect(filtered[highlighted].species_name);
      } else {
        onChange(draft);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      if (open && filtered[highlighted]) {
        handleSelect(filtered[highlighted].species_name);
      } else {
        onChange(draft);
      }
      setOpen(false);
    }
  }

  function handleBlur() {
    // Small delay so click on dropdown item registers first
    setTimeout(() => {
      onChange(draft);
      setOpen(false);
    }, 150);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => draft.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
          focus:outline-none focus:border-ring focus:bg-background hover:border-border"
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-popover border rounded-md shadow-md overflow-hidden">
          {filtered.map((s, i) => {
            const isUserPrice = s.my_price !== null;
            const displayPrice = isUserPrice
              ? s.my_price
              : s.price_low && s.price_high
                ? (s.price_low + s.price_high) / 2
                : null;

            return (
              <button
                key={s.species_name}
                onMouseDown={() => handleSelect(s.species_name)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center
                  cursor-pointer transition-colors
                  ${i === highlighted ? "bg-accent" : "hover:bg-accent"}`}
              >
                <span>{s.species_name}</span>
                {displayPrice !== null && (
                  <span className="text-xs text-muted-foreground">
                    ${displayPrice.toFixed(2)}/BF
                    {isUserPrice ? " ★" : " est."}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
