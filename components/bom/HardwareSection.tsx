"use client";

import { Fragment, useState } from "react";
import { useHardwareItems } from "@/hooks/useLineItems";
import { useProjectStore } from "@/store/projectStore";
import { formatCurrency } from "@/lib/utils";
import type { HardwareItem, HardwareUnit } from "@/types/bom";
import { Button } from "@/components/ui/button";
import { EditableCell, CurrencyCell, DescriptionCell, SortableHeader, type SortState } from "@/components/bom/BomCells";
import { SortableRow, DragHandle } from "@/components/bom/SortableRow";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bomSection, bomSectionHeader, bomHeader, bomRow, col } from "./bomStyles";

const UNIT_OPTIONS: HardwareUnit[] = ["each", "box", "pair", "set", "lb", "oz"];

function inferHardwareUnit(description: string): HardwareUnit {
  const s = description.toLowerCase();
  if (/\bnails?\b|\bscrews?\b|\bbolts?\b|\bstaples?\b|\btacks?\b|\bwasher|\bnut\b|\bnuts\b|\banchor|\bdrywall/.test(s)) return 'box';
  if (/\bhinges?\b|\bhandles?\b|\bknobs?\b|\bpulls?\b|\bbrackets?\b|\bslides?\b|\bcaster/.test(s)) return 'pair';
  if (/\bchain\b|\brope\b|\bwire\b|\bstrap\b/.test(s)) return 'lb';
  return 'each';
}

interface HardwareSectionProps {
  projectId: string;
}

