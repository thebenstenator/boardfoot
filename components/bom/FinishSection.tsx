"use client";

import { Fragment, useState } from "react";
import { useFinishItems } from "@/hooks/useLineItems";
import { useProjectStore } from "@/store/projectStore";
import type { FinishItem } from "@/types/bom";
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

const FINISH_UNITS = [
  "oz",
  "fl oz",
  "ml",
  "L",
  "qt",
  "gal",
  "sheets",
  "discs",
  "roll",
  "sticks",
  "tubes",
  "item",
];

interface FinishSectionProps {
  projectId: string;
}

export function FinishSection({ projectId }: FinishSectionProps) {
  const { items, addItem, updateItem, removeItem, undoRemove } = useFinishItems(projectId);
  const totals = useProjectStore((state) => state.totals);
  const [undoState, setUndoState] = useState<{ id: string; label: string; index: number } | null>(null);
  const undoTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleRemove(id: string, label: string, index: number) {
    removeItem(id);
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0]);
    setUndoState({ id, label, index });
    undoTimerRef[1](setTimeout(() => setUndoState(null), 5000));
  }

  function handleUndo() {
    if (!undoState) return;
    if (undoTimerRef[0]) clearTimeout(undoTimerRef[0]);
    undoRemove(undoState.id);
    setUndoState(null);
  }

  const TAB_OFFSET = 900;
  const TAB_STOPS_PER_ROW = 5;

  function handleUpdate(id: string, field: keyof FinishItem, raw: string) {
    const numericFields = ["container_cost", "container_size", "amount_used"];
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw;
    updateItem(id, { [field]: value } as Partial<FinishItem>);
  }

  function handleAmountUpdate(item: FinishItem, amountRaw: string) {
    const amount_used = parseFloat(amountRaw) || 0;
    const fraction_used =
      item.container_size && item.container_size > 0
        ? Math.min(amount_used / item.container_size, 1)
        : 1;
    updateItem(item.id, { amount_used, fraction_used });
  }

  function handleContainerSizeUpdate(item: FinishItem, sizeRaw: string) {
    const container_size = parseFloat(sizeRaw) || 0;
    const fraction_used =
      container_size > 0 && item.amount_used
        ? Math.min(item.amount_used / container_size, 1)
        : item.fraction_used;
    updateItem(item.id, { container_size, fraction_used });
  }

  function formatCurrency(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  return (
    <div className={bomSection}>
      <div className={bomSectionHeader}>
        <h2 className="text-lg font-semibold">Consumables</h2>
        <Button size="sm" onClick={addItem}>
          + Add consumable
        </Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
          <div className="min-w-[500px] sm:min-w-0">
            <div>
              <div className={bomHeader}>
                <span className={col.first}>Description</span>
                <span className={col.lg}>Container size</span>
                <span className={col.lg}>Container cost</span>
                <span className={col.lg}>Amount used</span>
                <span className={col.unit}>Unit</span>
                <span className={col.last}>Total</span>
                <span className={col.delete}></span>
              </div>

              {items.map((item, rowIndex) => {
                const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET;
                const lineCost = item.container_cost * item.fraction_used;

                return (
                  <Fragment key={item.id}>
                  {undoState?.index === rowIndex && (
                    <div className="flex items-center justify-between px-3 py-2 border-b rounded bg-muted text-sm">
                      <span className="text-muted-foreground">&ldquo;{undoState.label}&rdquo; deleted</span>
                      <button onClick={handleUndo} aria-label="Undo delete" className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none">Undo</button>
                    </div>
                  )}
                  <div
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
                    <div className={col.lg}>
                      <EditableCell
                        value={item.container_size ?? ""}
                        onChange={(v) => handleContainerSizeUpdate(item, v)}
                        type="number"
                        tabIndex={baseTab + 1}
                      />
                    </div>
                    <div className={col.lg}>
                      <CurrencyCell
                        value={item.container_cost}
                        onChange={(v) =>
                          handleUpdate(item.id, "container_cost", v)
                        }
                        tabIndex={baseTab + 2}
                      />
                    </div>
                    <div className={col.lg}>
                      <EditableCell
                        value={item.amount_used ?? ""}
                        onChange={(v) => handleAmountUpdate(item, v)}
                        type="number"
                        tabIndex={baseTab + 3}
                      />
                    </div>
                    <div className={col.unit}>
                      <Select
                        value={item.unit}
                        onValueChange={(v) => updateItem(item.id, { unit: v })}
                      >
                        <SelectTrigger className="h-7 w-full text-xs border-transparent hover:border-border focus:border-ring">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FINISH_UNITS.map((u) => (
                            <SelectItem key={u} value={u} className="text-xs">
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={`${col.last} text-sm`}>
                      {formatCurrency(lineCost)}
                    </div>
                    <div className={col.delete}>
                      <button
                        onClick={() => handleRemove(item.id, item.description || "consumable row", rowIndex)}
                        tabIndex={baseTab + 4}
                        aria-label={`Delete ${item.description || "consumable row"}`}
                        className="cursor-pointer text-muted-foreground hover:text-destructive
                      text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  </Fragment>
                );
              })}

              {undoState?.index === items.length && (
                <div className="flex items-center justify-between px-3 py-2 border-b rounded bg-muted text-sm">
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
                <span className={col.first}>+ Add consumable</span>
                <span className={col.lg} /><span className={col.lg} />
                <span className={col.lg} /><span className={col.unit} />
                <span className={col.last} /><span className={col.delete} />
              </div>

              <div className="flex justify-end text-sm pt-3">
                <span className="font-medium">
                  Consumables total: {formatCurrency(totals.finish.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
