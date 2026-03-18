import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/store/projectStore'
import type { LumberItem, HardwareItem, FinishItem } from '@/types/bom'

export function useLumberItems(projectId: string) {
  const {
    lumberItems,
    addLumberItem,
    updateLumberItem,
    removeLumberItem,
  } = useProjectStore()

  const supabase = createClient()

  const addItem = useCallback(async () => {
    const newItem = {
      project_id: projectId,
      species: '',
      thickness_in: 1.0,
      width_in: 6.0,
      length_ft: 8.0,
      length_unit: 'ft' as const,
      quantity: 1,
      pricing_mode: 'per_bf' as const,
      price_per_unit: 0,
      is_reclaimed: false,
      waste_override: null,
      notes: '',
      sort_order: lumberItems.length,
    }

    const { data, error } = await supabase
      .from('lumber_items')
      .insert(newItem)
      .select()
      .single()

    if (error) {
      console.error('Failed to add lumber item:', error)
      return
    }

    addLumberItem(data as LumberItem)
  }, [projectId, lumberItems.length, supabase, addLumberItem])

  const updateItem = useCallback(
    async (id: string, patch: Partial<LumberItem>) => {
      // Optimistic update — update store immediately
      updateLumberItem(id, patch)

      const { error } = await supabase
        .from('lumber_items')
        .update(patch)
        .eq('id', id)

      if (error) {
        console.error('Failed to update lumber item:', error)
        // TODO: rollback optimistic update on error
      }
    },
    [supabase, updateLumberItem]
  )

  const removeItem = useCallback(
    async (id: string) => {
      // Optimistic update
      removeLumberItem(id)

      const { error } = await supabase
        .from('lumber_items')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Failed to remove lumber item:', error)
      }
    },
    [supabase, removeLumberItem]
  )

  return {
    items: lumberItems,
    addItem,
    updateItem,
    removeItem,
  }

}

export function useHardwareItems(projectId: string) {
  const {
    hardwareItems,
    addHardwareItem,
    updateHardwareItem,
    removeHardwareItem,
  } = useProjectStore()

  const supabase = createClient()

  const addItem = useCallback(async () => {
    const newItem = {
      project_id: projectId,
      description: '',
      quantity: 1,
      unit: 'each',
      unit_cost: 0,
      notes: '',
      sort_order: hardwareItems.length,
    }

    const { data, error } = await supabase
      .from('hardware_items')
      .insert(newItem)
      .select()
      .single()

    if (error) {
      console.error('Failed to add hardware item:', error)
      return
    }

    addHardwareItem(data as HardwareItem)
  }, [projectId, hardwareItems.length, supabase, addHardwareItem])

  const updateItem = useCallback(
    async (id: string, patch: Partial<HardwareItem>) => {
      updateHardwareItem(id, patch)

      const { error } = await supabase
        .from('hardware_items')
        .update(patch)
        .eq('id', id)

      if (error) {
        console.error('Failed to update hardware item:', error)
      }
    },
    [supabase, updateHardwareItem]
  )

  const removeItem = useCallback(
    async (id: string) => {
      removeHardwareItem(id)

      const { error } = await supabase
        .from('hardware_items')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Failed to remove hardware item:', error)
      }
    },
    [supabase, removeHardwareItem]
  )

  return {
    items: hardwareItems,
    addItem,
    updateItem,
    removeItem,
  }
}

export function useFinishItems(projectId: string) {
  const {
    finishItems,
    addFinishItem,
    updateFinishItem,
    removeFinishItem,
  } = useProjectStore()

  const supabase = createClient()

  const addItem = useCallback(async () => {
    const newItem = {
      project_id: projectId,
      description: '',
      container_cost: 0,
      fraction_used: 1.0,
      notes: '',
      sort_order: finishItems.length,
    }

    const { data, error } = await supabase
      .from('finish_items')
      .insert(newItem)
      .select()
      .single()

    if (error) {
      console.error('Failed to add finish item:', error)
      return
    }

    addFinishItem(data as FinishItem)
  }, [projectId, finishItems.length, supabase, addFinishItem])

  const updateItem = useCallback(
    async (id: string, patch: Partial<FinishItem>) => {
      updateFinishItem(id, patch)

      const { error } = await supabase
        .from('finish_items')
        .update(patch)
        .eq('id', id)

      if (error) {
        console.error('Failed to update finish item:', error)
      }
    },
    [supabase, updateFinishItem]
  )

  const removeItem = useCallback(
    async (id: string) => {
      removeFinishItem(id)

      const { error } = await supabase
        .from('finish_items')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Failed to remove finish item:', error)
      }
    },
    [supabase, removeFinishItem]
  )

  return {
    items: finishItems,
    addItem,
    updateItem,
    removeItem,
  }
}