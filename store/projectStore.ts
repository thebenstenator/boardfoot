import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { calculateProjectTotals } from '@/lib/calculations/projectTotals'
import type {
  Project,
  LumberItem,
  HardwareItem,
  FinishItem,
  ProjectLabor,
  UserProfile,
  ProjectTotals,
  CutPart,
} from '@/types/bom'

// Default profile values used for calculations before profile loads
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

interface ProjectStore {
  // Data
  project: Project | null
  lumberItems: LumberItem[]
  hardwareItems: HardwareItem[]
  finishItems: FinishItem[]
  cutParts: CutPart[]
  labor: ProjectLabor | null
  profile: UserProfile

  // Per-project settings (persisted to DB)
  passSavingsToCustomer: boolean
  excludeOverhead: boolean

  // Computed
  totals: ProjectTotals

  // Status
  isLoading: boolean
  pendingSaves: number

  // Actions
  startSave: () => void
  endSave: () => void

  setProject: (project: Project) => void
  setProfile: (profile: UserProfile) => void
  setPassSavingsToCustomer: (val: boolean) => void
  setExcludeOverhead: (val: boolean) => void

  addLumberItem: (item: LumberItem) => void
  updateLumberItem: (id: string, patch: Partial<LumberItem>) => void
  removeLumberItem: (id: string) => void

  addHardwareItem: (item: HardwareItem) => void
  updateHardwareItem: (id: string, patch: Partial<HardwareItem>) => void
  removeHardwareItem: (id: string) => void

  addFinishItem: (item: FinishItem) => void
  updateFinishItem: (id: string, patch: Partial<FinishItem>) => void
  removeFinishItem: (id: string) => void

  addCutPart: (item: CutPart) => void
  updateCutPart: (id: string, patch: Partial<CutPart>) => void
  removeCutPart: (id: string) => void
  setCutParts: (items: CutPart[]) => void

  setLabor: (labor: ProjectLabor) => void

  // Load all project data from Supabase
  loadProject: (projectId: string) => Promise<void>
}

function computeTotals(
  lumberItems: LumberItem[],
  hardwareItems: HardwareItem[],
  finishItems: FinishItem[],
  labor: ProjectLabor | null,
  profile: UserProfile,
  wasteFactor: number,
  passSavingsToCustomer: boolean = false,
  excludeOverhead: boolean = false
): ProjectTotals {
  return calculateProjectTotals(
    lumberItems,
    hardwareItems,
    finishItems,
    labor,
    profile,
    wasteFactor,
    passSavingsToCustomer,
    excludeOverhead
  )
}

