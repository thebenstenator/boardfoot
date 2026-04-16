"use client";

import { useState, useRef, useEffect } from "react";
import { useSpeciesPrices } from "@/hooks/useSpeciesPrices";
import { getNominalActual, getAllNominalSizes } from "@/lib/calculations/nominalActual";

interface SpeciesInputProps {
  value: string;
  onChange: (species: string, suggestedPrice?: number, dimensions?: { thickness: number; width: number }) => void;
  tabIndex?: number;
  autoFocusInput?: boolean;
}

export function SpeciesInput({ value, onChange, tabIndex, autoFocusInput }: SpeciesInputProps) {
  const { species, getSuggestedPrice } = useSpeciesPrices();
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build the combined filtered list: species matches first, then nominal matches
  const allNominals = getAllNominalSizes();

  const filteredSpecies =
    draft.length > 0
      ? species.filter((s) =>
          s.species_name.toLowerCase().includes(draft.toLowerCase()),
        )
      : [];

  // Show nominal sizes if draft contains 'x' or starts with a digit
  const showNominals = draft.length > 0 && (/x/i.test(draft) || /^\d/.test(draft));
  const filteredNominals = showNominals
    ? allNominals.filter((n) => n.toLowerCase().startsWith(draft.toLowerCase()))
    : [];

  // Combined: species first, then nominals, capped at 8 total
  const MAX_ITEMS = 8;
  const speciesSlice = filteredSpecies.slice(0, MAX_ITEMS);
  const nominalsSlice = filteredNominals.slice(0, MAX_ITEMS - speciesSlice.length);
  // Build a unified list for keyboard navigation
  type DropdownItem =
    | { kind: 'species'; name: string; displayPrice: number | null; isUserPrice: boolean }
    | { kind: 'nominal'; nominal: string; thickness: number; width: number };

  const dropdownItems: DropdownItem[] = [
    ...speciesSlice.map((s) => {
      const isUserPrice = s.my_price !== null;
      const displayPrice = isUserPrice
        ? s.my_price
        : s.price_low && s.price_high
          ? (s.price_low + s.price_high) / 2
          : null;
      return { kind: 'species' as const, name: s.species_name, displayPrice, isUserPrice };
    }),
    ...nominalsSlice.map((n) => {
      const dims = getNominalActual(n)!;
      return { kind: 'nominal' as const, nominal: n, thickness: dims.thickness, width: dims.width };
    }),
  ];

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (autoFocusInput) {
      inputRef.current?.focus();
    }
  }, [autoFocusInput]);

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

  function handleSelectSpecies(speciesName: string) {
    const suggested = getSuggestedPrice(speciesName);
    onChange(speciesName, suggested ?? undefined);
    setDraft(speciesName);
    setOpen(false);
  }

  function handleSelectNominal(nominal: string, thickness: number, width: number) {
    onChange(nominal, undefined, { thickness, width });
    setDraft(nominal);
    setOpen(false);
  }

  function handleSelectItem(item: DropdownItem) {
    if (item.kind === 'species') {
      handleSelectSpecies(item.name);
    } else {
      handleSelectNominal(item.nominal, item.thickness, item.width);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, dropdownItems.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && dropdownItems[highlighted]) {
        handleSelectItem(dropdownItems[highlighted]);
      } else {
        onChange(draft);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      if (open && dropdownItems[highlighted]) {
        handleSelectItem(dropdownItems[highlighted]);
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
        ref={inputRef}
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

      {open && dropdownItems.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-popover border rounded-md shadow-md overflow-hidden">
          {dropdownItems.map((item, i) => {
            if (item.kind === 'species') {
              return (
                <button
                  key={`species-${item.name}`}
                  onMouseDown={() => handleSelectSpecies(item.name)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center
                    cursor-pointer transition-colors
                    ${i === highlighted ? "bg-accent" : "hover:bg-accent"}`}
                >
                  <span>{item.name}</span>
                  {item.displayPrice !== null && (
                    <span className="text-xs text-muted-foreground">
                      ${item.displayPrice.toFixed(2)}/BF
                      {item.isUserPrice ? " ★" : " est."}
                    </span>
                  )}
                </button>
              );
            } else {
              // nominal size row
              return (
                <button
                  key={`nominal-${item.nominal}`}
                  onMouseDown={() => handleSelectNominal(item.nominal, item.thickness, item.width)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center
                    cursor-pointer transition-colors
                    ${i === highlighted ? "bg-accent" : "hover:bg-accent"}`}
                >
                  <span>{item.nominal.replace('x', '×')}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.thickness}" × {item.width}"
                  </span>
                </button>
              );
            }
          })}
          <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground/60">
            Est. prices — ★ to set your own
          </div>
        </div>
      )}
    </div>
  );
}
