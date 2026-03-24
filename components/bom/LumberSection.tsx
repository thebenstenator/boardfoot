"use client";

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
  const { items, addItem, updateItem, removeItem } = useLumberItems(projectId);
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
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw;
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
          <Button size="sm" onClick={addItem}>
            + Add lumber
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No lumber added yet. Click "+ Add lumber" to start.
          </p>
        ) : (
          <div>
            <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
              <div className="min-w-[800px] sm:min-w-0">
                {/* Header row */}
                <div className={bomHeader}>
                  <span className={`${col.first}`}>Species</span>
                  <span className={`${col.md} pl-1`}>T(in)</span>
                  <span className={`${col.md} pl-1`}>W(in)</span>
                  <span className={`${col.md} pl-1`}>L</span>
                  <span className={col.toggle}>L ft/in</span>
                  <span className={`${col.sm} pl-1`}>Qty</span>
                  <span className={`${col.toggle} pl-1`}>Mode</span>
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
                    <div
                      key={item.id}
                      className={`${bomRow} group border-b hover:bg-muted/30`}
                    >
                      <div className={`${col.first} relative`} title={item.species}>
                        <SpeciesInput
                          value={item.species}
                          onChange={(species, suggestedPrice) => {
                            handleUpdate(item.id, "species", species);
                            if (suggestedPrice !== undefined) {
                              updateItem(item.id, {
                                price_per_unit: suggestedPrice,
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
                      <div className={col.toggle}>
                        <button
                          onClick={() =>
                            updateItem(item.id, {
                              pricing_mode:
                                item.pricing_mode === "per_bf"
                                  ? "per_lf"
                                  : "per_bf",
                            })
                          }
                          tabIndex={baseTab + 6}
                          className="cursor-pointer text-xs border rounded px-1.5 py-0.5
                            hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {item.pricing_mode === "per_bf" ? "BF" : "LF"}
                        </button>
                      </div>
                      <div className={col.lg}>
                        <CurrencyCell
                          value={item.price_per_unit}
                          onChange={(v) =>
                            handleUpdate(item.id, "price_per_unit", v)
                          }
                          tabIndex={baseTab + 7}
                        />
                      </div>
                      <div
                        className={`${col.sm} text-right text-muted-foreground text-sm`}
                      >
                        {totalBF.toFixed(2)}
                      </div>
                      <div className={`${col.last} text-sm`}>
                        {item.is_reclaimed
                          ? <span className="text-green-600">$0.00</span>
                          : formatCurrency(lineTotal)}
                      </div>
                      <div className={col.delete}>
                        <button
                          onClick={() => removeItem(item.id)}
                          tabIndex={baseTab + 8}
                          className="cursor-pointer text-muted-foreground hover:text-destructive
                            text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
