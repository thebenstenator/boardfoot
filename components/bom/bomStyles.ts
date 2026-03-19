/**
 * Shared BOM section layout styles.
 * All sections use the same outer container and row structure
 * so they align consistently across the page.
 */

export const bomRow = "flex items-center w-full gap-4 py-1"
export const bomHeader = "flex items-center w-full gap-4 py-2 border-b text-xs text-muted-foreground font-medium"
export const bomSection = "space-y-3"
export const bomSectionHeader = "flex items-center justify-between"

// Column width tokens
export const col = {
  // Pinned ends
  first: "w-[20%] shrink-0 min-w-0",  // species / description — fixed 30%
  last: "w-20 text-right shrink-0",    // total — fixed, right aligned
  delete: "w-4 shrink-0",              // delete button

  // Middle columns — all flex-1 so they share remaining space equally
  sm: "flex-1 min-w-0",               // T, W, Qty, BF
  md: "flex-1 min-w-0",               // Length
  lg: "flex-1 min-w-0",               // $/unit, Cost, container size
  toggle: "w-10 shrink-0",            // ft/in toggle, BF/LF toggle
  unit: "flex-1 min-w-0",             // Unit dropdown
}