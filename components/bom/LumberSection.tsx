"use client";

import { Fragment, useState } from "react";
import { useLumberItems } from "@/hooks/useLineItems";
import {
  calculateBoardFeetFlexible,
  convertLFtoBFPrice,
} from "@/lib/calculations/boardFeet";
import { applyWasteFactor } from "@/lib/calculations/wasteFactor";
import { useProjectStore } from "@/store/projectStore";
import { EditableCell, CurrencyCell } from "@/components/bom/BomCells";
import { SpeciesInput } from "@/components/bom/SpeciesInput";
import type { LumberItem, LengthUnit } from "@/types/bom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  bomSection,
  bomSectionHeader,
  bomHeader,
  bomRow,
  col,
} from "./bomStyles";
import { getActualToNominal } from "@/lib/calculations/nominalActual";

interface LumberSectionProps {
  projectId: string;
}

export function LumberSection({ projectId }: LumberSectionProps) {
  const { items, addItem, updateItem, removeItem, undoRemove } = useLumberItems(projectId);
  const [undoState, setUndoState] = useState<{ id: string; label: string; index: number } | null>(null);
  const undoTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);
  const [stalePriceIds, setStalePriceIds] = useState<Set<string>>(new Set());

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
  const project = useProjectStore((state) => state.project);
  const totals = useProjectStore((state) => state.totals);

  const wasteFactor = project?.waste_factor ?? 0.15;
  const wastePercent = Math.round(wasteFactor * 100);

  const TAB_OFFSET = 100;
  const TAB_STOPS_PER_ROW = 9;

  function handleUpdate(id: string, field: keyof LumberItem, raw: string) {
    const numericFields = [
      "thickness_in",
      "width_in",
      "length_ft",
      "quantity",
      "price_per_unit",
      "waste_override",
    ];
    const value = numericFields.includes(field)
      ? Math.max(0, parseFloat(raw) || 0)
      : raw;
    updateItem(id, { [field]: value } as Partial<LumberItem>);
  }

  function handleUnitToggle(item: LumberItem) {
    if (item.length_unit === "ft") {
      updateItem(item.id, {
        length_unit: "in",
        length_ft: parseFloat((item.length_ft * 12).toFixed(3)),
      });
    } else {
      updateItem(item.id, {
        length_unit: "ft",
        length_ft: parseFloat((item.length_ft / 12).toFixed(3)),
      });
    }
  }

  function getLineBF(item: LumberItem): number {
    const bf = calculateBoardFeetFlexible(
      item.thickness_in,
      item.width_in,
      item.length_ft,
      (item.length_unit ?? "ft") as LengthUnit,
    );
    return bf * item.quantity;
  }

  function getLineTotal(item: LumberItem): number {
    if (item.pricing_mode === "per_piece") {
      return item.price_per_unit * item.quantity;
    }
    const bf = getLineBF(item);
    if (item.pricing_mode === "per_lf") {
      const bfPrice = convertLFtoBFPrice(
        item.price_per_unit,
        item.thickness_in,
        item.width_in,
      );
      return bf * bfPrice;
    }
    return bf * item.price_per_unit;
  }

  function formatCurrency(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  // Waste footer calculations
  const netBF = totals.lumber.boardFeetNet;
  const adjustedBF = applyWasteFactor(netBF, wasteFactor);
  const extraBF = adjustedBF - netBF;
  const netCost = totals.lumber.netCost;
  const adjustedCost = totals.lumber.adjustedCost;
  const extraCost = adjustedCost - netCost;

  return (
    <TooltipProvider>
      <div className={bomSection}>
        <div className={bomSectionHeader}>
          <h2 className="text-lg font-semibold">Lumber</h2>
          <Button
            size="sm"
            onClick={() => {
              addItem();
              setTimeout(() => {
                const rows = document.querySelectorAll('[data-lumber-row]');
                const last = rows[rows.length - 1];
                (last?.querySelector('input') as HTMLInputElement)?.focus();
              }, 50);
            }}
          >
            + Add lumber
          </Button>
        </div>

        <div>
            <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
              <div className="min-w-[800px] sm:min-w-0">
                {items.length === 0 ? (
                  <div
                    onClick={() => addItem()}
                    className="py-10 text-center text-sm text-muted-foreground/50 hover:text-muted-foreground/70 cursor-pointer select-none transition-colors border border-dashed rounded-md my-2"
                  >
                    No lumber yet — click to add your first board
                  </div>
                ) : <>
                {/* Header row */}
                <div className={bomHeader}>
                  <span className={`${col.first}`}>Item</span>
                  <span className={`${col.md} pl-1`}>T(in)</span>
                  <span className={`${col.md} pl-1`}>W(in)</span>
                  <span className={`${col.md} pl-1`}>L</span>
                  <span className={col.toggle}>L ft/in</span>
                  <span className={`${col.sm} pl-1`}>Qty</span>
                  <span className={`${col.pricingMode} pl-1`}>Unit</span>
                  <span className={`${col.lg} pl-1`}>Price</span>
                  <span className={`${col.sm} pl-1`}>BF</span>
                  <span className={col.last}>Total</span>
                  <span className={col.delete}></span>
                </div>
                {/* Item rows */}
                {items.map((item, rowIndex) => {
                  const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET;
                  const totalBF = getLineBF(item);
                  const lineTotal = getLineTotal(item);
                  const nominalLabel = getActualToNominal(item.thickness_in, item.width_in);
                  return (
                    <Fragment key={item.id}>
                    {undoState?.index === rowIndex && (
                      <div className="flex items-center justify-between px-3 py-2 border-b rounded bg-muted text-sm">
                        <span className="text-muted-foreground">&ldquo;{undoState.label}&rdquo; deleted</span>
                        <button onClick={handleUndo} aria-label="Undo delete" className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none">Undo</button>
                      </div>
                    )}
                    <div
                      data-lumber-row
                      className={`${bomRow} group border-b hover:bg-muted/30`}
                    >
                      <div className={`${col.first} relative`} title={item.species}>
                        <SpeciesInput
                          value={item.species}
                          onChange={(species, suggestedPrice, dimensions) => {
                            handleUpdate(item.id, "species", species);
                            if (suggestedPrice !== undefined) {
                              updateItem(item.id, {
                                price_per_unit: suggestedPrice,
                              });
                            }
                            if (dimensions) {
                              updateItem(item.id, {
                                thickness_in: dimensions.thickness,
                                width_in: dimensions.width,
                              });
                            }
                          }}
                          tabIndex={baseTab}
                        />
                        <button
                          onClick={() =>
                            updateItem(item.id, {
                              is_reclaimed: !item.is_reclaimed,
                            })
                          }
                          tabIndex={-1}
                          aria-label={item.is_reclaimed ? "Unmark reclaimed" : "Mark as reclaimed/on-hand"}
                          title={
                            item.is_reclaimed
                              ? "Reclaimed/on-hand — click to unmark"
                              : "Mark as reclaimed"
                          }
                          className={`absolute -top-0.5 -right-0.5 text-xs rounded px-0.5 leading-none
                            transition-opacity focus:outline-none focus:ring-1 focus:ring-ring
                            ${item.is_reclaimed
                              ? "opacity-100 text-green-600"
                              : "opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground"
                            }`}
                        >
                          ♻
                        </button>
                      </div>
                      <div className={`${col.sm} text-right`}>
                        <EditableCell
                          value={item.thickness_in}
                          onChange={(v) =>
                            handleUpdate(item.id, "thickness_in", v)
                          }
                          type="number"
                          tabIndex={baseTab + 1}
                        />
                        {nominalLabel && (
                          <span className="block text-[10px] text-muted-foreground leading-none mt-0.5 text-center">
                            {nominalLabel}
                          </span>
                        )}
                      </div>
                      <div className={`${col.sm} text-right`}>
                        <EditableCell
                          value={item.width_in}
                          onChange={(v) => handleUpdate(item.id, "width_in", v)}
                          type="number"
                          tabIndex={baseTab + 2}
                        />
                      </div>
                      <div className={`${col.md} pl-1`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          defaultValue={item.length_ft}
                          key={item.length_ft}
                          onBlur={(e) =>
                            handleUpdate(item.id, "length_ft", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          tabIndex={baseTab + 3}
                          className="w-full bg-transparent border border-transparent rounded px-1 py-0.5
                                    text-sm focus:outline-none focus:border-ring focus:bg-background
                                    hover:border-border"
                        />
                      </div>
                      <div className={col.toggle}>
                        <button
                          onClick={() => handleUnitToggle(item)}
                          tabIndex={baseTab + 4}
                          aria-label={`Length unit: ${item.length_unit ?? "ft"} — click to toggle`}
                          className="cursor-pointer text-xs border rounded px-1.5 py-0.5
                                    hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                        >
                          {item.length_unit ?? "ft"}
                        </button>
                      </div>
                      <div className={col.sm}>
                        <EditableCell
                          value={item.quantity}
                          onChange={(v) => handleUpdate(item.id, "quantity", v)}
                          type="number"
                          tabIndex={baseTab + 5}
                        />
                      </div>
                      <div className={col.pricingMode}>
                        <Select
                          value={item.pricing_mode}
                          onValueChange={(v) => {
                            updateItem(item.id, { pricing_mode: v as LumberItem['pricing_mode'] });
                            setStalePriceIds((prev) => new Set(prev).add(item.id));
                          }}
                        >
                          <SelectTrigger
                            className="h-7 text-xs border-transparent hover:border-border focus:border-ring px-1.5"
                            aria-label={`Pricing mode: ${item.pricing_mode}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_bf" className="text-xs">$/BF</SelectItem>
                            <SelectItem value="per_lf" className="text-xs">$/LF</SelectItem>
                            <SelectItem value="per_piece" className="text-xs">$/piece</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className={`${col.lg} relative`}>
                        <CurrencyCell
                          value={item.price_per_unit}
                          onChange={(v) => {
                            handleUpdate(item.id, "price_per_unit", v);
                            setStalePriceIds((prev) => {
                              const next = new Set(prev);
                              next.delete(item.id);
                              return next;
                            });
                          }}
                          tabIndex={baseTab + 7}
                        />
                        {stalePriceIds.has(item.id) && (
                          <span
                            title="Unit changed — update price to match"
                            className="absolute -top-0.5 -right-0.5 text-[10px] text-amber-500 leading-none pointer-events-none"
                          >
                            ⚠
                          </span>
                        )}
                      </div>
                      <div
                        className={`${col.sm} text-right text-muted-foreground text-sm`}
                      >
                        {item.pricing_mode === "per_piece" ? "—" : totalBF.toFixed(2)}
                      </div>
                      <div className={`${col.last} text-sm`}>
                        {item.is_reclaimed
                          ? <span className="text-green-600">$0.00</span>
                          : formatCurrency(lineTotal)}
                      </div>
                      <div className={col.delete}>
                        <button
                          onClick={() => handleRemove(item.id, item.species || "lumber row", rowIndex)}
                          tabIndex={baseTab + 8}
                          aria-label={`Delete ${item.species || "lumber row"}`}
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
                    <span className="text-muted-foreground">&ldquo;{undoState.label}&rdquo; deleted</span>
                    <button onClick={handleUndo} aria-label="Undo delete" className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none">Undo</button>
                  </div>
                )}
                {/* Ghost row — click to add */}
                <div
                  onClick={() => {
                    addItem();
                    setTimeout(() => {
                      const rows = document.querySelectorAll('[data-lumber-row]');
                      const last = rows[rows.length - 1];
                      (last?.querySelector('input') as HTMLInputElement)?.focus();
                    }, 50);
                  }}
                  className="flex items-center w-full gap-3 py-2 border-b border-dashed
                    text-sm text-muted-foreground/40 hover:text-muted-foreground/70
                    hover:bg-muted/20 cursor-pointer select-none transition-colors"
                >
                  <span className={col.first}>+ Add lumber</span>
                  <span className={`${col.md} pl-1`} /><span className={`${col.md} pl-1`} />
                  <span className={`${col.md} pl-1`} /><span className={col.toggle} />
                  <span className={col.sm} /><span className={col.pricingMode} />
                  <span className={col.lg} /><span className={col.sm} />
                  <span className={col.last} /><span className={col.delete} />
                </div>

                {/* Waste footer */}
                <div className="flex justify-start sm:justify-end items-center gap-6 text-sm pt-3">
                  <span className="text-muted-foreground">
                    Net: {netBF.toFixed(2)} BF — {formatCurrency(netCost)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium cursor-help border-b border-dashed border-muted-foreground">
                        Buy {adjustedBF.toFixed(2)} BF (+{extraBF.toFixed(2)}{" "}
                        BF) for {wastePercent}% waste —{" "}
                        {formatCurrency(adjustedCost)} (+
                        {formatCurrency(extraCost)})
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        To end up with {netBF.toFixed(2)} BF of usable material
                        after {wastePercent}% waste, you need to purchase{" "}
                        {adjustedBF.toFixed(2)} BF. That's {extraBF.toFixed(2)}{" "}
                        extra BF costing an additional{" "}
                        {formatCurrency(extraCost)}.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                </>}
              </div>
            </div>
          </div>
        </div>
    </TooltipProvider>
  );
}
