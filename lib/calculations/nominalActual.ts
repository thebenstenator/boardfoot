/**
 * Nominal to Actual Lumber Dimensions
 *
 * When lumber is milled and dried, it shrinks from its nominal (named) size.
 * A "2x4" is actually 1.5" × 3.5". This table maps nominal to actual dimensions.
 *
 * Hardwoods bought rough or S4S are entered by the user at actual dimensions.
 * This lookup is primarily for dimensional softwood lumber (pine, fir, etc.)
 */

export interface NominalActual {
  thickness: number  // actual thickness in inches
  width: number      // actual width in inches
}

const NOMINAL_TO_ACTUAL: Record<string, NominalActual> = {
  '1x2':  { thickness: 0.75, width: 1.5 },
  '1x3':  { thickness: 0.75, width: 2.5 },
  '1x4':  { thickness: 0.75, width: 3.5 },
  '1x6':  { thickness: 0.75, width: 5.5 },
  '1x8':  { thickness: 0.75, width: 7.25 },
  '1x10': { thickness: 0.75, width: 9.25 },
  '1x12': { thickness: 0.75, width: 11.25 },
  '2x2':  { thickness: 1.5,  width: 1.5 },
  '2x3':  { thickness: 1.5,  width: 2.5 },
  '2x4':  { thickness: 1.5,  width: 3.5 },
  '2x6':  { thickness: 1.5,  width: 5.5 },
  '2x8':  { thickness: 1.5,  width: 7.25 },
  '2x10': { thickness: 1.5,  width: 9.25 },
  '2x12': { thickness: 1.5,  width: 11.25 },
  '4x4':  { thickness: 3.5,  width: 3.5 },
  '4x6':  { thickness: 3.5,  width: 5.5 },
}

/**
 * Look up actual dimensions for a nominal lumber size.
 * Returns null if the nominal size is not in the table (e.g. hardwoods).
 */
export function getNominalActual(nominal: string): NominalActual | null {
  // Normalize input: trim whitespace, lowercase, remove spaces around 'x'
  const normalized = nominal.trim().toLowerCase().replace(/\s*x\s*/i, 'x')
  return NOMINAL_TO_ACTUAL[normalized] ?? null
}

/**
 * Returns all known nominal sizes, useful for autocomplete dropdowns.
 */
export function getAllNominalSizes(): string[] {
  return Object.keys(NOMINAL_TO_ACTUAL)
}

/**
 * Given actual thickness and width, return the matching nominal size string,
 * or null if no match found.
 */
export function getActualToNominal(thickness: number, width: number): string | null {
  for (const [nominal, actual] of Object.entries(NOMINAL_TO_ACTUAL)) {
    if (Math.abs(actual.thickness - thickness) < 0.01 && Math.abs(actual.width - width) < 0.01) {
      return nominal
    }
  }
  return null
}