export function HardwareSection({ projectId }: HardwareSectionProps) {
  const { items, addItem, updateItem, removeItem, undoRemove, reorderItems } = useHardwareItems(projectId);
  const totals = useProjectStore((state) => state.totals);
  const [undoState, setUndoState] = useState<{ id: string; label: string; index: number } | null>(null);
  const undoTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);
  const [sort, setSort] = useState<SortState>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const displayItems = sort === null
    ? [...items].sort((a, b) => a.sort_order - b.sort_order)
    : [...items].sort((a, b) => {
        const v = sort.dir === 'asc' ? 1 : -1;
        switch (sort.col) {
          case 'description': return (a.description || '').localeCompare(b.description || '') * v;
          case 'qty': return (a.quantity - b.quantity) * v;
          case 'cost': return (a.unit_cost - b.unit_cost) * v;
          case 'total': return (a.quantity * a.unit_cost - b.quantity * b.unit_cost) * v;
          default: return 0;
        }
      });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = displayItems.map(i => i.id);
    reorderItems(arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string)));
  }

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

  function handleSort(column: string) {
    setSort(prev => {
      if (!prev || prev.col !== column) return { col: column, dir: 'asc' };
      if (prev.dir === 'asc') return { col: column, dir: 'desc' };
      return null;
    });
  }

  const TAB_OFFSET = 500;
  const TAB_STOPS_PER_ROW = 5;

  function handleUpdate(id: string, field: keyof HardwareItem, raw: string) {
    const numericFields = ["quantity", "unit_cost"];
    const value = numericFields.includes(field) ? Math.max(0, parseFloat(raw) || 0) : raw;
    updateItem(id, { [field]: value } as Partial<HardwareItem>);
  }


  return (
    <div className={bomSection}>
      <div className={bomSectionHeader}>
        <h2 className="text-lg font-semibold">Hardware</h2>
        <Button size="sm" onClick={async () => {
          await addItem();
          setTimeout(() => {
            const rows = document.querySelectorAll('[data-hardware-row]');
            const last = rows[rows.length - 1];
            (last?.querySelector('input, textarea') as HTMLElement)?.focus();
          }, 0);
        }}>
          + Add hardware
        </Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
        <div className="min-w-[500px] sm:min-w-0">
          {items.length === 0 ? (
            <div
              onClick={async () => {
                await addItem();
                setTimeout(() => {
                  const rows = document.querySelectorAll('[data-hardware-row]');
                  const last = rows[rows.length - 1];
                  (last?.querySelector('input, textarea') as HTMLElement)?.focus();
                }, 0);
              }}
              className="py-10 text-center text-sm text-muted-foreground/50 hover:text-muted-foreground/70 cursor-pointer select-none transition-colors border border-dashed rounded-md my-2"
            >
              No hardware yet — click to add your first item
            </div>
          ) : (
            <>
              <div className={bomHeader}>
                <span className={"flex-[2.5] min-w-0"}>
                  <SortableHeader label="Description" column="description" sort={sort} onSort={handleSort} />
                </span>
                <span className={"w-10 shrink-0"}>
                  <SortableHeader label="Qty" column="qty" sort={sort} onSort={handleSort} />
                </span>
                <span className={"w-[4.5rem] shrink-0"}>Unit</span>
                <span className={"flex-1 min-w-0"}>
                  <SortableHeader label="Cost" column="cost" sort={sort} onSort={handleSort} />
                </span>
                <span className={col.last}>
                  <SortableHeader label="Total" column="total" sort={sort} onSort={handleSort} />
                </span>
                <span className={col.reorder}></span>
                <span className={col.delete}></span>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {displayItems.map((item, rowIndex) => {
                    const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET;
                    const lineTotal = item.quantity * item.unit_cost;
                    return (
                      <Fragment key={item.id}>
                        {undoState?.index === rowIndex && (
                          <div className="flex items-center justify-between px-3 py-2 border-b rounded bg-muted text-sm">
                            <span className="text-muted-foreground">&ldquo;{undoState.label}&rdquo; deleted</span>
                            <button onClick={handleUndo} aria-label="Undo delete" className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none">Undo</button>
                          </div>
                        )}
                        <SortableRow id={item.id}>
                          <div data-hardware-row className={`${bomRow} group border-b hover:bg-muted/30`}>
                            <div className={"flex-[2.5] min-w-0"} title={item.description}>
                              <DescriptionCell
                                value={item.description}
                                onChange={(v) => {
                                  const isNew = item.description === "";
                                  handleUpdate(item.id, "description", v);
                                  if (isNew) {
                                    const inferred = inferHardwareUnit(v);
                                    if (inferred !== item.unit) updateItem(item.id, { unit: inferred });
                                  }
                                }}
                                tabIndex={baseTab}
                              />
                            </div>
                            <div className={"w-10 shrink-0"}>
                              <EditableCell value={item.quantity} onChange={(v) => handleUpdate(item.id, "quantity", v)} type="number" tabIndex={baseTab + 1} />
                            </div>
                            <div className={"w-[4.5rem] shrink-0"}>
                              <Select value={item.unit} onValueChange={(v) => updateItem(item.id, { unit: v as HardwareUnit })}>
                                <SelectTrigger className="h-7 w-full text-xs border-transparent hover:border-border focus:border-ring">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIT_OPTIONS.map((u) => (
                                    <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className={"flex-1 min-w-0"}>
                              <CurrencyCell value={item.unit_cost} onChange={(v) => handleUpdate(item.id, "unit_cost", v)} tabIndex={baseTab + 3} />
                            </div>
                            <div className={`${col.last} text-sm`}>
                              {formatCurrency(lineTotal)}
                            </div>
                            <div className={col.reorder}>
                              {sort === null && <DragHandle />}
                            </div>
                            <div className={col.delete}>
                              <button
                                onClick={() => handleRemove(item.id, item.description || "hardware row", rowIndex)}
                                tabIndex={baseTab + 4}
                                aria-label={`Delete ${item.description || "hardware row"}`}
                                className="cursor-pointer text-muted-foreground hover:text-destructive text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </SortableRow>
                      </Fragment>
                    );
                  })}
                </SortableContext>
              </DndContext>

              {undoState?.index === displayItems.length && (
                <div className="flex items-center justify-between px-3 py-2 border-b rounded bg-muted text-sm">
                  <span className="text-muted-foreground">&ldquo;{undoState.label}&rdquo; deleted</span>
                  <button onClick={handleUndo} aria-label="Undo delete" className="cursor-pointer font-medium underline hover:text-foreground focus:outline-none">Undo</button>
                </div>
              )}

              {/* Ghost row */}
              <div
                onClick={async () => {
                  await addItem();
                  setTimeout(() => {
                    const rows = document.querySelectorAll('[data-hardware-row]');
                    const last = rows[rows.length - 1];
                    (last?.querySelector('input, textarea') as HTMLElement)?.focus();
                  }, 0);
                }}
                className="flex items-center w-full gap-3 py-2 border-b border-dashed
                  text-sm text-muted-foreground/40 hover:text-muted-foreground/70
                  hover:bg-muted/20 cursor-pointer select-none transition-colors"
              >
                <span className={"flex-[2.5] min-w-0"}>+ Add hardware</span>
                <span className={"w-10 shrink-0"} /><span className={"w-[4.5rem] shrink-0"} />
                <span className={"flex-1 min-w-0"} /><span className={col.last} />
                <span className={col.reorder} /><span className={col.delete} />
              </div>

              <div className="flex justify-end text-sm pt-3">
                <span className="font-medium">Hardware total: {formatCurrency(totals.hardware.total)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
