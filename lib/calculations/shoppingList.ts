import type { LumberItem, HardwareItem, FinishItem } from "@/types/bom";

export interface ShoppingListItem {
  description: string;
  quantity: string;
  unit: string;
  estimatedCost: number;
  notes: string;
}

export interface ShoppingList {
  lumberYard: ShoppingListItem[];
  bigBox: ShoppingListItem[];
  specialty: ShoppingListItem[];
  anyStore: ShoppingListItem[];
}

// Species typically found at big box stores
const BIG_BOX_SPECIES = [
  "pine",
  "douglas fir",
  "fir",
  "cedar",
  "spruce",
  "plywood",
  "osb",
  "mdf",
  "particle board",
];

// Hardware typically found at specialty woodworking stores
const SPECIALTY_HARDWARE_KEYWORDS = [
  "pocket screw",
  "pocket hole",
  "domino",
  "biscuit",
  "drawer slide",
  "soft close",
  "undermount",
  "blum",
  "rockler",
  "woodcraft",
  "kreg",
  "festool",
  "router bit",
  "dovetail",
  "mortise",
  "tenon",
  "waterlox",
  "rubio",
  "osmo",
  "hard wax",
];

function isBigBoxSpecies(species: string): boolean {
  const lower = species.toLowerCase();
  return BIG_BOX_SPECIES.some((s) => lower.includes(s));
}

function isSpecialtyHardware(description: string): boolean {
  const lower = description.toLowerCase();
  return SPECIALTY_HARDWARE_KEYWORDS.some((k) => lower.includes(k));
}

export function buildShoppingList(
  lumberItems: LumberItem[],
  hardwareItems: HardwareItem[],
  finishItems: FinishItem[],
  wasteFactor: number,
): ShoppingList {
  const list: ShoppingList = {
    lumberYard: [],
    bigBox: [],
    specialty: [],
    anyStore: [],
  };

  // Sort lumber by store type
  for (const item of lumberItems) {
    if (item.is_reclaimed) continue  // already on-hand
    const adjustedQty = item.quantity / (1 - wasteFactor);
    const lengthFt =
      item.length_unit === "in" ? item.length_ft / 12 : item.length_ft;
    const bfPerPiece = (item.thickness_in * item.width_in * lengthFt) / 12;
    const totalBF = bfPerPiece * adjustedQty;
    const lineCost = totalBF * item.price_per_unit;

    const listItem: ShoppingListItem = {
      description: item.species || "Unknown species",
      quantity: `${totalBF.toFixed(2)} BF`,
      unit: item.pricing_mode === "per_lf" ? "LF" : "BF",
      estimatedCost: lineCost,
      notes: `${item.thickness_in}" × ${item.width_in}" × ${item.length_ft}${item.length_unit ?? "ft"} × ${item.quantity} pcs`,
    };

    if (isBigBoxSpecies(item.species)) {
      list.bigBox.push(listItem);
    } else {
      list.lumberYard.push(listItem);
    }
  }

  // Sort hardware by store type
  for (const item of hardwareItems) {
    const listItem: ShoppingListItem = {
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit,
      estimatedCost: item.quantity * item.unit_cost,
      notes: "",
    };

    if (isSpecialtyHardware(item.description)) {
      list.specialty.push(listItem);
    } else {
      list.bigBox.push(listItem);
    }
  }

  // All finish/consumables go to any store
  for (const item of finishItems) {
    list.anyStore.push({
      description: item.description,
      quantity: item.amount_used
        ? `${item.amount_used} ${item.unit}`
        : `${Math.round(item.fraction_used * 100)}% of container`,
      unit: item.unit,
      estimatedCost: item.container_cost * item.fraction_used,
      notes: "",
    });
  }

  return list;
}
