'use client'

import { useState } from 'react'
import { useFinishItems } from '@/hooks/useLineItems'
import { useProjectStore } from '@/store/projectStore'
import type { FinishItem } from '@/types/bom'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bomSection, bomSectionHeader, bomHeader, bomRow, col } from './bomStyles'

const FINISH_UNITS = ['oz', 'fl oz', 'ml', 'L', 'qt', 'gal', 'sheets', 'roll']

interface EditableCellProps {
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number'
  className?: string
  tabIndex?: number
}

function EditableCell({
  value,
  onChange,
  type = 'text',
  className = '',
  tabIndex,
}: EditableCellProps) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  function handleFocus() {
    setDraft(String(value))
    setFocused(true)
  }

  function handleBlur() {
    setFocused(false)
    onChange(draft)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  return (
    <input
      type={type}
      value={focused ? draft : String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      className={`w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
        focus:outline-none focus:border-ring focus:bg-background
        hover:border-border ${className}`}
    />
  )
}

interface FinishSectionProps {
  projectId: string
}

export function FinishSection({ projectId }: FinishSectionProps) {
  const { items, addItem, updateItem, removeItem } = useFinishItems(projectId)
  const totals = useProjectStore((state) => state.totals)

  const TAB_OFFSET = 900
  const TAB_STOPS_PER_ROW = 5

  function handleUpdate(id: string, field: keyof FinishItem, raw: string) {
    const numericFields = ['container_cost', 'container_size', 'amount_used']
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw
    updateItem(id, { [field]: value } as Partial<FinishItem>)
  }

  function handleAmountUpdate(item: FinishItem, amountRaw: string) {
    const amount_used = parseFloat(amountRaw) || 0
    const fraction_used =
      item.container_size && item.container_size > 0
        ? Math.min(amount_used / item.container_size, 1)
        : 1
    updateItem(item.id, { amount_used, fraction_used })
  }

  function handleContainerSizeUpdate(item: FinishItem, sizeRaw: string) {
    const container_size = parseFloat(sizeRaw) || 0
    const fraction_used =
      container_size > 0 && item.amount_used
        ? Math.min(item.amount_used / container_size, 1)
        : item.fraction_used
    updateItem(item.id, { container_size, fraction_used })
  }

  function formatCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  return (
    <div className={bomSection}>
      <div className={bomSectionHeader}>
        <h2 className="text-lg font-semibold">Finishing Materials</h2>
        <Button size="sm" onClick={addItem}>+ Add finish</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No finishing materials added yet. Click "+ Add finish" to start.
        </p>
      ) : (
        <div>
          <div className={bomHeader}>
            <span className={col.first}>Description</span>
            <span className={col.lg}>Container size</span>
            <span className={col.lg}>Amount used</span>
            <span className={col.unit}>Unit</span>
            <span className={col.lg}>Cost</span>
            <span className={col.last}>Total</span>
            <span className={col.delete}></span>
          </div>

          {items.map((item, rowIndex) => {
            const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET
            const lineCost = item.container_cost * item.fraction_used

            return (
              <div key={item.id} className={`${bomRow} border-b hover:bg-muted/30`}>
                <div className={col.first}>
                  <EditableCell
                    value={item.description}
                    onChange={(v) => handleUpdate(item.id, 'description', v)}
                    tabIndex={baseTab}
                  />
                </div>
                <div className={col.lg}>
                  <EditableCell
                    value={item.container_size ?? ''}
                    onChange={(v) => handleContainerSizeUpdate(item, v)}
                    type="number"
                    tabIndex={baseTab + 1}
                  />
                </div>
                <div className={col.lg}>
                  <EditableCell
                    value={item.amount_used ?? ''}
                    onChange={(v) => handleAmountUpdate(item, v)}
                    type="number"
                    tabIndex={baseTab + 2}
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
                <div className={col.lg}>
                  <EditableCell
                    value={item.container_cost}
                    onChange={(v) => handleUpdate(item.id, 'container_cost', v)}
                    type="number"
                    tabIndex={baseTab + 3}
                  />
                </div>
                <div className={`${col.last} text-sm`}>
                  {formatCurrency(lineCost)}
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
              Finish total: {formatCurrency(totals.finish.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}