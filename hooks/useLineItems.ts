import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "@/store/projectStore";
import type {
  LumberItem,
  HardwareItem,
  FinishItem,
  ProjectLabor,
  CutPart,
} from "@/types/bom";

export function useLumberItems(projectId: string) {
  const { lumberItems, addLumberItem, updateLumberItem, removeLumberItem } =
    useProjectStore();

  const supabase = createClient();
  const pendingDeletes = useRef<Map<string, { item: LumberItem; timeout: ReturnType<typeof setTimeout> }>>(new Map());

  const addItem = useCallback(async () => {
    const newItem = {
      project_id: projectId,
      species: "",
      thickness_in: 1.0,
      width_in: 6.0,
      length_ft: 8.0,
      length_unit: "ft" as const,
      quantity: 1,
      pricing_mode: "per_bf" as const,
      price_per_unit: 0,
      is_reclaimed: false,
      waste_override: null,
      notes: "",
      sort_order: lumberItems.length,
    };

    const { data, error } = await supabase
      .from("lumber_items")
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error("Failed to add lumber item:", error);
      return;
    }

    addLumberItem(data as LumberItem);
  }, [projectId, lumberItems.length, supabase, addLumberItem]);

  const updateItem = useCallback(
    async (id: string, patch: Partial<LumberItem>) => {
      updateLumberItem(id, patch);

      useProjectStore.getState().startSave();
      const { error } = await supabase
        .from("lumber_items")
        .update(patch)
        .eq("id", id);
      useProjectStore.getState().endSave();

      if (error) {
        console.error("Failed to update lumber item:", error);
      }
    },
    [supabase, updateLumberItem],
  );

  const removeItem = useCallback(
    (id: string): LumberItem | null => {
      const item = lumberItems.find((i) => i.id === id) ?? null;
      if (!item) return null;

      removeLumberItem(id);

      const timeout = setTimeout(async () => {
        const { error } = await supabase.from("lumber_items").delete().eq("id", id);
        pendingDeletes.current.delete(id);
        if (error) {
          console.error("Failed to delete lumber item:", error);
          addLumberItem(item);
        }
      }, 5000);

      pendingDeletes.current.set(id, { item, timeout });
      return item;
    },
    [lumberItems, removeLumberItem, supabase],
  );

  const undoRemove = useCallback((id: string) => {
    const pending = pendingDeletes.current.get(id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingDeletes.current.delete(id);
    addLumberItem(pending.item);
  }, [addLumberItem]);

  const reorderItem = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...lumberItems].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(i => i.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const item = sorted[idx];
    const swap = sorted[swapIdx];
    updateLumberItem(id, { sort_order: swap.sort_order });
    updateLumberItem(swap.id, { sort_order: item.sort_order });
    useProjectStore.getState().startSave();
    await Promise.all([
      supabase.from('lumber_items').update({ sort_order: swap.sort_order }).eq('id', id),
      supabase.from('lumber_items').update({ sort_order: item.sort_order }).eq('id', swap.id),
    ]);
    useProjectStore.getState().endSave();
  }, [lumberItems, updateLumberItem, supabase]);

  return {
    items: lumberItems,
    addItem,
    updateItem,
    removeItem,
    undoRemove,
    reorderItem,
  };
}

