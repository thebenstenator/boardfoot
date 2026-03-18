import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/store/projectStore'
import type { LumberItem } from '@/types/bom'

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