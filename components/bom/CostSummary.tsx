'use client'

import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useUserStore } from '@/store/userStore'
import { calculateEtsyFees } from '@/lib/calculations/etsyFees'

export function CostSummary() {
  const totals = useProjectStore((state) => state.totals)
  const project = useProjectStore((state) => state.project)
  const profile = useProjectStore((state) => state.profile)
  const passSavingsToCustomer = useProjectStore((state) => state.passSavingsToCustomer)

  // Flash ring when totals change
  const [flashed, setFlashed] = useState(false)
  const prevTotalsRef = useRef(totals)
  useEffect(() => {
    if (prevTotalsRef.current !== totals) {
      prevTotalsRef.current = totals
      setFlashed(true)
      const t = setTimeout(() => setFlashed(false), 600)
      return () => clearTimeout(t)
    }
  }, [totals])

  function formatCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  function formatPercent(n: number) {
    return `${Math.round(n * 100)}%`
  }

  const taxRate = profile.tax_rate
  const targetMargin = totals.labor.total > 0
    ? (useProjectStore.getState().labor?.target_margin ?? 0.30)
    : 0.30

  const etsyFees = calculateEtsyFees(totals.etsyListingPrice)

  return (
    <div className={`rounded-lg border bg-card p-6 space-y-4 transition-all duration-500 ${
      flashed ? 'ring-1 ring-primary/40' : ''
    }`}>
      <h2 className="text-lg font-semibold">Cost Summary</h2>

      {/* Materials */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Materials
        </p>
        <SummaryRow
          label="Lumber (net)"
          value={formatCurrency(totals.lumber.netCost)}
        />
        <SummaryRow
          label={`Lumber (adjusted for ${Math.round((project?.waste_factor ?? 0.15) * 100)}% waste)`}
          value={formatCurrency(totals.lumber.adjustedCost)}
          highlight
        />
        {totals.lumber.reclaimedSavings > 0 && (
          <>
            <SummaryRow
              label="♻ Reclaimed savings"
              value={`−${formatCurrency(totals.lumber.reclaimedSavings)}`}
              muted
            />
            <p className="text-xs text-muted-foreground pl-1">
              {passSavingsToCustomer
                ? 'Passed to customer (lower retail)'
                : 'Priced at market rate — woodworker keeps savings'}
            </p>
          </>
        )}
        <SummaryRow
          label="Hardware"
          value={formatCurrency(totals.hardware.total)}
        />
        <SummaryRow
          label="Consumables"
          value={formatCurrency(totals.finish.total)}
        />
        <SummaryRow
          label="Materials subtotal"
          value={formatCurrency(totals.subtotal)}
          bold
        />
      </div>

      <Divider />

      {/* Labor & Overhead */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Labor & Overhead
        </p>
        <SummaryRow
          label="Labor"
          value={totals.labor.total > 0
            ? formatCurrency(totals.labor.total)
            : '—'}
          muted={totals.labor.total === 0}
        />
        {totals.overhead.share > 0 ? (
          <SummaryRow
            label="Overhead share"
            value={formatCurrency(totals.overhead.share)}
          />
        ) : (
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Overhead share</span>
            <a href="/settings/overhead" className="text-xs underline hover:text-foreground">
              Set in shop settings
            </a>
          </div>
        )}
      </div>

      <Divider />

      {/* Totals */}
      <div className="space-y-1.5">
        <SummaryRow
          label="Grand total (COGS)"
          value={formatCurrency(totals.grandTotal)}
          bold
        />
        {project?.surface_area_sqft && project.surface_area_sqft > 0 && (
          <SummaryRow
            label="Cost per sq ft"
            value={formatCurrency(totals.grandTotal / project.surface_area_sqft)}
            muted
          />
        )}
        {taxRate > 0 && (
          <SummaryRow
            label={`With tax (${formatPercent(taxRate)})`}
            value={formatCurrency(totals.withTax)}
          />
        )}
        <SummaryRow
          label={`Suggested retail (${formatPercent(targetMargin)} margin)`}
          value={formatCurrency(totals.suggestedRetail)}
          highlight
        />
      </div>

      <Divider />

      {/* Etsy */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Etsy Pricing
        </p>
        <SummaryRow
          label="Suggested listing price"
          value={formatCurrency(totals.etsyListingPrice)}
          bold
        />
        <SummaryRow
          label="Etsy fees"
          value={`−${formatCurrency(etsyFees.totalFees)}`}
          muted
        />
        <SummaryRow
          label="Net after fees"
          value={formatCurrency(etsyFees.netAfterFees)}
        />
      </div>
    </div>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────

interface SummaryRowProps {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
  muted?: boolean
}

function SummaryRow({ label, value, bold, highlight, muted }: SummaryRowProps) {
  return (
    <div className={`flex justify-between items-center text-sm ${
      bold ? 'font-semibold' : ''
    } ${
      highlight ? 'text-primary' : ''
    } ${
      muted ? 'text-muted-foreground' : ''
    }`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="border-t" />
}