export function useHardwareItems(projectId: string) {
  const {
    hardwareItems,
    addHardwareItem,
    updateHardwareItem,
    removeHardwareItem,
  } = useProjectStore();

  const supabase = createClient();
  const pendingDeletes = useRef<Map<string, { item: HardwareItem; timeout: ReturnType<typeof setTimeout> }>>(new Map());

  const addItem = useCallback(async () => {
    const newItem = {
      project_id: projectId,
      description: "",
      quantity: 1,
      unit: "each",
      unit_cost: 0,
      notes: "",
      sort_order: hardwareItems.length,
    };

    const { data, error } = await supabase
      .from("hardware_items")
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error("Failed to add hardware item:", error);
      return;
    }

    addHardwareItem(data as HardwareItem);
  }, [projectId, hardwareItems.length, supabase, addHardwareItem]);

  const updateItem = useCallback(
    async (id: string, patch: Partial<HardwareItem>) => {
      updateHardwareItem(id, patch);

      useProjectStore.getState().startSave();
      const { error } = await supabase
        .from("hardware_items")
        .update(patch)
        .eq("id", id);
      useProjectStore.getState().endSave();

      if (error) {
        console.error("Failed to update hardware item:", error);
      }
    },
    [supabase, updateHardwareItem],
  );

  const removeItem = useCallback(
    (id: string): HardwareItem | null => {
      const item = hardwareItems.find((i) => i.id === id) ?? null;
      if (!item) return null;

      removeHardwareItem(id);

      const timeout = setTimeout(async () => {
        const { error } = await supabase.from("hardware_items").delete().eq("id", id);
        pendingDeletes.current.delete(id);
        if (error) {
          console.error("Failed to delete hardware item:", error);
          addHardwareItem(item);
        }
      }, 5000);

      pendingDeletes.current.set(id, { item, timeout });
      return item;
    },
    [hardwareItems, removeHardwareItem, supabase],
  );

  const undoRemove = useCallback((id: string) => {
    const pending = pendingDeletes.current.get(id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingDeletes.current.delete(id);
    addHardwareItem(pending.item);
  }, [addHardwareItem]);

  const reorderItem = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...hardwareItems].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(i => i.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const item = sorted[idx];
    const swap = sorted[swapIdx];
    updateHardwareItem(id, { sort_order: swap.sort_order });
    updateHardwareItem(swap.id, { sort_order: item.sort_order });
    useProjectStore.getState().startSave();
    await Promise.all([
      supabase.from('hardware_items').update({ sort_order: swap.sort_order }).eq('id', id),
      supabase.from('hardware_items').update({ sort_order: item.sort_order }).eq('id', swap.id),
    ]);
    useProjectStore.getState().endSave();
  }, [hardwareItems, updateHardwareItem, supabase]);

  return {
    items: hardwareItems,
    addItem,
    updateItem,
    removeItem,
    undoRemove,
    reorderItem,
  };
}

export function useFinishItems(projectId: string) {
  const { finishItems, addFinishItem, updateFinishItem, removeFinishItem } =
    useProjectStore();

  const supabase = createClient();
  const pendingDeletes = useRef<Map<string, { item: FinishItem; timeout: ReturnType<typeof setTimeout> }>>(new Map());

  const addItem = useCallback(async () => {
    const newItem = {
      project_id: projectId,
      description: "",
      container_cost: 0,
      fraction_used: 1.0,
      notes: "",
      sort_order: finishItems.length,
    };

    const { data, error } = await supabase
      .from("finish_items")
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error("Failed to add finish item:", error);
      return;
    }

    addFinishItem(data as FinishItem);
  }, [projectId, finishItems.length, supabase, addFinishItem]);

  const updateItem = useCallback(
    async (id: string, patch: Partial<FinishItem>) => {
      updateFinishItem(id, patch);

      useProjectStore.getState().startSave();
      const { error } = await supabase
        .from("finish_items")
        .update(patch)
        .eq("id", id);
      useProjectStore.getState().endSave();

      if (error) {
        console.error("Failed to update finish item:", error);
      }
    },
    [supabase, updateFinishItem],
  );

  const removeItem = useCallback(
    (id: string): FinishItem | null => {
      const item = finishItems.find((i) => i.id === id) ?? null;
      if (!item) return null;

      removeFinishItem(id);

      const timeout = setTimeout(async () => {
        const { error } = await supabase.from("finish_items").delete().eq("id", id);
        pendingDeletes.current.delete(id);
        if (error) {
          console.error("Failed to delete finish item:", error);
          addFinishItem(item);
        }
      }, 5000);

      pendingDeletes.current.set(id, { item, timeout });
      return item;
    },
    [finishItems, removeFinishItem, supabase],
  );

  const undoRemove = useCallback((id: string) => {
    const pending = pendingDeletes.current.get(id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingDeletes.current.delete(id);
    addFinishItem(pending.item);
  }, [addFinishItem]);

  const reorderItem = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...finishItems].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(i => i.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const item = sorted[idx];
    const swap = sorted[swapIdx];
    updateFinishItem(id, { sort_order: swap.sort_order });
    updateFinishItem(swap.id, { sort_order: item.sort_order });
    useProjectStore.getState().startSave();
    await Promise.all([
      supabase.from('finish_items').update({ sort_order: swap.sort_order }).eq('id', id),
      supabase.from('finish_items').update({ sort_order: item.sort_order }).eq('id', swap.id),
    ]);
    useProjectStore.getState().endSave();
  }, [finishItems, updateFinishItem, supabase]);

  return {
    items: finishItems,
    addItem,
    updateItem,
    removeItem,
    undoRemove,
    reorderItem,
  };
}

