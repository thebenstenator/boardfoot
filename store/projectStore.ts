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
  labor: ProjectLabor | null
  profile: UserProfile

  // UI-only settings (not persisted to DB)
  passSavingsToCustomer: boolean

  // Computed
  totals: ProjectTotals

  // Status
  isLoading: boolean
  isSaving: boolean

  // Actions
  setProject: (project: Project) => void
  setProfile: (profile: UserProfile) => void
  setPassSavingsToCustomer: (val: boolean) => void

  addLumberItem: (item: LumberItem) => void
  updateLumberItem: (id: string, patch: Partial<LumberItem>) => void
  removeLumberItem: (id: string) => void

  addHardwareItem: (item: HardwareItem) => void
  updateHardwareItem: (id: string, patch: Partial<HardwareItem>) => void
  removeHardwareItem: (id: string) => void

  addFinishItem: (item: FinishItem) => void
  updateFinishItem: (id: string, patch: Partial<FinishItem>) => void
  removeFinishItem: (id: string) => void

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
  passSavingsToCustomer: boolean = false
): ProjectTotals {
  return calculateProjectTotals(
    lumberItems,
    hardwareItems,
    finishItems,
    labor,
    profile,
    wasteFactor,
    passSavingsToCustomer
  )
}

const EMPTY_TOTALS: ProjectTotals = computeTotals([], [], [], null, DEFAULT_PROFILE, 0.15)

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  lumberItems: [],
  hardwareItems: [],
  finishItems: [],
  labor: null,
  profile: DEFAULT_PROFILE,
  passSavingsToCustomer: false,
  totals: EMPTY_TOTALS,
  isLoading: false,
  isSaving: false,

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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
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
        state.passSavingsToCustomer
      ),
    })
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
        state.passSavingsToCustomer
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
      { data: labor },
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('lumber_items').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('hardware_items').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('finish_items').select('*').eq('project_id', projectId).order('sort_order'),
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
    const resolvedLabor = (labor ?? null) as ProjectLabor | null

    set({
      project: project as Project,
      lumberItems: resolvedLumber,
      hardwareItems: resolvedHardware,
      finishItems: resolvedFinish,
      labor: resolvedLabor,
      totals: computeTotals(
        resolvedLumber,
        resolvedHardware,
        resolvedFinish,
        resolvedLabor,
        state.profile,
        project.waste_factor,
        state.passSavingsToCustomer
      ),
      isLoading: false,
    })
  },
}))