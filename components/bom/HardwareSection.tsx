"use client";

import { useState } from "react";
import { useHardwareItems } from "@/hooks/useLineItems";
import { useProjectStore } from "@/store/projectStore";
import type { HardwareItem, HardwareUnit } from "@/types/bom";
import { Button } from "@/components/ui/button";
import {
  EditableCell,
  CurrencyCell,
  DescriptionCell,
} from "@/components/bom/BomCells";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bomSection,
  bomSectionHeader,
  bomHeader,
  bomRow,
  col,
} from "./bomStyles";

const UNIT_OPTIONS: HardwareUnit[] = ["each", "box", "pair", "set", "lb", "oz"];

interface HardwareSectionProps {
  projectId: string;
}

export function HardwareSection({ projectId }: HardwareSectionProps) {
  const { items, addItem, updateItem, removeItem, undoRemove } =
    useHardwareItems(projectId);
  const totals = useProjectStore((state) => state.totals);
  const [undoState, setUndoState] = useState<{ id: string; label: string } | null>(null);
  const undoTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleRemove(id: string, label: string) {
    removeItem(id);
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0]);
    setUndoState({ id, label });
    undoTimerRef[1](setTimeout(() => setUndoState(null), 5000));
  }

  function handleUndo() {
    if (!undoState) return;
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0]);
    undoRemove(undoState.id);
    setUndoState(null);
  }

  const TAB_OFFSET = 500;
  const TAB_STOPS_PER_ROW = 5;

  function handleUpdate(id: string, field: keyof HardwareItem, raw: string) {
    const numericFields = ["quantity", "unit_cost"];
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw;
    updateItem(id, { [field]: value } as Partial<HardwareItem>);
  }

  function formatCurrency(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  return (
    <div className={bomSection}>
      <div className={bomSectionHeader}>
        <h2 className="text-lg font-semibold">Hardware</h2>
        <Button size="sm" onClick={addItem}>
          + Add hardware
        </Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
          <div className="min-w-[500px] sm:min-w-0">
            <div>
              <div className={bomHeader}>
                <span className={col.first}>Description</span>
                <span className={col.sm}>Qty</span>
                <span className={col.unit}>Unit</span>
                <span className={col.lg}>Cost</span>
                <span className={col.last}>Total</span>
                <span className={col.delete}></span>
              </div>

              {items.map((item, rowIndex) => {
                const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET;
                const lineTotal = item.quantity * item.unit_cost;

                return (
                  <div
                    key={item.id}
                    className={`${bomRow} border-b hover:bg-muted/30`}
                  >
                    <div className={col.first} title={item.description}>
                      <DescriptionCell
                        value={item.description}
                        onChange={(v) =>
                          handleUpdate(item.id, "description", v)
                        }
                        tabIndex={baseTab}
                      />
                    </div>
                    <div className={col.sm}>
                      <EditableCell
                        value={item.quantity}
                        onChange={(v) => handleUpdate(item.id, "quantity", v)}
                        type="number"
                        tabIndex={baseTab + 1}
                      />
                    </div>
                    <div className={col.unit}>
                      <Select
                        value={item.unit}
                        onValueChange={(v) =>
                          updateItem(item.id, { unit: v as HardwareUnit })
                        }
                      >
                        <SelectTrigger className="h-7 w-full text-xs border-transparent hover:border-border focus:border-ring">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u} className="text-xs">
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={col.lg}>
                      <CurrencyCell
                        value={item.unit_cost}
                        onChange={(v) => handleUpdate(item.id, "unit_cost", v)}
                        tabIndex={baseTab + 3}
                      />
                    </div>
                    <div className={`${col.last} text-sm`}>
                      {formatCurrency(lineTotal)}
                    </div>
                    <div className={col.delete}>
                      <button
                        onClick={() => handleRemove(item.id, item.description || "hardware row")}
                        tabIndex={baseTab + 4}
                        aria-label={`Delete ${item.description || "hardware row"}`}
                        className="cursor-pointer text-muted-foreground hover:text-destructive
                      text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              {undoState && (
                <div className="flex items-center justify-between mt-2 px-3 py-2 rounded bg-muted text-sm">
                  <span className="text-muted-foreground">
                    &ldquo;{undoState.label}&rdquo; deleted
                  </span>
                  <button
                    onClick={handleUndo}
                    aria-label="Undo delete"
                    className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none"
                  >
                    Undo
                  </button>
                </div>
              )}

              {/* Ghost row — click to add */}
              <div
                onClick={addItem}
                className="flex items-center w-full gap-3 py-2 border-b border-dashed
                  text-sm text-muted-foreground/40 hover:text-muted-foreground/70
                  hover:bg-muted/20 cursor-pointer select-none transition-colors"
              >
                <span className={col.first}>+ Add hardware</span>
                <span className={col.sm} /><span className={col.unit} />
                <span className={col.lg} /><span className={col.last} />
                <span className={col.delete} />
              </div>

              <div className="flex justify-end text-sm pt-3">
                <span className="font-medium">
                  Hardware total: {formatCurrency(totals.hardware.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