export function useProjectLabor(projectId: string) {
  const { labor, setLabor } = useProjectStore();
  const supabase = createClient();

  const updateLabor = useCallback(
    async (patch: Partial<ProjectLabor>) => {
      if (labor) {
        setLabor({ ...labor, ...patch });
      }

      const { data: existing } = await supabase
        .from("project_labor")
        .select("id")
        .eq("project_id", projectId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("project_labor")
          .update(patch)
          .eq("project_id", projectId);

        if (error) console.error("Failed to update labor:", error);
      } else {
        const { data, error } = await supabase
          .from("project_labor")
          .insert({
            project_id: projectId,
            hourly_rate: null,
            estimated_hrs: 0,
            target_margin: 0.3,
            ...patch,
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to create labor:", error);
        } else if (data) {
          setLabor(data as ProjectLabor);
        }
      }
    },
    [projectId, labor, supabase, setLabor],
  );

  return { labor, updateLabor };
}

export function useCutParts(projectId: string) {
  const { cutParts, addCutPart, updateCutPart, removeCutPart } = useProjectStore();
  const supabase = createClient();
  const pendingDeletes = useRef<Map<string, { item: CutPart; timeout: ReturnType<typeof setTimeout> }>>(new Map());

  const addItem = useCallback(async () => {
    const newItem = {
      project_id: projectId,
      label: "",
      thickness_in: 0.75,
      width_in: 3.5,
      length_in: 24,
      quantity: 1,
      notes: "",
      sort_order: cutParts.length,
    };
    const { data, error } = await supabase.from("cut_parts").insert(newItem).select().single();
    if (error) { console.error("Failed to add cut part:", error); return; }
    addCutPart(data as CutPart);
  }, [projectId, cutParts.length, supabase, addCutPart]);

  const updateItem = useCallback(async (id: string, patch: Partial<CutPart>) => {
    updateCutPart(id, patch);
    useProjectStore.getState().startSave();
    const { error } = await supabase.from("cut_parts").update(patch).eq("id", id);
    useProjectStore.getState().endSave();
    if (error) console.error("Failed to update cut part:", error);
  }, [supabase, updateCutPart]);

  const removeItem = useCallback((id: string): CutPart | null => {
    const item = cutParts.find((i) => i.id === id) ?? null;
    if (!item) return null;
    removeCutPart(id);
    const timeout = setTimeout(async () => {
      const { error } = await supabase.from("cut_parts").delete().eq("id", id);
      pendingDeletes.current.delete(id);
      if (error) {
        console.error("Failed to delete cut part:", error);
        addCutPart(item);
      }
    }, 5000);
    pendingDeletes.current.set(id, { item, timeout });
    return item;
  }, [cutParts, removeCutPart, supabase]);

  const undoRemove = useCallback((id: string) => {
    const pending = pendingDeletes.current.get(id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingDeletes.current.delete(id);
    addCutPart(pending.item);
  }, [addCutPart]);

  const reorderItem = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...cutParts].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(i => i.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const item = sorted[idx];
    const swap = sorted[swapIdx];
    updateCutPart(id, { sort_order: swap.sort_order });
    updateCutPart(swap.id, { sort_order: item.sort_order });
    useProjectStore.getState().startSave();
    await Promise.all([
      supabase.from('cut_parts').update({ sort_order: swap.sort_order }).eq('id', id),
      supabase.from('cut_parts').update({ sort_order: item.sort_order }).eq('id', swap.id),
    ]);
    useProjectStore.getState().endSave();
  }, [cutParts, updateCutPart, supabase]);

  return { items: cutParts, addItem, updateItem, removeItem, undoRemove, reorderItem };
}
