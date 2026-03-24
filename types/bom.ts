/**
 * BOM Domain Types
 *
 * These types mirror the database schema in ARCHITECTURE.md.
 * All slices import from here — do not define BOM types anywhere else.
 */

export type LengthUnit = 'ft' | 'in'

// ─── Lumber ───────────────────────────────────────────────────────────────────

export type PricingMode = 'per_bf' | 'per_lf'

export interface LumberItem {
  id: string
  project_id: string
  species: string
  thickness_in: number       // Rough thickness (4/4 = 1.0")
  width_in: number
  length_ft: number
  quantity: number
  pricing_mode: PricingMode
  price_per_unit: number     // $/BF or $/LF depending on pricing_mode
  is_reclaimed: boolean
  waste_override: number | null  // null = use project default
  notes: string
  sort_order: number
  created_at: string
  length_unit: LengthUnit
}

// ─── Hardware ─────────────────────────────────────────────────────────────────

export type HardwareUnit = 'each' | 'box' | 'pair' | 'set' | 'lb' | 'oz'

export interface HardwareItem {
  id: string
  project_id: string
  description: string
  quantity: number
  unit: HardwareUnit
  unit_cost: number
  notes: string
  sort_order: number
  created_at: string
}

// ─── Finish ───────────────────────────────────────────────────────────────────

export interface FinishItem {
  id: string
  project_id: string
  description: string
  container_cost: number
  container_size: number | null   // total size of container
  amount_used: number | null      // how much used on this project
  unit: string                    // oz, ml, sheets, etc.
  fraction_used: number           // calculated from amount_used/container_size, or entered directly
  notes: string
  sort_order: number
  created_at: string
}

// ─── Labor ────────────────────────────────────────────────────────────────────

export interface ProjectLabor {
  id: string
  project_id: string
  hourly_rate: number | null  // null = use profile default
  estimated_hrs: number
  target_margin: number       // 0.30 = 30%
  created_at: string
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  display_name: string
  hourly_rate: number
  tax_rate: number            // 0.098 = 9.8%
  monthly_overhead: number
  projects_per_month: number
  subscription_tier: 'free' | 'pro'
  stripe_customer_id: string | null
  created_at: string
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  user_id: string
  name: string
  notes: string
  waste_factor: number        // 0.15 = 15%
  surface_area_sqft: number | null
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

// ─── Computed Totals ──────────────────────────────────────────────────────────

export interface LumberTotals {
  netCost: number             // Cost before waste adjustment
  wasteCost: number           // The extra cost due to waste
  adjustedCost: number        // What user should budget (netCost / (1 - wasteFactor))
  boardFeetNet: number        // Total BF before waste
  boardFeetAdjusted: number   // Total BF to purchase after waste
  reclaimedSavings: number   // Market value of reclaimed items (not included in COGS)
}

export interface ProjectTotals {
  lumber: LumberTotals
  hardware: { total: number }
  finish: { total: number }
  labor: { total: number }
  overhead: { share: number }
  subtotal: number            // lumber adjusted + hardware + finish
  grandTotal: number          // subtotal + labor + overhead
  withTax: number             // grandTotal × (1 + tax_rate)
  suggestedRetail: number     // grandTotal / (1 - target_margin)
  etsyListingPrice: number    // Suggested Etsy price after fees
}