const EMPTY_TOTALS: ProjectTotals = computeTotals([], [], [], null, DEFAULT_PROFILE, 0.15)

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  lumberItems: [],
  hardwareItems: [],
  finishItems: [],
  cutParts: [],
  labor: null,
  profile: DEFAULT_PROFILE,
  passSavingsToCustomer: false,
  excludeOverhead: false,
  totals: EMPTY_TOTALS,
  isLoading: false,
  pendingSaves: 0,

  startSave: () => set((s) => ({ pendingSaves: s.pendingSaves + 1 })),
  endSave: () => set((s) => ({ pendingSaves: Math.max(0, s.pendingSaves - 1) })),

  setProject: (project) => {
    const state = get()
    set({
      project,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        project.waste_factor,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  setProfile: (profile) => {
    const state = get()
    set({
      profile,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        state.finishItems,
        state.labor,
        profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  setPassSavingsToCustomer: (val) => {
    const state = get()
    set({
      passSavingsToCustomer: val,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        val,
        state.excludeOverhead
      ),
    })
  },

  setExcludeOverhead: (val) => {
    const state = get()
    set({
      excludeOverhead: val,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        val
      ),
    })
  },

  addLumberItem: (item) => {
    const state = get()
    const lumberItems = [...state.lumberItems, item]
    set({
      lumberItems,
      totals: computeTotals(
        lumberItems,
        state.hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  updateLumberItem: (id, patch) => {
    const state = get()
    const lumberItems = state.lumberItems.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    )
    set({
      lumberItems,
      totals: computeTotals(
        lumberItems,
        state.hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  removeLumberItem: (id) => {
    const state = get()
    const lumberItems = state.lumberItems.filter((item) => item.id !== id)
    set({
      lumberItems,
      totals: computeTotals(
        lumberItems,
        state.hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  addHardwareItem: (item) => {
    const state = get()
    const hardwareItems = [...state.hardwareItems, item]
    set({
      hardwareItems,
      totals: computeTotals(
        state.lumberItems,
        hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  updateHardwareItem: (id, patch) => {
    const state = get()
    const hardwareItems = state.hardwareItems.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    )
    set({
      hardwareItems,
      totals: computeTotals(
        state.lumberItems,
        hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  removeHardwareItem: (id) => {
    const state = get()
    const hardwareItems = state.hardwareItems.filter((item) => item.id !== id)
    set({
      hardwareItems,
      totals: computeTotals(
        state.lumberItems,
        hardwareItems,
        state.finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  addFinishItem: (item) => {
    const state = get()
    const finishItems = [...state.finishItems, item]
    set({
      finishItems,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  updateFinishItem: (id, patch) => {
    const state = get()
    const finishItems = state.finishItems.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    )
    set({
      finishItems,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  removeFinishItem: (id) => {
    const state = get()
    const finishItems = state.finishItems.filter((item) => item.id !== id)
    set({
      finishItems,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        finishItems,
        state.labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  addCutPart: (item) => {
    const state = get()
    set({ cutParts: [...state.cutParts, item] })
  },

  updateCutPart: (id, patch) => {
    const state = get()
    set({
      cutParts: state.cutParts.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    })
  },

  removeCutPart: (id) => {
    const state = get()
    set({ cutParts: state.cutParts.filter((item) => item.id !== id) })
  },

  setCutParts: (items) => {
    set({ cutParts: items })
  },

  setLabor: (labor) => {
    const state = get()
    set({
      labor,
      totals: computeTotals(
        state.lumberItems,
        state.hardwareItems,
        state.finishItems,
        labor,
        state.profile,
        state.project?.waste_factor ?? 0.15,
        state.passSavingsToCustomer,
        state.excludeOverhead
      ),
    })
  },

  loadProject: async (projectId) => {
    set({ isLoading: true })
    const supabase = createClient()

    const [
      { data: project },
      { data: lumberItems },
      { data: hardwareItems },
      { data: finishItems },
      { data: cutParts },
      { data: labor },
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('lumber_items').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('hardware_items').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('finish_items').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('cut_parts').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('project_labor').select('*').eq('project_id', projectId).maybeSingle(),
    ])

    if (!project) {
      set({ isLoading: false })
      return
    }

    const state = get()
    const resolvedLumber = (lumberItems ?? []) as LumberItem[]
    const resolvedHardware = (hardwareItems ?? []) as HardwareItem[]
    const resolvedFinish = (finishItems ?? []) as FinishItem[]
    const resolvedCutParts = (cutParts ?? []) as CutPart[]
    const resolvedLabor = (labor ?? null) as ProjectLabor | null

    const passSavings = (project as Project).pass_reclaimed_to_customer ?? false
    const excludeOverhead = (project as Project).exclude_overhead ?? false
    set({
      project: project as Project,
      lumberItems: resolvedLumber,
      hardwareItems: resolvedHardware,
      finishItems: resolvedFinish,
      cutParts: resolvedCutParts,
      labor: resolvedLabor,
      passSavingsToCustomer: passSavings,
      excludeOverhead,
      totals: computeTotals(
        resolvedLumber,
        resolvedHardware,
        resolvedFinish,
        resolvedLabor,
        state.profile,
        project.waste_factor,
        passSavings,
        excludeOverhead
      ),
      isLoading: false,
    })
  },
}))