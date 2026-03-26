'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateProjectTotals } from '@/lib/calculations/projectTotals'
import type {
  Project,
  LumberItem,
  HardwareItem,
  FinishItem,
  ProjectTotals,
  UserProfile,
} from '@/types/bom'

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  display_name: '',
  hourly_rate: 25,
  tax_rate: 0,
  monthly_overhead: 0,
  projects_per_month: 4,
  subscription_tier: 'free',
  stripe_customer_id: null,
  created_at: '',
}

// ─── Read-only sub-components ────────────────────────────────────────────────

function ReadOnlyLumberTable({ items }: { items: LumberItem[] }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-2">Lumber</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-md overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Species</th>
              <th className="text-right px-3 py-2 font-medium">T&quot;</th>
              <th className="text-right px-3 py-2 font-medium">W&quot;</th>
              <th className="text-right px-3 py-2 font-medium">L</th>
              <th className="text-right px-3 py-2 font-medium">Qty</th>
              <th className="text-right px-3 py-2 font-medium">$/unit</th>
              <th className="text-right px-3 py-2 font-medium">BF</th>
              <th className="text-right px-3 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const lengthDisplay = item.length_unit === 'in'
                ? `${item.length_ft}"`
                : `${item.length_ft}'`
              const bf = (item.thickness_in * item.width_in * item.length_ft) / 12 * item.quantity
              const total = item.is_reclaimed ? 0 : bf * item.price_per_unit
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    {item.species}
                    {item.is_reclaimed && (
                      <span className="ml-1.5 text-xs text-green-600" title="Reclaimed">♻</span>
                    )}
                  </td>
                  <td className="text-right px-3 py-2">{item.thickness_in}</td>
                  <td className="text-right px-3 py-2">{item.width_in}</td>
                  <td className="text-right px-3 py-2">{lengthDisplay}</td>
                  <td className="text-right px-3 py-2">{item.quantity}</td>
                  <td className="text-right px-3 py-2">
                    {item.is_reclaimed ? '—' : `$${item.price_per_unit.toFixed(2)}`}
                  </td>
                  <td className="text-right px-3 py-2">{bf.toFixed(2)}</td>
                  <td className="text-right px-3 py-2">
                    {item.is_reclaimed ? <span className="text-green-600">reclaimed</span> : `$${total.toFixed(2)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReadOnlyHardwareTable({ items }: { items: HardwareItem[] }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-2">Hardware</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-md overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Description</th>
              <th className="text-right px-3 py-2 font-medium">Qty</th>
              <th className="text-right px-3 py-2 font-medium">Unit</th>
              <th className="text-right px-3 py-2 font-medium">Unit Cost</th>
              <th className="text-right px-3 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-3 py-2">{item.description}</td>
                <td className="text-right px-3 py-2">{item.quantity}</td>
                <td className="text-right px-3 py-2">{item.unit}</td>
                <td className="text-right px-3 py-2">${item.unit_cost.toFixed(2)}</td>
                <td className="text-right px-3 py-2">${(item.quantity * item.unit_cost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReadOnlyFinishTable({ items }: { items: FinishItem[] }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-2">Finish</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-md overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Description</th>
              <th className="text-right px-3 py-2 font-medium">Used</th>
              <th className="text-right px-3 py-2 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const cost = item.container_cost * item.fraction_used
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="text-right px-3 py-2">
                    {item.amount_used != null && item.container_size != null
                      ? `${item.amount_used} / ${item.container_size} ${item.unit}`
                      : `${(item.fraction_used * 100).toFixed(0)}%`}
                  </td>
                  <td className="text-right px-3 py-2">${cost.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReadOnlyCostSummary({
  totals,
  wasteFactor,
}: {
  totals: ProjectTotals
  wasteFactor: number
}) {
  const wastePercent = Math.round(wasteFactor * 100)
  return (
    <div className="border border-border rounded-md p-4 space-y-2 text-sm">
      <h2 className="font-semibold text-base mb-3">Cost Summary</h2>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Lumber (net)</span>
        <span>${totals.lumber.netCost.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Lumber (+{wastePercent}% waste)</span>
        <span>${totals.lumber.adjustedCost.toFixed(2)}</span>
      </div>
      {totals.lumber.reclaimedSavings > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Reclaimed savings</span>
          <span>-${totals.lumber.reclaimedSavings.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Hardware</span>
        <span>${totals.hardware.total.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Finish</span>
        <span>${totals.finish.total.toFixed(2)}</span>
      </div>
      <div className="border-t border-border pt-2 flex justify-between font-semibold">
        <span>Grand Total</span>
        <span>${totals.grandTotal.toFixed(2)}</span>
      </div>
    </div>
  )
}

function CloneButton({ projectId, isSignedIn }: { projectId: string; isSignedIn: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  if (!isSignedIn) {
    return (
      <a
        href={`/login?next=/share/${projectId}`}
        className="inline-flex items-center gap-1.5 text-sm border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
      >
        Clone this project
      </a>
    )
  }

  async function handleClone() {
    setLoading(true)
    setLimitReached(false)
    try {
      const res = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (res.status === 403) {
        setLimitReached(true)
        return
      }
      const data = await res.json()
      if (data.projectId) {
        router.push(`/projects/${data.projectId}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClone}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-sm border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Cloning...' : 'Clone this project'}
      </button>
      {limitReached && (
        <p className="text-xs text-destructive">
          Project limit reached — upgrade to Pro
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharePage() {
  const params = useParams<{ projectId: string }>()
  const projectId = params.projectId

  const [project, setProject] = useState<Project | null>(null)
  const [lumberItems, setLumberItems] = useState<LumberItem[]>([])
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>([])
  const [finishItems, setFinishItems] = useState<FinishItem[]>([])
  const [totals, setTotals] = useState<ProjectTotals | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [
        { data: proj },
        { data: { user } },
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).eq('is_public', true).single(),
        supabase.auth.getUser(),
      ])

      if (!proj) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const [
        { data: lumber },
        { data: hardware },
        { data: finish },
      ] = await Promise.all([
        supabase.from('lumber_items').select('*').eq('project_id', projectId).order('sort_order'),
        supabase.from('hardware_items').select('*').eq('project_id', projectId).order('sort_order'),
        supabase.from('finish_items').select('*').eq('project_id', projectId).order('sort_order'),
      ])

      const resolvedLumber = (lumber ?? []) as LumberItem[]
      const resolvedHardware = (hardware ?? []) as HardwareItem[]
      const resolvedFinish = (finish ?? []) as FinishItem[]

      const computed = calculateProjectTotals(
        resolvedLumber,
        resolvedHardware,
        resolvedFinish,
        null,
        DEFAULT_PROFILE,
        proj.waste_factor
      )

      setProject(proj as Project)
      setLumberItems(resolvedLumber)
      setHardwareItems(resolvedHardware)
      setFinishItems(resolvedFinish)
      setTotals(computed)
      setIsSignedIn(!!user)
      setLoading(false)
    }

    load()
  }, [projectId])

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">Loading...</div>
    )
  }

  if (notFound || !project || !totals) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        This project is not available.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.notes && (
            <p className="text-muted-foreground mt-1 text-sm">{project.notes}</p>
          )}
        </div>
        <CloneButton projectId={projectId} isSignedIn={isSignedIn} />
      </div>

      {/* Line item tables */}
      {lumberItems.length > 0 && <ReadOnlyLumberTable items={lumberItems} />}
      {hardwareItems.length > 0 && <ReadOnlyHardwareTable items={hardwareItems} />}
      {finishItems.length > 0 && <ReadOnlyFinishTable items={finishItems} />}

      {/* Cost summary */}
      <ReadOnlyCostSummary totals={totals} wasteFactor={project.waste_factor} />
    </div>
  )
}
