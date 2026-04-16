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
      // Optimistic update — update store immediately
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

      // Optimistic: remove from store immediately
      removeLumberItem(id);

      // Schedule DB delete in 5s — cancelled if undo is called
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
    // Row still exists in DB (delete was deferred) — restore to store only
    addLumberItem(pending.item);
  }, [addLumberItem]);

  return {
    items: lumberItems,
    addItem,
    updateItem,
    removeItem,
    undoRemove,
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

  return {
    items: hardwareItems,
    addItem,
    updateItem,
    removeItem,
    undoRemove,
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

  return {
    items: finishItems,
    addItem,
    updateItem,
    removeItem,
    undoRemove,
  };
}

export function useProjectLabor(projectId: string) {
  const { labor, setLabor } = useProjectStore();
  const supabase = createClient();

  const updateLabor = useCallback(
    async (patch: Partial<ProjectLabor>) => {
      // Optimistic update
      if (labor) {
        setLabor({ ...labor, ...patch });
      }

      // Check if labor row exists
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
        // Create new labor row
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

  return { items: cutParts, addItem, updateItem, removeItem, undoRemove };
}
