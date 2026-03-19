'use client'

import { useState } from 'react'
import { useHardwareItems } from '@/hooks/useLineItems'
import { useProjectStore } from '@/store/projectStore'
import type { HardwareItem, HardwareUnit } from '@/types/bom'
import { Button } from '@/components/ui/button'
import { EditableCell, CurrencyCell } from '@/components/bom/bomCells'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bomSection, bomSectionHeader, bomHeader, bomRow, col } from './bomStyles'

const UNIT_OPTIONS: HardwareUnit[] = ['each', 'box', 'pair', 'set', 'lb', 'oz']

interface HardwareSectionProps {
  projectId: string
}

export function HardwareSection({ projectId }: HardwareSectionProps) {
  const { items, addItem, updateItem, removeItem } = useHardwareItems(projectId)
  const totals = useProjectStore((state) => state.totals)

  const TAB_OFFSET = 500
  const TAB_STOPS_PER_ROW = 5

  function handleUpdate(id: string, field: keyof HardwareItem, raw: string) {
    const numericFields = ['quantity', 'unit_cost']
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw
    updateItem(id, { [field]: value } as Partial<HardwareItem>)
  }

  function formatCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  return (
    <div className={bomSection}>
      <div className={bomSectionHeader}>
        <h2 className="text-lg font-semibold">Hardware</h2>
        <Button size="sm" onClick={addItem}>+ Add hardware</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hardware added yet. Click "+ Add hardware" to start.
        </p>
      ) : (
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
            const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET
            const lineTotal = item.quantity * item.unit_cost

            return (
              <div key={item.id} className={`${bomRow} border-b hover:bg-muted/30`}>
                <div className={col.first}>
                  <EditableCell
                    value={item.description}
                    onChange={(v) => handleUpdate(item.id, 'description', v)}
                    tabIndex={baseTab}
                  />
                </div>
                <div className={col.sm}>
                  <EditableCell
                    value={item.quantity}
                    onChange={(v) => handleUpdate(item.id, 'quantity', v)}
                    type="number"
                    tabIndex={baseTab + 1}
                  />
                </div>
                <div className={col.unit}>
                  <Select
                    value={item.unit}
                    onValueChange={(v) => updateItem(item.id, { unit: v as HardwareUnit })}
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
                    onChange={(v) => handleUpdate(item.id, 'unit_cost', v)}
                    tabIndex={baseTab + 3}
                    />
                </div>
                <div className={`${col.last} text-sm`}>
                  {formatCurrency(lineTotal)}
                </div>
                <div className={col.delete}>
                  <button
                    onClick={() => removeItem(item.id)}
                    tabIndex={baseTab + 4}
                    className="cursor-pointer text-muted-foreground hover:text-destructive
                      text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}

          <div className="flex justify-end text-sm pt-3">
            <span className="font-medium">
              Hardware total: {formatCurrency(totals.hardware.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}